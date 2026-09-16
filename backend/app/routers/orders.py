import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.branch import Branch
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import (
    OrderCreateRequest,
    OrderResponse,
    PaginatedOrdersResponse,
    OrderItemResponse,
)
from app.services.allocation_service import allocate_order, restore_inventory_on_cancel
from app.services.classification_service import classify_message

router = APIRouter(prefix="/orders", tags=["Orders"])


def _build_order_response(db: Session, order: Order) -> OrderResponse:
    items_resp: list[OrderItemResponse] = []
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        items_resp.append(
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=product.name if product else "Unknown",
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=round(item.quantity * item.unit_price, 2),
            )
        )

    branch_name = None
    if order.allocated_branch_id:
        branch = db.query(Branch).filter(Branch.id == order.allocated_branch_id).first()
        branch_name = branch.name if branch else None

    customer_name = order.customer.full_name if order.customer else None

    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=customer_name,
        status=order.status,
        allocated_branch_id=order.allocated_branch_id,
        allocated_branch_name=branch_name,
        customer_note=order.customer_note,
        note_category=order.note_category,
        note_confidence=order.note_confidence,
        note_needs_review=order.note_needs_review,
        total_amount=order.total_amount,
        delivery_city=order.delivery_city,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items_resp,
    )


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate all products and snapshot prices
    total_amount = 0.0
    validated_items: list[tuple[Product, int]] = []
    for req_item in data.items:
        product = db.query(Product).filter(
            Product.id == req_item.product_id, Product.is_active == True
        ).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {req_item.product_id} not found or inactive",
            )
        total_amount += product.price * req_item.quantity
        validated_items.append((product, req_item.quantity))

    # Resolve delivery location
    delivery_lat = data.delivery_lat or current_user.location_lat
    delivery_lng = data.delivery_lng or current_user.location_lng
    delivery_city = data.delivery_city or current_user.location_city

    order = Order(
        customer_id=current_user.id,
        status="PENDING",
        customer_note=data.customer_note,
        total_amount=round(total_amount, 2),
        delivery_lat=delivery_lat,
        delivery_lng=delivery_lng,
        delivery_city=delivery_city,
    )

    # Classify note if present (gracefully skip if model not trained)
    if data.customer_note:
        try:
            result = classify_message(data.customer_note)
            order.note_category = result["category"]
            order.note_confidence = result["confidence"]
            order.note_needs_review = result["needs_review"]
        except FileNotFoundError:
            pass  # Model not trained yet — classification skipped

    db.add(order)
    db.flush()  # Obtain order.id without committing

    for product, qty in validated_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
            )
        )

    db.commit()
    db.refresh(order)

    # Run allocation synchronously (swap to background task in production)
    allocate_order(db, order.id)
    db.refresh(order)

    return _build_order_response(db, order)


@router.get("", response_model=PaginatedOrdersResponse)
def list_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Order).filter(Order.customer_id == current_user.id)
    if status_filter:
        query = query.filter(Order.status == status_filter.upper())

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


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Customers can only view their own orders; admins see all
    if current_user.role == "CUSTOMER" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return _build_order_response(db, order)


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if current_user.role == "CUSTOMER" and order.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if order.status in ("CANCELLED", "DELIVERED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel an order with status '{order.status}'",
        )

    # Restore inventory before changing status
    restore_inventory_on_cancel(db, order)
    order.status = "CANCELLED"
    order.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Order cancelled successfully", "order_id": order_id}
