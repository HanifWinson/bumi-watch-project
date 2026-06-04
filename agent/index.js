g// agent/index.js
// Express server that exposes the Bumi Watch Gemini agent as an HTTP API.
// The frontend calls POST /api/agent with a question and gets back an AI answer.

import express    from "express";
import cors       from "cors";
import dotenv     from "dotenv";
import { callGemini }           from "./gemini.js";
import { SYSTEM_PROMPT, routeQuery } from "./prompts.js";
import {
  queryAirQuality,
  queryFireHotspots,
  queryEarthquakes,
  queryRainfall,
  queryCrossCorrelation,
  queryNationalOverview,
} from "./tools.js";

dotenv.config();

const app  = express();
const PORT = process.env.PORT || process.env.AGENT_PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Bumi Watch Agent", version: "1.0.0" });
});

// ─── Main agent endpoint ──────────────────────────────────────────────────────
app.post("/api/agent", async (req, res) => {
  const { question, history = [] } = req.body;

  if (!question?.trim()) {
    return res.status(400).json({ error: "Question is required" });
  }

  console.log(`\n🤖 Question: ${question}`);

  try {
    // Step 1 — Route the query to decide which data to fetch
    const route = routeQuery(question);
    console.log(`📍 Route: province=${route.province}, days=${route.days}, topics=${route.topics}`);

    // Step 2 — Fetch relevant data from Elastic in parallel
    const dataContext = await fetchDataForRoute(route);
    console.log(`📊 Data fetched: ${Object.keys(dataContext).join(", ")}`);

    // Step 3 — Build context string for Gemini
    const contextStr = buildContextString(dataContext, route);

    // Step 4 — Call Gemini with real data as context
    const userMessageWithContext = `
${question}

--- REAL-TIME DATA CONTEXT ---
${contextStr}
--- END DATA CONTEXT ---

Please answer the question above using the real data provided in the context.
`;

    const answer = await callGemini({
      systemPrompt: SYSTEM_PROMPT,
      userMessage:  userMessageWithContext,
      history,
    });

    console.log(`✅ Answer generated (${answer.length} chars)`);

    // Step 5 — Return answer + metadata
    res.json({
      answer,
      metadata: {
        province:  route.province,
        days:      route.days,
        topics:    route.topics,
        sources:   getSourcesList(dataContext),
        timestamp: new Date().toISOString(),
      }
    });

  } catch (err) {
    console.error("❌ Agent error:", err.message);
    res.status(500).json({
      error:   "Agent failed to process question",
      details: err.message,
    });
  }
});

// ─── Data fetcher ─────────────────────────────────────────────────────────────
async function fetchDataForRoute({ province, days, topics }) {
  const fetches = {};

  if (topics.includes("cross_correlation")) {
    fetches.cross = queryCrossCorrelation({ province, days });
  }
  if (topics.includes("overview")) {
    fetches.overview = queryNationalOverview({ days });
  }
  if (topics.includes("air_quality")) {
    fetches.airQuality = queryAirQuality({ province, days });
  }
  if (topics.includes("fires")) {
    fetches.fires = queryFireHotspots({ province, days });
  }
  if (topics.includes("earthquakes")) {
    fetches.earthquakes = queryEarthquakes({ province, days });
  }
  if (topics.includes("rainfall")) {
    fetches.rainfall = queryRainfall({ province, days });
  }

  // If nothing matched, do national overview
  if (Object.keys(fetches).length === 0) {
    fetches.overview = queryNationalOverview({ days });
  }

  const results = {};
  await Promise.allSettled(
    Object.entries(fetches).map(async ([key, promise]) => {
      try {
        results[key] = await promise;
      } catch (e) {
        console.warn(`⚠️ Failed to fetch ${key}: ${e.message}`);
      }
    })
  );

  return results;
}

// ─── Context builder ──────────────────────────────────────────────────────────
function buildContextString(data, route) {
  const lines = [];
  const period = `Last ${route.days} day${route.days > 1 ? "s" : ""}`;

  if (route.province) lines.push(`📍 Focus province: ${route.province}`);
  lines.push(`⏱️ Period: ${period}\n`);

  // Air quality
  const aq = data.airQuality || data.cross?.air_quality || data.overview?.air_quality;
  if (aq) {
    lines.push("💨 AIR QUALITY (Source: WAQI)");
    if (aq.summary?.length) {
      aq.summary.slice(0, 5).forEach(p => {
        lines.push(`  ${p.province}: AQI ${p.avg_aqi} avg, ${p.max_aqi} max`);
      });
    } else if (aq.overall_avg) {
      lines.push(`  National avg AQI: ${aq.overall_avg}, max: ${aq.overall_max}`);
    }
    lines.push("");
  }

  // Fire hotspots
  const fires = data.fires || data.cross?.fires || data.overview?.fires;
  if (fires) {
    lines.push("🔥 FIRE HOTSPOTS (Source: NASA FIRMS)");
    lines.push(`  Total hotspots: ${fires.total_count}`);
    lines.push(`  High confidence: ${fires.high_confidence_count}`);
    if (fires.by_province?.length) {
      const knownProvinces = fires.by_province.filter(p => p.province !== "Unknown");
      const unknown = fires.by_province.find(p => p.province === "Unknown");
      if (knownProvinces.length) {
        knownProvinces.slice(0, 5).forEach(p => {
          lines.push(`  ${p.province}: ${p.count} hotspots, FRP: ${p.total_frp} MW`);
        });
      }
      if (unknown) {
        lines.push(`  Note: ${unknown.count} hotspots detected across Indonesia (coordinates available but province not yet mapped)`);
      }
    }
    // Include sample hotspot coordinates for context
    if (fires.hotspots?.length) {
      lines.push(`  Sample locations (lat/lon): ${fires.hotspots.slice(0, 3).map(h => `${h.coordinates?.lat?.toFixed(2)},${h.coordinates?.lon?.toFixed(2)}`).join(" | ")}`);
    }
    lines.push("");
  }

  // Earthquakes
  const eq = data.earthquakes || data.cross?.earthquakes || data.overview?.earthquakes;
  if (eq) {
    lines.push("🌋 EARTHQUAKES (Source: BMKG)");
    lines.push(`  Total events: ${eq.total}`);
    lines.push(`  Max magnitude: ${eq.max_magnitude}`);
    lines.push(`  Avg magnitude: ${eq.avg_magnitude}`);
    if (eq.earthquakes?.length) {
      eq.earthquakes.slice(0, 3).forEach(e => {
        lines.push(`  M${e.magnitude} — ${e.description} (${e.severity})`);
      });
    }
    lines.push("");
  }

  // Rainfall
  const rain = data.rainfall || data.cross?.rainfall || data.overview?.rainfall;
  if (rain) {
    lines.push("🌧️ RAINFALL (Source: Open-Meteo)");
    lines.push(`  National avg: ${rain.avg_rainfall} mm/day`);
    if (rain.by_province?.length) {
      rain.by_province.slice(0, 5).forEach(p => {
        lines.push(`  ${p.province}: ${p.avg_rain_mm} mm/day — drought: ${p.drought_risk}, flood: ${p.flood_risk}`);
      });
    }
    lines.push("");
  }

  return lines.join("\n") || "No data available for the requested query.";
}

// ─── Sources list ─────────────────────────────────────────────────────────────
function getSourcesList(data) {
  const sources = new Set();
  if (data.airQuality || data.cross?.air_quality || data.overview?.air_quality)
    sources.add("WAQI");
  if (data.fires || data.cross?.fires || data.overview?.fires)
    sources.add("NASA FIRMS");
  if (data.earthquakes || data.cross?.earthquakes || data.overview?.earthquakes)
    sources.add("BMKG");
  if (data.rainfall || data.cross?.rainfall || data.overview?.rainfall)
    sources.add("Open-Meteo");
  return [...sources];
}

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  🌿 Bumi Watch Agent running on http://localhost:${PORT}
  
  Endpoints:
  GET  /health      → health check
  POST /api/agent   → ask a question
  
  Example:
  curl -X POST http://localhost:${PORT}/api/agent \\
    -H "Content-Type: application/json" \\
    -d '{"question": "Bagaimana kualitas udara di Jakarta?"}'
  `);
});
