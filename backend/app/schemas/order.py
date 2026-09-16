from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime


class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=1000)


class OrderCreateRequest(BaseModel):
    items: List[OrderItemRequest] = Field(min_length=1)
    customer_note: Optional[str] = Field(None, max_length=2000)
    delivery_mobile: Optional[str] = Field(None, max_length=20)
    delivery_address_line_1: Optional[str] = Field(None, max_length=255)
    delivery_address_line_2: Optional[str] = Field(None, max_length=255)
    delivery_postal_code: Optional[str] = Field(None, max_length=10)
    delivery_city: Optional[str] = Field(None, max_length=100)
    delivery_district: Optional[str] = Field(None, max_length=100)
    delivery_lat: Optional[float] = Field(None, ge=-90, le=90)
    delivery_lng: Optional[float] = Field(None, ge=-180, le=180)

    @model_validator(mode="after")
    def check_no_duplicate_products(self) -> "OrderCreateRequest":
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError(
                "Duplicate products in order. Combine quantities into a single line item."
            )
        return self


class OrderStatusUpdateRequest(BaseModel):
    status: str = Field(
        pattern="^(ALLOCATED|UNALLOCATED|CANCELLED|DELIVERED|PENDING)$"
    )


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float = 0.0


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    status: str
    allocated_branch_id: Optional[int] = None
    allocated_branch_name: Optional[str] = None
    customer_note: Optional[str] = None
    note_category: Optional[str] = None
    note_confidence: Optional[float] = None
    note_needs_review: Optional[bool] = None
    total_amount: float
    delivery_mobile: Optional[str] = None
    delivery_address_line_1: Optional[str] = None
    delivery_address_line_2: Optional[str] = None
    delivery_postal_code: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_district: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []


class PaginatedOrdersResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
