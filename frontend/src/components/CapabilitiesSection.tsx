import React from 'react';
import { motion } from 'framer-motion';
import { FadingVideo } from './FadingVideo';
import { ImageIcon, MovieIcon, LightbulbIcon, ArrowUpRight } from './Icons';

interface CapabilityCardData {
  title: string;
  icon: React.ReactNode;
  tags: string[];
  body: string;
  href: string;
  actionText: string;
}

const capabilities: CapabilityCardData[] = [
  {
    title: 'Assess',
    icon: <ImageIcon className="w-5 h-5 text-white" />,
    tags: ['Image Upload', 'AI Assistance', 'Confidence', 'Retake Guidance'],
    body: 'Farmers can capture or upload a crop image and receive an AI-assisted assessment of visible disease symptoms, supported by confidence information and clear guidance when an image cannot be assessed reliably.',
    href: '/farmer/predict',
    actionText: 'Assess a Crop',
  },
  {
    title: 'Report',
    icon: <MovieIcon className="w-5 h-5 text-white" />,
    tags: ['Location', 'Farmer Notes', 'History', 'Field Evidence'],
    body: 'Assessment results can become structured field reports with location, crop details, farmer observations, and history—helping preserve valuable evidence beyond a single prediction.',
    href: '/farmer',
    actionText: 'Farmer Records',
  },
  {
    title: 'Monitor',
    icon: <LightbulbIcon className="w-5 h-5 text-white" />,
    tags: ['Officer Review', 'Regional Trends', 'Hotspots', 'Early Warning'],
    body: 'Agricultural officers can review submitted cases, study geographic disease patterns, identify emerging clusters, and prioritise areas that may require field verification or intervention.',
    href: '/login?role=officer',
    actionText: 'Officer Portal',
  },
];

export const CapabilitiesSection: React.FC = () => {
  return (
    <section
      id="capabilities"
      className="min-h-screen scroll-mt-24 overflow-hidden bg-black relative flex flex-col justify-between"
    >
      {/* Background Video */}
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_093722_ccfc7ebf-182f-419f-8a62-2dc02db7dd9d.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      />

      {/* Dark Ambient Overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90 z-[1] pointer-events-none"
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10 px-6 sm:px-10 md:px-16 lg:px-20 pt-24 sm:pt-28 pb-12 flex flex-col min-h-screen justify-between max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-auto">
          <p className="text-xs sm:text-sm font-body text-white/80 uppercase tracking-widest mb-4 sm:mb-6">
            // Platform Capabilities
          </p>
          <h2 className="font-heading italic text-5xl sm:text-6xl md:text-7xl lg:text-[5.75rem] leading-[0.9] tracking-[-2px] sm:tracking-[-3px] text-white max-w-3xl text-balance">
            From leaf image,<br />to field intelligence
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
              className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col justify-between group hover:border-white/30 transition-all"
            >
              {/* Top Row: Icon + Tags */}
              <div className="flex items-start justify-between gap-3">
                <div className="liquid-glass h-11 w-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  {item.icon}
                </div>

                <div className="flex flex-wrap gap-1.5 justify-end">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="liquid-glass rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] text-white/90 font-body whitespace-nowrap"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-1 min-h-[48px]" />

              {/* Bottom: Title + Description + Subtle Action Link */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading italic text-3xl md:text-4xl tracking-[-1px] leading-none text-white">
                    {item.title}
                  </h3>
                  <a
                    href={item.href}
                    aria-label={`${item.actionText} for ${item.title}`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-white/80 hover:text-white"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>

                <p className="text-sm text-white/85 font-body font-light leading-snug max-w-[34ch]">
                  {item.body}
                </p>

                <div className="pt-2">
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1.5 text-xs text-white/70 group-hover:text-white font-medium transition-colors"
                  >
                    <span>{item.actionText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Footer Minimal Notice */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50 font-body font-light">
          <div>
            KrishRakshak Platform • AI Advisory & Human-In-The-Loop Surveillance
          </div>
          <div className="flex items-center gap-6 text-white/60">
            <a href="/login" className="hover:text-white transition-colors">Sign In</a>
            <a href="/farmer" className="hover:text-white transition-colors">Farmer App</a>
            <a href="/officer" className="hover:text-white transition-colors">Officer Map</a>
          </div>
        </div>
      </div>
    </section>
  );
};
