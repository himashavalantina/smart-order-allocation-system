from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=255)
    location_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_lng: Optional[float] = Field(None, ge=-180, le=180)
    location_city: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="after")
    def validate_location_pair(self) -> "UserRegisterRequest":
        lat_set = self.location_lat is not None
        lng_set = self.location_lng is not None
        if lat_set != lng_set:
            raise ValueError(
                "location_lat and location_lng must both be provided or both omitted"
            )
        return self


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
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_city: Optional[str] = None
    is_active: bool
