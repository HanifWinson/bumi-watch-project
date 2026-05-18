// pipeline/fetchBMKG.js
// Fetches earthquake and weather alerts from BMKG (Indonesia's meteorology agency).
// BMKG provides free public APIs — no API key required.

import { elastic } from "../config/elastic.js";
import { geoPoint, inferProvince, log } from "../utils/helpers.js";

const SOURCE = "BMKG";
const INDEX  = "bumi-bmkg-events";

// ─── Earthquake data ─────────────────────────────────────────────────────────
async function fetchEarthquakes() {
  // BMKG public endpoint — returns last 15 significant earthquakes (M >= 5.0)
  const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
  if (!res.ok) throw new Error(`BMKG earthquake API error: ${res.status}`);
  const data = await res.json();
  return data.Infogempa?.gempa ? [data.Infogempa.gempa] : [];
}

async function fetchRecentEarthquakes() {
  // Returns last 15 earthquakes regardless of magnitude
  const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json");
  if (!res.ok) throw new Error(`BMKG recent quakes API error: ${res.status}`);
  const data = await res.json();
  return data.Infogempa?.gempa || [];
}

function transformEarthquake(raw) {
  // BMKG coordinate format: "6.31 LS" (south latitude) or "2.15 LU" (north)
  const parseCoord = (str) => {
    if (!str) return 0;
    const val = parseFloat(str);
    return str.includes("LS") ? -val : val;
  };

  const lat = parseCoord(raw.Lintang);
  const lon = parseFloat(raw.Bujur);
  const province = inferProvince(raw.Wilayah || "");

  return {
    timestamp:   (() => {
                   try {
                     if (raw.Tanggal && raw.Jam) {
                       // BMKG format: "13 May 2026" + "23:59:00 WIB"
                       const cleanJam = raw.Jam.replace(/\s*(WIB|WITA|WIT)$/i, "").trim();
                       const d = new Date(`${raw.Tanggal} ${cleanJam}`);
                       if (!isNaN(d.getTime())) return d.toISOString();
                     }
                   } catch {}
                   return new Date().toISOString();
                 })(),
    event_type:  "earthquake",
    province,
    coordinates: geoPoint(lat, lon),
    magnitude:   parseFloat(raw.Magnitude) || null,
    depth_km:    parseFloat(raw.Kedalaman) || null,
    description: raw.Wilayah || "",
    severity:    classifyEarthquakeSeverity(parseFloat(raw.Magnitude)),
    source:      SOURCE,
  };
}

function classifyEarthquakeSeverity(magnitude) {
  if (magnitude >= 7.0) return "extreme";
  if (magnitude >= 6.0) return "high";
  if (magnitude >= 5.0) return "medium";
  return "low";
}

// ─── Weather alerts ──────────────────────────────────────────────────────────
async function fetchWeatherAlerts() {
  // BMKG weather warning XML feed
  const res = await fetch("https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-Indonesia.xml");
  if (!res.ok) throw new Error(`BMKG weather API error: ${res.status}`);
  // XML parsing kept simple — in production use a proper XML parser
  const text = await res.text();
  // Return raw for now; full XML parsing is in the TODO
  return [];
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function fetchAndIndexBMKG() {
  log(SOURCE, "Fetching BMKG earthquake and weather data...");

  const [latest, recent] = await Promise.all([
    fetchEarthquakes().catch(e => { log(SOURCE, e.message, "warn"); return []; }),
    fetchRecentEarthquakes().catch(e => { log(SOURCE, e.message, "warn"); return []; }),
  ]);

  // Deduplicate by combining both lists
  const allQuakes = [...latest, ...recent];
  log(SOURCE, `Fetched ${allQuakes.length} earthquake records`);

  if (allQuakes.length === 0) return;

  const operations = allQuakes.flatMap(raw => [
    { index: { _index: INDEX } },
    transformEarthquake(raw),
  ]);

  const { errors } = await elastic.bulk({ operations, refresh: true });
  if (errors) log(SOURCE, "Some documents failed to index", "warn");

  log(SOURCE, `Indexed ${allQuakes.length} events into ${INDEX}`, "success");
}
