from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="CUSTOMER")  # CUSTOMER | ADMIN

    # Sri Lankan Address Data
    mobile_number = Column(String(20), nullable=True)
    address_line_1 = Column(String(255), nullable=True)
    address_line_2 = Column(String(255), nullable=True)
    postal_code = Column(String(10), nullable=True)
    location_city = Column(String(100), nullable=True)
    location_district = Column(String(100), nullable=True)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer", lazy="select")
