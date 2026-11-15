"use client";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useThree } from "@react-three/fiber";

export type GroundMode = "image" | "3d";
function ramp(p: number, a: number, b: number) {
  const t = Math.max(0, Math.min(1, (p - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** The source stills use the original desktop and portrait cameras at p=.51. */
export function GroundImage({ progress, reducedMotion }: {
  progress: MutableRefObject<number>; reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const p = progress.current;
      if (p > 0.18) setLoad(true);
      if (!ref.current) return;
      const alpha = ramp(p, .35, .445) * (1 - ramp(p, .565, .65));
      ref.current.style.opacity = String(alpha);
      // A gentle two-pixel drift; reduced motion keeps the still completely static.
      ref.current.style.transform = `translateY(${reducedMotion ? 0 : (p - .51) * 12}px)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); };
  }, [progress, reducedMotion]);
  return <div ref={ref} data-ground-image="true" aria-hidden="true"
    style={{ position: "absolute", inset: -2, opacity: 0, pointerEvents: "none", willChange: "opacity, transform" }}>
    {load && <picture>
      <source media="(max-width: 767px)" srcSet="/images/ground-still-mobile.webp" />
      <img src="/images/ground-still-desktop.webp" alt="" decoding="async"
        style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </picture>}
  </div>;
}

/** Stop GPU work only while the still fully covers the canvas; hero settings are untouched. */
export function GroundRenderBudget({ mode, progress }: {
  mode: GroundMode; progress: MutableRefObject<number>;
}) {
  const { setFrameloop, gl, get } = useThree();
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const p = progress.current;
      const image = document.querySelector<HTMLImageElement>("[data-ground-image] img");
      const covered = mode === "image" && p >= .445 && p <= .565 && !!image?.complete && image.naturalWidth > 0;
      const next = covered || document.hidden ? "never" : "always";
      if (get().frameloop !== next) setFrameloop(next);
      // All shadow casters and lights are static during the ground close-up.
      const shadowActive = !(mode === "3d" && p > .445 && p < .56);
      if (gl.shadowMap.autoUpdate !== shadowActive) gl.shadowMap.needsUpdate = true;
      gl.shadowMap.autoUpdate = shadowActive;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", update);
    // The image can finish decoding after the scroll has stopped.
    document.addEventListener("load", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", update);
      document.removeEventListener("load", update, true);
      gl.shadowMap.autoUpdate = true;
      setFrameloop("always");
    };
  }, [mode, progress, setFrameloop, gl, get]);
  return null;
}

/** Anchor points follow the same cover crop as the approved still, including ultrawide screens. */
export function useGroundAnchors() {
  const [size, setSize] = useState({ width: 1440, height: 900 });
  useEffect(() => {
    const update = () => setSize({ width: innerWidth, height: innerHeight });
    update(); window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const mobile = size.width < 768;
  const sw = mobile ? 390 : 1440, sh = mobile ? 844 : 900;
  const scale = Math.max(size.width / sw, size.height / sh);
  const anchors = mobile ? [[.10,.64],[.28,.86],[.68,.75]] : [[.245,.71],[.45,.795],[.675,.685]];
  return anchors.map(([x,y]) => ({
    left: Math.max(24, Math.min(size.width-24, (size.width-sw*scale)/2+x*sw*scale)),
    top: (size.height-sh*scale)/2+y*sh*scale,
  }));
}
