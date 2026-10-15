import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownIcon } from './Icons';

export const HeroSection: React.FC = () => {
  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen w-full flex items-center justify-between pt-28 pb-16 px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* Left Column: Focused Editorial Copy */}
      <div className="relative z-10 w-full max-w-2xl lg:max-w-xl xl:max-w-2xl flex flex-col items-start justify-center text-left">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex items-center gap-2.5 mb-5"
        >
          <span className="w-2 h-2 rounded-full bg-[#57A773] animate-pulse" />
          <span className="text-xs sm:text-sm font-body tracking-wider uppercase text-white/70 font-medium">
            AI-assisted crop health and field reporting
          </span>
        </motion.div>

        {/* 2-Line Editorial Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="font-heading italic text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] tracking-[-3px] text-white leading-[0.95] text-balance"
        >
          See the signs.<br />
          Protect the harvest.
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="mt-6 text-base sm:text-lg text-white/75 font-body font-light leading-relaxed max-w-lg"
        >
          KrishRakshak helps farmers assess visible crop symptoms, create location-aware reports, and connect field observations with agricultural-officer review.
        </motion.p>

        {/* CTAs: Clean contrast, no bulky cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          className="mt-8 flex flex-wrap items-center gap-4 sm:gap-6"
        >
          <a
            href="/farmer/predict"
            className="inline-flex items-center gap-2 bg-white text-black font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Check a Crop
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <a
            href="#how-it-works"
            onClick={scrollToHowItWorks}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white font-body transition-colors py-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Explore the Platform
            <ArrowDownIcon className="w-4 h-4 text-[#57A773]" />
          </a>
        </motion.div>
      </div>

      {/* Right Column: Generous negative space reserved for the 3D botanical specimen */}
      <div className="hidden lg:block w-[45%] h-full pointer-events-none" aria-hidden="true" />
    </section>
  );
};
