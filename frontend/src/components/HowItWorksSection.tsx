import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    num: '01',
    title: 'Capture',
    tag: 'Field Photography',
    description: 'The farmer photographs the affected crop using the application.',
  },
  {
    num: '02',
    title: 'Assess',
    tag: 'Vision Inference',
    description: 'The system analyses visible symptoms and presents an AI-assisted result with appropriate confidence and uncertainty guidance.',
  },
  {
    num: '03',
    title: 'Report',
    tag: 'Geotagged Record',
    description: 'The farmer can add observations and location information to create a structured field report.',
  },
  {
    num: '04',
    title: 'Review',
    tag: 'Officer Oversight',
    description: 'Agricultural officers can examine submitted cases and identify areas that may require attention.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="relative min-h-screen scroll-mt-24 py-28 sm:py-36 px-6 sm:px-10 lg:px-16 overflow-hidden flex items-center justify-between"
    >
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Focused Sequence Container (Left 50%) */}
        <div className="w-full lg:w-[52%] max-w-xl flex flex-col items-start">
          <p className="text-xs uppercase tracking-widest text-[#57A773] font-body font-medium mb-3">
            Workflow Architecture
          </p>
          <h2 className="font-heading italic text-4xl sm:text-5xl md:text-6xl text-white tracking-[-2px] leading-[1.05] text-balance">
            From one field observation to informed action
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/70 font-body font-light leading-relaxed">
            Every step is structured to preserve ground evidence, communicate prediction bounds, and facilitate rapid agronomist review.
          </p>

          {/* 4 Steps in a clean 2x2 grid anchored on the left */}
          <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                className="group relative flex flex-col justify-between pt-5 border-t border-white/15 hover:border-[#57A773]/60 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2.5">
                    <span className="text-white/40 group-hover:text-[#57A773] transition-colors">
                      {step.num}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-white/40">
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="font-heading italic text-2xl text-white tracking-tight mb-2">
                    {step.title}
                  </h3>

                  <p className="text-xs text-white/70 font-body font-light leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 h-0.5 w-6 bg-white/20 group-hover:w-full group-hover:bg-[#57A773] transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Generous negative space dedicated to the 3D botanical subject */}
        <div className="hidden lg:block w-[45%] h-full pointer-events-none" aria-hidden="true" />
      </div>
    </section>
  );
};
