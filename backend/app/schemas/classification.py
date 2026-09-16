from pydantic import BaseModel, Field
from typing import Optional, Dict


class ClassifyRequest(BaseModel):
    message: str = Field(min_length=5, max_length=2000)


class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    needs_review: bool
    all_probabilities: Optional[Dict[str, float]] = None
