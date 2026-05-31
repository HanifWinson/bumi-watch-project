"use client";

import { useEffect, useState } from "react";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

interface Alert {
  type:    "fire" | "earthquake" | "air" | "flood";
  message: string;
  severity: "high" | "medium";
}

const ICONS = { fire: "🔥", earthquake: "🌋", air: "💨", flood: "🌊" };
const COLORS = {
  high:   "border-[#E74C3C] bg-[rgba(231,76,60,0.08)] text-[#E74C3C]",
  medium: "border-[#E67E22] bg-[rgba(230,126,34,0.08)] text-[#E67E22]",
};

export default function AlertBanner() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`${AGENT_URL}/api/agent`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: "Are there any critical environmental alerts in Indonesia right now? Check for: high AQI cities, large fire hotspot counts, significant earthquakes. Give me 2-3 brief bullet points only."
          }),
        });
        const data = await res.json();

        // Parse response into alerts
        const lines = (data.answer || "").split("\n").filter((l: string) => l.trim().startsWith("•") || l.trim().startsWith("*") || l.trim().startsWith("-"));

        const parsed: Alert[] = lines.slice(0, 3).map((line: string) => {
          const text = line.replace(/^[•*-]\s*/, "").trim();
          const type = text.toLowerCase().includes("fire") || text.toLowerCase().includes("hotspot") ? "fire"
                     : text.toLowerCase().includes("gempa") || text.toLowerCase().includes("earthquake") ? "earthquake"
                     : text.toLowerCase().includes("aqi") || text.toLowerCase().includes("udara") ? "air"
                     : "flood";
          return { type, message: text, severity: "medium" as const };
        });

        if (parsed.length > 0) setAlerts(parsed);
      } catch {
        // Silent fail — alerts are non-critical UI
      }
    }
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (alerts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [alerts]);

  if (alerts.length === 0) return null;

  const alert = alerts[current];

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${COLORS[alert.severity]} transition-all`}>
      <span>{ICONS[alert.type]}</span>
      <p className="flex-1 text-xs leading-relaxed">{alert.message}</p>
      {alerts.length > 1 && (
        <div className="flex gap-1">
          {alerts.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-current" : "bg-current opacity-30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
