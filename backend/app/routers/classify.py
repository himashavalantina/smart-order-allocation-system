from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.dependencies import get_current_user
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.classification import ClassifyRequest, ClassifyResponse
from app.services.classification_service import classify_message

router = APIRouter(prefix="/classify", tags=["AI Classification"])


@router.post("", response_model=ClassifyResponse)
@limiter.limit("20/minute")
def classify_note(
    request: Request,
    data: ClassifyRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Classify a customer message into one of:
      Payment Issue | Delivery Issue | Refund/Cancellation |
      Product Inquiry | General Inquiry

    If confidence < 0.65 the result is "Needs Manual Review".
    """
    try:
        result = classify_message(data.message)
        return ClassifyResponse(
            category=result["category"],
            confidence=result["confidence"],
            needs_review=result["needs_review"],
            all_probabilities=result["all_probabilities"],
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
