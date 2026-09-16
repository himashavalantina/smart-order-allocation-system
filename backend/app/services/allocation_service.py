import logging
from typing import Optional, Tuple, List

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.branch import Branch
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.utils.location_data import calculate_haversine_distance
from app.utils.location_service import lookup_postal_code_csv as lookup_postal_code

logger = logging.getLogger(__name__)

# Scoring constants specified in requirements:
# Score = (Distance_in_km * 1.0) + (Active_Pending_Orders_Count * 0.5)
DISTANCE_WEIGHT = 1.0
WORKLOAD_WEIGHT = 0.5


class AllocationService:
    @staticmethod
    def allocate_order(db: Session, order_id: int) -> Tuple[Optional[Branch], str]:
        """
        Smart Order Allocation Engine.

        Step 1 — The Hard Filter (Stock Check with row-level locking):
            Filter out ANY branch that does not have 100% stock availability
            for EVERY line item in the order payload.

        Step 2 — The Scoring System:
            Score = (Distance_in_km * 1.0) + (Active_Pending_Orders_Count * 0.5)
            Lower Score = Better Branch candidate.

        Step 3 — Exact Middle Tie-Breakers:
            If two or more branches achieve the exact same final Score:
            1. Inventory Tie-Breaker: Select branch with highest remaining total stock of requested items.
            2. Workload Tie-Breaker: Select branch with lowest active pending orders count.
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

        # Resolve delivery lat/lng from order or customer profile or postal code centroid lookup
        delivery_lat = order.delivery_lat or (customer.location_lat if customer else None)
        delivery_lng = order.delivery_lng or (customer.location_lng if customer else None)

        if delivery_lat is None or delivery_lng is None:
            postal_code = order.delivery_postal_code or (customer.postal_code if customer else "00300")
            loc = lookup_postal_code(postal_code)
            delivery_lat, delivery_lng = loc["lat"], loc["lng"]

        active_branches = db.query(Branch).filter(Branch.is_active == True).all()
        if not active_branches:
            order.status = "UNALLOCATED"
            db.commit()
            return None, "No active branches are available"

        # ── Step 1: The Hard Filter (Stock Check) ────────────────────────────
        eligible_branches: List[Branch] = []

        for branch in active_branches:
            qualifies = True
            for item in items:
                # Use with_for_update() row locking to inspect accurate committed inventory
                inv = (
                    db.query(Inventory)
                    .filter(
                        Inventory.branch_id == branch.id,
                        Inventory.product_id == item.product_id,
                    )
                    .with_for_update()
                    .first()
                )
                if inv is None or inv.quantity < item.quantity:
                    qualifies = False
                    break

            if qualifies:
                eligible_branches.append(branch)

        if not eligible_branches:
            order.status = "UNALLOCATED"
            db.commit()
            logger.info("Order %d → UNALLOCATED (insufficient stock at all branches)", order_id)
            return None, "No branch has 100% stock availability for all items"

        # ── Step 2 & 3: Scoring & Tie-Breaker Logic ──────────────────────────
        # Candidate format: (score, -total_remaining_inventory, active_orders_count, branch)
        candidates: List[Tuple[float, int, int, Branch]] = []

        for branch in eligible_branches:
            # 1. Straight-line distance in km via pure math Haversine formula
            dist_km = calculate_haversine_distance(
                delivery_lat, delivery_lng, branch.location_lat, branch.location_lng
            )

            # 2. Count active pending/allocated orders at this branch
            active_order_count = (
                db.query(func.count(Order.id))
                .filter(
                    Order.allocated_branch_id == branch.id,
                    Order.status.in_(["ALLOCATED", "PENDING"]),
                )
                .scalar()
            ) or 0

            # 3. Calculate exact scoring formula
            score = (dist_km * DISTANCE_WEIGHT) + (active_order_count * WORKLOAD_WEIGHT)

            # 4. Calculate total remaining inventory of requested products (for Tie-Breaker 1)
            total_remaining_stock = 0
            for item in items:
                inv = (
                    db.query(Inventory)
                    .filter(
                        Inventory.branch_id == branch.id,
                        Inventory.product_id == item.product_id,
                    )
                    .first()
                )
                total_remaining_stock += inv.quantity if inv else 0

            candidates.append((round(score, 4), -total_remaining_stock, active_order_count, branch))

        # Sort Order:
        # 1. Primary: Lowest Score
        # 2. Tie-Breaker 1: Highest remaining total stock (negated)
        # 3. Tie-Breaker 2: Lowest active pending orders count
        candidates.sort(key=lambda c: (c[0], c[1], c[2]))
        best_candidate = candidates[0]
        best_branch = best_candidate[3]

        # ── Step 4: Atomic Inventory Reservation ────────────────────────────
        try:
            for item in items:
                inv = (
                    db.query(Inventory)
                    .filter(
                        Inventory.branch_id == best_branch.id,
                        Inventory.product_id == item.product_id,
                    )
                    .with_for_update()
                    .first()
                )
                if inv is None or inv.quantity < item.quantity:
                    db.rollback()
                    order = db.query(Order).filter(Order.id == order_id).first()
                    order.status = "UNALLOCATED"
                    db.commit()
                    return None, "Stock depleted during allocation"

                inv.quantity -= item.quantity

            order.status = "ALLOCATED"
            order.allocated_branch_id = best_branch.id
            db.commit()

            logger.info(
                "Order %d → ALLOCATED to '%s' (score=%.4f)",
                order_id, best_branch.name, best_candidate[0],
            )
            return best_branch, f"Allocated to {best_branch.name}"

        except Exception as exc:
            db.rollback()
            logger.error("Order %d allocation failed: %s", order_id, exc)
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.status = "UNALLOCATED"
                db.commit()
            return None, f"Allocation failed: {exc}"


# Module-level alias functions for backwards compatibility
def allocate_order(db: Session, order_id: int) -> Tuple[Optional[Branch], str]:
    return AllocationService.allocate_order(db, order_id)


def restore_inventory_on_cancel(db: Session, order: Order) -> None:
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

    db.commit()
