from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    mobile_number: str = Field(..., min_length=10, max_length=10, pattern=r"^\d{10}$")
    address_line_1: str = Field(..., min_length=2, max_length=255)
    address_line_2: Optional[str] = Field(None, max_length=255)
    postal_code: str = Field(..., min_length=5, max_length=5, pattern=r"^\d{5}$")
    location_city: Optional[str] = Field(None, max_length=100)
    location_district: Optional[str] = Field(None, max_length=100)
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lng: Optional[float] = Field(None, ge=-180, le=180)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    email: str
    full_name: str
    role: str
    mobile_number: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    postal_code: Optional[str] = None
    location_city: Optional[str] = None
    location_district: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    is_active: bool
