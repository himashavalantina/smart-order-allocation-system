from pydantic import BaseModel
from typing import Optional


class InventoryAddRequest(BaseModel):
    product_name: str
    stock: int
    price: Optional[float] = 0.0
    image_url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = "General"


class InventoryUpdateRequest(BaseModel):
    stock: int
