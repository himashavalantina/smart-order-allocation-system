from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class InventoryItemSchema(BaseModel):
    product_id: int
    quantity: int = Field(ge=0)


class BranchCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    location_lat: float = Field(ge=-90, le=90)
    location_lng: float = Field(ge=-180, le=180)
    city: Optional[str] = Field(None, max_length=100)


class BranchUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    address: Optional[str] = Field(None, max_length=500)
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lng: Optional[float] = Field(None, ge=-180, le=180)
    city: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class BranchInventoryUpdateRequest(BaseModel):
    inventory: List[InventoryItemSchema]


class InventoryResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int


class BranchResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    location_lat: float
    location_lng: float
    city: Optional[str] = None
    is_active: bool
    created_at: datetime
    inventory: List[InventoryResponse] = []
    active_orders_count: int = 0
