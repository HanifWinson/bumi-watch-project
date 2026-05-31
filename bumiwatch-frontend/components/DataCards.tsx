"use client";
import { useEffect, useState } from "react";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

function aqiCategory(aqi: number) {
  if (aqi <= 50)  return { label: "Good",           color: "#52B788" };
  if (aqi <= 100) return { label: "Moderate",       color: "#F4D03F" };
  if (aqi <= 150) return { label: "Sensitive",      color: "#E67E22" };
  if (aqi <= 200) return { label: "Unhealthy",      color: "#E74C3C" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#9B59B6" };
  return                 { label: "Hazardous",      color: "#7B241C" };
}

interface CardData { value: string; label: string; sub: string; icon: string; color: string; loading: boolean; }

export default function DataCards() {
  const [cards, setCards] = useState<CardData[]>([
    { value:"—", label:"Air Quality",   sub:"Jakarta AQI",         icon:"💨", color:"#52B788", loading:true },
    { value:"—", label:"Fire Hotspots", sub:"Active this week",    icon:"🔥", color:"#E67E22", loading:true },
    { value:"—", label:"Earthquakes",   sub:"Events this week",    icon:"🌋", color:"#74C69D", loading:true },
    { value:"—", label:"Rainfall",      sub:"National avg mm/day", icon:"🌧️", color:"#52B788", loading:true },
  ]);

  useEffect(() => {
    const fetchCard = async (question: string) => {
      try {
        const r = await fetch(`${AGENT_URL}/api/agent`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ question }),
        });
        const d = await r.json();
        const m = d.answer?.match(/\d+\.?\d*/);
        return m ? m[0] : null;
      } catch { return null; }
    };

    Promise.all([
      fetchCard("What is the current AQI in Jakarta? Just the number."),
      fetchCard("Total fire hotspots in Indonesia this week? Just the number."),
      fetchCard("Total earthquake events in Indonesia this week? Just the number."),
      fetchCard("National average rainfall mm per day in Indonesia? Just the number."),
    ]).then(([aqi, fires, eq, rain]) => {
      const aqiNum = aqi ? parseInt(aqi) : null;
      const aqiInfo = aqiNum ? aqiCategory(aqiNum) : null;
      setCards([
        { value:aqi||"N/A",    label:"Air Quality",   sub:aqiInfo?`Jakarta · ${aqiInfo.label}`:"Jakarta AQI",    icon:"💨", color:aqiInfo?.color||"#52B788", loading:false },
        { value:fires||"N/A",  label:"Fire Hotspots", sub:"Active this week · NASA FIRMS",                       icon:"🔥", color:"#E67E22",                  loading:false },
        { value:eq||"N/A",     label:"Earthquakes",   sub:"Events this week · BMKG",                             icon:"🌋", color:"#74C69D",                  loading:false },
        { value:rain?`${rain} mm`:"N/A", label:"Rainfall", sub:"National avg · Open-Meteo",                     icon:"🌧️", color:"#52B788",                  loading:false },
      ]);
    });
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div key={i} className="card p-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{background:`radial-gradient(circle at top right,${card.color},transparent 70%)`}} />
          <div className="relative">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">{card.icon}</span>
              {card.loading && <div className="w-2 h-2 rounded-full bg-[#52B788] pulse" />}
            </div>
            <div className="text-2xl font-bold mb-1" style={{color:card.color}}>
              {card.loading ? <div className="h-8 w-16 bg-[rgba(82,183,136,0.1)] rounded animate-pulse"/> : card.value}
            </div>
            <div className="text-xs font-semibold text-[#D8F3DC] mb-0.5">{card.label}</div>
            <div className="text-[10px] text-[#52B788]">{card.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
