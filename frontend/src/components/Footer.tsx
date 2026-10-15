import React from 'react';

interface FooterProps {
  onOpenAbout: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout }) => {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#050706] pt-14 pb-12 px-6 sm:px-10 lg:px-16 text-xs text-white/60 font-body">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand & Purpose */}
        <div className="space-y-2 max-w-sm">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/images/krishirakshak-symbol-128.png"
              alt=""
              width="20"
              height="20"
              className="w-5 h-5 object-contain opacity-80"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-heading italic text-xl text-white tracking-tight">
              KrishRakshak
            </span>
          </div>
          <p className="text-white/50 text-[11px] leading-relaxed">
            AI-assisted crop health assessment and regional epidemiological surveillance platform.
          </p>
        </div>

        {/* Verified Navigation Links */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs">
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How It Works
          </a>
          <a href="/farmer" className="hover:text-white transition-colors">
            Farmer Portal
          </a>
          <a href="/officer" className="hover:text-white transition-colors">
            Officer Dashboard
          </a>
          <button
            type="button"
            onClick={onOpenAbout}
            className="hover:text-white transition-colors"
          >
            About & Scope
          </button>
          <a href="/docs" className="hover:text-white transition-colors">
            API Documentation
          </a>
        </div>
      </div>

      {/* Scope Disclaimer */}
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
        <div>
          Current Model Scope: 14 Supported Crops • 38 Disease Classes • Decision-Support Only
        </div>
        <div>
          KrishRakshak Project • Designed for Indian Agriculture
        </div>
      </div>
    </footer>
  );
};
