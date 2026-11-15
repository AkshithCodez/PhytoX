"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, Activity, Layers } from "lucide-react";

interface RegionalZone {
  id: string;
  name: string;
  subregion: string;
  crops: string[];
  primaryPathologies: string[];
  workflowStage: string;
  nodeX: number;
  nodeY: number;
  confidenceTier: string;
}

const REGIONAL_ZONES: RegionalZone[] = [
  {
    id: "zone-1",
    name: "Northern Paddy Belt",
    subregion: "Lowland Alluvial Basin",
    crops: ["Rice / Paddy", "Wheat"],
    primaryPathologies: ["Bacterial Leaf Blight", "Blast (Magnaporthe)"],
    workflowStage: "Automated Screening & Officer Advisory",
    nodeX: 72,
    nodeY: 34,
    confidenceTier: "High (Top-1 Calibrated)",
  },
  {
    id: "zone-2",
    name: "Central Cotton & Chili",
    subregion: "Black Soil Agro-Climatic Zone",
    crops: ["Cotton", "Chili Pepper"],
    primaryPathologies: ["Leaf Curl Geminivirus", "Cercospora Leaf Spot"],
    workflowStage: "Active Cluster Aggregation",
    nodeX: 138,
    nodeY: 58,
    confidenceTier: "High (Uncertainty Filtered)",
  },
  {
    id: "zone-3",
    name: "Eastern Maize & Pulses",
    subregion: "Upland Rainfed Plain",
    crops: ["Maize", "Chickpea"],
    primaryPathologies: ["Common Rust (Puccinia)", "Northern Leaf Blight"],
    workflowStage: "Field Photo Quality Verified",
    nodeX: 198,
    nodeY: 42,
    confidenceTier: "Calibrated Top-K",
  },
  {
    id: "zone-4",
    name: "Southern Horticultural Basin",
    subregion: "Semi-Arid Red Loam",
    crops: ["Tomato", "Potato", "Capsicum"],
    primaryPathologies: ["Early Blight (Alternaria)", "Late Blight"],
    workflowStage: "Localized Preventive Advisory Issued",
    nodeX: 108,
    nodeY: 82,
    confidenceTier: "Officer Verified",
  },
];

export function RegionalIntelligenceViz() {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("zone-2");

  const selectedZone =
    REGIONAL_ZONES.find((z) => z.id === selectedZoneId) || REGIONAL_ZONES[1];

  return (
    <div className="w-full max-w-[340px] sm:max-w-[380px] rounded-[12px] bg-[#1a221b]/80 backdrop-blur-xl border border-white/15 p-4 sm:p-5 text-white shadow-2xl transition-all">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <div className="text-[12.5px] font-medium tracking-tight text-white flex items-center gap-1.5">
            <Activity size={14} className="text-[#b7f36b]" />
            <span>Regional Intelligence Node</span>
          </div>
          <div className="font-mono text-[8.5px] tracking-[0.14em] uppercase text-white/60 mt-0.5">
            FASTAPI ONNX · SPATIAL AGGREGATION
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-[3px] bg-[#b7f36b]/15 text-[#b7f36b] border border-[#b7f36b]/30 font-mono text-[9px] font-medium tracking-[0.06em]">
          LIVE GRID
        </span>
      </div>

      {/* Interactive Vector Regional Topography SVG */}
      <div className="mt-3 relative rounded-[8px] bg-[#121913]/90 border border-white/10 p-2.5 overflow-hidden">
        <svg
          viewBox="0 0 260 110"
          className="w-full h-[105px] overflow-visible select-none"
          aria-label="Conceptual Regional Crop Intelligence Map"
        >
          {/* Subtle regional contour lines */}
          <path
            d="M 20 85 Q 70 70, 130 80 T 240 65"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <path
            d="M 15 50 Q 80 30, 150 45 T 245 35"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <path
            d="M 40 25 Q 110 15, 180 28 T 235 20"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />

          {/* Telemetry interconnect links */}
          <line
            x1="72"
            y1="34"
            x2="138"
            y2="58"
            stroke="rgba(183,243,107,0.3)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <line
            x1="138"
            y1="58"
            x2="198"
            y2="42"
            stroke="rgba(183,243,107,0.3)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <line
            x1="138"
            y1="58"
            x2="108"
            y2="82"
            stroke="rgba(183,243,107,0.3)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Regional Monitoring Nodes */}
          {REGIONAL_ZONES.map((zone) => {
            const isSelected = zone.id === selectedZone.id;
            return (
              <g
                key={zone.id}
                onClick={() => setSelectedZoneId(zone.id)}
                className="cursor-pointer group"
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`Select ${zone.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedZoneId(zone.id);
                  }
                }}
              >
                {/* Outer pulse wave on selected */}
                {isSelected && (
                  <circle
                    cx={zone.nodeX}
                    cy={zone.nodeY}
                    r="12"
                    fill="none"
                    stroke="#b7f36b"
                    strokeWidth="1"
                    className="animate-ping opacity-30"
                  />
                )}
                {/* Glow ring */}
                <circle
                  cx={zone.nodeX}
                  cy={zone.nodeY}
                  r={isSelected ? "7" : "5"}
                  fill={isSelected ? "#b7f36b" : "rgba(255,255,255,0.2)"}
                  fillOpacity={isSelected ? "0.3" : "0.1"}
                  stroke={isSelected ? "#b7f36b" : "rgba(255,255,255,0.4)"}
                  strokeWidth="1.2"
                />
                {/* Core dot */}
                <circle
                  cx={zone.nodeX}
                  cy={zone.nodeY}
                  r={isSelected ? "3.2" : "2.2"}
                  fill={isSelected ? "#b7f36b" : "#ffffff"}
                />
                {/* Label */}
                <text
                  x={zone.nodeX}
                  y={zone.nodeY - (isSelected ? 9 : 7)}
                  textAnchor="middle"
                  fill={isSelected ? "#b7f36b" : "rgba(255,255,255,0.6)"}
                  fontSize={isSelected ? "7.5" : "6.5"}
                  fontFamily="monospace"
                  letterSpacing="0.05em"
                >
                  {zone.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex items-center justify-between text-[8px] font-mono tracking-[0.08em] text-white/50 pt-1 border-t border-white/5">
          <span>INTERACTIVE MAP · CLICK ZONE NODE</span>
          <span className="text-[#b7f36b]">4 REGIONAL SECTORS</span>
        </div>
      </div>

      {/* Selected Zone Telemetry Breakdown */}
      <div className="mt-3 space-y-2 text-left">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#b7f36b]">
              {selectedZone.name}
            </span>
            <span className="text-[10px] text-white/60 font-mono">
              {selectedZone.subregion}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[10.5px]">
          <div>
            <div className="text-[8.5px] font-mono uppercase text-white/50 tracking-wider">
              Monitored Crops
            </div>
            <div className="text-white/90 font-medium truncate mt-0.5">
              {selectedZone.crops.join(", ")}
            </div>
          </div>
          <div>
            <div className="text-[8.5px] font-mono uppercase text-white/50 tracking-wider">
              Foliar Target
            </div>
            <div className="text-white/90 font-medium truncate mt-0.5">
              {selectedZone.primaryPathologies[0]}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/70">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={11} className="text-[#b7f36b]" />
            <span>{selectedZone.workflowStage}</span>
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} className="text-white/50" />
            <span>PostgreSQL RLS</span>
          </span>
        </div>
      </div>
    </div>
  );
}
