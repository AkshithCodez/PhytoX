"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { en, hi, te, type MessageKey } from "@/lib/messages";
import { ArrowRight, Check, Globe2, Sprout } from "lucide-react";
type Language = "en" | "te" | "hi";
const LocaleContext = createContext({
  language: "en" as Language,
  chosen: false,
  ready: false,
  setLanguage: (_v: Language) => {},
  t: (key: MessageKey): string => en[key],
});
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>("en"),
    [chosen, setChosen] = useState(false),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("phytox-language");
    if (saved === "en" || saved === "te" || saved === "hi") {
      setLang(saved);
      setChosen(true);
    }
    setReady(true);
  }, []);
  function setLanguage(value: Language) {
    setLang(value);
    setChosen(true);
    localStorage.setItem("phytox-language", value);
  }
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return (
    <LocaleContext.Provider
      value={{
        language,
        chosen,
        ready,
        setLanguage,
        t: (key: MessageKey) => ({ en, te, hi })[language][key],
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}
export function useLocale() {
  return useContext(LocaleContext);
}
export function LanguagePicker({ onDone }: { onDone?: () => void }) {
  const { language, setLanguage } = useLocale();
  const [selected, setSelected] = useState<Language>(language);
  return (
    <main id="main" className="language-page">
      <a href="/" className="brand">
        <Sprout />
        Phyto<span>X</span>
      </a>
      <div className="language-card">
        <Globe2 size={36} />
        <p className="eyebrow">WELCOME TO PHYTOX</p>
        <h1>Grow in your language.</h1>
        <p>మీ భాషను ఎంచుకోండి · अपनी भाषा चुनें</p>
        <div className="language-options">
          {(
            [
              ["en", "English", "Continue in English"],
              ["te", "తెలుగు", "తెలుగులో కొనసాగించండి"],
              ["hi", "हिन्दी", "हिन्दी में जारी रखें"],
            ] as const
          ).map(([code, title, subtitle]) => (
            <button
              key={code}
              lang={code}
              className={selected === code ? "selected" : ""}
              aria-pressed={selected === code}
              onClick={() => setSelected(code)}
            >
              <span>
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </span>
              {selected === code && <Check size={22} />}
            </button>
          ))}
        </div>
        <button
          className="button full"
          onClick={() => {
            setLanguage(selected);
            onDone?.();
          }}
        >
          {selected === "te"
            ? "కొనసాగించండి"
            : selected === "hi"
              ? "जारी रखें"
              : "Continue"}
          <ArrowRight size={18} />
        </button>
      </div>
      <p className="muted">English · తెలుగు · हिन्दी</p>
    </main>
  );
}
export function LanguageGate({ children }: { children: React.ReactNode }) {
  const { ready, chosen } = useLocale();
  if (!ready) return <p className="loading">Loading…</p>;
  return chosen ? children : <LanguagePicker />;
}
export function LanguageSelect() {
  const { language, setLanguage, t } = useLocale();
  return (
    <label className="language-select">
      <Globe2 size={16} />
      <span className="sr-only">{t("language")}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
      >
        <option value="en">English</option>
        <option value="te">తెలుగు</option>
        <option value="hi">हिन्दी</option>
      </select>
    </label>
  );
}
