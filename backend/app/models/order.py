from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    allocated_branch_id = Column(
        Integer, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Status lifecycle: PENDING → ALLOCATED | UNALLOCATED → PROCESSING → DELIVERED | CANCELLED
    status = Column(String(20), nullable=False, default="PENDING", index=True)

    # Customer note + AI/ML classification result
    customer_note = Column(Text, nullable=True)
    # Primary AI fields (new canonical names)
    ai_category = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    # Legacy aliases kept for backward compatibility
    note_category = Column(String(100), nullable=True)
    note_confidence = Column(Float, nullable=True)
    note_needs_review = Column(Boolean, nullable=True)

    total_amount = Column(Float, nullable=False, default=0.0)

    # Sri Lankan Delivery Address Data
    delivery_mobile = Column(String(20), nullable=True)
    delivery_address_line_1 = Column(String(255), nullable=True)
    delivery_address_line_2 = Column(String(255), nullable=True)
    delivery_postal_code = Column(String(10), nullable=True)
    delivery_city = Column(String(100), nullable=True)
    delivery_district = Column(String(100), nullable=True)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("User", back_populates="orders")
    allocated_branch = relationship("Branch", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
