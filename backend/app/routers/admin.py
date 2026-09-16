import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin, require_staff
from app.models.branch import Branch
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.routers.branches import _build_response as _branch_resp
from app.routers.orders import _build_order_response
from app.schemas.order import OrderStatusUpdateRequest, OrderStatusPatchRequest, PaginatedOrdersResponse

router = APIRouter(prefix="/admin", tags=["Admin"])

# Import here to avoid circular imports
from app.services.allocation_service import restore_inventory_on_cancel  # noqa: E402


@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    def count(filt=None):
        q = db.query(func.count(Order.id))
        if _staff.role == "BRANCH_MANAGER":
            q = q.filter(Order.allocated_branch_id == _staff.branch_id)
        return (q.filter(filt).scalar() if filt is not None else q.scalar()) or 0

    total_orders = count()
    allocated = count(Order.status == "ALLOCATED")
    delivered = count(Order.status == "DELIVERED")
    unallocated = count(Order.status == "UNALLOCATED")
    cancelled = count(Order.status == "CANCELLED")
    pending = count(Order.status == "PENDING")

    revenue_query = db.query(func.sum(Order.total_amount)).filter(Order.status.in_(["ALLOCATED", "DELIVERED"]))
    if _staff.role == "BRANCH_MANAGER":
        revenue_query = revenue_query.filter(Order.allocated_branch_id == _staff.branch_id)
    total_revenue = revenue_query.scalar() or 0.0

    total_customers = (
        db.query(func.count(User.id)).filter(User.role == "CUSTOMER").scalar() or 0
    )
    total_branches = (
        db.query(func.count(Branch.id)).filter(Branch.is_active == True).scalar() or 0
    )
    total_products = (
        db.query(func.count(Product.id)).filter(Product.is_active == True).scalar() or 0
    )

    branches = db.query(Branch).filter(Branch.is_active == True).all()
    branch_workload = []
    for branch in branches:
        active = (
            db.query(func.count(Order.id))
            .filter(
                Order.allocated_branch_id == branch.id,
                Order.status.in_(["ALLOCATED", "PENDING"]),
            )
            .scalar()
            or 0
        )
        total_b = (
            db.query(func.count(Order.id))
            .filter(Order.allocated_branch_id == branch.id)
            .scalar()
            or 0
        )
        branch_workload.append(
            {
                "id": branch.id,
                "name": branch.name,
                "city": branch.city,
                "active_orders": active,
                "total_orders": total_b,
            }
        )

    status_distribution = [
        {"status": "ALLOCATED", "count": allocated},
        {"status": "DELIVERED", "count": delivered},
        {"status": "UNALLOCATED", "count": unallocated},
        {"status": "CANCELLED", "count": cancelled},
        {"status": "PENDING", "count": pending},
    ]

    recent_query = db.query(Order)
    if _staff.role == "BRANCH_MANAGER":
        recent_query = recent_query.filter(Order.allocated_branch_id == _staff.branch_id)
    recent_orders = recent_query.order_by(Order.created_at.desc()).limit(5).all()

    return {
        "summary": {
            "total_orders": total_orders,
            "allocated_orders": allocated,
            "delivered_orders": delivered,
            "unallocated_orders": unallocated,
            "cancelled_orders": cancelled,
            "pending_orders": pending,
            "total_revenue": round(total_revenue, 2),
            "total_customers": total_customers,
            "total_branches": total_branches,
            "total_products": total_products,
        },
        "status_distribution": status_distribution,
        "branch_workload": branch_workload,
        "recent_orders": [_build_order_response(db, o) for o in recent_orders],
    }


@router.get("/orders", response_model=PaginatedOrdersResponse)
def list_all_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    branch_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None, description="Search by customer name or email"),
    db: Session = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    query = db.query(Order)
    
    if _staff.role == "BRANCH_MANAGER":
        query = query.filter(Order.allocated_branch_id == _staff.branch_id)
    elif branch_id:
        query = query.filter(Order.allocated_branch_id == branch_id)
        
    if status_filter:
        query = query.filter(Order.status == status_filter.upper())
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if search:
        query = query.join(User, Order.customer_id == User.id).filter(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    total = query.count()
    orders = (
        query.order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return PaginatedOrdersResponse(
        orders=[_build_order_response(db, o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusUpdateRequest,
    db: Session = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    """Legacy PUT endpoint — kept for backward compatibility."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    if _staff.role == "BRANCH_MANAGER" and str(order.allocated_branch_id) != str(_staff.branch_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Not authorized to update this order. Order branch: {order.allocated_branch_id}, Your branch: {_staff.branch_id}"
        )
        
    if data.status == "CANCELLED" and order.status not in ("CANCELLED", "DELIVERED"):
        restore_inventory_on_cancel(db, order)
    order.status = data.status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return _build_order_response(db, order)


@router.patch(
    "/orders/{order_id}/status",
    response_model=None,
    summary="Update order status (Admin)",
    description=(
        "Transitions an order's status. "
        "Side-effects: "
        "(1) CANCELLED → inventory restored to the allocated branch. "
        "(2) DELIVERED / CANCELLED → order excluded from branch active-workload."
    ),
)
def patch_order_status(
    order_id: int,
    data: OrderStatusPatchRequest,
    db: Session = Depends(get_db),
    _staff: User = Depends(require_staff),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if _staff.role == "BRANCH_MANAGER" and str(order.allocated_branch_id) != str(_staff.branch_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Not authorized to update this order. Order branch: {order.allocated_branch_id}, Your branch: {_staff.branch_id}"
        )

    new_status = data.status
    old_status = order.status

    # Guard: already in a terminal state — no further transitions
    if old_status in ("DELIVERED", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already in a terminal state '{old_status}' and cannot be changed.",
        )

    # Side-effect 1: Restore inventory when cancelling an allocated order
    if new_status == "CANCELLED" and order.allocated_branch_id is not None:
        restore_inventory_on_cancel(db, order)

    # Side-effect 2: DELIVERED and CANCELLED orders are automatically excluded from
    # active-workload calculations because allocation_service filters on
    # status IN ('ALLOCATED', 'PENDING') — no extra action needed here.

    order.status = new_status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return _build_order_response(db, order)


@router.get("/customers")
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    query = db.query(User).filter(User.role == "CUSTOMER")
    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    total = query.count()
    customers = (
        query.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "customers": [
            {
                "id": c.id,
                "email": c.email,
                "full_name": c.full_name,
                "location_city": c.location_city,
                "is_active": c.is_active,
                "created_at": c.created_at,
                "total_orders": db.query(func.count(Order.id))
                .filter(Order.customer_id == c.id)
                .scalar()
                or 0,
            }
            for c in customers
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size) if total > 0 else 0,
    }
