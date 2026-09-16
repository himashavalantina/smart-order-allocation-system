from typing import Optional, Tuple

# Geospatial coordinates (Latitude, Longitude) for major cities in Sri Lanka
SRI_LANKA_CITY_COORDINATES = {
    "Colombo": (6.9271, 79.8612),
    "Kandy": (7.2906, 80.6337),
    "Galle": (6.0535, 80.2210),
    "Negombo": (7.2083, 79.8358),
    "Jaffna": (9.6615, 80.0255),
    "Kurunegala": (7.4863, 80.3623),
    "Matara": (5.9549, 80.5550),
    "Anuradhapura": (8.3114, 80.4037),
    "Batticaloa": (7.7170, 81.7000),
    "Trincomalee": (8.5874, 81.2152),
    "Ratnapura": (6.6828, 80.4016),
    "Badulla": (6.9934, 81.0550),
    "Kalutara": (6.5854, 79.9607),
    "Dambulla": (7.8731, 80.6517),
}

DEFAULT_COORDINATES = (6.9271, 79.8612)


def get_city_coordinates(city_name: Optional[str]) -> Tuple[float, float]:
    """
    Returns (latitude, longitude) for a given city in Sri Lanka.
    Case-insensitive matching with fallback to Colombo coordinates.
    """
    if not city_name:
        return DEFAULT_COORDINATES

    clean_name = city_name.strip()
    for name, coords in SRI_LANKA_CITY_COORDINATES.items():
        if name.lower() == clean_name.lower():
            return coords

    for name, coords in SRI_LANKA_CITY_COORDINATES.items():
        if name.lower() in clean_name.lower() or clean_name.lower() in name.lower():
            return coords

    return DEFAULT_COORDINATES
