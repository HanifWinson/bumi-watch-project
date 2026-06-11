<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&pause=1000&color=8A9A5B&center=true&vCenter=true&width=500&lines=Real-time+environmental+intelligence;Powered+by+Gemini+2.5+%2B+Elastic+MCP;Built+for+270M%2B+Indonesians;Ask+the+Earth.+It's+Listening." alt="Typing SVG" />

# 🌿 Bumi Watch

### Indonesia Environmental Intelligence Platform

*Ask the Earth. It's Listening.*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.5-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Elastic](https://img.shields.io/badge/Powered%20by-Elastic%20MCP-005571?logo=elasticsearch&logoColor=white)](https://www.elastic.co/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Agent%20Builder-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/)
[![Hackathon](https://img.shields.io/badge/Google%20Cloud%20AI-Hackathon%202026-orange)](https://devpost.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

</div>

---

## 🗺️ What is Bumi Watch?

**Bumi Watch** is an AI-powered environmental monitoring platform for Indonesia. It unifies real-time data on air quality, fire hotspots, earthquakes, and rainfall — then makes that data *conversational* through a Gemini-powered agent connected to Elastic via the official MCP protocol.

> *"Provinsi mana yang paling banyak titik api saat ini?"*
> → **"Sulawesi Tengah: 15 hotspots, 151 MW fire radiative power — NASA FIRMS"**

> *"Bagaimana kondisi lingkungan di Jakarta?"*
> → **"AQI 157 (Tidak Sehat), curah hujan 2.9 mm/hari — WAQI + Open-Meteo"**

Real data. Real answers. No hallucinations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                 │
│   NASA FIRMS · BMKG · WAQI · Open-Meteo                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ every 30 min
┌──────────────────────────▼──────────────────────────────────────┐
│                   DATA PIPELINE (Node.js)                        │
│         Fetches, normalizes, and indexes environmental data      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              ELASTICSEARCH (Elastic Cloud · Jakarta)             │
│   bumi-air-quality · bumi-fire-hotspots · bumi-bmkg-events      │
│   bumi-rainfall · bumi-deforestation · bumi-disasters · etc.    │
└──────────┬───────────────────────────────────────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────────────────┐
│   ELASTIC MCP       │   │         GEMINI AGENT                 │
│   SERVER            │──▶│   Gemini 2.5 Flash + Express API     │
│   (Cloud Run)       │   │   Google Cloud Agent Builder         │
│   Tools: search,    │   │   Cross-correlation engine           │
│   list_indices,     │   │   Bahasa Indonesia + English         │
│   get_mappings      │   └──────────────┬───────────────────────┘
└─────────────────────┘                  │
                           ┌─────────────▼───────────────────────┐
                           │         FRONTEND                     │
                           │   React + Vite · Firebase Hosting    │
                           │   Leaflet Maps · Real-time UI        │
                           └─────────────────────────────────────┘
```

---

## ✨ What Makes This Different

| Capability | Generic Chatbot | Bumi Watch |
|-----------|----------------|------------|
| Current AQI in Pekanbaru | ❌ Guesses | ✅ Real WAQI sensor |
| Active fires today | ❌ Can't know | ✅ NASA FIRMS satellite |
| Cross-source correlation | ❌ No | ✅ Fire × AQI × Rainfall |
| Bahasa Indonesia | ✅ Generic | ✅ Auto-detected |
| Cites sources | ❌ Rarely | ✅ Every response |
| Real earthquake data | ❌ Training data | ✅ Live BMKG feed |

---

## 📡 Data Sources

| Source | Index | Data | Update |
|--------|-------|------|--------|
| [WAQI](https://aqicn.org) | `bumi-air-quality` | AQI across 25 cities | 30 min |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov) | `bumi-fire-hotspots` | Satellite fire hotspots | 30 min |
| [BMKG](https://data.bmkg.go.id) | `bumi-bmkg-events` | Earthquakes & weather | 30 min |
| [Open-Meteo](https://open-meteo.com) | `bumi-rainfall` | Rainfall + drought/flood risk | 30 min |

---

## 🤖 Agent Capabilities

The Gemini 2.5 agent understands natural language in **Bahasa Indonesia and English**:

```
"Bagaimana kondisi lingkungan di Jakarta?"
→ Cross-correlates: AQI + fires + earthquakes + rainfall
→ Returns: Cited report with health advice

"Provinsi mana yang paling banyak titik api?"
→ Queries: All fire hotspots grouped by province
→ Returns: Ranked list with fire radiative power (MW)

"Apakah ada gempa besar minggu ini?"
→ Queries: BMKG earthquake data, last 7 days
→ Returns: Events sorted by magnitude with locations
```

Auto-detects: province names, time ranges, topic, language.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI Brain | Gemini 2.5 Flash | NLQ understanding & insight generation |
| Agent Orchestration | Google Cloud Agent Builder | Multi-step agent workflows |
| Search & Storage | Elastic Cloud (MCP) | Environmental data indexing & search |
| MCP Bridge | `@elastic/mcp-server-elasticsearch` | Connects Gemini to Elastic natively |
| Data Pipeline | Node.js + Cloud Run | Scheduled fetching from all sources |
| Frontend | React + Vite + Tailwind | Interactive dashboard |
| Maps | Leaflet + React-Leaflet | Interactive Indonesia province map |
| Hosting | Firebase Hosting | Public web deployment |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20
- [Elastic Cloud](https://cloud.elastic.co) account
- [WAQI token](https://aqicn.org/data-platform/token/) (free)
- [NASA FIRMS MAP_KEY](https://firms.modaps.eosdis.nasa.gov/api/area/) (free)
- [Gemini API key](https://aistudio.google.com/apikey) (free)

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/HanifWinson/bumi-watch-project.git
cd bumi-watch-project

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
# → Agent running at http://localhost:3001

# 7. Start the frontend (new terminal)
cd bumiwatch-frontend
npm install
npm run dev
# → Frontend at http://localhost:3000
```

### Test the Agent

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/agent" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"question": "Bagaimana kondisi lingkungan di Jakarta?"}'
```

---

## 📁 Project Structure

```
bumi-watch-project/
├── agent/
│   ├── index.js          # Express server — POST /api/agent
│   ├── gemini.js         # Gemini 2.5 Flash client
│   ├── tools.js          # Elastic query functions (6 tools)
│   └── prompts.js        # System prompt + NLQ query router
├── pipeline/
│   ├── index.js          # Orchestrator (runs every 30 min)
│   ├── fetchAirQuality.js    # WAQI → bumi-air-quality
│   ├── fetchBMKG.js          # BMKG → bumi-bmkg-events
│   ├── fetchFireHotspots.js  # NASA FIRMS → bumi-fire-hotspots
│   ├── fetchRainfall.js      # Open-Meteo → bumi-rainfall
│   └── fetchResourceWatch.js # Resource Watch datasets
├── mcp/
│   ├── server.js         # Custom MCP server (backup)
│   └── Dockerfile        # Cloud Run deployment
├── config/
│   └── elastic.js        # Elastic client + 9 index schemas
├── utils/
│   └── helpers.js        # AQI calc, province mapping (all 34)
├── bumiwatch-frontend/   # React + Vite frontend
├── .env.example
└── README.md
```

---

## 🌟 Live Demo Examples

```
Question: "Provinsi mana yang paling banyak titik api saat ini?"

Answer:
Berdasarkan data real-time dari NASA FIRMS (7 hari terakhir):
• Sulawesi Tengah: 15 hotspots, FRP 151 MW
• Maluku Utara:    12 hotspots
• Jawa Tengah:     7 hotspots
Total Indonesia: 1,075 hotspots terdeteksi

📍 Sources: NASA FIRMS | Period: Last 7 days
```

---

## 🗓️ Roadmap

- [x] Data pipeline — WAQI, BMKG, NASA FIRMS, Open-Meteo
- [x] Elastic Cloud — 9 indices, Jakarta region
- [x] Gemini 2.5 Flash agent — NLQ in Bahasa & English
- [x] Cross-correlation engine — multi-source reasoning
- [x] Province coordinate mapping — all 34 provinces
- [x] Elastic MCP server — deployed on Cloud Run
- [x] Google Cloud Agent Builder — configured
- [x] React + Vite frontend — Leaflet maps, chat UI
- [x] Firebase Hosting deployment
- [ ] Cloud Run pipeline scheduler

---

## 🏆 Hackathon

Built for the **[Google Cloud AI Hackathon 2026](https://devpost.com/) — Elastic Track**

| Requirement | Status |
|-------------|--------|
| Gemini (mandatory) | ✅ Gemini 2.5 Flash |
| Google Cloud Agent Builder | ✅ Configured with Elastic MCP |
| Elastic MCP Server (Partner) | ✅ `@elastic/mcp-server-elasticsearch` on Cloud Run |
| Hosted web platform | ✅ Firebase Hosting |
| Public GitHub repo + MIT license | ✅ |
| Demo video (3 min, English) | ✅ |

---

## 👥 Team

| Name | Role |
|------|------|
| Hanif Muhammad Rifqi | Project Lead · Data Pipeline · AI Agent |
| Hannan Muhammad | Frontend Designer · Deployment |
| Muhammad Hanif Fadhillah | Backend Developer · Video Maker |

---

## 📄 License

[MIT License](./LICENSE) — open source as required by the competition.

---

<div align="center">

Made with 🌿 for Indonesia · Google Cloud AI Hackathon 2026

*Bumi = Earth in Bahasa Indonesia*


</div>
