"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

interface CinematicBackgroundProps {
  progressRef: MutableRefObject<number>;
  reducedMotion: boolean;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function CinematicBackground({
  progressRef,
  reducedMotion,
}: CinematicBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ecoLayerRef = useRef<HTMLDivElement>(null);
  const regLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animFrame = 0;

    const updateLayers = () => {
      animFrame = 0;
      const p = progressRef.current;

      // -----------------------------------------------------------------------
      // Image 1: Ground-Level Botanical Ecosystem (Active p: 0.33 -> 0.63)
      // Entrance: 0.33 -> 0.42 (smooth crossfade in from Hero/Vision)
      // Stable Viewing: 0.42 -> 0.58
      // Exit: 0.58 -> 0.66 (smooth crossfade into Image 2)
      // -----------------------------------------------------------------------
      const ecoIn = smoothstep(0.33, 0.42, p);
      const ecoOut = 1 - smoothstep(0.58, 0.66, p);
      const ecoAlpha = ecoIn * ecoOut;

      // Subtle cinematic zoom-in and micro-parallax
      const ecoScale = reducedMotion ? 1 : 1.04 - ecoIn * 0.04;
      const ecoY = reducedMotion ? 0 : (p - 0.48) * 20;

      if (ecoLayerRef.current) {
        ecoLayerRef.current.style.opacity = ecoAlpha.toFixed(3);
        ecoLayerRef.current.style.visibility =
          ecoAlpha > 0.01 ? "visible" : "hidden";
        ecoLayerRef.current.style.transform = reducedMotion
          ? "matrix(1, 0, 0, 1, 0, 0)"
          : `translate3d(0, ${ecoY.toFixed(1)}px, 0) scale(${ecoScale.toFixed(3)})`;
      }

      // -----------------------------------------------------------------------
      // Image 2: Regional Crop Intelligence Environment (Active p: 0.58 -> 0.94)
      // Entrance: 0.58 -> 0.66 (smooth crossfade in from Image 1)
      // Stable Viewing: 0.66 -> 0.86
      // Exit: 0.86 -> 0.94 (natural fade as Solutions section slides over)
      // -----------------------------------------------------------------------
      const regIn = smoothstep(0.58, 0.66, p);
      const regOut = 1 - smoothstep(0.86, 0.94, p);
      const regAlpha = regIn * regOut;

      const regScale = reducedMotion ? 1 : 1.03 - regIn * 0.03;
      const regY = reducedMotion ? 0 : (p - 0.76) * 18;

      if (regLayerRef.current) {
        regLayerRef.current.style.opacity = regAlpha.toFixed(3);
        regLayerRef.current.style.visibility =
          regAlpha > 0.01 ? "visible" : "hidden";
        regLayerRef.current.style.transform = `translate3d(0, ${regY.toFixed(
          1
        )}px, 0) scale(${regScale.toFixed(3)})`;
      }
    };

    const onScrollOrFrame = () => {
      if (!animFrame) {
        animFrame = requestAnimationFrame(updateLayers);
      }
    };

    updateLayers();
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
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ------------------------------------------------------------------- */}
      {/* IMAGE 1: GROUND-LEVEL BOTANICAL ECOSYSTEM                           */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={ecoLayerRef}
        data-ground-image
        className="absolute inset-[-12px] opacity-0 will-change-[opacity,transform] transition-none"
        style={{ visibility: "hidden" }}
      >
        <picture>
          <source
            media="(max-width: 767px)"
            type="image/avif"
            srcSet="/images/cinematic/ecosystem-mobile.avif"
          />
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/images/cinematic/ecosystem-mobile.webp"
          />
          <source
            type="image/avif"
            srcSet="/images/cinematic/ecosystem-desktop.avif"
          />
          <img
            src="/images/cinematic/ecosystem-desktop.webp"
            alt="Photorealistic ground-level botanical ecosystem with ferns, mossy limestone rocks, and natural pathway"
            className="w-full h-full object-cover object-[center_35%]"
            decoding="async"
            loading="lazy"
          />
        </picture>
        {/* Subtle atmospheric vignette and top text scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f12]/70 via-[#0a0f12]/15 to-[#0a0f12]/60 pointer-events-none" />
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* IMAGE 2: REGIONAL CROP INTELLIGENCE BOTANICAL ENVIRONMENT            */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={regLayerRef}
        className="absolute inset-[-12px] opacity-0 will-change-[opacity,transform] transition-none"
        style={{ visibility: "hidden" }}
      >
        <picture>
          <source
            media="(max-width: 767px)"
            type="image/avif"
            srcSet="/images/cinematic/regional-intelligence-mobile.avif"
          />
          <source
            media="(max-width: 767px)"
            type="image/webp"
            srcSet="/images/cinematic/regional-intelligence-mobile.webp"
          />
          <source
            type="image/avif"
            srcSet="/images/cinematic/regional-intelligence-desktop.avif"
          />
          <img
            src="/images/cinematic/regional-intelligence-desktop.webp"
            alt="Lush botanical landscape with broadleaf foliage, weathered rock formations, and central observation clearing"
            className="w-full h-full object-cover object-[center_40%]"
            decoding="async"
            loading="lazy"
          />
        </picture>
        {/* Subtle depth vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f12]/65 via-[#0a0f12]/20 to-[#0a0f12]/70 pointer-events-none" />
      </div>
    </div>
  );
}
