import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, MenuIcon, CloseIcon } from './Icons';

interface NavbarProps {
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAbout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] px-4 py-2 bg-white text-black font-medium text-xs rounded-full shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Skip to main content
      </a>

      <header
        className="fixed top-4 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-8 lg:px-14"
        role="banner"
      >
        {/* Left: Brand Mark */}
        <a
          href="/"
          onClick={scrollTo('top')}
          aria-label="KrishRakshak home"
          className="liquid-glass h-11 w-11 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        >
          <img
            src="/assets/images/krishirakshak-symbol-128.png"
            alt=""
            width="22"
            height="22"
            className="w-5 h-5 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
              const span = e.currentTarget.nextElementSibling as HTMLElement;
              if (span) span.style.display = 'block';
            }}
          />
          <span
            style={{ display: 'none' }}
            className="font-heading italic text-2xl leading-none text-white select-none"
          >
            K
          </span>
        </a>

        {/* Center: Desktop Nav Pill */}
        <nav
          className="hidden lg:flex liquid-glass rounded-full px-2 py-1.5 items-center gap-1 bg-[#050706]/60 backdrop-blur-md border border-white/10"
          aria-label="Primary navigation"
        >
          <a
            href="/"
            onClick={scrollTo('top')}
            className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-body transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Home
          </a>
          <a
            href="#how-it-works"
            onClick={scrollTo('how-it-works')}
            className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-body transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            How It Works
          </a>
          <a
            href="#for-farmers"
            onClick={scrollTo('for-farmers')}
            className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-body transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            For Farmers
          </a>
          <a
            href="#for-officers"
            onClick={scrollTo('for-officers')}
            className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-body transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            For Officers
          </a>
          <a
            href="#approach"
            onClick={scrollTo('approach')}
            className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-body transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Approach
          </a>
          <button
            type="button"
            onClick={onOpenAbout}
            className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-body transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            About
          </button>
          <a
            href="/login?role=officer"
            className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white font-body transition-colors rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
          >
            Officer Portal
          </a>

          {/* Primary CTA in navbar */}
          <a
            href="/farmer/predict"
            className="ml-1.5 inline-flex items-center gap-1.5 bg-white text-black font-body text-xs font-medium px-3.5 py-1.5 rounded-full hover:bg-neutral-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Check a Crop
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </nav>

        {/* Right: Mobile Menu Toggle / Desktop Spacer */}
        <div className="flex items-center">
          <div className="hidden lg:block h-11 w-11" aria-hidden="true" />

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden liquid-glass h-11 w-11 rounded-full flex items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {mobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Accessible Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-20 z-40 lg:hidden rounded-2xl p-6 bg-[#050706]/95 border border-white/10 shadow-2xl flex flex-col gap-3 font-body backdrop-blur-xl"
          >
            <a
              href="/"
              onClick={scrollTo('top')}
              className="text-sm text-white/90 hover:text-white py-2 border-b border-white/5"
            >
              Home
            </a>
            <a
              href="#how-it-works"
              onClick={scrollTo('how-it-works')}
              className="text-sm text-white/90 hover:text-white py-2 border-b border-white/5"
            >
              How It Works
            </a>
            <a
              href="#for-farmers"
              onClick={scrollTo('for-farmers')}
              className="text-sm text-white/90 hover:text-white py-2 border-b border-white/5"
            >
              For Farmers
            </a>
            <a
              href="#for-officers"
              onClick={scrollTo('for-officers')}
              className="text-sm text-white/90 hover:text-white py-2 border-b border-white/5"
            >
              For Officers
            </a>
            <a
              href="#approach"
              onClick={scrollTo('approach')}
              className="text-sm text-white/90 hover:text-white py-2 border-b border-white/5"
            >
              Approach
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="text-left text-sm text-white/90 hover:text-white py-2 border-b border-white/5"
            >
              About KrishRakshak
            </button>
            <a
              href="/login?role=officer"
              className="text-sm text-white/90 hover:text-white py-2 border-b border-white/5"
            >
              Officer Portal
            </a>

            <div className="pt-3">
              <a
                href="/farmer/predict"
                className="w-full flex items-center justify-center gap-2 bg-white text-black font-medium py-3 rounded-xl hover:bg-neutral-200 transition-colors text-sm"
              >
                Check a Crop
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
