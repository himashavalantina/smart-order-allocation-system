from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_branch_manager
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.schemas.branch_inventory import InventoryAddRequest, InventoryUpdateRequest
from app.schemas.branch import InventoryResponse

router = APIRouter(prefix="/branch/inventory", tags=["Branch Inventory"])


@router.get("", response_model=List[InventoryResponse])
def get_branch_inventory(
    db: Session = Depends(get_db),
    manager: User = Depends(require_branch_manager),
):
    """Get all inventory items for the current manager's branch."""
    inv_items = db.query(Inventory).filter(Inventory.branch_id == manager.branch_id).all()
    
    response = []
    for inv in inv_items:
        product = db.query(Product).filter(Product.id == inv.product_id).first()
        response.append(
            InventoryResponse(
                product_id=inv.product_id,
                product_name=product.name if product else "Unknown",
                quantity=inv.quantity,
            )
        )
    return response


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def add_product_to_inventory(
    data: InventoryAddRequest,
    db: Session = Depends(get_db),
    manager: User = Depends(require_branch_manager),
):
    """Create a new product globally and add it to the branch's inventory."""
    # Create the global product first
    product = Product(
        name=data.product_name,
        description=data.description,
        price=data.price,
        category=data.category or "General",
        image_url=data.image_url,
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Auto-generate SKU based on category and ID (e.g. ELE-005)
    category_prefix = (product.category or "GEN")[:3].upper()
    product.sku = f"{category_prefix}-{product.id:03d}"
    db.commit()

    # Add it to the manager's branch inventory
    inv = Inventory(
        branch_id=manager.branch_id,
        product_id=product.id,
        quantity=data.stock,
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    return InventoryResponse(
        product_id=product.id,
        product_name=product.name,
        quantity=inv.quantity,
    )


@router.patch("/{product_id}", response_model=InventoryResponse)
def update_inventory_stock(
    product_id: int,
    data: InventoryUpdateRequest,
    db: Session = Depends(get_db),
    manager: User = Depends(require_branch_manager),
):
    """Manually update the stock of an item in the branch's inventory."""
    inv = (
        db.query(Inventory)
        .filter(Inventory.branch_id == manager.branch_id, Inventory.product_id == product_id)
        .first()
    )
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in this branch's inventory"
        )
    
    inv.quantity = data.stock
    db.commit()
    db.refresh(inv)

    product = db.query(Product).filter(Product.id == product_id).first()
    return InventoryResponse(
        product_id=product.id,
        product_name=product.name if product else "Unknown",
        quantity=inv.quantity,
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_inventory(
    product_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(require_branch_manager),
):
    """Remove a product from the branch's inventory (soft delete by setting stock to 0)."""
    inv = (
        db.query(Inventory)
        .filter(Inventory.branch_id == manager.branch_id, Inventory.product_id == product_id)
        .first()
    )
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found in this branch's inventory"
        )
    
    inv.quantity = 0
    db.commit()
    return None
