"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

interface LivingDataLandscapeProps {
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// 8 Conceptual Regional Observation Nodes (illustrative, privacy-safe)
export const OBSERVATION_NODES = [
  { id: "node-1", code: "OBS-2601", x: 22, y: 34, crop: "Tomato", signal: "Early Blight Risk", status: "Active Observation" },
  { id: "node-2", code: "OBS-2602", x: 38, y: 26, crop: "Cotton / Chili", signal: "Foliar Target Spot", status: "Verified Cluster" },
  { id: "node-3", code: "OBS-2603", x: 64, y: 32, crop: "Maize", signal: "Normal Health", status: "Healthy Baseline" },
  { id: "node-4", code: "OBS-2604", x: 78, y: 44, crop: "Grape", signal: "Black Rot Alert", status: "Review Queued" },
  { id: "node-5", code: "OBS-2605", x: 28, y: 68, crop: "Bell Pepper", signal: "Bacterial Spot", status: "Active Observation" },
  { id: "node-6", code: "OBS-2606", x: 48, y: 74, crop: "Potato", signal: "Late Blight Early", status: "Under Review" },
  { id: "node-7", code: "OBS-2607", x: 68, y: 66, crop: "Soybean", signal: "Normal Health", status: "Healthy Baseline" },
  { id: "node-8", code: "OBS-2608", x: 84, y: 78, crop: "Tomato", signal: "Yellow Leaf Curl", status: "Priority Advisory" },
];

export function LivingDataLandscape({
  progressRef,
  reducedMotion,
}: LivingDataLandscapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contourLayerRef = useRef<SVGSVGElement>(null);
  const networkLayerRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let animFrame = 0;

    const updateLandscape = () => {
      animFrame = 0;
      const p = progressRef.current;

      // -----------------------------------------------------------------------
      // Phase A: Terrain Memory (Active p: 0.28 -> 0.65)
      // Topographic contours fade in smoothly as 3D island completes exit motion
      // -----------------------------------------------------------------------
      const contourIn = smoothstep(0.28, 0.40, p);
      const contourOut = 1 - smoothstep(0.85, 0.96, p);
      const contourAlpha = contourIn * contourOut;

      // -----------------------------------------------------------------------
      // Phase B & C: Regional Intelligence Network (Active p: 0.52 -> 0.96)
      // Observation nodes and regional connection vectors emerge and connect
      // -----------------------------------------------------------------------
      const netIn = smoothstep(0.50, 0.64, p);
      const netOut = 1 - smoothstep(0.88, 0.96, p);
      const netAlpha = netIn * netOut;

      // Container visibility & fade (Active only from Scene 3 onwards, p: 0.26 -> 0.96)
      const containerIn = smoothstep(0.26, 0.36, p);
      const containerOut = 1 - smoothstep(0.88, 0.98, p);
      const containerAlpha = containerIn * containerOut;

      if (containerRef.current) {
        containerRef.current.style.opacity = containerAlpha.toFixed(3);
        containerRef.current.style.visibility =
          containerAlpha > 0.005 ? "visible" : "hidden";
      }

      // Micro parallax offset
      const offsetY = reducedMotion ? 0 : (p - 0.55) * 35;

      if (contourLayerRef.current) {
        contourLayerRef.current.style.opacity = contourAlpha.toFixed(3);
        contourLayerRef.current.style.visibility =
          contourAlpha > 0.01 ? "visible" : "hidden";
        if (!reducedMotion) {
          contourLayerRef.current.style.transform = `translate3d(0, ${offsetY.toFixed(1)}px, 0)`;
        }
      }

      if (networkLayerRef.current) {
        networkLayerRef.current.style.opacity = netAlpha.toFixed(3);
        networkLayerRef.current.style.visibility =
          netAlpha > 0.01 ? "visible" : "hidden";
      }
    };

    const onScrollOrFrame = () => {
      if (!animFrame) animFrame = requestAnimationFrame(updateLandscape);
    };

    updateLandscape();
    window.addEventListener("scroll", onScrollOrFrame, { passive: true });
    window.addEventListener("resize", onScrollOrFrame, { passive: true });

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      window.removeEventListener("scroll", onScrollOrFrame);
      window.removeEventListener("resize", onScrollOrFrame);
    };
  }, [progressRef, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a0f12] will-change-[opacity]"
      style={{ opacity: 0, visibility: "hidden" }}
      aria-hidden="true"
    >
      {/* ------------------------------------------------------------------- */}
      {/* LAYER 1: ABSTRACT TOPOGRAPHIC CONTOUR MEMORY (SVG)                  */}
      {/* ------------------------------------------------------------------- */}
      <svg
        ref={contourLayerRef}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-0 will-change-[opacity,transform] transition-none"
        style={{ visibility: "hidden" }}
      >
        <defs>
          <linearGradient id="contourGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#565a5c" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#907768" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#394045" stopOpacity="0.20" />
          </linearGradient>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#20292d" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0a0f12" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle radial depth backing */}
        <circle cx="720" cy="450" r="540" fill="url(#centerGlow)" />

        {/* Topographic elevation contours */}
        <g stroke="url(#contourGrad)" fill="none" strokeWidth="1.2" strokeLinecap="round">
          {/* Contour 1 (Broad baseline perimeter) */}
          <path d="M-60,320 C180,240 360,420 540,310 C720,200 940,380 1140,290 C1320,210 1480,360 1520,380" strokeDasharray="3 4" strokeOpacity="0.4" />
          
          {/* Contour 2 */}
          <path d="M-40,410 C160,340 380,480 620,390 C840,300 1060,460 1280,370 C1420,310 1500,420 1540,430" />

          {/* Contour 3 */}
          <path d="M20,490 C220,420 440,560 700,460 C920,370 1140,540 1340,450 C1460,390 1520,480 1560,500" />

          {/* Contour 4 (Core elevation ridge) */}
          <path d="M80,570 C280,510 500,630 760,530 C980,450 1200,600 1380,520 C1480,470 1540,540 1580,560" strokeWidth="1.5" strokeOpacity="0.7" />

          {/* Contour 5 */}
          <path d="M140,650 C340,590 560,700 820,600 C1040,520 1250,670 1420,590 C1510,540 1560,600 1600,620" />

          {/* Contour 6 */}
          <path d="M220,730 C410,670 630,770 890,670 C1100,590 1310,740 1460,660 C1540,610 1580,660 1620,680" strokeDasharray="4 6" strokeOpacity="0.5" />
          
          {/* Internal Valley Rings */}
          <ellipse cx="640" cy="480" rx="220" ry="95" strokeWidth="1" strokeOpacity="0.35" transform="rotate(-6 640 480)" />
          <ellipse cx="640" cy="480" rx="140" ry="60" strokeWidth="1.2" strokeOpacity="0.5" transform="rotate(-6 640 480)" />
          <ellipse cx="640" cy="480" rx="70" ry="30" strokeWidth="1.5" strokeOpacity="0.75" transform="rotate(-6 640 480)" />
        </g>
      </svg>

      {/* ------------------------------------------------------------------- */}
      {/* LAYER 2: REGIONAL OBSERVATION NETWORK & AGGREGATION VECTORS         */}
      {/* ------------------------------------------------------------------- */}
      <svg
        ref={networkLayerRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full opacity-0 will-change-[opacity] transition-none"
        style={{ visibility: "hidden" }}
      >
        <defs>
          <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a33715" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#907768" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#565a5c" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Aggregation Vectors linking field observation nodes */}
        <g stroke="url(#linkGrad)" strokeWidth="0.18" fill="none">
          <line x1="22" y1="34" x2="38" y2="26" strokeDasharray="0.8 0.6" />
          <line x1="38" y1="26" x2="64" y2="32" />
          <line x1="64" y1="32" x2="78" y2="44" strokeDasharray="0.8 0.6" />
          <line x1="22" y1="34" x2="28" y2="68" />
          <line x1="28" y1="68" x2="48" y2="74" />
          <line x1="48" y1="74" x2="68" y2="66" strokeDasharray="1 0.8" />
          <line x1="68" y1="66" x2="84" y2="78" />
          <line x1="38" y1="26" x2="48" y2="74" strokeOpacity="0.3" strokeDasharray="0.5 0.5" />
          <line x1="64" y1="32" x2="68" y2="66" strokeOpacity="0.3" strokeDasharray="0.5 0.5" />
        </g>

        {/* Node pulse rings in SVG */}
        {OBSERVATION_NODES.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r="0.6" fill="#a33715" />
            <circle cx={node.x} cy={node.y} r="1.4" fill="none" stroke="#a33715" strokeWidth="0.12" opacity="0.6" />
          </g>
        ))}
      </svg>

      {/* Atmospheric depth vignette and edge gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f12] via-transparent to-[#0a0f12]/80 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f12]/70 via-transparent to-[#0a0f12]/70 pointer-events-none" />
    </div>
  );
}
