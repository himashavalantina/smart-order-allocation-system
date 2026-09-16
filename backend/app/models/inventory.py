from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint("branch_id", "product_id", name="uq_branch_product"),
    )

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(
        Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    branch = relationship("Branch", back_populates="inventory")
    product = relationship("Product", back_populates="inventory")
