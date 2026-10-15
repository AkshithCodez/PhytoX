import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface BlurTextProps {
  text: string;
  className?: string;
  delayOffset?: number;
}

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  className = '',
  delayOffset = 0,
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const words = text.split(' ').filter(Boolean);

  return (
    <h1
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: '0.1em',
      }}
    >
      {words.map((word, index) => {
        if (prefersReducedMotion) {
          return (
            <span
              key={`${word}-${index}`}
              style={{
                display: 'inline-block',
                marginRight: '0.28em',
                opacity: 1,
                filter: 'none',
                transform: 'none',
              }}
            >
              {word}
            </span>
          );
        }

        return (
          <motion.span
            key={`${word}-${index}`}
            initial={{
              filter: 'blur(10px)',
              opacity: 0,
              y: 50,
            }}
            animate={
              isInView
                ? {
                    filter: 'blur(0px)',
                    opacity: 1,
                    y: 0,
                  }
                : {
                    filter: 'blur(10px)',
                    opacity: 0,
                    y: 50,
                  }
            }
            transition={{
              duration: 0.7,
              delay: delayOffset + index * 0.1,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              display: 'inline-block',
              marginRight: '0.28em',
              willChange: 'filter, opacity, transform',
            }}
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
};
