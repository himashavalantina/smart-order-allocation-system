from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductCreateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: float = Field(gt=0)
    category: str = Field(min_length=2, max_length=100)
    sku: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = Field(None, max_length=500)


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    sku: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    description: Optional[str] = None
    price: float
    category: str
    sku: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
