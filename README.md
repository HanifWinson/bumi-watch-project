<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&pause=1000&color=1A7A4A&center=true&vCenter=true&width=500&lines=Real-time+environmental+intelligence;Powered+by+Gemini+2.5+%2B+Elastic;Built+for+270M%2B+Indonesians;Ask+the+Earth.+It's+Listening." alt="Typing SVG" />

# 🌿 Bumi Watch

### Indonesia Environmental Intelligence Platform

*Ask the Earth. It's Listening.*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.5-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Elastic](https://img.shields.io/badge/Powered%20by-Elastic-005571?logo=elasticsearch&logoColor=white)](https://www.elastic.co/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Agent%20Builder-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/)
[![Hackathon](https://img.shields.io/badge/Google%20Cloud%20AI-Hackathon%202026-orange)](https://devpost.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

</div>

---

## 🗺️ What is Bumi Watch?

**Bumi Watch** is an AI-powered environmental monitoring platform for Indonesia. It unifies real-time data on air quality, fire hotspots, earthquakes, rainfall, and disaster risk — then makes that data *conversational* through a Gemini-powered agent.

Instead of static dashboards, users simply ask:

> *"Provinsi mana yang paling banyak titik api saat ini?"*
> → **"Sulawesi Tengah: 15 hotspots, 151 MW fire radiative power"**

> *"Bagaimana kondisi lingkungan di Jakarta?"*
> → **"AQI 157 (Tidak Sehat), curah hujan 2.9 mm/hari, risiko kekeringan sedang"**

Real data. Real answers. No hallucinations.

---

## ✨ What Makes This Different

Generic AI chatbots answer from training data. Bumi Watch answers from **live satellite and sensor data**, updated every 30 minutes:

| Capability | Generic Chatbot | Bumi Watch |
|-----------|----------------|------------|
| Current AQI in Pekanbaru | ❌ Guesses | ✅ Real WAQI sensor data |
| Active fires today | ❌ Can't know | ✅ NASA FIRMS satellite |
| Cross-source correlation | ❌ No | ✅ Fire × AQI × Rainfall |
| Bahasa Indonesia | ✅ Yes | ✅ Yes (auto-detected) |
| Cites sources | ❌ Rarely | ✅ Every response |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (WIP)                     │
│         React + Next.js · Google Maps API            │
└───────────────────────┬─────────────────────────────┘
                        │ POST /api/agent
┌───────────────────────▼─────────────────────────────┐
│              GEMINI AGENT (✅ Live)                   │
│     Gemini 2.5 Flash · Express API · Port 3001       │
│     Query Router · Cross-correlation Engine          │
└───────────────────────┬─────────────────────────────┘
                        │ Elastic queries
┌───────────────────────▼─────────────────────────────┐
│           ELASTIC CLOUD (✅ Live · Singapore)         │
│  bumi-air-quality     bumi-bmkg-events               │
│  bumi-fire-hotspots   bumi-rainfall                  │
│  bumi-deforestation   bumi-land-temperature          │
│  bumi-water-stress    bumi-co2-emissions             │
│  bumi-disasters                                      │
└───────────────────────┬─────────────────────────────┘
                        │ fed every 30 min
┌───────────────────────▼─────────────────────────────┐
│              DATA PIPELINE (✅ Live)                  │
│  WAQI          → Air quality (25 Indonesian cities)  │
│  NASA FIRMS    → Fire hotspots (MODIS + VIIRS)       │
│  BMKG          → Earthquakes & weather alerts        │
│  Open-Meteo    → Rainfall + drought/flood risk       │
│  Resource Watch → Deforestation, water, CO2          │
└─────────────────────────────────────────────────────┘
```

---

## 📡 Data Sources

| Source | Data | Key Required | Update |
|--------|------|-------------|--------|
| [WAQI](https://aqicn.org) | Air quality — AQI, PM2.5, PM10 across 25 cities | Yes (free) | 30 min |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) | Active fire hotspots — MODIS + VIIRS satellites | Yes (free MAP_KEY) | 30 min |
| [BMKG](https://data.bmkg.go.id) | Earthquakes, weather alerts | None | 30 min |
| [Open-Meteo](https://open-meteo.com) | Rainfall, drought/flood risk | None | 30 min |
| [Resource Watch](https://resourcewatch.org) | Deforestation, water stress, CO2 | None | Daily |

---

## 🤖 Agent Capabilities

The Gemini 2.5 agent understands natural language in **Bahasa Indonesia and English**:

```
"Bagaimana kondisi lingkungan di Jakarta?"
→ Fetches: AQI + fires + earthquakes + rainfall for DKI Jakarta
→ Returns: Cross-correlated report with health advice

"Provinsi mana yang paling banyak titik api?"
→ Fetches: All fire hotspots, grouped by province
→ Returns: Ranked list with fire radiative power (MW)

"Apakah ada gempa besar minggu ini?"
→ Fetches: BMKG earthquake data, last 7 days
→ Returns: Events sorted by magnitude with locations
```

Auto-detects: province names, time ranges, topic (fires/AQI/earthquakes/rainfall), language.

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- [Elastic Cloud](https://cloud.elastic.co) account (free trial)
- [WAQI token](https://aqicn.org/data-platform/token/) (free, instant)
- [NASA FIRMS MAP_KEY](https://firms.modaps.eosdis.nasa.gov/api/area/) (free)
- [Gemini API key](https://aistudio.google.com/apikey) (free, from Google AI Studio)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/bumiwatch.git
cd bumiwatch

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your keys in .env

# 4. Create Elastic indices
npm run setup

# 5. Start the data pipeline
npm run pipeline

# 6. Start the AI agent (new terminal)
npm run agent
```

### Test the Agent

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/agent" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"question": "Bagaimana kondisi lingkungan di Jakarta?"}'

# Or open in browser
GET http://localhost:3001/health
```

---

## 📁 Project Structure

```
bumiwatch/
├── agent/
│   ├── index.js          # Express server — POST /api/agent
│   ├── gemini.js         # Gemini 2.5 Flash client
│   ├── tools.js          # Elastic query functions
│   └── prompts.js        # System prompt + query router
├── pipeline/
│   ├── index.js          # Orchestrator (runs every 30 min)
│   ├── fetchAirQuality.js    # WAQI integration
│   ├── fetchBMKG.js          # BMKG earthquakes & weather
│   ├── fetchFireHotspots.js  # NASA FIRMS fire hotspots
│   ├── fetchRainfall.js      # Open-Meteo rainfall
│   └── fetchResourceWatch.js # Resource Watch datasets
├── config/
│   └── elastic.js        # Elastic client + 9 index schemas
├── utils/
│   └── helpers.js        # AQI calc, province mapping (all 34 provinces)
├── .env.example
├── package.json
└── README.md
```

---

## 🛠️ Environment Variables

```env
# Elastic Cloud
ELASTIC_URL=https://your-deployment.es.asia-southeast1.gcp.elastic-cloud.com
ELASTIC_API_KEY=your_elastic_api_key

# Gemini (Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key

# Data Sources
WAQI_API_KEY=your_waqi_token
NASA_FIRMS_API_KEY=your_nasa_firms_map_key

# BMKG, Open-Meteo, Resource Watch — no keys needed

# Pipeline
PIPELINE_INTERVAL_MINUTES=30
LOG_LEVEL=info
```

---

## 📊 Live Data Example

```
Question: "Provinsi mana yang paling banyak titik api saat ini?"

Answer:
Berdasarkan data real-time dari NASA FIRMS (7 hari terakhir):
• Sulawesi Tengah: 15 hotspots, FRP 151 MW
• Maluku Utara:    12 hotspots
• Jawa Tengah:     7 hotspots
• Jawa Timur:      2 hotspots
• Papua:           2 hotspots
Total Indonesia: 1,075 hotspots terdeteksi

📍 Sources: NASA FIRMS | Period: Last 7 days
```

---

## 🗓️ Roadmap

- [x] Data pipeline — WAQI, BMKG, NASA FIRMS, Open-Meteo
- [x] Elastic Cloud — 9 indices, Singapore region
- [x] Gemini 2.5 Flash agent — NLQ in Bahasa & English
- [x] Cross-correlation engine — multi-source reasoning
- [x] Province coordinate mapping — all 34 provinces
- [ ] React + Next.js frontend dashboard
- [ ] Interactive Indonesia map with province drill-down
- [ ] Google Cloud Agent Builder integration
- [ ] Firebase Hosting deployment
- [ ] Demo video

---

## 🏆 Hackathon

Built for the **[Google Cloud AI Hackathon 2026](https://devpost.com/) — Elastic Track**

| Requirement | Status |
|-------------|--------|
| Gemini (mandatory) | ✅ Gemini 2.5 Flash |
| Google Cloud Agent Builder | 🔄 In progress |
| Elastic MCP Server | ✅ 9 indices, Singapore |
| Hosted web platform | 🔄 In progress |
| Public GitHub repo + MIT license | ✅ |

---

## 👥 Team

| Name | Role |
|------|------|
| Hanif Muhammad Rifqi | Project Lead · Data Pipeline · AI Agent |
| TBA | Frontend Designer |
| TBA | AI / Backend Engineer |

---

## 📄 License

[MIT License](./LICENSE) — open source as required by the competition.

---

<div align="center">

Made with 🌿 for Indonesia · Google Cloud AI Hackathon 2026

*Bumi = Earth in Bahasa Indonesia*

</div>
