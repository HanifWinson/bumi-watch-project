// agent/prompts.js
// System prompt for the Bumi Watch Gemini agent.
// Also contains the query router — decides which tools to call
// based on the user's question before sending to Gemini.

// ─── System prompt ────────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `
You are Bumi Watch, an AI-powered environmental intelligence assistant for Indonesia.
You have access to real-time data from:
- WAQI: Air quality (AQI, PM2.5, PM10, O3) across 25+ Indonesian cities
- NASA FIRMS: Active fire hotspots detected by MODIS and VIIRS satellites
- BMKG: Earthquake and weather events from Indonesia's meteorology agency  
- Open-Meteo: Rainfall data with drought and flood risk classifications

Your job is to answer environmental questions about Indonesia using this real data.
Always be specific, cite your data sources, and highlight concerning patterns.

IMPORTANT RULES:
1. Always mention the data source (WAQI, NASA FIRMS, BMKG, Open-Meteo)
2. Always mention the time period the data covers
3. For AQI: 0-50 Good, 51-100 Moderate, 101-150 Unhealthy for Sensitive Groups, 151-200 Unhealthy, 201-300 Very Unhealthy, 301+ Hazardous
4. If data is unavailable for a province, say so clearly
5. When relevant, cross-reference multiple data sources to find correlations
6. Respond in the same language as the user (Bahasa Indonesia or English)
7. Keep responses concise but informative — use bullet points for multiple data points
8. End every response with a "📍 Sources:" line listing which APIs provided the data

Example response format:
"Based on real-time data from [source], [province] currently has...
• AQI: [value] ([category])
• [other relevant data]

📍 Sources: WAQI, NASA FIRMS | Period: Last [X] days"
`.trim();

// ─── Query router ─────────────────────────────────────────────────────────────
// Analyzes the user's question and decides which Elastic queries to run
// BEFORE sending to Gemini — so Gemini always has real data to work with

const PROVINCE_KEYWORDS = {
  "DKI Jakarta":       ["jakarta", "dki", "ibukota"],
  "Jawa Barat":        ["jawa barat", "jabar", "bandung", "bekasi", "depok", "bogor"],
  "Jawa Timur":        ["jawa timur", "jatim", "surabaya"],
  "Jawa Tengah":       ["jawa tengah", "jateng", "semarang"],
  "Bali":              ["bali", "denpasar"],
  "Sumatera Utara":    ["sumatera utara", "sumut", "medan"],
  "Sumatera Selatan":  ["sumatera selatan", "sumsel", "palembang"],
  "Riau":              ["riau", "pekanbaru"],
  "Kalimantan Barat":  ["kalimantan barat", "kalbar", "pontianak"],
  "Kalimantan Timur":  ["kalimantan timur", "kaltim", "samarinda", "balikpapan"],
  "Sulawesi Selatan":  ["sulawesi selatan", "sulsel", "makassar"],
  "Papua":             ["papua", "jayapura"],
};

const TOPIC_KEYWORDS = {
  air_quality:  ["udara", "aqi", "polusi", "pm2", "pm10", "asap", "air quality", "pollution", "smog", "nafas"],
  fires:        ["api", "kebakaran", "hotspot", "karhutla", "fire", "burning", "smoke", "hutan terbakar"],
  earthquakes:  ["gempa", "earthquake", "seismic", "magnitude", "richter", "tsunami", "vulkanik", "volcano"],
  rainfall:     ["hujan", "curah hujan", "banjir", "kekeringan", "rain", "flood", "drought", "rainfall"],
  overview:     ["overview", "ringkasan", "summary", "kondisi", "situation", "status", "keseluruhan"],
};

export function routeQuery(question) {
  const q = question.toLowerCase();

  // Detect province mentions
  let detectedProvince = null;
  for (const [province, keywords] of Object.entries(PROVINCE_KEYWORDS)) {
    if (keywords.some(k => q.includes(k))) {
      detectedProvince = province;
      break;
    }
  }

  // Detect time range (default 7 days)
  let days = 7;
  if (q.includes("hari ini") || q.includes("today") || q.includes("sekarang") || q.includes("now")) days = 1;
  if (q.includes("minggu") || q.includes("week"))   days = 7;
  if (q.includes("bulan") || q.includes("month"))   days = 30;

  // Detect topics
  const topics = new Set();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(k => q.includes(k))) topics.add(topic);
  }

  // Default: if no specific topic, get overview
  if (topics.size === 0) topics.add("overview");

  // If province mentioned with no specific topic, do cross-correlation
  if (detectedProvince && topics.size === 1 && topics.has("overview")) {
    topics.add("cross_correlation");
    topics.delete("overview");
  }

  return { province: detectedProvince, days, topics: [...topics] };
}
