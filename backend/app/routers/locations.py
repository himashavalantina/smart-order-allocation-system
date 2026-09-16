"""
routers/locations.py
~~~~~~~~~~~~~~~~~~~~
Provides a single search endpoint backed by the in-memory CSV postal code
service so the frontend can autocomplete Sri Lankan postal codes without
shipping the entire 1 800-row dataset to the browser.
"""

from typing import List

from fastapi import APIRouter, Query

from app.utils.location_service import search_postal_codes
from pydantic import BaseModel

router = APIRouter(prefix="/api/locations", tags=["Locations"])


class PostalCodeResult(BaseModel):
    postal_code: str
    city: str
    district: str
    lat: float
    lng: float


@router.get(
    "/search",
    response_model=List[PostalCodeResult],
    summary="Search Sri Lankan postal codes",
    description=(
        "Performs a fast two-phase search: prefix-match on postal code, "
        "then substring-match on city/district name. "
        "Returns at most 10 results."
    ),
)
def search_locations(
    query: str = Query(
        default="",
        min_length=0,
        max_length=20,
        description="Partial postal code or place name to search for",
    )
) -> List[PostalCodeResult]:
    results = search_postal_codes(query.strip(), limit=10)
    return [PostalCodeResult(**r) for r in results]
