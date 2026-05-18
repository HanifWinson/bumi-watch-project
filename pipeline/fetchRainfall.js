// pipeline/fetchRainfall.js
// Fetches rainfall data from CHIRPS (Climate Hazards Group InfraRed Precipitation)
// via the CHIRTS/CHIRPS API. Free, no key needed, very reliable.
//
// Docs: https://www.chc.ucsb.edu/data/chirps
// API:  https://data.chc.ucsb.edu/products/CHIRPS-2.0/

import { elastic } from "../config/elastic.js";
import { geoPoint, log, PROVINCE_CENTERS } from "../utils/helpers.js";

const SOURCE = "CHIRPS";
const INDEX  = "bumi-rainfall";

// ─── Fetch rainfall data directly from Open-Meteo ────────────────────────────
// Completely free, no key, reliable, covers all Indonesian provinces
async function fetchRainfallData() {
  log(SOURCE, "Using Open-Meteo as rainfall source...");

  // Open-Meteo requires end_date to be yesterday at latest
  const yesterday  = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const endDate    = yesterday.toISOString().split("T")[0];
  const startDate  = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  const keyProvinces = [
    "DKI Jakarta", "Jawa Barat", "Jawa Timur",
    "Sumatera Utara", "Sumatera Selatan", "Riau",
    "Kalimantan Barat", "Kalimantan Timur",
    "Sulawesi Selatan", "Papua", "Bali",
  ];

  // Collect results properly using Promise.allSettled with return values
  const settled = await Promise.allSettled(
    keyProvinces.map(async province => {
      const center = PROVINCE_CENTERS[province];
      if (!center) return null;

      const url = new URL("https://archive-api.open-meteo.com/v1/archive");
      url.searchParams.set("latitude",   center.lat);
      url.searchParams.set("longitude",  center.lon);
      url.searchParams.set("start_date", startDate);
      url.searchParams.set("end_date",   endDate);
      url.searchParams.set("daily",      "precipitation_sum");
      url.searchParams.set("timezone",   "Asia/Jakarta");

      const res = await fetch(url.toString());
      if (!res.ok) return null;

      const data  = await res.json();
      const daily = data.daily;
      if (!daily?.time?.length) return null;

      const totalRain = daily.precipitation_sum
        ?.reduce((a, b) => a + (b || 0), 0) || 0;
      const avgDaily  = totalRain / daily.time.length;

      return { province, center, avgDailyMm: avgDaily, totalMm: totalRain, days: daily.time.length };
    })
  );

  // Filter out failures and nulls
  return settled
    .filter(r => r.status === "fulfilled" && r.value !== null)
    .map(r => r.value);
}

function transformRainfallRecord(raw) {
  return {
    timestamp:       new Date().toISOString(),
    province:        raw.province || "Unknown",
    coordinates:     raw.center
                       ? geoPoint(raw.center.lat, raw.center.lon)
                       : geoPoint(-2.5, 118),
    rainfall_mm:     parseFloat(raw.avgDailyMm?.toFixed(2)) || 0,
    total_mm:        parseFloat(raw.totalMm?.toFixed(2)) || 0,
    period_days:     raw.days || 7,
    drought_risk:    classifyDroughtRisk(raw.avgDailyMm),
    flood_risk:      classifyFloodRisk(raw.avgDailyMm),
    source:          SOURCE,
  };
}

function classifyDroughtRisk(avgDailyMm) {
  if (avgDailyMm < 1)  return "high";
  if (avgDailyMm < 3)  return "medium";
  if (avgDailyMm < 6)  return "low";
  return "none";
}

function classifyFloodRisk(avgDailyMm) {
  if (avgDailyMm > 50) return "extreme";
  if (avgDailyMm > 30) return "high";
  if (avgDailyMm > 15) return "medium";
  if (avgDailyMm > 8)  return "low";
  return "none";
}

export async function fetchAndIndexRainfall() {
  log(SOURCE, "Fetching rainfall data for Indonesia...");

  const rawData = await fetchRainfallData();
  if (!rawData.length) {
    log(SOURCE, "No rainfall data returned", "warn");
    return;
  }

  const docs = rawData.map(transformRainfallRecord);
  log(SOURCE, `Fetched rainfall data for ${docs.length} provinces`);

  const operations = docs.flatMap(doc => [
    { index: { _index: INDEX } },
    doc,
  ]);

  const { errors } = await elastic.bulk({ operations, refresh: true });
  if (errors) log(SOURCE, "Some documents failed to index", "warn");
  log(SOURCE, `Indexed ${docs.length} rainfall records into ${INDEX}`, "success");
}
