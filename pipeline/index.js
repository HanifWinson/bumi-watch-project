// pipeline/index.js
// Main orchestrator — runs all data fetchers on a schedule.
// Run with: node pipeline/index.js
// Or deploy as a Cloud Function / Cloud Run job.

import dotenv from "dotenv";
dotenv.config();

import { setupIndices } from "../config/elastic.js";
import { fetchAndIndexAirQuality }     from "./fetchAirQuality.js";
import { fetchAndIndexBMKG }           from "./fetchBMKG.js";
import { fetchAndIndexFireHotspots }   from "./fetchFireHotspots.js";
import { fetchAndIndexResourceWatch }  from "./fetchResourceWatch.js";
import { fetchAndIndexRainfall }       from "./fetchRainfall.js";
import { log } from "../utils/helpers.js";

const INTERVAL_MS = (parseInt(process.env.PIPELINE_INTERVAL_MINUTES) || 30) * 60 * 1000;

// ─── Run all fetchers ─────────────────────────────────────────────────────────
async function runPipeline() {
  const start = Date.now();
  log("Pipeline", "━━━ Starting data pipeline run ━━━");

  const tasks = [
    { name: "Air Quality (WAQI)",                  fn: fetchAndIndexAirQuality    },
    { name: "Earthquakes & Weather (BMKG)",        fn: fetchAndIndexBMKG          },
    { name: "Fire Hotspots (NASA FIRMS)",          fn: fetchAndIndexFireHotspots  },
    { name: "Environment Data (Resource Watch)",   fn: fetchAndIndexResourceWatch },
    { name: "Rainfall (CHIRPS / Open-Meteo)",      fn: fetchAndIndexRainfall      },
  ];

  const results = await Promise.allSettled(
    tasks.map(async ({ name, fn }) => {
      try {
        await fn();
      } catch (err) {
        log(name, `Failed: ${err.message}`, "error");
        throw err;
      }
    })
  );

  const passed  = results.filter(r => r.status === "fulfilled").length;
  const failed  = results.filter(r => r.status === "rejected").length;
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  log("Pipeline", `━━━ Run complete: ${passed}/${tasks.length} sources OK, ${failed} failed — ${elapsed}s ━━━`);
}

// ─── Bootstrap + schedule ────────────────────────────────────────────────────
async function main() {
  console.log(`
  ██████╗ ██╗   ██╗███╗   ███╗██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗
  ██╔══██╗██║   ██║████╗ ████║██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║
  ██████╔╝██║   ██║██╔████╔██║██║ █╗ ██║███████║   ██║   ██║     ███████║
  ██╔══██╗██║   ██║██║╚██╔╝██║██║███╗██║██╔══██║   ██║   ██║     ██╔══██║
  ██████╔╝╚██████╔╝██║ ╚═╝ ██║╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║
  ╚═════╝  ╚═════╝ ╚═╝     ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝
  🌿 Indonesia Environmental Intelligence Pipeline
  `);

  // Validate required env vars
  const required = ["ELASTIC_URL", "ELASTIC_API_KEY"];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    console.error("   Copy .env.example to .env and fill in your credentials.");
    process.exit(1);
  }

  // Optional env vars — warn but don't exit
  const optional = ["NASA_FIRMS_API_KEY", "WAQI_API_KEY"];
  optional.forEach(k => {
    if (!process.env[k]) log("Config", `${k} not set — that source will be skipped`, "warn");
  });

  // Create Elastic indices on first run
  await setupIndices();

  // Run immediately on start
  await runPipeline();

  // Then run on schedule
  log("Pipeline", `Scheduling next run in ${INTERVAL_MS / 60000} minutes...`);
  setInterval(runPipeline, INTERVAL_MS);
}

main().catch(err => {
  console.error("Fatal pipeline error:", err);
  process.exit(1);
});
