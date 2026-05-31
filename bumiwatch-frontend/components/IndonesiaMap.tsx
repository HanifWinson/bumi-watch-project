"use client";

import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://raw.githubusercontent.com/ans-4175/peta-indonesia-geojson/master/indonesia.geojson";

// AQI color scale
function getProvinceColor(provinceName: string, data: Record<string, number>) {
  const aqi = data[provinceName];
  if (!aqi) return "#162B1E";
  if (aqi <= 50)  return "#1A7A4A";
  if (aqi <= 100) return "#2D6A4F";
  if (aqi <= 150) return "#E67E22";
  if (aqi <= 200) return "#E74C3C";
  if (aqi <= 300) return "#9B59B6";
  return "#7B241C";
}

// Mock AQI data — replace with real Elastic data
const MOCK_AQI: Record<string, number> = {
  "DKI Jakarta":       157,
  "Jawa Barat":        89,
  "Jawa Tengah":       72,
  "Jawa Timur":        95,
  "Bali":              45,
  "Sumatera Utara":    110,
  "Riau":              39,
  "Kalimantan Barat":  88,
  "Sulawesi Selatan":  61,
};

interface TooltipState {
  x: number;
  y: number;
  name: string;
  aqi: number | null;
}

export default function IndonesiaMap() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="card p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-[#D8F3DC]">
            Environmental Health Map
          </h3>
          <p className="text-[10px] text-[#52B788]">Color coded by AQI · Click province for details</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-[#74C69D]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-[#1A7A4A]" />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-[#E67E22]" />
            <span>Sensitive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-[#E74C3C]" />
            <span>Unhealthy</span>
          </div>
        </div>
      </div>

      <div className="relative h-[280px] overflow-hidden rounded-lg bg-[#0A1812]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 1000, center: [118, -2] }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const name = geo.properties.Propinsi || geo.properties.NAME_1 || "";
                  const color = getProvinceColor(name, MOCK_AQI);
                  const isSelected = selected === name;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(evt) => {
                        setTooltip({
                          x: evt.clientX,
                          y: evt.clientY,
                          name,
                          aqi: MOCK_AQI[name] || null,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => setSelected(isSelected ? null : name)}
                      style={{
                        default: {
                          fill:    color,
                          stroke:  isSelected ? "#74C69D" : "#0A1812",
                          strokeWidth: isSelected ? 1.5 : 0.5,
                          outline: "none",
                          cursor:  "pointer",
                          transition: "fill 0.2s",
                        },
                        hover: {
                          fill:    "#52B788",
                          stroke:  "#74C69D",
                          strokeWidth: 1,
                          outline: "none",
                          cursor:  "pointer",
                        },
                        pressed: {
                          fill:    "#1A7A4A",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 bg-[#111E17] border border-[rgba(82,183,136,0.3)] rounded-lg px-3 py-2 pointer-events-none text-xs shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
          >
            <p className="font-semibold text-[#D8F3DC]">{tooltip.name || "Unknown"}</p>
            {tooltip.aqi ? (
              <p className="text-[#74C69D]">AQI: {tooltip.aqi}</p>
            ) : (
              <p className="text-[#52B788] opacity-60">No data</p>
            )}
          </div>
        )}
      </div>

      {/* Selected province info */}
      {selected && (
        <div className="mt-3 p-3 bg-[#162B1E] border border-[rgba(82,183,136,0.2)] rounded-lg">
          <p className="text-xs font-semibold text-[#D8F3DC]">{selected}</p>
          <p className="text-[10px] text-[#74C69D]">
            AQI: {MOCK_AQI[selected] || "No data available"}
            {MOCK_AQI[selected] && " · Click 'Ask Bumi' for full analysis"}
          </p>
        </div>
      )}
    </div>
  );
}
