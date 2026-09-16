from pydantic import BaseModel
from typing import Optional


class InventoryAddRequest(BaseModel):
    product_name: str
    stock: int
    price: Optional[float] = 0.0


class InventoryUpdateRequest(BaseModel):
    stock: int
