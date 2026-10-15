import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Menu, X, ArrowUpRight, Activity, ShieldCheck, MapPin, Database, Sparkles } from 'lucide-react';

const primaryCtaGradient = {
  background: 'linear-gradient(to bottom, #2B2B2B, #101010)',
};

export const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [farmerInput, setFarmerInput] = useState('');
  const solutionsRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close solutions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (solutionsRef.current && !solutionsRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDiagnoseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = '/farmer';
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black font-sans antialiased select-none">
      {/* Background full-bleed cinematic video */}
      <video
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260803_192301_9231ed6b-c55c-4a48-909c-4ebe11cf2e11.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Content wrapper sitting directly over video at z-10 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar navigation */}
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          {/* Logo & Brand: KrishiRakshak Botanical Shield */}
          <a href="/" className="flex items-center gap-2 group cursor-pointer">
            <svg
              viewBox="0 0 32 32"
              className="h-6 w-6 text-[#010101] lg:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-label="KrishiRakshak Shield Logo"
            >
              <path
                d="M16 3C16 3 26 6 26 14C26 21.5 16 28 16 28C16 28 6 21.5 6 14C6 6 16 3 16 3Z"
                className="fill-current/15"
              />
              <path d="M16 10V22" />
              <path d="M16 14C18.5 12.5 21 13 21 13" />
              <path d="M16 18C13.5 16.5 11 17 11 17" />
            </svg>
            <span className="text-lg font-semibold tracking-normal text-[#010101] lg:text-white transition-colors">
              krishirakshak
            </span>
          </a>

          {/* Desktop Navigation (hidden md:flex) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Glass pill nav cluster */}
            <div className="relative flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-1.5 backdrop-blur-lg">
              <a
                href="/farmer"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Farmer Portal</span>
              </a>
              <a
                href="/officer"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Officer Dashboard</span>
              </a>

              {/* Solutions Dropdown Menu */}
              <div ref={solutionsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSolutionsOpen(!solutionsOpen)}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <span>Solutions</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      solutionsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Popover */}
                {solutionsOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-black/90 p-2 backdrop-blur-xl border border-white/10 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                    <a
                      href="/farmer"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Crop Diagnosis AI</div>
                        <div className="text-[11px] text-white/60">Instant leaf pathology detector</div>
                      </div>
                    </a>

                    <a
                      href="/officer/map"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">GIS Outbreak Map</div>
                        <div className="text-[11px] text-white/60">Spatial blight cluster heatmap</div>
                      </div>
                    </a>

                    <a
                      href="/docs"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Database className="h-4 w-4 text-blue-400 shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>Backend OpenAPI</span>
                          <ArrowUpRight className="h-3 w-3 text-white/50" />
                        </div>
                        <div className="text-[11px] text-white/60">FastAPI Swagger endpoints</div>
                      </div>
                    </a>

                    <a
                      href="/health"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Activity className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-white flex items-center justify-between">
                          <span>System Health</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        </div>
                        <div className="text-[11px] text-white/60">API status & cluster health</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Backend API Docs link */}
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-4 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>API Docs</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </a>
            </div>

            {/* Separate Launch Portal CTA pill */}
            <a
              href="/login"
              style={primaryCtaGradient}
              className="self-stretch flex items-center justify-center rounded-full px-5 text-sm font-medium text-white hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
            >
              Sign In
            </a>
          </div>

          {/* Mobile hamburger button (md:hidden) */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="relative flex md:hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-lg z-50 text-[#010101] lg:text-white focus:outline-none cursor-pointer"
          >
            <Menu
              className={`absolute h-5 w-5 transition-all duration-300 ${
                menuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <X
              className={`absolute h-5 w-5 transition-all duration-300 ${
                menuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              }`}
            />
          </button>
        </nav>

        {/* Mobile menu glass overlay + drawer */}
        {/* Backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden ${
            menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Slide-in Drawer Panel */}
        <div
          className={`fixed right-0 top-0 z-40 h-full w-72 bg-black/90 backdrop-blur-xl flex flex-col justify-between transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer links with staggered entrance */}
          <div className="flex flex-col gap-2 px-6 pt-24">
            {[
              { label: 'Farmer Portal', href: '/farmer' },
              { label: 'Officer Dashboard', href: '/officer' },
              { label: 'GIS Outbreak Map', href: '/officer/map' },
              { label: 'Backend API Docs', href: '/docs', external: true },
              { label: 'System Health', href: '/health', external: true },
            ].map((link, idx) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noreferrer' : undefined}
                onClick={() => setMenuOpen(false)}
                style={{
                  transitionDelay: menuOpen ? `${(idx + 1) * 60}ms` : '0ms',
                }}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 ${
                  menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'
                }`}
              >
                <span>{link.label}</span>
                {link.external && <ArrowUpRight className="h-4 w-4 opacity-60" />}
              </a>
            ))}
          </div>

          {/* Drawer bottom CTA */}
          <div
            style={{
              transitionDelay: menuOpen ? '300ms' : '0ms',
            }}
            className={`mt-auto px-6 pb-10 transition-all duration-400 ${
              menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <a
              href="/login"
              style={primaryCtaGradient}
              className="block w-full rounded-full py-3.5 text-center text-sm font-medium text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              Sign In to Dashboard
            </a>
          </div>
        </div>

        {/* Main bottom-anchored content */}
        <main className="mt-auto px-5 pb-8 sm:px-8 sm:pb-12 lg:px-12 lg:pb-16">
          <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* Left column: headline + crop diagnosis CTA */}
            <div className="max-w-xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight text-[#010101] lg:text-white transition-colors">
                Diagnose crop diseases in seconds. Protect the harvest.
              </h1>

              {/* Email / Farmer ID CTA Capsule */}
              <div className="mt-6 sm:mt-8">
                <form
                  onSubmit={handleDiagnoseSubmit}
                  className="flex flex-col gap-3 sm:inline-flex sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5 sm:gap-0 shadow-lg"
                >
                  <input
                    type="text"
                    value={farmerInput}
                    onChange={(e) => setFarmerInput(e.target.value)}
                    placeholder="Enter phone number or field ID"
                    className="w-full rounded-full bg-white px-5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none sm:w-72 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2"
                  />
                  <button
                    type="submit"
                    style={primaryCtaGradient}
                    className="w-full sm:w-auto rounded-full px-6 py-3 sm:py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Check a Crop</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </form>

                {/* Quick portal shortcut links */}
                <div className="mt-3 flex items-center gap-4 text-xs font-medium text-[#010101]/70 lg:text-white/70">
                  <a href="/farmer" className="hover:underline flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Free Farmer Scan</span>
                  </a>
                  <span>&bull;</span>
                  <a href="/officer" className="hover:underline flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-amber-500" />
                    <span>Officer Surveillance</span>
                  </a>
                  <span>&bull;</span>
                  <a href="/docs" target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                    <Database className="h-3.5 w-3.5 text-blue-400" />
                    <span>API Swagger</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right column: two glass cards */}
            <div className="flex flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5">
              {/* Stats card */}
              <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-5 sm:p-6 sm:w-64 flex flex-col justify-between border border-white/5">
                <div>
                  <div
                    style={{ fontFamily: "'Silkscreen', cursive" }}
                    className="text-3xl sm:text-4xl font-normal tracking-tight text-[#010101] lg:text-white transition-colors"
                  >
                    42,500+
                  </div>
                  <p className="text-sm leading-relaxed mt-3 sm:mt-4 text-[#010101]/70 lg:text-white/70 transition-colors">
                    Crop scans diagnosed across 18 agricultural zones with 98.4% diagnostic confidence.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#010101]/60 lg:text-white/60">
                  <span>Outbreak Alert SLA</span>
                  <span className="font-semibold text-[#010101] lg:text-white">&lt; 48 Hours</span>
                </div>
              </div>

              {/* Testimonial / Agronomist Card */}
              <div className="rounded-2xl bg-white/10 backdrop-blur-lg p-5 sm:p-6 sm:w-64 flex flex-col justify-between border border-white/5">
                <div>
                  {/* Header row: black badge with K + Krishi Vigyan Kendra */}
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="h-6 w-6 rounded bg-[#010101] flex items-center justify-center text-white text-xs font-bold leading-none select-none">
                      K
                    </div>
                    <span className="text-sm font-semibold text-[#010101] lg:text-white transition-colors">
                      Krishi Vigyan Kendra
                    </span>
                  </div>

                  {/* Quote */}
                  <p className="text-sm leading-relaxed text-[#010101]/80 lg:text-white/80 transition-colors">
                    &ldquo;With KrishiRakshak, our field officers detected early tomato blight across 12 villages and halted the outbreak within 48 hours.&rdquo;
                  </p>
                </div>

                {/* Footer: avatar + Dr. Rajesh Sharma */}
                <div className="flex items-center gap-3 mt-4 sm:mt-5">
                  <img
                    src="https://i.pravatar.cc/72?img=68"
                    alt="Dr. Rajesh Sharma"
                    className="h-9 w-9 rounded-full object-cover bg-white/20"
                    loading="lazy"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#010101] lg:text-white transition-colors">
                      Dr. Rajesh Sharma
                    </div>
                    <div className="text-xs text-[#010101]/60 lg:text-white/60 transition-colors">
                      Senior Agricultural Officer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default App;
