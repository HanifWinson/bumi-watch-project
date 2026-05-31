"use client";

import dynamic from "next/dynamic";
import Header     from "@/components/Header";
import DataCards  from "@/components/DataCards";
import ChatPanel  from "@/components/ChatPanel";
import TrendCharts from "@/components/TrendCharts";
import AlertBanner from "@/components/AlertBanner";
import Footer     from "@/components/Footer";

// Map uses browser APIs — load client-side only
const IndonesiaMap = dynamic(() => import("@/components/IndonesiaMap"), {
  ssr: false,
  loading: () => (
    <div className="card h-[340px] flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-xs text-[#52B788]">Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6" id="dashboard">

        {/* Hero */}
        <div className="text-center py-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-[#D8F3DC] mb-2">
            Indonesia's Environment,<br />
            <span className="text-[#52B788]">In Plain Language</span>
          </h2>
          <p className="text-sm text-[#74C69D] max-w-lg mx-auto">
            Real-time satellite and sensor data from across 38 provinces —
            ask anything, get cited answers powered by Gemini AI.
          </p>
        </div>

        {/* Alert banner */}
        <AlertBanner />

        {/* Data cards */}
        <DataCards />

        {/* Map + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="chat">
          <IndonesiaMap />
          <ChatPanel />
        </div>

        {/* Trend charts */}
        <TrendCharts />

        {/* Sources section */}
        <div className="card p-6">
          <h3 className="font-display text-sm font-bold text-[#D8F3DC] mb-4">
            Data Sources & Methodology
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "💨", name: "WAQI",       desc: "Air quality sensors across 25 Indonesian cities",         url: "https://waqi.info" },
              { icon: "🔥", name: "NASA FIRMS", desc: "Satellite fire hotspot detection (MODIS + VIIRS)",        url: "https://firms.modaps.eosdis.nasa.gov" },
              { icon: "🌋", name: "BMKG",        desc: "Indonesia's meteorology & geophysics agency",             url: "https://bmkg.go.id" },
              { icon: "🌧️", name: "Open-Meteo", desc: "Free open-source weather API with historical data",       url: "https://open-meteo.com" },
            ].map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                className="card p-3 hover:border-[#52B788] transition-all group"
              >
                <div className="text-xl mb-2">{src.icon}</div>
                <div className="text-xs font-semibold text-[#D8F3DC] group-hover:text-[#52B788] transition-colors mb-1">
                  {src.name}
                </div>
                <div className="text-[10px] text-[#52B788] leading-relaxed">{src.desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Competition badge */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(82,183,136,0.2)] text-[10px] text-[#52B788]">
            <span>🏆</span>
            <span>Google Cloud AI Hackathon 2026 · Elastic Track</span>
            <span>·</span>
            <span>Gemini 2.5 · Agent Builder · Elastic MCP</span>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
