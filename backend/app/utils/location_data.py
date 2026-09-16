import math
from typing import Dict, Any, Optional

# Mock Sri Lankan Postal Code Centroids Mapping
SRI_LANKA_POSTAL_CODES: Dict[str, Dict[str, Any]] = {
    "00300": {
        "city": "Kollupitiya (Colombo 03)",
        "district": "Colombo",
        "lat": 6.9056,
        "lng": 79.8523,
    },
    "00100": {
        "city": "Fort (Colombo 01)",
        "district": "Colombo",
        "lat": 6.9344,
        "lng": 79.8428,
    },
    "00700": {
        "city": "Cinnamon Gardens (Colombo 07)",
        "district": "Colombo",
        "lat": 6.9110,
        "lng": 79.8650,
    },
    "10350": {
        "city": "Dehiwala",
        "district": "Colombo",
        "lat": 6.8511,
        "lng": 79.8660,
    },
    "11500": {
        "city": "Negombo",
        "district": "Gampaha",
        "lat": 7.2090,
        "lng": 79.8380,
    },
    "20000": {
        "city": "Kandy Central",
        "district": "Kandy",
        "lat": 7.2906,
        "lng": 80.6337,
    },
    "20100": {
        "city": "Peradeniya",
        "district": "Kandy",
        "lat": 7.2662,
        "lng": 80.5983,
    },
    "80000": {
        "city": "Galle Fort",
        "district": "Galle",
        "lat": 6.0535,
        "lng": 80.2210,
    },
    "81000": {
        "city": "Matara Central",
        "district": "Matara",
        "lat": 5.9549,
        "lng": 80.5550,
    },
    "40000": {
        "city": "Jaffna Town",
        "district": "Jaffna",
        "lat": 9.6615,
        "lng": 80.0255,
    },
    "60000": {
        "city": "Kurunegala Town",
        "district": "Kurunegala",
        "lat": 7.4863,
        "lng": 80.3623,
    },
    "50000": {
        "city": "Anuradhapura",
        "district": "Anuradhapura",
        "lat": 8.3114,
        "lng": 80.4037,
    },
    "30000": {
        "city": "Badulla",
        "district": "Badulla",
        "lat": 6.9934,
        "lng": 81.0550,
    },
}

DEFAULT_POSTAL_CODE = "00300"


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """
    Pure-math Haversine distance formula.
    Calculates straight-line distance in kilometers between two geographic coordinates.
    """
    R = 6371.0  # Earth's mean radius in kilometers

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 4)


def lookup_postal_code(postal_code: Optional[str]) -> Dict[str, Any]:
    """
    Looks up city, district, latitude, and longitude from a 5-digit Sri Lankan postal code.
    Falls back to Colombo 03 (00300) if the postal code is invalid or missing.
    """
    if not postal_code:
        return SRI_LANKA_POSTAL_CODES[DEFAULT_POSTAL_CODE]

    clean_code = str(postal_code).strip()
    if clean_code in SRI_LANKA_POSTAL_CODES:
        return SRI_LANKA_POSTAL_CODES[clean_code]

    # Fallback default
    return SRI_LANKA_POSTAL_CODES[DEFAULT_POSTAL_CODE]
