// agent/tools.js
// Query functions that the Gemini agent uses to fetch data from Elastic.
// Each function maps to a specific environmental data type.

import { elastic } from "../config/elastic.js";

// ─── Air Quality ──────────────────────────────────────────────────────────────
export async function queryAirQuality({ province, city, days = 7, limit = 10 }) {
  const must = [];

  if (province) must.push({ match: { province } });
  if (city)     must.push({ match:  { city } });

  const res = await elastic.search({
    index: "bumi-air-quality",
    body: {
      size: limit,
      sort: [{ timestamp: "desc" }],
      query: {
        bool: {
          must: must.length ? must : [{ match_all: {} }],
          filter: [{
            range: {
              timestamp: {
                gte: `now-${days}d/d`,
                lte: "now",
              }
            }
          }]
        }
      },
      aggs: {
        by_province: {
          terms: { field: "province", size: 38 },
          aggs: {
            avg_aqi:  { avg:  { field: "aqi" } },
            max_aqi:  { max:  { field: "aqi" } },
            top_hits: { top_hits: { size: 1, sort: [{ timestamp: "desc" }] } },
          }
        },
        overall_avg: { avg: { field: "aqi" } },
        overall_max: { max: { field: "aqi" } },
      }
    }
  });

  const hits = res.hits.hits.map(h => h._source);
  const byProvince = res.aggregations?.by_province?.buckets || [];

  return {
    readings: hits,
    summary: byProvince.map(b => ({
      province:   b.key,
      avg_aqi:    Math.round(b.avg_aqi?.value || 0),
      max_aqi:    Math.round(b.max_aqi?.value || 0),
      latest:     b.top_hits?.hits?.hits?.[0]?._source,
    })).sort((a, b) => b.avg_aqi - a.avg_aqi),
    overall_avg: Math.round(res.aggregations?.overall_avg?.value || 0),
    overall_max: Math.round(res.aggregations?.overall_max?.value || 0),
  };
}

// ─── Fire Hotspots ────────────────────────────────────────────────────────────
export async function queryFireHotspots({ province, days = 7, limit = 20 }) {
  const must = province ? [{ match: { province } }] : [{ match_all: {} }];

  const res = await elastic.search({
    index: "bumi-fire-hotspots",
    body: {
      size: limit,
      sort: [{ timestamp: "desc" }],
      query: {
        bool: {
          must,
          filter: [{
            range: { timestamp: { gte: `now-${days}d/d`, lte: "now" } }
          }]
        }
      },
      aggs: {
        by_province: {
          terms: { field: "province", size: 38 },
          aggs: {
            total_frp: { sum: { field: "frp" } },
            count:     { value_count: { field: "frp" } },
          }
        },
        total_count:  { value_count: { field: "frp" } },
        high_confidence: {
          filter: { term: { confidence: "high" } },
          aggs: { count: { value_count: { field: "frp" } } }
        }
      }
    }
  });

  const byProvince = res.aggregations?.by_province?.buckets || [];

  return {
    hotspots:    res.hits.hits.map(h => h._source),
    total_count: res.aggregations?.total_count?.value || 0,
    high_confidence_count: res.aggregations?.high_confidence?.count?.value || 0,
    by_province: byProvince.map(b => ({
      province:  b.key,
      count:     b.count?.value || 0,
      total_frp: Math.round(b.total_frp?.value || 0),
    })).sort((a, b) => b.count - a.count),
  };
}

// ─── Earthquakes ──────────────────────────────────────────────────────────────
export async function queryEarthquakes({ province, minMagnitude = 0, days = 7, limit = 10 }) {
  const must = [{ match_all: {} }];
  if (province)      must.push({ match: { province } });
  if (minMagnitude)  must.push({ range: { magnitude: { gte: minMagnitude } } });

  const res = await elastic.search({
    index: "bumi-bmkg-events",
    body: {
      size: limit,
      sort: [{ timestamp: "desc" }],
      query: {
        bool: {
          must,
          filter: [{
            range: { timestamp: { gte: `now-${days}d/d`, lte: "now" } }
          }]
        }
      },
      aggs: {
        by_severity: { terms: { field: "severity", size: 5 } },
        avg_magnitude: { avg: { field: "magnitude" } },
        max_magnitude: { max: { field: "magnitude" } },
        by_province:   { terms: { field: "province", size: 10 } },
      }
    }
  });

  return {
    earthquakes:   res.hits.hits.map(h => h._source),
    total:         res.hits.total?.value || 0,
    avg_magnitude: res.aggregations?.avg_magnitude?.value?.toFixed(1),
    max_magnitude: res.aggregations?.max_magnitude?.value,
    by_severity:   res.aggregations?.by_severity?.buckets || [],
    by_province:   res.aggregations?.by_province?.buckets || [],
  };
}

// ─── Rainfall ─────────────────────────────────────────────────────────────────
export async function queryRainfall({ province, days = 7, limit = 15 }) {
  const must = province ? [{ match: { province } }] : [{ match_all: {} }];

  const res = await elastic.search({
    index: "bumi-rainfall",
    body: {
      size: limit,
      sort: [{ timestamp: "desc" }],
      query: {
        bool: {
          must,
          filter: [{
            range: { timestamp: { gte: `now-${days}d/d`, lte: "now" } }
          }]
        }
      },
      aggs: {
        drought_risk: { terms: { field: "drought_risk", size: 5 } },
        flood_risk:   { terms: { field: "flood_risk",   size: 5 } },
        avg_rainfall: { avg:  { field: "rainfall_mm" } },
        by_province: {
          terms: { field: "province", size: 38 },
          aggs: {
            avg_rain:     { avg: { field: "rainfall_mm" } },
            drought_risk: { terms: { field: "drought_risk", size: 1 } },
            flood_risk:   { terms: { field: "flood_risk",   size: 1 } },
          }
        }
      }
    }
  });

  const byProvince = res.aggregations?.by_province?.buckets || [];

  return {
    records:      res.hits.hits.map(h => h._source),
    avg_rainfall: res.aggregations?.avg_rainfall?.value?.toFixed(1),
    drought_risk: res.aggregations?.drought_risk?.buckets || [],
    flood_risk:   res.aggregations?.flood_risk?.buckets   || [],
    by_province:  byProvince.map(b => ({
      province:     b.key,
      avg_rain_mm:  b.avg_rain?.value?.toFixed(1),
      drought_risk: b.drought_risk?.buckets?.[0]?.key || "unknown",
      flood_risk:   b.flood_risk?.buckets?.[0]?.key   || "unknown",
    })),
  };
}

// ─── Cross-correlation — the killer feature ───────────────────────────────────
// Fetches multiple data types simultaneously for a province
// This is what generic chatbots CAN'T do
export async function queryCrossCorrelation({ province, days = 7 }) {
  const [airQuality, fires, earthquakes, rainfall] = await Promise.allSettled([
    queryAirQuality({ province, days }),
    queryFireHotspots({ province, days }),
    queryEarthquakes({ province, days }),
    queryRainfall({ province, days }),
  ]);

  return {
    province,
    period_days: days,
    air_quality:  airQuality.status  === "fulfilled" ? airQuality.value  : null,
    fires:        fires.status        === "fulfilled" ? fires.value        : null,
    earthquakes:  earthquakes.status  === "fulfilled" ? earthquakes.value  : null,
    rainfall:     rainfall.status     === "fulfilled" ? rainfall.value     : null,
  };
}

// ─── National overview ────────────────────────────────────────────────────────
export async function queryNationalOverview({ days = 1 }) {
  const [airQuality, fires, earthquakes, rainfall] = await Promise.allSettled([
    queryAirQuality({ days, limit: 5 }),
    queryFireHotspots({ days, limit: 5 }),
    queryEarthquakes({ days, limit: 5 }),
    queryRainfall({ days, limit: 5 }),
  ]);

  return {
    period_days:  days,
    air_quality:  airQuality.status  === "fulfilled" ? airQuality.value  : null,
    fires:        fires.status        === "fulfilled" ? fires.value        : null,
    earthquakes:  earthquakes.status  === "fulfilled" ? earthquakes.value  : null,
    rainfall:     rainfall.status     === "fulfilled" ? rainfall.value     : null,
  };
}
