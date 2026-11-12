"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Minus,
  Plus,
  Sprout,
} from "lucide-react";
import { EcoTechScene } from "@/components/eco-tech-scene";

gsap.registerPlugin(ScrollTrigger);

function smoothRange(
  value: number,
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number
): number {
  if (value <= inStart || value >= outEnd) return 0;
  if (value >= inEnd && value <= outStart) return 1;
  if (value < inEnd) {
    const t = (value - inStart) / (inEnd - inStart);
    return t * t * (3 - 2 * t);
  }
  const t = 1 - (value - outStart) / (outEnd - outStart);
  return t * t * (3 - 2 * t);
}

const CAPABILITY_PILLARS = [
  {
    id: "01",
    title: "EDGE-OPTIMIZED MOBILENETV2 CLASSIFICATION",
    detail:
      "Screens 38 crop-disease categories on our FastAPI ONNX service with calibrated top-k predictions.",
  },
  {
    id: "02",
    title: "AUTOMATED PHOTO QUALITY & UNCERTAINTY GATES",
    detail:
      "Detects blur, poor lighting, or ambiguous leaf framing before showing action guidance.",
  },
  {
    id: "03",
    title: "MULTILINGUAL CARE IN ENGLISH, TELUGU & HINDI",
    detail:
      "Native language interface and crop-care instructions available cleanly prior to login.",
  },
  {
    id: "04",
    title: "PRIVATE FARMER STORAGE VIA POSTGRESQL RLS",
    detail:
      "Signed media uploads and strict Row Level Security isolate each farmer's diagnosis history.",
  },
  {
    id: "05",
    title: "REGIONAL CLUSTER REVIEW FOR AGRI OFFICERS",
    detail:
      "Verified regional reports highlight emerging foliar blight or rust clusters for timely advisories.",
  },
] as const;

const SPATIAL_HOTSPOTS = [
  {
    id: "hs-1",
    posClass: "top-[44%] left-[12%] sm:top-[53%] sm:left-[28%]",
    kicker: "DIAGNOSTIC ENGINE",
    label: "38 CROP DISEASE CLASSES",
    detail: "MobileNetV2 ONNX screening across foliar blights, rusts, spots, and healthy leaves.",
  },
  {
    id: "hs-2",
    posClass: "top-[78%] left-[10%] sm:top-[73%] sm:left-[10%]",
    kicker: "FIELD ACCESSIBILITY",
    label: "ENGLISH · తెలుగు · हिन्दी",
    detail: "Multilingual screening workflows and preventive recommendations built for regional growers.",
  },
  {
    id: "hs-3",
    posClass: "top-[61%] left-[38%] sm:top-[56%] sm:left-[64%]",
    kicker: "DATA GOVERNANCE",
    label: "PRIVATE RLS STORAGE",
    detail: "Signed private uploads and farmer-controlled report sharing under PostgreSQL RLS.",
  },
] as const;

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const runwayRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const scene1Ref = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const scene2Ref = useRef<HTMLDivElement>(null);
  const scene3Ref = useRef<HTMLDivElement>(null);
  const scene4Ref = useRef<HTMLDivElement>(null);
  const skyScrimRef = useRef<HTMLDivElement>(null);

  const scrollProgressRef = useRef(0);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const [reducedMotion, setReducedMotion] = useState(false);
  const [openPillar, setOpenPillar] = useState<string | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onMq);

    function applyHudProgress(p: number) {
      // Scene opacity & vertical parallax transitions (zero overlap between Hero, Vision, Macro, Telemetry)
      const s1 = smoothRange(p, -1.0, -0.5, 0.06, 0.14);
      const s2 = smoothRange(p, 0.14, 0.19, 0.27, 0.33);
      const s3 = smoothRange(p, 0.43, 0.47, 0.55, 0.61);
      const s4 = smoothRange(p, 0.63, 0.67, 0.75, 0.82);
      const skyScrim = smoothRange(p, 0.3, 0.4, 0.88, 0.96);

      const updateLayer = (
        el: HTMLDivElement | null,
        alpha: number,
        shiftY = 0
      ) => {
        if (!el) return;
        const clamped = Math.max(0, Math.min(1, alpha));
        el.style.opacity = clamped.toFixed(3);
        el.style.visibility = clamped > 0.02 ? "visible" : "hidden";
        el.style.pointerEvents = clamped > 0.45 ? "auto" : "none";
        el.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0)`;
      };

      updateLayer(scene1Ref.current, s1, (1 - s1) * -18);
      updateLayer(reticleRef.current, s1, 0);
      updateLayer(scene2Ref.current, s2, (1 - s2) * 16);
      updateLayer(scene3Ref.current, s3, (1 - s3) * 18);
      updateLayer(scene4Ref.current, s4, p > 0.75 ? (1 - s4) * -32 : (1 - s4) * 18);

      if (skyScrimRef.current) {
        skyScrimRef.current.style.opacity = skyScrim.toFixed(3);
      }

      const solutionsTop = solutionsRef.current
        ? solutionsRef.current.getBoundingClientRect().top
        : Infinity;

      if (headerRef.current) {
        const nextMode =
          solutionsTop <= 80 || p >= 0.985 ? "light" : p >= 0.33 ? "mist" : "dark";
        if (headerRef.current.getAttribute("data-mode") !== nextMode) {
          headerRef.current.setAttribute("data-mode", nextMode);
        }
      }
    }

    const ctx = gsap.context(() => {
      if (!runwayRef.current) return;

      ScrollTrigger.create({
        trigger: runwayRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          scrollProgressRef.current = self.progress;
          applyHudProgress(self.progress);
        },
      });
    }, rootRef);

    // Ensure initial progress state on load and sync across programmatic/hash jumps
    function syncFromWindowScroll() {
      if (!runwayRef.current) return;
      const runwayLen = Math.max(1, runwayRef.current.offsetHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / runwayLen));
      scrollProgressRef.current = p;
      applyHudProgress(p);
    }
    syncFromWindowScroll();

    function onMouseMove(e: MouseEvent) {
      mousePosRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    }
    window.addEventListener("scroll", syncFromWindowScroll, { passive: true });
    window.addEventListener("scrollend", syncFromWindowScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let observer: IntersectionObserver | null = null;
    if (solutionsRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        () => {
          syncFromWindowScroll();
        },
        { rootMargin: "-80px 0px 0px 0px", threshold: [0, 0.01] }
      );
      observer.observe(solutionsRef.current);
    }

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("scroll", syncFromWindowScroll);
      window.removeEventListener("scrollend", syncFromWindowScroll);
      window.removeEventListener("mousemove", onMouseMove);
      observer?.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="marketing-cinematic min-h-screen relative bg-[#111d13] text-[#f5f7f4] overflow-x-clip selection:bg-[#b7f36b] selection:text-[#111d13]"
    >
      {/* 3D WebGL Background Stage */}
      <EcoTechScene
        scrollProgressRef={scrollProgressRef}
        mousePosRef={mousePosRef}
        reducedMotion={reducedMotion}
      />

      {/* Minimal Floating HUD Header matching reference composition */}
      <header
        ref={headerRef}
        data-mode="dark"
        className="hdr-cinema fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-[1440px] mx-auto px-5 md:px-10 h-[72px] flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-[18px] font-semibold tracking-tight whitespace-nowrap"
            aria-label="PhytoX home"
          >
            <span className="hdr-brand-mark w-7 h-7 rounded-[6px] inline-flex items-center justify-center">
              <Sprout size={15} strokeWidth={2.2} />
            </span>
            <span>PhytoX</span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-[11px] font-mono tracking-[0.12em] uppercase"
          >
            <a href="#vision" className="hdr-nav-link">
              Vision
            </a>
            <a href="#methodology" className="hdr-nav-link">
              Methodology
            </a>
            <a href="#telemetry" className="hdr-nav-link">
              Telemetry
            </a>
            <a href="#solutions" className="hdr-nav-link">
              Solutions
            </a>
            <Link href="/auth/login?portal=officer" className="hdr-nav-link">
              Officer Login
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/language"
              className="hdr-nav-link hidden sm:inline-flex text-[10.5px] font-mono tracking-[0.12em] uppercase px-2 py-1 rounded-[4px]"
            >
              EN · తె · हिं
            </Link>
            <Link
              href="/farmer"
              className="inline-flex items-center gap-2.5 text-[11px] font-mono font-medium tracking-[0.12em] uppercase whitespace-nowrap group"
            >
              <span>Farmer Portal</span>
              <span className="hdr-portal-arrow w-[22px] h-[22px] rounded-[4px] inline-flex items-center justify-center">
                <ChevronRight size={13} strokeWidth={2.5} />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="relative z-10">
        {/* ================================================================= */}
        {/* PINNED 3D RUNWAY FOR SCENES 1 -> 4 (460vh Scroll Track)            */}
        {/* ================================================================= */}
        <div ref={runwayRef} className="relative h-[460vh]">
          {/* Scroll Anchor Targets inside Runway for Clean Nav Deep-Linking */}
          <div id="hero" className="absolute top-0 left-0 h-px w-px" aria-hidden="true" />
          <div id="vision" className="absolute top-[106vh] left-0 h-px w-px" aria-hidden="true" />
          <div id="methodology" className="absolute top-[235vh] left-0 h-px w-px" aria-hidden="true" />
          <div id="telemetry" className="absolute top-[330vh] left-0 h-px w-px" aria-hidden="true" />

          {/* Sticky 100vh HUD Viewport */}
          <div className="sticky top-0 h-screen w-full overflow-hidden">
            {/* Subtle top sky contrast scrim active during bright overcast Scenes 3-4 */}
            <div
              ref={skyScrimRef}
              className="absolute inset-x-0 top-0 h-[44vh] pointer-events-none bg-gradient-to-b from-[#172118]/50 via-[#1f2920]/20 to-transparent"
              style={{ opacity: 0 }}
              aria-hidden="true"
            />

            {/* ------------------------------------------------------------- */}
            {/* SCENE 1: HERO (0% - 16%)                                      */}
            {/* ------------------------------------------------------------- */}
            <div
              ref={scene1Ref}
              className="absolute inset-0 max-w-[1440px] mx-auto px-6 md:px-12 pt-[88px] pb-8 md:pb-10 flex flex-col justify-between"
            >
              {/* Subtle Translucent Square Reticle Over Moss Patch */}
              <div
                ref={reticleRef}
                className="hidden md:flex flex-col justify-end items-end pointer-events-none absolute top-[47%] left-[52%] -translate-x-1/2 -translate-y-1/2 w-[176px] h-[176px] border border-white/30 bg-white/[0.02]"
                aria-hidden="true"
              >
                <div className="translate-x-[58%] translate-y-2 flex flex-col items-start gap-1">
                  <span className="px-1.5 py-0.5 rounded-[2px] bg-[#f5f7f4] text-[#111d13] font-mono text-[8.5px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap">
                    38 DISEASE CLASSES
                  </span>
                  <span className="font-mono text-[8.5px] tracking-[0.12em] uppercase text-white/80 leading-tight whitespace-nowrap [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
                    LEAF SCREENING · ONNX READY
                    <br />
                    EN / తెలుగు / हिन्दी
                  </span>
                </div>
              </div>

              {/* Top-Left Hero Headline & Action */}
              <div className="relative z-10 max-w-[560px] mt-[4vh] md:mt-[5vh]">
                <h1 className="text-[clamp(2.35rem,4.7vw,4.25rem)] font-medium leading-[1.03] tracking-[-0.03em] text-[#f5f7f4] [text-shadow:0_2px_24px_rgba(10,18,12,0.55)]">
                  Where Crop Science
                  <br />
                  and Field Intelligence
                  <br />
                  Meet
                </h1>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Link
                    href="/farmer"
                    className="inline-flex items-center gap-3 pl-4 pr-2.5 py-2 rounded-[5px] border border-white/25 bg-[#111d13]/55 hover:border-white/55 hover:bg-[#111d13]/75 transition-all text-[11px] font-mono tracking-[0.12em] uppercase text-white group"
                  >
                    <span>Open Scanner</span>
                    <span className="w-[20px] h-[20px] rounded-[3px] bg-[#b7f36b] text-[#111d13] inline-flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </span>
                  </Link>
                  <Link
                    href="/auth/login?portal=officer"
                    className="inline-flex items-center gap-1.5 px-2 py-2 text-[11px] font-mono tracking-[0.12em] uppercase text-white/75 hover:text-white transition-colors"
                  >
                    <span>Officer Portal</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Bottom Strip matching reference subcopy + Scroll hint */}
              <div className="relative z-10 flex items-end justify-between gap-6">
                <p className="max-w-[330px] text-[12.5px] md:text-[13px] leading-[1.45] text-[#dce2da] [text-shadow:0_1px_12px_rgba(8,14,9,0.75)]">
                  Screen leaf symptoms early.
                  <br />
                  AI-assisted crop disease intelligence paired with multilingual
                  farmer guidance and verified regional tracking.
                </p>

                <div className="hidden sm:flex items-center gap-2 text-[10.5px] font-mono tracking-[0.08em] text-white/80">
                  <span className="w-3.5 h-5 rounded-full border border-white/40 inline-flex justify-center pt-1">
                    <span className="w-0.5 h-1 rounded-full bg-[#b7f36b]" />
                  </span>
                  <span>Scroll to discover</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SCENE 2: VISION - Direct Centered Copy Over Boulder (no grey box) */}
            {/* ------------------------------------------------------------- */}
            <div
              ref={scene2Ref}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none"
              style={{ opacity: 0, visibility: "hidden" }}
            >
              <div className="max-w-[680px] flex flex-col items-center">
                <span className="inline-block px-2.5 py-1 rounded-[3px] bg-[#b7f36b] text-[#111d13] font-mono text-[10px] font-medium tracking-[0.14em] uppercase shadow-sm">
                  OUR VISION
                </span>

                <h2 className="mt-5 text-[clamp(2rem,4.1vw,3.45rem)] font-medium leading-[1.06] tracking-[-0.03em] text-white [text-shadow:0_4px_30px_rgba(8,14,9,0.9)]">
                  From Field Uncertainty to
                  <br />
                  Science-Backed,
                  <br />
                  Actionable Insights
                </h2>

                <p className="mt-4 max-w-[430px] text-[13.5px] md:text-[15px] leading-[1.45] text-[#f0f4ee] [text-shadow:0_2px_18px_rgba(8,14,9,0.95)]">
                  AI-assisted leaf diagnosis and native language advice,
                  built for practical field conditions.
                </p>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SCENE 3: MACRO TERRAIN, FERN & 3 MINIMAL LIME HOTSPOTS        */}
            {/* ------------------------------------------------------------- */}
            <div
              ref={scene3Ref}
              className="absolute inset-0 max-w-[1440px] mx-auto px-6 md:px-12 pt-[88px] pb-10 pointer-events-none"
              style={{ opacity: 0, visibility: "hidden" }}
            >
              {/* Top Row: Left Micro Stack + Right Editorial Statement */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase leading-[1.45] text-white [text-shadow:0_1px_10px_rgba(12,18,13,0.7)]">
                  REAL-TIME
                  <br />
                  MULTILINGUAL
                  <br />
                  CROP INTELLIGENCE
                </div>

                <h2 className="max-w-[540px] md:ml-auto text-[clamp(1.25rem,2.25vw,1.9rem)] font-normal leading-[1.24] tracking-[-0.02em] text-white [text-shadow:0_2px_20px_rgba(12,18,13,0.55)]">
                  PhytoX screening workflows translate single leaf photographs
                  into clear, uncertainty-aware findings—helping growers act early
                  with verified insight, not guesswork.
                </h2>
              </div>

              {/* 3 Spatial Lime Target Hotspots matching reference composition */}
              <div className="relative h-[calc(100%-150px)] w-full">
                {SPATIAL_HOTSPOTS.map((spot) => {
                  const isPinned = activeHotspot === spot.id;
                  const isOpen = isPinned || hoveredHotspot === spot.id;
                  return (
                    <div
                      key={spot.id}
                      className={`absolute ${spot.posClass} ${isOpen ? "z-30" : "z-10"} flex items-start gap-2.5`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isPinned) {
                            setActiveHotspot(null);
                            setHoveredHotspot(null);
                          } else {
                            setActiveHotspot(spot.id);
                          }
                        }}
                        onMouseEnter={() => setHoveredHotspot(spot.id)}
                        onMouseLeave={() =>
                          setHoveredHotspot((prev) => (prev === spot.id ? null : prev))
                        }
                        aria-expanded={isPinned}
                        aria-label={`${spot.label}: ${spot.detail}`}
                        className="w-6 h-6 rounded-full bg-[#c4f56b] text-[#111d13] inline-flex items-center justify-center shadow-md hotspot-pulse shrink-0 focus-visible:outline-2 focus-visible:outline-white"
                      >
                        {/* 4-dot target glyph matching reference */}
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                          <circle cx="5" cy="1.8" r="1.15" />
                          <circle cx="8.2" cy="5" r="1.15" />
                          <circle cx="5" cy="8.2" r="1.15" />
                          <circle cx="1.8" cy="5" r="1.15" />
                        </svg>
                      </button>

                      <div className="text-left">
                        <div className="font-mono text-[8.5px] sm:text-[9.5px] tracking-[0.11em] uppercase leading-tight text-white [text-shadow:0_1px_10px_rgba(8,14,9,0.95),0_0_3px_rgba(8,14,9,0.9)]">
                          <span className="block text-[#d7f79a]">{spot.kicker}</span>
                          <span>{spot.label}</span>
                        </div>
                        {isOpen && (
                          <div className="mt-1.5 max-w-[220px] px-2.5 py-1.5 rounded-[6px] bg-[#111d13]/90 backdrop-blur-md border border-white/15 text-[11px] leading-snug text-white shadow-lg">
                            {spot.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SCENE 4: TELEMETRY MAST + FROSTED CARD + 5 STRIPS             */}
            {/* ------------------------------------------------------------- */}
            <div
              ref={scene4Ref}
              className="absolute inset-0 max-w-[1440px] mx-auto px-5 sm:px-6 md:px-12 pt-[78px] sm:pt-[86px] pb-4 sm:pb-8 overflow-y-auto lg:overflow-visible flex flex-col justify-between pointer-events-none"
              style={{ opacity: 0, visibility: "hidden" }}
            >
              {/* Top-Left Title Matching `↗ Scientific Credibility...` */}
              <div className="flex items-start gap-2.5 max-w-[360px] pt-1 sm:pt-2">
                <ArrowUpRight
                  size={16}
                  className="text-white/90 mt-1 shrink-0"
                  aria-hidden="true"
                />
                <h2 className="text-[clamp(1.15rem,2.1vw,1.65rem)] font-normal leading-[1.2] tracking-[-0.02em] text-white [text-shadow:0_2px_18px_rgba(12,18,13,0.6)]">
                  Scientific Credibility to
                  <br />
                  Regional Crop Action
                </h2>
              </div>

              {/* Mid-Viewport Left Frosted Metric Card + Right 5 Horizontal Strips */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-8 items-center my-auto py-1 sm:py-2">
                {/* Left Frosted Card matching reference `w-[275px]` proportion */}
                <div className="lg:col-span-5 flex lg:justify-end">
                  <div className="w-full max-w-[300px] rounded-[12px] bg-[#1a1f1b]/75 backdrop-blur-xl border border-white/15 p-4 sm:p-5 text-white shadow-2xl">
                    <div className="text-[12px] font-medium text-white">
                      Model pathology coverage
                    </div>
                    <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-white/65 mt-0.5">
                      ONNX CLASSIFICATION
                    </div>

                    <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                      <span className="text-[26px] sm:text-[30px] font-normal tracking-tight text-white">
                        38
                      </span>
                      <span className="font-mono text-[10px] text-white/75">
                        classes
                      </span>
                    </div>

                    {/* Minimal Node-and-Line Workflow Chart matching reference MAY badge */}
                    <div className="mt-2.5 sm:mt-4 relative pt-4 sm:pt-5">
                      <span className="absolute right-8 top-0 px-1.5 py-0.5 rounded-[3px] bg-[#c4f56b] text-[#111d13] font-mono text-[8.5px] font-semibold tracking-[0.06em]">
                        EN · TE · HI
                      </span>
                      <svg
                        viewBox="0 0 240 52"
                        className="w-full h-9 sm:h-12 overflow-visible"
                        aria-hidden="true"
                      >
                        <path
                          d="M 8 44 L 54 39 L 100 28 L 144 26 L 188 18 L 232 10"
                          fill="none"
                          stroke="rgba(255,255,255,0.45)"
                          strokeWidth="1.2"
                          strokeDasharray="2.5 2.5"
                        />
                        <circle cx="8" cy="44" r="2.5" fill="#ffffff" />
                        <circle cx="54" cy="39" r="2.5" fill="#ffffff" />
                        <circle cx="100" cy="28" r="2.5" fill="#ffffff" />
                        <circle cx="144" cy="26" r="2.5" fill="#ffffff" />
                        <circle cx="188" cy="18" r="3.5" fill="#c4f56b" />
                        <circle cx="232" cy="10" r="2.5" fill="#ffffff" />
                      </svg>
                      <div className="flex justify-between font-mono text-[8px] tracking-[0.08em] text-white/70 mt-1">
                        <span>SCAN</span>
                        <span>CHECK</span>
                        <span>SCORE</span>
                        <span>GUIDE</span>
                        <span className="text-[#c4f56b]">STORE</span>
                        <span>VERIFY</span>
                      </div>
                    </div>

                    <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10 font-mono text-[9px] text-white/75">
                      FastAPI ONNX · Private PostgreSQL RLS
                    </div>
                  </div>
                </div>

                {/* Right 5 Stacked Translucent Capability Strips */}
                <div className="lg:col-span-7 flex lg:justify-start">
                  <div className="w-full max-w-[430px] rounded-[6px] overflow-hidden border border-white/15 bg-[#1b221c]/60 backdrop-blur-md divide-y divide-white/15 shadow-xl">
                    {CAPABILITY_PILLARS.map((pillar) => {
                      const expanded = openPillar === pillar.id;
                      return (
                        <div key={pillar.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenPillar((prev) =>
                                prev === pillar.id ? null : pillar.id
                              )
                            }
                            aria-expanded={expanded}
                            className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-left hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-white"
                          >
                            <span className="flex items-center gap-3 font-mono text-[9.5px] sm:text-[10.5px] tracking-[0.08em] text-white">
                              <span className="text-[#c4f56b]">{pillar.id}</span>
                              <span>{pillar.title}</span>
                            </span>
                            <span className="text-white/80 shrink-0">
                              {expanded ? <Minus size={13} /> : <Plus size={13} />}
                            </span>
                          </button>
                          {expanded && (
                            <p className="px-3.5 sm:px-4 pb-2.5 sm:pb-3 pl-9 sm:pl-10 text-[12px] leading-relaxed text-[#e2e8e0]">
                              {pillar.detail}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="h-2 sm:h-4" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SCENE 5: PURE WHITE EDITORIAL SOLUTIONS SECTION + FOOTER          */}
        {/* Slides cleanly over Scene 4 mast in normal document flow          */}
        {/* ================================================================= */}
        <section
          id="solutions"
          ref={solutionsRef}
          className="relative z-20 bg-white text-[#111813] pt-24 pb-20 md:pt-28 md:pb-28 px-6 md:px-12 shadow-[0_-24px_60px_rgba(0,0,0,0.18)]"
        >
          <div className="max-w-[1360px] mx-auto">
            <span className="inline-block px-2.5 py-1 rounded-[3px] bg-[#c4f56b] text-[#111d13] font-mono text-[10px] font-medium tracking-[0.14em] uppercase">
              OUR SOLUTIONS
            </span>

            <h2 className="mt-6 text-[clamp(2.1rem,3.8vw,3.3rem)] font-medium leading-[1.06] tracking-[-0.03em] text-[#111813] max-w-[540px]">
              Validating What Your
              <br />
              Fields Show Naturally
            </h2>

            {/* 2-Column Editorial Photo Cards matching Frame 18/20 */}
            <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Card: Farmer Portal */}
              <Link
                href="/farmer"
                className="group relative block h-[340px] sm:h-[390px] md:h-[440px] rounded-[12px] overflow-hidden bg-[#101811]"
              >
                <img
                  src="/images/farmers-leaf.jpg"
                  alt="Dark botanical crop leaf with water droplets for farmer leaf disease scanning"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 to-black/80"
                  aria-hidden="true"
                />

                <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-white">
                      [ FARMER PORTAL ]
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#c4f56b] text-[#111d13] inline-flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight size={15} strokeWidth={2.2} />
                    </span>
                  </div>

                  <div className="max-w-[380px]">
                    <h3 className="text-[22px] sm:text-[25px] font-medium tracking-[-0.02em] text-white">
                      Field Leaf Scanner &amp; History
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.45] text-[#e7ece6]">
                      Photograph a leaf, receive uncertainty-calibrated screening
                      and native care steps in English, Telugu, or Hindi, and
                      maintain private logs.
                    </p>
                  </div>
                </div>
              </Link>

              {/* Right Card: Officer Portal */}
              <Link
                href="/auth/login?portal=officer"
                className="group relative block h-[340px] sm:h-[390px] md:h-[440px] rounded-[12px] overflow-hidden bg-[#162317]"
              >
                <img
                  src="/images/officer-fields.jpg"
                  alt="Aerial view of contoured green agricultural crop fields for regional monitoring"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"
                  aria-hidden="true"
                />

                <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-white">
                      [ OFFICER PORTAL ]
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#c4f56b] text-[#111d13] inline-flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight size={15} strokeWidth={2.2} />
                    </span>
                  </div>

                  <div className="max-w-[380px]">
                    <h3 className="text-[22px] sm:text-[25px] font-medium tracking-[-0.02em] text-white">
                      Regional Outbreak Surveillance
                    </h3>
                    <p className="mt-2 text-[13px] leading-[1.45] text-[#e7ece6]">
                      Review farmer submissions, inspect regional symptom
                      clusters, verify diagnoses, and publish targeted field
                      advisories.
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Quiet Factual Capability Strip */}
            <div className="mt-12 pt-8 border-t border-[#e6ebe4] grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#4d624c]">
                  CLASSIFICATION SCOPE
                </div>
                <p className="mt-1 text-[14px] font-medium text-[#111813]">
                  38 Crop &amp; Disease Classes
                </p>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#4d624c]">
                  LANGUAGE ACCESS
                </div>
                <p className="mt-1 text-[14px] font-medium text-[#111813]">
                  English · తెలుగు · हिन्दी
                </p>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#4d624c]">
                  SECURITY ARCHITECTURE
                </div>
                <p className="mt-1 text-[14px] font-medium text-[#111813]">
                  Private RLS &amp; Signed Media Access
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="relative z-20 bg-[#111d13] text-[#d0d8ce] border-t border-white/10 px-6 md:px-12 py-10">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-2.5 text-white font-semibold">
            <span className="w-6 h-6 rounded-[5px] bg-white/10 text-[#b7f36b] inline-flex items-center justify-center">
              <Sprout size={14} />
            </span>
            <span>PhytoX</span>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-6 font-mono text-[11px] tracking-[0.1em] uppercase"
          >
            <Link href="/farmer" className="text-white/80 hover:text-white transition-colors">
              Farmer Portal
            </Link>
            <Link
              href="/auth/login?portal=officer"
              className="text-white/80 hover:text-white transition-colors"
            >
              Officer Login
            </Link>
            <Link href="/language" className="text-white/80 hover:text-white transition-colors">
              Language Settings
            </Link>
            <Link href="/privacy" className="text-white/80 hover:text-white transition-colors">
              Privacy &amp; AI
            </Link>
          </nav>

          <p className="text-[11.5px] text-[#b4bfb2] max-w-sm">
            AI screening assists initial crop review; consult local agricultural
            officers before applying chemical treatments.
          </p>
        </div>
      </footer>
    </div>
  );
}
