"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar
} from "recharts";

// Mock trend data — in production, fetch from Elastic via agent
const AQI_TREND = [
  { day: "Mon", jakarta: 145, surabaya: 89, bandung: 72 },
  { day: "Tue", jakarta: 162, surabaya: 95, bandung: 80 },
  { day: "Wed", jakarta: 158, surabaya: 88, bandung: 68 },
  { day: "Thu", jakarta: 170, surabaya: 102, bandung: 75 },
  { day: "Fri", jakarta: 155, surabaya: 91, bandung: 70 },
  { day: "Sat", jakarta: 148, surabaya: 85, bandung: 65 },
  { day: "Sun", jakarta: 157, surabaya: 89, bandung: 72 },
];

const FIRE_TREND = [
  { day: "Mon", hotspots: 280 },
  { day: "Tue", hotspots: 312 },
  { day: "Wed", hotspots: 298 },
  { day: "Thu", hotspots: 352 },
  { day: "Fri", hotspots: 340 },
  { day: "Sat", hotspots: 328 },
  { day: "Sun", hotspots: 352 },
];

const RAIN_TREND = [
  { day: "Mon", rainfall: 3.2, drought: 4, flood: 1 },
  { day: "Tue", rainfall: 2.8, drought: 5, flood: 0 },
  { day: "Wed", rainfall: 4.1, drought: 3, flood: 2 },
  { day: "Thu", rainfall: 2.4, drought: 6, flood: 0 },
  { day: "Fri", rainfall: 3.8, drought: 4, flood: 1 },
  { day: "Sat", rainfall: 4.9, drought: 2, flood: 3 },
  { day: "Sun", rainfall: 2.9, drought: 5, flood: 1 },
];

const TABS = ["Air Quality", "Fire Hotspots", "Rainfall"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111E17] border border-[rgba(82,183,136,0.3)] rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-[#74C69D] font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value}{p.name === "rainfall" ? " mm" : ""}
        </p>
      ))}
    </div>
  );
};

export default function TrendCharts() {
  const [tab, setTab] = useState(0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-bold text-[#D8F3DC]">7-Day Trends</h3>
          <p className="text-[10px] text-[#52B788]">Historical environmental data across Indonesia</p>
        </div>
        <div className="flex gap-1">
          {TABS.map((t, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${
                tab === i
                  ? "bg-[#1A7A4A] text-[#D8F3DC]"
                  : "text-[#52B788] hover:text-[#D8F3DC]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48">
        {tab === 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={AQI_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,183,136,0.08)" />
              <XAxis dataKey="day" tick={{ fill: "#52B788", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#52B788", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="jakarta"  stroke="#E74C3C" strokeWidth={2} dot={false} name="Jakarta"  />
              <Line type="monotone" dataKey="surabaya" stroke="#E67E22" strokeWidth={2} dot={false} name="Surabaya" />
              <Line type="monotone" dataKey="bandung"  stroke="#52B788" strokeWidth={2} dot={false} name="Bandung"  />
            </LineChart>
          </ResponsiveContainer>
        )}

        {tab === 1 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FIRE_TREND}>
              <defs>
                <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E67E22" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E67E22" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,183,136,0.08)" />
              <XAxis dataKey="day"      tick={{ fill: "#52B788", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis                    tick={{ fill: "#52B788", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hotspots" stroke="#E67E22" strokeWidth={2}
                    fill="url(#fireGrad)" name="hotspots" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {tab === 2 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RAIN_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(82,183,136,0.08)" />
              <XAxis dataKey="day"     tick={{ fill: "#52B788", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis                   tick={{ fill: "#52B788", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rainfall" fill="#52B788" radius={[3, 3, 0, 0]} name="rainfall" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex gap-4 mt-3 text-[10px] text-[#52B788]">
        {tab === 0 && (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#E74C3C] inline-block"/>Jakarta</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#E67E22] inline-block"/>Surabaya</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#52B788] inline-block"/>Bandung</span>
          </>
        )}
        {tab === 1 && <span>🔥 NASA FIRMS satellite data</span>}
        {tab === 2 && <span>🌧️ Open-Meteo historical data</span>}
      </div>
    </div>
  );
}
