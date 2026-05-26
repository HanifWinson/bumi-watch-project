// mcp/server.js
// Bumi Watch MCP Server — compatible with Google Cloud Agent Builder
// Uses raw SSE implementation instead of SDK transport for better compatibility

import express from "express";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
dotenv.config();

const app  = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// ─── Elastic client ───────────────────────────────────────────────────────────
const elastic = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

// ─── MCP Tool definitions ─────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "query_air_quality",
    description: "Get real-time air quality data (AQI, PM2.5) for Indonesian provinces from WAQI sensors",
    inputSchema: {
      type: "object",
      properties: {
        province: { type: "string", description: "Indonesian province name e.g. DKI Jakarta, Riau" },
        days:     { type: "number", description: "Days to look back, default 7" },
      }
    }
  },
  {
    name: "query_fire_hotspots",
    description: "Get active fire hotspot data from NASA FIRMS satellites for Indonesia",
    inputSchema: {
      type: "object",
      properties: {
        province: { type: "string", description: "Indonesian province name" },
        days:     { type: "number", description: "Days to look back, default 7" },
      }
    }
  },
  {
    name: "query_earthquakes",
    description: "Get earthquake data from BMKG for Indonesia",
    inputSchema: {
      type: "object",
      properties: {
        province:     { type: "string", description: "Indonesian province name" },
        minMagnitude: { type: "number", description: "Minimum magnitude" },
        days:         { type: "number", description: "Days to look back, default 7" },
      }
    }
  },
  {
    name: "query_rainfall",
    description: "Get rainfall and flood/drought risk data for Indonesian provinces",
    inputSchema: {
      type: "object",
      properties: {
        province: { type: "string", description: "Indonesian province name" },
        days:     { type: "number", description: "Days to look back, default 7" },
      }
    }
  },
  {
    name: "query_national_overview",
    description: "Get national environmental overview across all of Indonesia",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Days to look back, default 1" },
      }
    }
  },
];

// ─── Elastic query handlers ───────────────────────────────────────────────────
async function queryAirQuality({ province, days = 7 }) {
  const must = province ? [{ match: { province } }] : [{ match_all: {} }];
  const res = await elastic.search({
    index: "bumi-air-quality",
    body: {
      size: 10,
      sort: [{ timestamp: "desc" }],
      query: { bool: { must, filter: [{ range: { timestamp: { gte: `now-${days}d/d` } } }] } },
      aggs: {
        by_province: {
          terms: { field: "province", size: 38 },
          aggs: { avg_aqi: { avg: { field: "aqi" } }, max_aqi: { max: { field: "aqi" } } }
        },
        overall_avg: { avg: { field: "aqi" } },
      }
    }
  });
  return {
    source: "WAQI", period_days: days,
    overall_avg_aqi: Math.round(res.aggregations?.overall_avg?.value || 0),
    by_province: (res.aggregations?.by_province?.buckets || [])
      .map(b => ({ province: b.key, avg_aqi: Math.round(b.avg_aqi?.value || 0), max_aqi: Math.round(b.max_aqi?.value || 0) }))
      .sort((a, b) => b.avg_aqi - a.avg_aqi),
  };
}

async function queryFireHotspots({ province, days = 7 }) {
  const must = province ? [{ match: { province } }] : [{ match_all: {} }];
  const res = await elastic.search({
    index: "bumi-fire-hotspots",
    body: {
      size: 0,
      query: { bool: { must, filter: [{ range: { timestamp: { gte: `now-${days}d/d` } } }] } },
      aggs: {
        total: { value_count: { field: "frp" } },
        by_province: {
          terms: { field: "province", size: 38 },
          aggs: { count: { value_count: { field: "frp" } }, total_frp: { sum: { field: "frp" } } }
        },
      }
    }
  });
  return {
    source: "NASA FIRMS", period_days: days,
    total_hotspots: res.aggregations?.total?.value || 0,
    by_province: (res.aggregations?.by_province?.buckets || [])
      .map(b => ({ province: b.key, count: b.count?.value || 0, total_frp: Math.round(b.total_frp?.value || 0) }))
      .sort((a, b) => b.count - a.count),
  };
}

async function queryEarthquakes({ province, minMagnitude = 0, days = 7 }) {
  const must = [{ match_all: {} }];
  if (province)     must.push({ match: { province } });
  if (minMagnitude) must.push({ range: { magnitude: { gte: minMagnitude } } });
  const res = await elastic.search({
    index: "bumi-bmkg-events",
    body: {
      size: 10,
      sort: [{ timestamp: "desc" }],
      query: { bool: { must, filter: [{ range: { timestamp: { gte: `now-${days}d/d` } } }] } },
      aggs: {
        total: { value_count: { field: "magnitude" } },
        max_magnitude: { max: { field: "magnitude" } },
        avg_magnitude: { avg: { field: "magnitude" } },
      }
    }
  });
  return {
    source: "BMKG", period_days: days,
    total_events: res.aggregations?.total?.value || 0,
    max_magnitude: res.aggregations?.max_magnitude?.value,
    avg_magnitude: res.aggregations?.avg_magnitude?.value?.toFixed(1),
    recent_events: res.hits.hits.map(h => h._source).slice(0, 5),
  };
}

async function queryRainfall({ province, days = 7 }) {
  const must = province ? [{ match: { province } }] : [{ match_all: {} }];
  const res = await elastic.search({
    index: "bumi-rainfall",
    body: {
      size: 15,
      sort: [{ timestamp: "desc" }],
      query: { bool: { must, filter: [{ range: { timestamp: { gte: `now-${days}d/d` } } }] } },
      aggs: {
        avg_rainfall: { avg: { field: "rainfall_mm" } },
        by_province: {
          terms: { field: "province", size: 38 },
          aggs: {
            avg_rain:     { avg:   { field: "rainfall_mm" } },
            drought_risk: { terms: { field: "drought_risk", size: 1 } },
            flood_risk:   { terms: { field: "flood_risk",   size: 1 } },
          }
        }
      }
    }
  });
  return {
    source: "Open-Meteo", period_days: days,
    avg_rainfall_mm: res.aggregations?.avg_rainfall?.value?.toFixed(1),
    by_province: (res.aggregations?.by_province?.buckets || []).map(b => ({
      province:     b.key,
      avg_rain_mm:  b.avg_rain?.value?.toFixed(1),
      drought_risk: b.drought_risk?.buckets?.[0]?.key || "unknown",
      flood_risk:   b.flood_risk?.buckets?.[0]?.key   || "unknown",
    })),
  };
}

async function queryNationalOverview({ days = 1 }) {
  const [aq, fires, eq, rain] = await Promise.allSettled([
    queryAirQuality({ days }),
    queryFireHotspots({ days }),
    queryEarthquakes({ days }),
    queryRainfall({ days }),
  ]);
  return {
    period_days:  days,
    air_quality:  aq.status    === "fulfilled" ? aq.value    : null,
    fires:        fires.status === "fulfilled" ? fires.value : null,
    earthquakes:  eq.status    === "fulfilled" ? eq.value    : null,
    rainfall:     rain.status  === "fulfilled" ? rain.value  : null,
  };
}

// ─── MCP message handler ──────────────────────────────────────────────────────
async function handleMCPMessage(message) {
  const { method, id, params } = message;

  if (method === "initialize") {
    return {
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "bumi-watch-elastic-mcp", version: "1.0.0" },
      }
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params;
    try {
      let result;
      switch (name) {
        case "query_air_quality":       result = await queryAirQuality(args || {});       break;
        case "query_fire_hotspots":     result = await queryFireHotspots(args || {});     break;
        case "query_earthquakes":       result = await queryEarthquakes(args || {});       break;
        case "query_rainfall":          result = await queryRainfall(args || {});          break;
        case "query_national_overview": result = await queryNationalOverview(args || {}); break;
        default: throw new Error(`Unknown tool: ${name}`);
      }
      return {
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] }
      };
    } catch (err) {
      return {
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true }
      };
    }
  }

  if (method === "notifications/initialized") {
    return null; // no response needed
  }

  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
}

// ─── SSE sessions ─────────────────────────────────────────────────────────────
const sessions = new Map();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Bumi Watch MCP Server", version: "1.0.0" });
});

// SSE endpoint — Agent Builder connects here
app.get("/sse", (req, res) => {
  const sessionId = Date.now().toString();
  console.log(`📡 SSE connection opened: ${sessionId}`);

  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Send endpoint event — full URL required by Agent Builder
  const host = req.headers.host || `bumiwatch-mcp-338260459122.asia-southeast1.run.app`;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const messagesUrl = `${protocol}://${host}/messages?sessionId=${sessionId}`;
  res.write(`event: endpoint\ndata: ${messagesUrl}\n\n`);

  sessions.set(sessionId, res);

  // Keepalive ping every 15s to prevent timeout
  const keepalive = setInterval(() => {
    if (!res.writableEnded) {
      res.write(`: ping\n\n`);
    }
  }, 15000);

  req.on("close", () => {
    console.log(`📡 SSE connection closed: ${sessionId}`);
    clearInterval(keepalive);
    sessions.delete(sessionId);
  });
});

// Messages endpoint — Agent Builder POSTs MCP messages here
app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const sseRes    = sessions.get(sessionId);
  const message   = req.body;

  console.log(`📨 MCP message [${sessionId}]: ${message?.method}`);

  const response = await handleMCPMessage(message);

  if (response && sseRes) {
    sseRes.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
  }

  res.status(202).json({ accepted: true });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌿 Bumi Watch MCP Server running on port ${PORT}`);
  console.log(`   GET  /health → health check`);
  console.log(`   GET  /sse    → MCP SSE connection`);
  console.log(`   POST /messages?sessionId=X → MCP messages`);
});
