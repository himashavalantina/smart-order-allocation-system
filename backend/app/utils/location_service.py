"""
location_service.py
~~~~~~~~~~~~~~~~~~~
Loads Sri Lankan postal code data from Postal_Codes.csv into memory on
application startup and exposes fast, pure-Python search and lookup functions.

CSV column layout (as shipped):
    Postal Code | Area | District | Latitude | Longitude

Duplicate postal codes in the CSV are averaged so each key maps to a single
geographic centroid — this keeps haversine math accurate when multiple CSV
rows share the same code (e.g. the two "200" entries in Colombo).
"""

import csv
import logging
import os
from collections import defaultdict
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Internal data structures
# ---------------------------------------------------------------------------

class PostalCodeEntry:
    """Lightweight value object representing one resolved postal code."""

    __slots__ = ("postal_code", "city", "district", "lat", "lng")

    def __init__(
        self,
        postal_code: str,
        city: str,
        district: str,
        lat: float,
        lng: float,
    ) -> None:
        self.postal_code = postal_code
        self.city = city
        self.district = district
        self.lat = lat
        self.lng = lng

    def to_dict(self) -> Dict:
        return {
            "postal_code": self.postal_code,
            "city": self.city,
            "district": self.district,
            "lat": self.lat,
            "lng": self.lng,
        }


# ---------------------------------------------------------------------------
# Module-level in-memory store
# ---------------------------------------------------------------------------

# Primary lookup: postal_code (str) → PostalCodeEntry
_POSTAL_CODE_MAP: Dict[str, PostalCodeEntry] = {}

# Sorted list of all codes for prefix-search iteration
_SORTED_CODES: List[str] = []

# Default fallback – Colombo Fort (code "100")
_DEFAULT_CODE = "100"

# Absolute path to the CSV file (sibling of this file's parent package)
_CSV_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "ml",
    "Postal_Codes.csv",
)


# ---------------------------------------------------------------------------
# Loader (called once at startup)
# ---------------------------------------------------------------------------

def _build_centroid(accum: Dict) -> PostalCodeEntry:
    """Average lat/lng of duplicate rows and pick the first area/district name."""
    count = accum["count"]
    return PostalCodeEntry(
        postal_code=accum["postal_code"],
        city=accum["city"],
        district=accum["district"],
        lat=round(accum["lat_sum"] / count, 6),
        lng=round(accum["lng_sum"] / count, 6),
    )


def load_postal_codes() -> None:
    """
    Read Postal_Codes.csv into memory.

    Duplicate postal code rows are merged by averaging their coordinates and
    keeping the first Area/District name encountered.  This produces one
    accurate centroid per code.

    Safe to call multiple times – subsequent calls re-load the data.
    """
    global _POSTAL_CODE_MAP, _SORTED_CODES

    csv_path = os.path.normpath(_CSV_PATH)
    if not os.path.isfile(csv_path):
        logger.error("Postal_Codes.csv not found at %s", csv_path)
        return

    # Accumulate duplicate rows per postal code before resolving centroids
    accumulator: Dict[str, Dict] = defaultdict(
        lambda: {"count": 0, "city": "", "district": "", "lat_sum": 0.0, "lng_sum": 0.0, "postal_code": ""}
    )

    rows_read = 0
    errors = 0

    with open(csv_path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            try:
                code = str(row["Postal Code"]).strip()
                area = str(row["Area"]).strip()
                district = str(row["District"]).strip()
                lat = float(row["Latitude"])
                lng = float(row["Longitude"])
            except (KeyError, ValueError) as exc:
                errors += 1
                logger.debug("Skipping malformed CSV row: %s — %s", row, exc)
                continue

            acc = accumulator[code]
            acc["count"] += 1
            acc["lat_sum"] += lat
            acc["lng_sum"] += lng
            acc["postal_code"] = code
            if acc["count"] == 1:
                # Keep first-encountered name for this code
                acc["city"] = area
                acc["district"] = district

            rows_read += 1

    # Resolve centroids and build the final map
    _POSTAL_CODE_MAP = {
        code: _build_centroid(acc) for code, acc in accumulator.items()
    }
    _SORTED_CODES = sorted(_POSTAL_CODE_MAP.keys())

    logger.info(
        "Postal code service: loaded %d unique codes from %d CSV rows (%d skipped)",
        len(_POSTAL_CODE_MAP),
        rows_read,
        errors,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def search_postal_codes(query: str, limit: int = 10) -> List[Dict]:
    """
    Return up to *limit* postal code entries whose code or city name contains
    the query string (case-insensitive).

    Strategy:
      1. Prefix-match on the code itself (e.g. "003" → all codes starting with "003").
      2. If fewer than *limit* results so far, substring-match on city name.

    This keeps the common case (user typing a code) fast while still supporting
    city-name search.
    """
    if not query:
        # Return a sensible default sample when query is empty
        return [_POSTAL_CODE_MAP[c].to_dict() for c in _SORTED_CODES[:limit]]

    q = query.strip().lower()
    results: List[PostalCodeEntry] = []
    seen: set = set()

    # Phase 1 – prefix match on code
    for code in _SORTED_CODES:
        if code.startswith(q):
            results.append(_POSTAL_CODE_MAP[code])
            seen.add(code)
            if len(results) >= limit:
                break

    # Phase 2 – substring match on city/district (fill remaining slots)
    if len(results) < limit:
        for code in _SORTED_CODES:
            if code in seen:
                continue
            entry = _POSTAL_CODE_MAP[code]
            if q in entry.city.lower() or q in entry.district.lower():
                results.append(entry)
                seen.add(code)
                if len(results) >= limit:
                    break

    return [e.to_dict() for e in results]


def lookup_postal_code_csv(postal_code: Optional[str]) -> Dict:
    """
    Exact lookup for a postal code.  Falls back to the default Colombo entry
    if the code is missing or not found.
    """
    if not postal_code:
        return _get_default()

    code = str(postal_code).strip()
    entry = _POSTAL_CODE_MAP.get(code)
    if entry:
        return entry.to_dict()

    logger.warning("Postal code '%s' not found in CSV — using default", code)
    return _get_default()


def _get_default() -> Dict:
    default = _POSTAL_CODE_MAP.get(_DEFAULT_CODE)
    if default:
        return default.to_dict()
    # Absolute last-resort hard-coded fallback
    return {
        "postal_code": "100",
        "city": "Fort",
        "district": "Colombo",
        "lat": 6.9392,
        "lng": 79.8436,
    }
