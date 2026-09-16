from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)

    # The customer who submitted the ticket
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Optional link to a specific order
    order_id = Column(
        Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Free-text message from the customer
    message = Column(Text, nullable=False)

    # AI/ML classification result
    ai_category = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True)          # raw probability 0–1
    ai_confidence_pct = Column(String(10), nullable=True) # e.g. "86%"

    # Ticket lifecycle: Open → Closed
    status = Column(String(20), nullable=False, default="Open", index=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("User", foreign_keys=[user_id])
    order = relationship("Order", foreign_keys=[order_id])
