"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Check, X, Share2, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already running as installed standalone PWA
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isAppleMobile);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      alert("To install PhytoX: Tap your browser's menu (⋮ or ⋯) and select 'Install app' or 'Add to Home screen'.");
    }
  }

  // Do not render banner if already standalone, installed, or user dismissed
  if (isStandalone || installed || dismissed) return null;

  return (
    <>
      <div className="pwa-install-banner mb-5 p-3.5 sm:p-4 rounded-[10px] bg-gradient-to-r from-[#20292D] to-[#1a221b] border border-[#a33715]/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#A33715]/20 border border-[#A33715]/40 flex items-center justify-center text-[#A33715] shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="font-semibold text-[13.5px] text-white flex items-center gap-2">
              <span>Install PhytoX Mobile App</span>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[#B5A295]">PWA</span>
            </div>
            <div className="text-[12px] text-[#B5A295] mt-0.5">
              Add to your home screen for faster leaf scanning, offline guidance, and observation schedules.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-[5px] text-[#B5A295] hover:text-white transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white text-[12.5px] font-medium transition-all shadow-md cursor-pointer"
          >
            <Download size={14} />
            <span>Install App</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[12px] bg-[#20292D] border border-white/20 p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-[16px] font-medium text-white flex items-center gap-2">
                <Smartphone size={18} className="text-[#A33715]" />
                <span>Install on iOS Safari</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-[#B5A295] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <ol className="flex flex-col gap-3.5 text-[13px] text-[#dce2da] pl-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong>Share</strong> button <Share2 size={14} className="inline mx-1 text-sky-400" /> at the bottom of your Safari screen.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down the share sheet and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} className="inline mx-1 text-white" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top-right corner to launch PhytoX full-screen from your home screen.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full py-2.5 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white font-medium text-[13px] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
