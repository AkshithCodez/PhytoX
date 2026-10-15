import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from './Icons';

const farmerFeatures = [
  {
    title: 'Instant Field Capture',
    desc: 'Photograph suspect leaves directly in daylight. Automated sharpness checks detect blur and glare before inference begins.',
  },
  {
    title: 'Understandable Assessment',
    desc: 'AI returns clear disease terminology with explicit confidence percentages, avoiding confusing scientific jargon.',
  },
  {
    title: 'Retake Guidance',
    desc: 'When an image cannot be reliably assessed or features unsupported foliage, clear retake instructions are provided immediately.',
  },
  {
    title: 'Geotagged Field Reports',
    desc: 'Attach GPS coordinates, symptom history, and farmer notes to log formal case documentation into regional records.',
  },
];

export const FarmerSection: React.FC = () => {
  return (
    <section
      id="for-farmers"
      className="relative min-h-screen scroll-mt-24 py-28 sm:py-36 px-6 sm:px-10 lg:px-16 overflow-hidden flex items-center justify-between"
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Negative space dedicated to the close-up 3D leaf model on the left */}
        <div className="hidden lg:block w-[45%] h-full pointer-events-none" aria-hidden="true" />

        {/* Right Column: Farmer Editorial & Interface Dossier (Right 52%) */}
        <div className="w-full lg:w-[52%] max-w-xl flex flex-col items-start">
          <p className="text-xs uppercase tracking-widest text-[#57A773] font-body font-medium mb-3">
            Farmer Experience
          </p>
          <h2 className="font-heading italic text-4xl sm:text-5xl md:text-6xl text-white tracking-[-2px] leading-[1.05] text-balance">
            Simple enough for the field
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 font-body font-light leading-relaxed">
            Designed for real working conditions—where sunlight is harsh, network connectivity varies, and actionable guidance is needed before symptoms escalate.
          </p>

          {/* Feature List */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full border-t border-white/10 pt-6">
            {farmerFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#57A773]" />
                  <h3 className="text-xs sm:text-sm font-medium text-white/90 font-body">
                    {f.title}
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-white/60 font-body font-light leading-relaxed pl-3.5">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Diagnostic Dossier Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-8 w-full rounded-2xl bg-[#090e0b]/95 border border-white/15 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#57A773]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-white/70">
                  Diagnostic Dossier #4082
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-mono">Live Mobile Session</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-white/40 block">Target Specimen</span>
                <span className="text-white font-medium">Tomato (S. lycopersicum)</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-white/40 block">Assessed Condition</span>
                <span className="text-amber-300 font-medium">Early Blight (A. solani)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70 font-light leading-relaxed">
              <strong className="text-white font-medium">Actionable Recommendation:</strong> Remove infected lower foliage to reduce fungal spore splash. Transition from overhead sprinkling to root-level drip irrigation.
            </div>
          </motion.div>

          {/* Action CTA */}
          <div className="mt-8 pt-6 border-t border-white/10 w-full flex items-center gap-4">
            <a
              href="/farmer"
              className="inline-flex items-center gap-2 bg-white text-black font-body text-xs sm:text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Open Farmer Portal
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs text-white/40 font-body font-light">
              Available on any mobile browser
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
