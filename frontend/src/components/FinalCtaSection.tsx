import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from './Icons';

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="relative min-h-[80vh] py-28 sm:py-36 px-6 sm:px-10 lg:px-16 overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
        {/* Subtle Category Pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-[#57A773]" />
          <span className="text-xs uppercase tracking-widest text-white/60 font-body font-medium">
            National Agricultural Telemetry
          </span>
        </motion.div>

        {/* Closing Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="font-heading italic text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] text-white tracking-[-2px] leading-[1.0] text-balance"
        >
          Better crop protection begins with better visibility.
        </motion.h2>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="mt-6 text-base sm:text-lg text-white/75 font-body font-light leading-relaxed max-w-xl"
        >
          Capture what you see, preserve the evidence, and help connect local crop concerns with informed agricultural review.
        </motion.p>

        {/* Dual Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        >
          <a
            href="/farmer/predict"
            className="inline-flex items-center gap-2 bg-white text-black font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-neutral-200 transition-colors shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Check a Crop
            <ArrowUpRight className="w-4 h-4" />
          </a>

          <a
            href="/login?role=officer"
            className="inline-flex items-center gap-2 border border-white/25 text-white font-body text-sm font-medium px-6 py-3 rounded-full hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Officer Login
            <ArrowUpRight className="w-3.5 h-3.5 text-white/70" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
