// config/elastic.js
// Sets up the Elastic client and creates all required indices on first run.

import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
dotenv.config();

export const elastic = new Client({
  node: process.env.ELASTIC_URL,
  auth: { apiKey: process.env.ELASTIC_API_KEY },
});

// ─── Index definitions ───────────────────────────────────────────────────────
// Each environmental data type gets its own index with appropriate mappings.

const INDICES = {

  // Air quality readings from OpenAQ
  "bumi-air-quality": {
    mappings: {
      properties: {
        timestamp:     { type: "date" },
        province:      { type: "keyword" },
        city:          { type: "keyword" },
        location_name: { type: "text" },
        coordinates:   { type: "geo_point" },
        parameter:     { type: "keyword" },   // pm25, pm10, o3, no2, so2, co
        value:         { type: "float" },
        unit:          { type: "keyword" },
        aqi:           { type: "integer" },
        aqi_category:  { type: "keyword" },   // Good, Moderate, Unhealthy, etc.
        source:        { type: "keyword" },
      }
    }
  },

  // Earthquake & weather events from BMKG
  "bumi-bmkg-events": {
    mappings: {
      properties: {
        timestamp:     { type: "date" },
        event_type:    { type: "keyword" },   // earthquake, weather_alert, volcanic
        province:      { type: "keyword" },
        coordinates:   { type: "geo_point" },
        magnitude:     { type: "float" },     // for earthquakes
        depth_km:      { type: "float" },     // for earthquakes
        description:   { type: "text" },
        severity:      { type: "keyword" },   // low, medium, high, extreme
        source:        { type: "keyword" },
      }
    }
  },

  // Active fire hotspots from NASA FIRMS
  "bumi-fire-hotspots": {
    mappings: {
      properties: {
        timestamp:        { type: "date" },
        province:         { type: "keyword" },
        coordinates:      { type: "geo_point" },
        brightness:       { type: "float" },  // fire radiative power
        confidence:       { type: "keyword" }, // low, nominal, high
        frp:              { type: "float" },   // fire radiative power (MW)
        satellite:        { type: "keyword" }, // MODIS, VIIRS
        source:           { type: "keyword" },
      }
    }
  },

  // Deforestation alerts from Global Forest Watch
  "bumi-deforestation": {
    mappings: {
      properties: {
        timestamp:        { type: "date" },
        province:         { type: "keyword" },
        island:           { type: "keyword" }, // Sumatra, Kalimantan, Papua, etc.
        coordinates:      { type: "geo_point" },
        area_ha:          { type: "float" },   // hectares lost
        alert_type:       { type: "keyword" }, // GLAD, RADD
        confidence:       { type: "keyword" },
        source:           { type: "keyword" },
      }
    }
  },

  // Land surface temperature anomalies from RW/MODIS
  "bumi-land-temperature": {
    mappings: {
      properties: {
        timestamp:        { type: "date" },
        province:         { type: "keyword" },
        coordinates:      { type: "geo_point" },
        anomaly_celsius:  { type: "float" },
        severity:         { type: "keyword" }, // low, medium, high, extreme
        source:           { type: "keyword" },
      }
    }
  },

  // Water stress from RW/Aqueduct
  "bumi-water-stress": {
    mappings: {
      properties: {
        timestamp:        { type: "date" },
        province:         { type: "keyword" },
        coordinates:      { type: "geo_point" },
        stress_score:     { type: "float" },
        stress_category:  { type: "keyword" },
        stress_label:     { type: "keyword" },
        source:           { type: "keyword" },
      }
    }
  },

  // CO2 emissions from RW/Global Carbon Project
  "bumi-co2-emissions": {
    mappings: {
      properties: {
        timestamp:        { type: "date" },
        province:         { type: "keyword" },
        sector:           { type: "keyword" },
        emissions_mtco2:  { type: "float" },
        year:             { type: "integer" },
        coordinates:      { type: "geo_point" },
        source:           { type: "keyword" },
      }
    }
  },

  // Rainfall data from CHIRPS / Open-Meteo
  "bumi-rainfall": {
    mappings: {
      properties: {
        timestamp:    { type: "date" },
        province:     { type: "keyword" },
        coordinates:  { type: "geo_point" },
        rainfall_mm:  { type: "float" },
        total_mm:     { type: "float" },
        period_days:  { type: "integer" },
        drought_risk: { type: "keyword" }, // none, low, medium, high
        flood_risk:   { type: "keyword" }, // none, low, medium, high, extreme
        source:       { type: "keyword" },
      }
    }
  },

  // Disaster events from BNPB
  "bumi-disasters": {
    mappings: {
      properties: {
        timestamp:        { type: "date" },
        province:         { type: "keyword" },
        city:             { type: "keyword" },
        coordinates:      { type: "geo_point" },
        disaster_type:    { type: "keyword" }, // flood, landslide, drought, etc.
        affected_people:  { type: "integer" },
        description:      { type: "text" },
        status:           { type: "keyword" }, // active, resolved
        source:           { type: "keyword" },
      }
    }
  },
};

// ─── Bootstrap: create indices if they don't exist ──────────────────────────
export async function setupIndices() {
  console.log("🔧 Setting up Elastic indices...");
  for (const [name, config] of Object.entries(INDICES)) {
    const exists = await elastic.indices.exists({ index: name });
    if (!exists) {
      await elastic.indices.create({ index: name, ...config });
      console.log(`  ✅ Created index: ${name}`);
    } else {
      console.log(`  ✓  Index already exists: ${name}`);
    }
  }
  console.log("🔧 Index setup complete.\n");
}
