import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, ArrowUpRight } from './Icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-modal-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl liquid-glass-strong rounded-3xl p-6 sm:p-8 bg-neutral-950/90 border border-white/10 text-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 id="about-modal-title" className="text-2xl font-heading italic tracking-tight">
                  About KrishRakshak
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="w-9 h-9 rounded-full liquid-glass flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm sm:text-base font-body text-white/80 font-light leading-relaxed">
              <p>
                <strong className="text-white font-medium">KrishRakshak</strong> is an AI-assisted crop-health assessment and regional epidemiological surveillance platform designed for Indian agriculture.
              </p>
              <p>
                Our core vision is to close the gap between initial leaf symptoms in the field and timely agricultural-officer oversight. When farmers detect leaf discoloration or spotting, early identification prevents minor crop stresses from escalating into harvest-threatening outbreaks.
              </p>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Responsible AI Principle
                </h3>
                <p className="text-xs text-white/70 leading-normal">
                  Our deep-learning models evaluate visible leaf morphology across 14 crops and 38 classes. All AI outputs serve as advisory assistance to guide human verification—never as a substitute for certified agronomists or clinical lab cultures.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-white/50">Current Model Scope: 14 Crops • 38 Classes</span>
              <a
                href="/farmer/predict"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-medium text-xs hover:bg-neutral-200 transition-colors"
              >
                Start Diagnosis
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
