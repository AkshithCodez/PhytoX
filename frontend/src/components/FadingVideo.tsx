import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface FadingVideoProps {
  src: string | string[];
  className?: string;
  style?: React.CSSProperties;
  poster?: string;
}

export const FadingVideo: React.FC<FadingVideoProps> = ({
  src,
  className = '',
  style = {},
  poster,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState<number>(0);
  const [sourceIndex, setSourceIndex] = useState<number>(0);

  const sources = Array.isArray(src) ? src : [src];
  const currentSource = sources[sourceIndex] || sources[0];

  const rafFadeInRef = useRef<number | null>(null);
  const rafFadeOutRef = useRef<number | null>(null);
  const isFadingOutRef = useRef<boolean>(false);
  const isFadingInRef = useRef<boolean>(false);

  // Fade in over 500ms using requestAnimationFrame
  const fadeIn = useCallback((duration = 500) => {
    if (rafFadeOutRef.current) {
      cancelAnimationFrame(rafFadeOutRef.current);
      rafFadeOutRef.current = null;
    }
    if (rafFadeInRef.current) {
      cancelAnimationFrame(rafFadeInRef.current);
    }
    isFadingOutRef.current = false;
    isFadingInRef.current = true;

    const start = performance.now();
    const initialOpacity = 0;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress);
      const newOpacity = initialOpacity + eased * (1 - initialOpacity);
      setOpacity(newOpacity);

      if (progress < 1) {
        rafFadeInRef.current = requestAnimationFrame(step);
      } else {
        isFadingInRef.current = false;
        rafFadeInRef.current = null;
      }
    };
    rafFadeInRef.current = requestAnimationFrame(step);
  }, []);

  // Fade out over 550ms using requestAnimationFrame
  const fadeOut = useCallback((duration = 550) => {
    if (rafFadeInRef.current) {
      cancelAnimationFrame(rafFadeInRef.current);
      rafFadeInRef.current = null;
    }
    if (rafFadeOutRef.current) {
      cancelAnimationFrame(rafFadeOutRef.current);
    }
    isFadingInRef.current = false;
    isFadingOutRef.current = true;

    const start = performance.now();
    const initialOpacity = 1;

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = progress * progress; // easeInQuad
      const newOpacity = Math.max(0, initialOpacity - eased * initialOpacity);
      setOpacity(newOpacity);

      if (progress < 1) {
        rafFadeOutRef.current = requestAnimationFrame(step);
      } else {
        rafFadeOutRef.current = null;
      }
    };
    rafFadeOutRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Handle prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setOpacity(0.85);
      return;
    }

    const handleLoadedData = () => {
      fadeIn(500);
      video.play().catch(() => {
        // Autoplay policy fallback
      });
    };

    const handleTimeUpdate = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= 0.55 && !isFadingOutRef.current) {
        fadeOut(550);
      }
    };

    const handleEnded = () => {
      if (sources.length > 1) {
        setSourceIndex((prev) => (prev + 1) % sources.length);
      } else {
        video.currentTime = 0;
        video.play().then(() => {
          fadeIn(500);
        }).catch(() => {});
      }
    };

    const handleError = () => {
      // Graceful fallback on network error
      setOpacity(0.2);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    // If already loaded before listeners attached
    if (video.readyState >= 2) {
      handleLoadedData();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);

      if (rafFadeInRef.current) cancelAnimationFrame(rafFadeInRef.current);
      if (rafFadeOutRef.current) cancelAnimationFrame(rafFadeOutRef.current);
    };
  }, [currentSource, sources.length, fadeIn, fadeOut]);

  return (
    <video
      ref={videoRef}
      src={currentSource}
      poster={poster}
      autoPlay
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      className={className}
      style={{
        ...style,
        opacity,
        transition: 'none', // opacity driven by requestAnimationFrame
      }}
    />
  );
};
