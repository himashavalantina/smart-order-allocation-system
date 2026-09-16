import math
import logging
from typing import Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.branch import Branch
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User

logger = logging.getLogger(__name__)

# ── Scoring weights ───────────────────────────────────────────────────────────
# Workload (0.6) is weighted higher than distance (0.4) so the closest branch
# does not always get overloaded. Tune these for production use cases.
DISTANCE_WEIGHT = 0.4
WORKLOAD_WEIGHT = 0.6


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two coordinates (Haversine formula)."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def allocate_order(db: Session, order_id: int) -> Tuple[Optional[Branch], str]:
    """
    Smart 3-phase order allocation algorithm.

    Phase 1 — Hard Filter
        Eliminate any branch that cannot fulfil 100% of every line item.

    Phase 2 — Score
        score = DISTANCE_WEIGHT * distance_km + WORKLOAD_WEIGHT * active_orders
        Lower score = better candidate. Branches are sorted ascending by score.
        Tie-breaker: highest total inventory of requested products wins
        (indicates the branch is less likely to stock-out soon).

    Phase 3 — Atomic Reservation
        Inventory rows are locked (with_for_update / BEGIN IMMEDIATE on SQLite)
        before decrementing. If a race condition depleted stock between Phase 1
        and Phase 3, the order is marked UNALLOCATED rather than over-committed.

    Returns: (allocated_branch | None, human-readable reason)
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None, "Order not found"

    items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    if not items:
        order.status = "UNALLOCATED"
        db.commit()
        return None, "Order has no items"

    customer = db.query(User).filter(User.id == order.customer_id).first()

    # Prefer explicit delivery coordinates; fall back to customer profile
    delivery_lat = order.delivery_lat or (customer.location_lat if customer else None)
    delivery_lng = order.delivery_lng or (customer.location_lng if customer else None)

    active_branches = db.query(Branch).filter(Branch.is_active == True).all()
    if not active_branches:
        order.status = "UNALLOCATED"
        db.commit()
        return None, "No active branches are available"

    # ── Phase 1: Hard Filter ──────────────────────────────────────────────────
    eligible: list[Branch] = []
    for branch in active_branches:
        qualifies = True
        for item in items:
            inv = (
                db.query(Inventory)
                .filter(
                    Inventory.branch_id == branch.id,
                    Inventory.product_id == item.product_id,
                )
                .first()
            )
            if inv is None or inv.quantity < item.quantity:
                qualifies = False
                break
        if qualifies:
            eligible.append(branch)

    if not eligible:
        order.status = "UNALLOCATED"
        db.commit()
        logger.info("Order %d → UNALLOCATED (insufficient stock at all branches)", order_id)
        return None, "No branch has sufficient stock for all ordered items"

    # ── Phase 2: Score Each Eligible Branch ──────────────────────────────────
    scored: list[tuple[float, int, Branch]] = []
    for branch in eligible:
        dist_km = (
            haversine_km(delivery_lat, delivery_lng, branch.location_lat, branch.location_lng)
            if delivery_lat is not None and delivery_lng is not None
            else 0.0
        )

        active_order_count = (
            db.query(func.count(Order.id))
            .filter(
                Order.allocated_branch_id == branch.id,
                Order.status.in_(["ALLOCATED", "PENDING"]),
            )
            .scalar()
        ) or 0

        score = DISTANCE_WEIGHT * dist_km + WORKLOAD_WEIGHT * active_order_count

        # Tie-breaker: total remaining inventory of ordered products
        total_inv = 0
        for item in items:
            row = (
                db.query(Inventory)
                .filter(
                    Inventory.branch_id == branch.id,
                    Inventory.product_id == item.product_id,
                )
                .first()
            )
            total_inv += row.quantity if row else 0

        scored.append((score, -total_inv, branch))
        logger.debug(
            "Branch '%s': dist=%.1fkm workload=%d score=%.2f inv=%d",
            branch.name, dist_km, active_order_count, score, total_inv,
        )

    # Primary: lowest score. Secondary: highest inventory (negated for sort).
    scored.sort(key=lambda t: (round(t[0], 2), t[1]))
    best = scored[0][2]

    # ── Phase 3: Atomic Inventory Reservation ────────────────────────────────
    try:
        for item in items:
            inv = (
                db.query(Inventory)
                .filter(
                    Inventory.branch_id == best.id,
                    Inventory.product_id == item.product_id,
                )
                .with_for_update()
                .first()
            )
            if inv is None or inv.quantity < item.quantity:
                # Race condition: another transaction consumed stock between phases
                logger.warning(
                    "Order %d: race condition at branch '%s' — marking UNALLOCATED",
                    order_id, best.name,
                )
                db.rollback()
                order = db.query(Order).filter(Order.id == order_id).first()
                order.status = "UNALLOCATED"
                db.commit()
                return None, "Stock depleted during allocation — please retry"
            inv.quantity -= item.quantity

        order.status = "ALLOCATED"
        order.allocated_branch_id = best.id
        db.commit()
        logger.info(
            "Order %d → ALLOCATED to '%s' (score=%.2f)",
            order_id, best.name, scored[0][0],
        )
        return best, f"Allocated to {best.name}"

    except Exception as exc:
        db.rollback()
        logger.error("Order %d: allocation exception — %s", order_id, exc)
        order = db.query(Order).filter(Order.id == order_id).first()
        if order:
            order.status = "UNALLOCATED"
            db.commit()
        return None, f"Allocation failed: {exc}"


def restore_inventory_on_cancel(db: Session, order: Order) -> None:
    """
    Restore branch inventory when an order is cancelled.
    Only restores if the order was previously ALLOCATED to a branch.
    """
    if order.allocated_branch_id is None:
        return

    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for item in items:
        inv = (
            db.query(Inventory)
            .filter(
                Inventory.branch_id == order.allocated_branch_id,
                Inventory.product_id == item.product_id,
            )
            .with_for_update()
            .first()
        )
        if inv:
            inv.quantity += item.quantity

    logger.info(
        "Inventory restored for cancelled order %d at branch %d",
        order.id, order.allocated_branch_id,
    )
