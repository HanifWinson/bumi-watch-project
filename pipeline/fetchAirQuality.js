// pipeline/fetchAirQuality.js
// Fetches air quality data from WAQI (World Air Quality Index)
// for major Indonesian cities. Extremely reliable, free token.
//
// Get free token at: https://aqicn.org/data-platform/token/
// Docs: https://aqicn.org/json-api/doc/

import { elastic } from "../config/elastic.js";
import { calculateAQI, aqiCategory, geoPoint, inferProvince, log } from "../utils/helpers.js";

const SOURCE = "WAQI";
const INDEX  = "bumi-air-quality";

// Major Indonesian cities to monitor
const INDONESIA_CITIES = [
  // Java
  "jakarta", "jakarta/us-embassy",
  "surabaya", "bandung", "semarang",
  "yogyakarta", "bekasi", "tangerang",
  "depok", "bogor",
  // Sumatra
  "medan", "palembang", "pekanbaru",
  "batam", "padang", "bandar-lampung",
  // Kalimantan
  "pontianak", "samarinda",
  "balikpapan", "banjarmasin",
  // Sulawesi
  "makassar", "manado", "palu",
  // Bali & others
  "bali", "mataram",
];

async function fetchCityAQI(city) {
  const url = `https://api.waqi.info/feed/${city}/?token=${process.env.WAQI_API_KEY}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error(`WAQI error for ${city}: ${res.status}`);
  const data = await res.json();
  if (data.status !== "ok" || !data.data) return null;
  return data.data;
}

function transformReading(raw, citySlug) {
  const iaqi    = raw.iaqi || {};
  const readings = [];
  const province = inferProvince(raw.city?.name || citySlug);
  const coords   = raw.city?.geo
    ? geoPoint(raw.city.geo[0], raw.city.geo[1])
    : null;

  const paramMap = {
    pm25: "pm25", pm10: "pm10",
    o3: "o3",     no2: "no2",
    so2: "so2",   co:  "co",
  };

  for (const [key, paramName] of Object.entries(paramMap)) {
    if (iaqi[key]?.v == null) continue;
    const value = iaqi[key].v;
    const aqi   = key === "pm25"
      ? (typeof raw.aqi === "number" ? raw.aqi : parseInt(raw.aqi) || null)
      : calculateAQI(paramName, value);

    readings.push({
      timestamp:     raw.time?.iso || new Date().toISOString(),
      province,
      city:          raw.city?.name || citySlug,
      location_name: raw.city?.name || citySlug,
      coordinates:   coords,
      parameter:     paramName,
      value:         parseFloat(value),
      unit:          key === "co" ? "ppm" : "µg/m³",
      aqi:           aqi,
      aqi_category:  aqi ? aqiCategory(aqi) : null,
      source:        SOURCE,
    });
  }
  return readings;
}

export async function fetchAndIndexAirQuality() {
  log(SOURCE, "Fetching air quality for Indonesian cities...");

  const results = await Promise.allSettled(
    INDONESIA_CITIES.map(city => fetchCityAQI(city))
  );

  const allReadings = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value) {
      allReadings.push(...transformReading(result.value, INDONESIA_CITIES[i]));
    }
  });

  log(SOURCE, `Fetched ${allReadings.length} readings from ${INDONESIA_CITIES.length} cities`);
  if (allReadings.length === 0) return;

  const operations = allReadings.flatMap(doc => [
    { index: { _index: INDEX } },
    doc,
  ]);

  const { errors } = await elastic.bulk({ operations, refresh: true });
  if (errors) log(SOURCE, "Some documents failed to index", "warn");
  log(SOURCE, `Indexed ${allReadings.length} readings into ${INDEX}`, "success");
}
