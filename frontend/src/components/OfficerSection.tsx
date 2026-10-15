import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from './Icons';

const officerCapabilities = [
  {
    label: 'Photographic Audit',
    desc: 'Inspect original uncompressed leaf captures, lighting conditions, and symptom progression before confirming field action.',
  },
  {
    label: 'Geospatial Clustering',
    desc: 'Detect emerging disease outbreaks by analyzing localized case densities across taluks and agricultural blocks.',
  },
  {
    label: 'Historical Chronology',
    desc: 'Correlate reported crop diseases with local microclimate changes, recent rainfall, and seasonal vulnerability cycles.',
  },
  {
    label: 'Agronomist Ground Dispatch',
    desc: 'Assign verification officers and log structured agronomic follow-up actions directly against farmer case dossiers.',
  },
];

export const OfficerSection: React.FC = () => {
  return (
    <section
      id="for-officers"
      className="relative min-h-screen scroll-mt-24 py-28 sm:py-36 px-6 sm:px-10 lg:px-16 overflow-hidden flex items-center justify-between"
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Officer Editorial & Surveillance Telemetry (Left 52%) */}
        <div className="w-full lg:w-[52%] max-w-xl flex flex-col items-start">
          <p className="text-xs uppercase tracking-widest text-[#C58A45] font-body font-medium mb-3">
            Officer Surveillance
          </p>
          <h2 className="font-heading italic text-4xl sm:text-5xl md:text-6xl text-white tracking-[-2px] leading-[1.05] text-balance">
            Turn individual reports into regional awareness
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 font-body font-light leading-relaxed">
            Agricultural extension teams gain real-time visibility across districts, allowing targeted advisory interventions before local spore dispersal escalates into widespread crop damage.
          </p>

          {/* Capabilities List */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full border-t border-white/10 pt-6">
            {officerCapabilities.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C58A45]" />
                  <h3 className="text-xs sm:text-sm font-medium text-white/90 font-body">
                    {item.label}
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-white/60 font-body font-light leading-relaxed pl-3.5">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Surveillance Feed Dossier Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-8 w-full rounded-2xl bg-[#090e0b]/95 border border-white/15 p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                  Regional Extension Desk
                </p>
                <h4 className="text-xs font-medium text-white font-body mt-0.5">
                  Surveillance Feed Telemetry
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                Connected
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <p className="text-white font-medium text-xs">Tomato • Early Blight</p>
                  <p className="text-[10px] text-white/50">Anantapur West Block • 14.6° N</p>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  Moderate
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <p className="text-white font-medium text-xs">Potato • Late Blight</p>
                  <p className="text-[10px] text-white/50">Nashik Zone • 19.9° N</p>
                </div>
                <span className="text-[10px] font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20">
                  Cluster Watch
                </span>
              </div>
            </div>
          </motion.div>

          {/* Action CTA */}
          <div className="mt-8 pt-6 border-t border-white/10 w-full flex items-center gap-4">
            <a
              href="/login?role=officer"
              className="inline-flex items-center gap-2 bg-white text-black font-body text-xs sm:text-sm font-medium px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Enter Officer Portal
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs text-white/40 font-body font-light">
              Restricted to authorized extension personnel
            </span>
          </div>
        </div>

        {/* Right Column: Negative space dedicated to 3D plant + Cadastral Grid on the right */}
        <div className="hidden lg:block w-[45%] h-full pointer-events-none" aria-hidden="true" />
      </div>
    </section>
  );
};
