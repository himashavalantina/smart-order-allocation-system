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

    # Status lifecycle: PENDING -> ALLOCATED | UNALLOCATED -> DELIVERED | CANCELLED
    status = Column(String(20), nullable=False, default="PENDING", index=True)

    # Customer note + AI classification result
    customer_note = Column(Text, nullable=True)
    note_category = Column(String(100), nullable=True)
    note_confidence = Column(Float, nullable=True)
    note_needs_review = Column(Boolean, nullable=True)

    total_amount = Column(Float, nullable=False, default=0.0)

    # Delivery address (overrides customer profile location)
    delivery_lat = Column(Float, nullable=True)
    delivery_lng = Column(Float, nullable=True)
    delivery_city = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("User", back_populates="orders")
    allocated_branch = relationship("Branch", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
