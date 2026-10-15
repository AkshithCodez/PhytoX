import React from 'react';
import { motion } from 'framer-motion';

const principles = [
  {
    num: '01',
    title: 'Communicate uncertainty',
    description:
      'When an image exhibits poor focus, heavy shadow, or falls outside the supported botanical envelope, the model explicitly flags low confidence rather than fabricating a false diagnosis.',
  },
  {
    num: '02',
    title: 'Preserve field evidence',
    description:
      'Every diagnostic submission archives the original leaf photograph, farmer observations, and timestamped coordinates. Algorithmic outputs never erase or overwrite ground-truth evidence.',
  },
  {
    num: '03',
    title: 'Keep officers in control',
    description:
      'Predictions function as triage signals. Regional quarantine advisories, chemical treatment mandates, and containment policies always require verification and sign-off by qualified agronomists.',
  },
];

export const HumanInTheLoopSection: React.FC = () => {
  return (
    <section
      id="approach"
      className="relative min-h-screen scroll-mt-24 py-28 sm:py-36 px-6 sm:px-10 lg:px-16 overflow-hidden flex items-center justify-center"
    >
      <div className="relative z-10 max-w-5xl mx-auto w-full">
        {/* Editorial Heading */}
        <div className="max-w-2xl text-left">
          <p className="text-xs uppercase tracking-widest text-[#57A773] font-body font-medium mb-3">
            Ethical AI & Agronomic Governance
          </p>
          <h2 className="font-heading italic text-4xl sm:text-5xl md:text-6xl text-white tracking-[-2px] leading-[1.05] text-balance">
            AI assists. People decide.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-white/75 font-body font-light leading-relaxed">
            KrishRakshak organises visual evidence and field reports to support faster review. Predictions are treated as decision-support signals—not as a replacement for agricultural expertise or field verification.
          </p>
        </div>

        {/* 3 Principles with Thin Vertical Dividers (No large cards) */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x divide-white/15 border-t border-b border-white/15 py-10">
          {principles.map((p, idx) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: 'easeOut' }}
              className="flex flex-col justify-between px-0 md:px-8 first:pl-0 last:pr-0 space-y-4"
            >
              <div>
                <span className="text-xs font-mono text-[#57A773] tracking-widest">
                  PRINCIPLE // {p.num}
                </span>
                <h3 className="font-heading italic text-2xl text-white tracking-tight mt-2 mb-3">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 font-body font-light leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                <span className="text-[11px] uppercase tracking-wider text-white/40 font-body">
                  Guaranteed Protocol
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
