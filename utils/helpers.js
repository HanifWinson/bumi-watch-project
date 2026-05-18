// utils/helpers.js
// Shared utilities: province mapping, AQI calculation, geo-point formatting.

// ─── Indonesia province list (ISO 3166-2:ID) ────────────────────────────────
export const INDONESIA_PROVINCES = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
  "Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung",
  "Kepulauan Riau", "DKI Jakarta", "Jawa Barat", "Jawa Tengah",
  "DI Yogyakarta", "Jawa Timur", "Banten", "Bali", "Nusa Tenggara Barat",
  "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Gorontalo", "Sulawesi Barat", "Maluku", "Maluku Utara",
  "Papua Barat", "Papua", "Papua Selatan", "Papua Tengah", "Papua Pegunungan",
];

// Rough bounding boxes per province for geo assignment when only city is known
export const PROVINCE_CENTERS = {
  "DKI Jakarta":       { lat: -6.2088,  lon: 106.8456 },
  "Jawa Barat":        { lat: -6.9175,  lon: 107.6191 },
  "Jawa Tengah":       { lat: -7.1500,  lon: 110.1403 },
  "Jawa Timur":        { lat: -7.5361,  lon: 112.2384 },
  "Bali":              { lat: -8.3405,  lon: 115.0920 },
  "Sumatera Utara":    { lat:  2.1154,  lon:  99.5451 },
  "Sumatera Selatan":  { lat: -3.3194,  lon: 103.9144 },
  "Kalimantan Barat":  { lat:  0.0000,  lon: 109.3333 },
  "Kalimantan Timur":  { lat:  1.6407,  lon: 116.4194 },
  "Sulawesi Selatan":  { lat: -3.6687,  lon: 119.9740 },
  "Papua":             { lat: -4.2699,  lon: 138.0804 },
};

// ─── AQI calculation (US EPA standard) ──────────────────────────────────────
const AQI_BREAKPOINTS = {
  pm25: [
    { cLow: 0,     cHigh: 12.0,  iLow: 0,   iHigh: 50  },
    { cLow: 12.1,  cHigh: 35.4,  iLow: 51,  iHigh: 100 },
    { cLow: 35.5,  cHigh: 55.4,  iLow: 101, iHigh: 150 },
    { cLow: 55.5,  cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
  ],
};

export function calculateAQI(parameter, value) {
  const breakpoints = AQI_BREAKPOINTS[parameter.toLowerCase()];
  if (!breakpoints) return null;

  const bp = breakpoints.find(b => value >= b.cLow && value <= b.cHigh);
  if (!bp) return null;

  const aqi = Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (value - bp.cLow) + bp.iLow
  );
  return aqi;
}

export function aqiCategory(aqi) {
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// ─── Geo-point formatter ─────────────────────────────────────────────────────
export function geoPoint(lat, lon) {
  return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

// ─── Infer province from GPS coordinates ─────────────────────────────────────
// Rough bounding boxes for Indonesian provinces
const PROVINCE_BOUNDS = [
  { province: "Aceh",                   latMin: 2.0,  latMax: 6.0,  lonMin: 95.0,  lonMax: 98.5  },
  { province: "Sumatera Utara",         latMin: 1.0,  latMax: 4.5,  lonMin: 98.0,  lonMax: 100.0 },
  { province: "Sumatera Barat",         latMin: -3.5, latMax: 1.0,  lonMin: 98.5,  lonMax: 101.5 },
  { province: "Riau",                   latMin: -1.5, latMax: 2.5,  lonMin: 100.0, lonMax: 104.5 },
  { province: "Kepulauan Riau",         latMin: -1.0, latMax: 1.5,  lonMin: 103.5, lonMax: 109.5 },
  { province: "Jambi",                  latMin: -3.5, latMax: -0.5, lonMin: 101.0, lonMax: 104.5 },
  { province: "Sumatera Selatan",       latMin: -5.5, latMax: -1.5, lonMin: 102.0, lonMax: 107.0 },
  { province: "Bengkulu",               latMin: -5.5, latMax: -2.0, lonMin: 101.0, lonMax: 103.5 },
  { province: "Lampung",                latMin: -6.0, latMax: -3.5, lonMin: 104.0, lonMax: 106.0 },
  { province: "Kepulauan Bangka Belitung", latMin: -3.5, latMax: -1.0, lonMin: 105.0, lonMax: 108.5 },
  { province: "DKI Jakarta",            latMin: -6.4, latMax: -6.0, lonMin: 106.6, lonMax: 107.0 },
  { province: "Jawa Barat",             latMin: -7.8, latMax: -5.9, lonMin: 106.4, lonMax: 108.8 },
  { province: "Jawa Tengah",            latMin: -8.2, latMax: -6.5, lonMin: 108.5, lonMax: 111.2 },
  { province: "DI Yogyakarta",          latMin: -8.2, latMax: -7.5, lonMin: 110.0, lonMax: 110.8 },
  { province: "Jawa Timur",             latMin: -8.8, latMax: -6.8, lonMin: 111.0, lonMax: 115.0 },
  { province: "Banten",                 latMin: -7.0, latMax: -5.8, lonMin: 105.1, lonMax: 106.7 },
  { province: "Bali",                   latMin: -8.9, latMax: -8.0, lonMin: 114.4, lonMax: 115.7 },
  { province: "Nusa Tenggara Barat",    latMin: -9.1, latMax: -8.0, lonMin: 115.7, lonMax: 117.5 },
  { province: "Nusa Tenggara Timur",    latMin: -11.0, latMax: -8.0, lonMin: 117.5, lonMax: 125.3 },
  { province: "Kalimantan Barat",       latMin: -3.5, latMax: 2.5,  lonMin: 108.0, lonMax: 114.8 },
  { province: "Kalimantan Tengah",      latMin: -4.5, latMax: -0.5, lonMin: 111.0, lonMax: 116.5 },
  { province: "Kalimantan Selatan",     latMin: -4.8, latMax: -1.5, lonMin: 114.5, lonMax: 117.5 },
  { province: "Kalimantan Timur",       latMin: -2.5, latMax: 2.5,  lonMin: 114.5, lonMax: 119.0 },
  { province: "Kalimantan Utara",       latMin: 2.5,  latMax: 4.5,  lonMin: 114.5, lonMax: 118.5 },
  { province: "Sulawesi Utara",         latMin: 0.5,  latMax: 4.0,  lonMin: 123.5, lonMax: 127.5 },
  { province: "Sulawesi Tengah",        latMin: -3.5, latMax: 1.5,  lonMin: 119.5, lonMax: 125.0 },
  { province: "Sulawesi Selatan",       latMin: -6.0, latMax: -1.0, lonMin: 119.0, lonMax: 122.0 },
  { province: "Sulawesi Tenggara",      latMin: -6.0, latMax: -3.0, lonMin: 121.5, lonMax: 124.5 },
  { province: "Gorontalo",              latMin: 0.0,  latMax: 1.0,  lonMin: 121.5, lonMax: 123.5 },
  { province: "Sulawesi Barat",         latMin: -3.5, latMax: -1.0, lonMin: 118.5, lonMax: 120.0 },
  { province: "Maluku",                 latMin: -9.0, latMax: -2.5, lonMin: 124.5, lonMax: 132.0 },
  { province: "Maluku Utara",           latMin: -2.5, latMax: 3.5,  lonMin: 124.5, lonMax: 129.5 },
  { province: "Papua Barat",            latMin: -4.5, latMax: 2.5,  lonMin: 130.5, lonMax: 136.5 },
  { province: "Papua",                  latMin: -9.0, latMax: -1.0, lonMin: 136.5, lonMax: 141.0 },
];

export function inferProvinceFromCoords(lat, lon) {
  if (lat == null || lon == null) return "Unknown";
  for (const b of PROVINCE_BOUNDS) {
    if (lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax) {
      return b.province;
    }
  }
  return "Unknown";
}

// ─── Infer Indonesian province from city name ────────────────────────────────
// Simple lookup — extend as needed
const CITY_TO_PROVINCE = {
  "jakarta": "DKI Jakarta",
  "bandung": "Jawa Barat",
  "surabaya": "Jawa Timur",
  "semarang": "Jawa Tengah",
  "yogyakarta": "DI Yogyakarta",
  "medan": "Sumatera Utara",
  "palembang": "Sumatera Selatan",
  "pekanbaru": "Riau",
  "denpasar": "Bali",
  "makassar": "Sulawesi Selatan",
  "pontianak": "Kalimantan Barat",
  "samarinda": "Kalimantan Timur",
  "jayapura": "Papua",
};

export function inferProvince(cityName = "") {
  const key = cityName.toLowerCase().trim();
  for (const [city, province] of Object.entries(CITY_TO_PROVINCE)) {
    if (key.includes(city)) return province;
  }
  return "Unknown";
}

// ─── Logger ──────────────────────────────────────────────────────────────────
export function log(source, message, level = "info") {
  const icon = { info: "ℹ️", success: "✅", warn: "⚠️", error: "❌" }[level] || "•";
  console.log(`${icon} [${source}] ${message}`);
}
