export interface PostalCodeData {
  city: string;
  district: string;
  lat: number;
  lng: number;
}

export const SRI_LANKA_POSTAL_CODES: Record<string, PostalCodeData> = {
  "00300": {
    city: "Kollupitiya (Colombo 03)",
    district: "Colombo",
    lat: 6.9056,
    lng: 79.8523,
  },
  "00100": {
    city: "Fort (Colombo 01)",
    district: "Colombo",
    lat: 6.9344,
    lng: 79.8428,
  },
  "00700": {
    city: "Cinnamon Gardens (Colombo 07)",
    district: "Colombo",
    lat: 6.911,
    lng: 79.865,
  },
  "10350": {
    city: "Dehiwala",
    district: "Colombo",
    lat: 6.8511,
    lng: 79.866,
  },
  "11500": {
    city: "Negombo",
    district: "Gampaha",
    lat: 7.209,
    lng: 79.838,
  },
  "20000": {
    city: "Kandy Central",
    district: "Kandy",
    lat: 7.2906,
    lng: 80.6337,
  },
  "20100": {
    city: "Peradeniya",
    district: "Kandy",
    lat: 7.2662,
    lng: 80.5983,
  },
  "80000": {
    city: "Galle Fort",
    district: "Galle",
    lat: 6.0535,
    lng: 80.221,
  },
  "81000": {
    city: "Matara Central",
    district: "Matara",
    lat: 5.9549,
    lng: 80.555,
  },
  "40000": {
    city: "Jaffna Town",
    district: "Jaffna",
    lat: 9.6615,
    lng: 80.0255,
  },
  "60000": {
    city: "Kurunegala Town",
    district: "Kurunegala",
    lat: 7.4863,
    lng: 80.3623,
  },
  "50000": {
    city: "Anuradhapura",
    district: "Anuradhapura",
    lat: 8.3114,
    lng: 80.4037,
  },
  "30000": {
    city: "Badulla",
    district: "Badulla",
    lat: 6.9934,
    lng: 81.055,
  },
};

export const DEFAULT_POSTAL_CODE = "00300";

export function getPostalCodeLocation(postalCode: string): PostalCodeData {
  const code = postalCode ? postalCode.trim() : "";
  if (code in SRI_LANKA_POSTAL_CODES) {
    return SRI_LANKA_POSTAL_CODES[code];
  }
  return SRI_LANKA_POSTAL_CODES[DEFAULT_POSTAL_CODE];
}
