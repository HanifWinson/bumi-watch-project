# 🌿 Bumi Watch — Data Pipeline

Fetches environmental data from 4 sources and indexes everything into Elastic.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your keys
cp .env.example .env

# 3. Create Elastic indices
npm run setup

# 4. Run the pipeline (fetches all sources + schedules repeat every 30 min)
npm run pipeline
```

## Data Sources

| Source | Index | Frequency | Key Required |
|--------|-------|-----------|-------------|
| OpenAQ | `bumi-air-quality` | Every 30 min | Yes (free) |
| BMKG | `bumi-bmkg-events` | Every 30 min | No |
| NASA FIRMS | `bumi-fire-hotspots` | Every 30 min | Yes (free) |
| Global Forest Watch | `bumi-deforestation` | Every 30 min | Yes (free) |

## Getting API Keys

- **OpenAQ**: https://docs.openaq.org/ (free, instant)
- **NASA FIRMS**: https://firms.modaps.eosdis.nasa.gov/api/area/ (free, instant)
- **Global Forest Watch**: https://www.globalforestwatch.org/ (free, register)
- **Elastic Cloud**: https://cloud.elastic.co/ (free trial available)

## Folder Structure

```
bumiwatch/
├── config/
│   └── elastic.js        # Elastic client + index definitions
├── pipeline/
│   ├── index.js          # Main orchestrator
│   ├── fetchAirQuality.js
│   ├── fetchBMKG.js
│   ├── fetchFireHotspots.js
│   └── fetchDeforestation.js
├── utils/
│   └── helpers.js        # AQI calc, province mapping, geo utils
├── .env.example
└── package.json
```

## Next Steps

- [ ] Add Gemini AI agent layer (`/agent`)
- [ ] Add React frontend dashboard (`/frontend`)
- [ ] Deploy pipeline as Google Cloud Run Job
