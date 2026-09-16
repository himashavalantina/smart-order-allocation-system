"""
routers/support.py
~~~~~~~~~~~~~~~~~~
Support ticket endpoints.

POST /api/support/tickets
  - Authenticated customers submit a message (+ optional order_id).
  - The message is classified by the in-memory ML classifier.
  - ai_category, ai_confidence, and ai_confidence_pct are stored in the DB.
  - Returns the classification result in the exact format requested:
      { "category": "Payment Issue", "confidence": "86%" }
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.support_ticket import SupportTicket
from app.models.user import User
from app.services.ml_classifier import classify_message

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/support", tags=["Support"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class TicketCreateRequest(BaseModel):
    message: str = Field(
        min_length=5,
        max_length=2000,
        description="Customer's support message",
        examples=["My payment was deducted, but my order is not showing."],
    )
    order_id: Optional[int] = Field(
        None,
        description="Optional ID of the order this ticket relates to",
    )


class TicketCreateResponse(BaseModel):
    """
    Exact response shape required by the spec:
      { "category": "Payment Issue", "confidence": "86%" }

    Extra fields are included for completeness but the primary ones are
    category and confidence.
    """
    ticket_id: int
    category: str
    confidence: str          # formatted percentage, e.g. "86%"
    needs_review: bool
    status: str
    message: str


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/tickets",
    response_model=TicketCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a support ticket",
    description=(
        "Accepts a customer message, classifies it with the ML classifier, "
        "stores the ticket in the database, and returns the predicted "
        "category along with a confidence percentage."
    ),
)
def create_support_ticket(
    data: TicketCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate optional order_id belongs to the current user
    if data.order_id is not None:
        from app.models.order import Order
        order = db.query(Order).filter(Order.id == data.order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {data.order_id} not found",
            )
        if order.customer_id != current_user.id and current_user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to that order",
            )

    # Run ML classification
    try:
        result = classify_message(data.message)
    except Exception as exc:
        logger.error("ML classification failed for ticket: %s", exc)
        result = {
            "category": "Unclassified - Requires Human Review",
            "confidence": 0.0,
            "confidence_pct": "0%",
            "needs_review": True,
            "all_probabilities": {},
        }

    # Persist the ticket
    ticket = SupportTicket(
        user_id=current_user.id,
        order_id=data.order_id,
        message=data.message,
        ai_category=result["category"],
        ai_confidence=result["confidence"],
        ai_confidence_pct=result["confidence_pct"],
        status="Open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    logger.info(
        "Support ticket #%d created — category: %s  confidence: %s",
        ticket.id,
        result["category"],
        result["confidence_pct"],
    )

    return TicketCreateResponse(
        ticket_id=ticket.id,
        category=result["category"],
        confidence=result["confidence_pct"],   # "86%"
        needs_review=result["needs_review"],
        status=ticket.status,
        message=data.message,
    )
