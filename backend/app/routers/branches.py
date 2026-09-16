from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.branch import Branch
from app.models.inventory import Inventory
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.branch import (
    BranchCreateRequest,
    BranchUpdateRequest,
    BranchInventoryUpdateRequest,
    BranchResponse,
    InventoryResponse,
)

router = APIRouter(prefix="/branches", tags=["Branches"])


def _build_response(db: Session, branch: Branch) -> BranchResponse:
    inv_items: List[InventoryResponse] = []
    for inv in branch.inventory:
        product = db.query(Product).filter(Product.id == inv.product_id).first()
        inv_items.append(
            InventoryResponse(
                product_id=inv.product_id,
                product_name=product.name if product else "Unknown",
                quantity=inv.quantity,
            )
        )

    active_orders = (
        db.query(Order)
        .filter(
            Order.allocated_branch_id == branch.id,
            Order.status.in_(["ALLOCATED", "PENDING"]),
        )
        .count()
    )

    return BranchResponse(
        id=branch.id,
        name=branch.name,
        address=branch.address,
        location_lat=branch.location_lat,
        location_lng=branch.location_lng,
        city=branch.city,
        is_active=branch.is_active,
        created_at=branch.created_at,
        inventory=inv_items,
        active_orders_count=active_orders,
    )


@router.get("", response_model=List[BranchResponse])
def list_branches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    branches = db.query(Branch).order_by(Branch.name).all()
    return [_build_response(db, b) for b in branches]


@router.get("/{branch_id}", response_model=BranchResponse)
def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    return _build_response(db, branch)


@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
def create_branch(
    data: BranchCreateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    branch = Branch(**data.model_dump())
    db.add(branch)
    db.commit()
    db.refresh(branch)
    return _build_response(db, branch)


@router.put("/{branch_id}", response_model=BranchResponse)
def update_branch(
    branch_id: int,
    data: BranchUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(branch, field, value)
    db.commit()
    db.refresh(branch)
    return _build_response(db, branch)


@router.put("/{branch_id}/inventory", response_model=BranchResponse)
def update_inventory(
    branch_id: int,
    data: BranchInventoryUpdateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Branch not found")

    for inv_item in data.inventory:
        if not db.query(Product).filter(Product.id == inv_item.product_id).first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {inv_item.product_id} not found",
            )
        existing = (
            db.query(Inventory)
            .filter(
                Inventory.branch_id == branch_id,
                Inventory.product_id == inv_item.product_id,
            )
            .first()
        )
        if existing:
            existing.quantity = inv_item.quantity
        else:
            db.add(
                Inventory(
                    branch_id=branch_id,
                    product_id=inv_item.product_id,
                    quantity=inv_item.quantity,
                )
            )

    db.commit()
    db.refresh(branch)
    return _build_response(db, branch)
