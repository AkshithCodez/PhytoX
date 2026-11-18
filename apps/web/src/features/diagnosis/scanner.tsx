"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Camera, Check, HelpCircle, ImagePlus, ScanLine, Search, Upload, X } from "lucide-react";
import { useLocale } from "@/components/locale";
import { Notice, PageHeading } from "@/components/ui";
import { Botanical } from "@/components/botanical";
import { api, useResource } from "@/lib/client";
import type { Diagnosis } from "@/lib/contracts";

export interface SupportedCrop {
  id: string;
  name: string;
  aliases: string[];
  image: string;
  te: string;
  hi: string;
}

export const SUPPORTED_CROPS: SupportedCrop[] = [
  { id: "Tomato", name: "Tomato", aliases: ["tamata", "tamatar"], image: "/images/crops/tomato.webp", te: "టమోటా", hi: "टमाटर" },
  { id: "Potato", name: "Potato", aliases: ["aloo", "bangaladumpa"], image: "/images/crops/potato.webp", te: "బంగాళాదుంప", hi: "आलू" },
  { id: "Corn (maize)", name: "Corn (Maize)", aliases: ["corn", "maize", "makka", "mokkajonna"], image: "/images/crops/corn.webp", te: "మొక్కజొన్న", hi: "मक्का" },
  { id: "Pepper, bell", name: "Bell Pepper", aliases: ["capsicum", "pepper", "mirapa", "shimla mirch"], image: "/images/crops/bell-pepper.webp", te: "బెల్ పెప్పర్", hi: "शिमला मिर्च" },
  { id: "Grape", name: "Grape", aliases: ["grapes", "draksha", "angoor"], image: "/images/crops/grape.webp", te: "ద్రాక్ష", hi: "अंगूर" },
  { id: "Apple", name: "Apple", aliases: ["seb"], image: "/images/crops/apple.webp", te: "ఆపిల్", hi: "सेब" },
  { id: "Orange", name: "Orange", aliases: ["citrus", "narinja", "santara"], image: "/images/crops/orange.webp", te: "నారింజ", hi: "संतरा" },
  { id: "Strawberry", name: "Strawberry", aliases: ["strawberries"], image: "/images/crops/strawberry.webp", te: "స్ట్రాబెర్రీ", hi: "स्ट्रॉबेरी" },
  { id: "Peach", name: "Peach", aliases: ["aadu"], image: "/images/crops/peach.webp", te: "పీచ్", hi: "आड़ू" },
  { id: "Cherry (including sour)", name: "Cherry", aliases: ["cherries"], image: "/images/crops/cherry.webp", te: "చెర్రీ", hi: "चेरी" },
  { id: "Blueberry", name: "Blueberry", aliases: ["blueberries"], image: "/images/crops/blueberry.webp", te: "బ్లూబెర్రీ", hi: "नीलबदरी" },
  { id: "Squash", name: "Squash", aliases: ["gummadi", "kaddu"], image: "/images/crops/squash.webp", te: "స్క్వాష్", hi: "चप्पन कद्दू" },
  { id: "Soybean", name: "Soybean", aliases: ["soya", "soy"], image: "/images/crops/soybean.webp", te: "సోయాబీన్", hi: "सोयाबीन" },
  { id: "Raspberry", name: "Raspberry", aliases: ["rasbhari"], image: "/images/crops/raspberry.webp", te: "రాస్ప్బెర్రీ", hi: "रसभरी" },
];

export function Scanner() {
  const { t, language } = useLocale(),
    router = useRouter(),
    reduced = useReducedMotion();
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [selectedCrop, setSelectedCrop] = useState<string>("Tomato"),
    [cropSearch, setCropSearch] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [analysisStepText, setAnalysisStepText] = useState("Validating leaf resolution and orientation...");
  const upload = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const readiness = useResource<{
    database: boolean;
    model: boolean;
    configured?: boolean;
    status?: string;
    reason?: string;
  }>("/api/status");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const filteredCrops = useMemo(() => {
    const q = cropSearch.toLowerCase().trim();
    if (!q) return SUPPORTED_CROPS;
    return SUPPORTED_CROPS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.te.toLowerCase().includes(q) ||
        c.hi.toLowerCase().includes(q) ||
        c.aliases.some((a) => a.includes(q)),
    );
  }, [cropSearch]);

  const currentCropObj = SUPPORTED_CROPS.find((c) => c.id === selectedCrop);
  const selectedCropDisplay = currentCropObj
    ? language === "te"
      ? currentCropObj.te
      : language === "hi"
        ? currentCropObj.hi
        : currentCropObj.name
    : selectedCrop === "not_sure"
      ? t("notSureCrop")
      : selectedCrop;

  function choose(chosen: File | undefined) {
    setError("");
    if (!chosen) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(chosen.type) ||
      chosen.size > 3 * 1024 * 1024 ||
      !chosen.size
    ) {
      setError(t("photoError"));
      return;
    }
    setFile(chosen);
  }

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError("");
    setAnalysisStepText("Validating leaf resolution and orientation...");

    const stepTimers = [
      setTimeout(() => setAnalysisStepText(`Scanning ${selectedCropDisplay} foliar tissue for pathological lesions...`), 700),
      setTimeout(() => setAnalysisStepText("Evaluating 38 disease classes against crop priors..."), 1800),
      setTimeout(() => setAnalysisStepText("Finalizing diagnostic assessment and treatment guidance..."), 3200),
    ];

    const body = new FormData();
    body.set("file", file);
    body.set("request_key", crypto.randomUUID());
    if (selectedCrop && selectedCrop !== "not_sure") {
      body.set("selected_crop", selectedCrop);
    }
    try {
      const result = await api<Diagnosis>("/api/diagnoses", {
        method: "POST",
        body,
      });
      stepTimers.forEach(clearTimeout);
      router.push(`/farmer/diagnosis/${result.id}`);
    } catch {
      stepTimers.forEach(clearTimeout);
      setError(t("serviceError"));
      setBusy(false);
      readiness.reload();
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={t("diagnosis")}
        title={t("welcome")}
        text={t("scanIntro")}
      />
      <div className="scan-layout">
        <section className="panel">
          <div className="panel-title">
            <h2>{t("newScan")}</h2>
            <ScanLine size={22} />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          {readiness.data && !readiness.data.model && (
            <Notice tone={readiness.data.configured ? "info" : "warning"}>
              <strong>
                {readiness.data.status === "unconfigured"
                  ? t("unavailable")
                  : "Crop analysis service is connecting"}
              </strong>
              <p>
                {readiness.data.status === "unconfigured"
                  ? t("modelNote")
                  : "The AI inference engine is spinning up from idle. You can select your crop and prepare your leaf image below."}
              </p>
              {readiness.data.configured && (
                <button
                  type="button"
                  className="button secondary"
                  style={{ marginTop: 10, fontSize: 12, padding: "5px 12px" }}
                  onClick={() => readiness.reload()}
                >
                  Check status again
                </button>
              )}
            </Notice>
          )}
          {busy ? (
            <div className="progress-panel" role="status" aria-live="polite">
              <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[10px] border border-[#565A5C] bg-black shadow-2xl mb-4 aspect-[4/3]">
                {preview ? (
                  <img
                    src={preview}
                    alt="Uploaded crop leaf under analysis"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#20292D] text-[#B5A295]">
                    Leaf Image
                  </div>
                )}
                {/* Active Scanning Beam */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#A33715] to-transparent shadow-[0_0_12px_#A33715]"
                  animate={reduced ? {} : { top: ["0%", "100%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[11px] font-mono text-white flex items-center gap-1.5 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#A33715] animate-pulse" />
                  <span>ANALYZING FOLIAR SYMPTOMS</span>
                </div>
              </div>
              <h3 className="text-[17px] font-semibold text-white mb-1">{t("analyzing")}</h3>
              <p className="text-[13px] text-[#B5A295]">{analysisStepText || t("processing")}</p>
            </div>
          ) : (
            <>
              {/* Step 1: Crop Selection */}
              <div className="crop-step-header">
                <h3>1. {t("selectCrop")}</h3>
                <p>{t("cropHelp")}</p>
              </div>

              {selectedCrop && (
                <div className="crop-selected-pill">
                  <Check size={14} color="#A33715" />
                  <span>
                    {t("selectedCropLabel")}:{" "}
                    <strong>{selectedCropDisplay}</strong>
                  </span>
                </div>
              )}

              <div className="crop-search-wrap">
                <input
                  type="text"
                  className="crop-search-input"
                  placeholder={t("searchCrop")}
                  value={cropSearch}
                  onChange={(e) => setCropSearch(e.target.value)}
                  aria-label={t("searchCrop")}
                />
              </div>

              <div className="crop-grid" role="radiogroup" aria-label={t("selectCrop")}>
                <button
                  type="button"
                  className={`crop-card ${selectedCrop === "not_sure" ? "active" : ""}`}
                  onClick={() => setSelectedCrop("not_sure")}
                  role="radio"
                  aria-checked={selectedCrop === "not_sure"}
                >
                  <div className="crop-card-img-placeholder flex items-center justify-center w-7 h-7 rounded-[6px] bg-[#394045] text-[#B5A295]">
                    <Search size={15} />
                  </div>
                  <span className="crop-card-title">{t("notSureCrop")}</span>
                  <span className="crop-card-sub">All 14 crops</span>
                </button>
                {filteredCrops.map((crop) => {
                  const isSelected = selectedCrop === crop.id;
                  const localizedTitle =
                    language === "te"
                      ? crop.te
                      : language === "hi"
                        ? crop.hi
                        : crop.name;
                  return (
                    <button
                      key={crop.id}
                      type="button"
                      className={`crop-card ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedCrop(crop.id)}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <img
                        src={crop.image}
                        alt={crop.name}
                        className="crop-card-img w-7 h-7 rounded-[6px] object-cover border border-[#565A5C]/60"
                        loading="lazy"
                      />
                      <span className="crop-card-title">{localizedTitle}</span>
                      {language !== "en" && (
                        <span className="crop-card-sub">{crop.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Step 2: Upload or Camera */}
              <div className="crop-step-header" style={{ marginTop: 16 }}>
                <h3>2. {t("upload")}</h3>
                <p>{t("imageHelp")}</p>
              </div>

              <input
                ref={upload}
                className="sr-only"
                tabIndex={-1}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={t("upload")}
                onChange={(e) => {
                  choose(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <input
                ref={camera}
                className="sr-only"
                tabIndex={-1}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label={t("camera")}
                onChange={(e) => {
                  choose(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {preview ? (
                <div className="image-preview">
                  <img src={preview} alt={t("newScan")} />
                  <button
                    className="icon-button"
                    aria-label={t("remove")}
                    onClick={() => setFile(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div
                  className="upload-zone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    choose(e.dataTransfer.files[0]);
                  }}
                >
                  <span className="upload-symbol">
                    <ImagePlus size={32} />
                  </span>
                  <h3>{t("upload")}</h3>
                  <p>{t("imageHelp")}</p>
                  <div className="upload-buttons">
                    <button
                      className="button"
                      type="button"
                      onClick={() => upload.current?.click()}
                    >
                      <Upload size={17} />
                      {t("upload")}
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => camera.current?.click()}
                    >
                      <Camera size={17} />
                      {t("camera")}
                    </button>
                  </div>
                </div>
              )}
              {preview && (
                <button
                  className="text-button"
                  type="button"
                  onClick={() => upload.current?.click()}
                >
                  {t("replace")}
                </button>
              )}
              <div className="scan-submit">
                <p>{t("aiNote")}</p>
                <button
                  className="button"
                  type="button"
                  disabled={!file}
                  onClick={analyze}
                >
                  <ScanLine size={18} />
                  {t("analyze")}
                </button>
              </div>
            </>
          )}
        </section>
        <aside className="panel tips-panel">
          <div className="tip-photo-wrap relative rounded-[10px] overflow-hidden border border-white/10 shadow-lg">
            <picture>
              <source srcSet="/images/guidance-leaf-sample.webp" type="image/webp" />
              <img
                src="/images/guidance-leaf-sample.jpg"
                alt="Field diagnostics macro photograph of a tomato leaf showing symptomatic disease lesions in natural light"
                className="w-full aspect-[16/9] object-cover"
                loading="lazy"
                width={480}
                height={270}
              />
            </picture>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-[4px] bg-[#0A0F12]/80 backdrop-blur-sm text-[9.5px] font-mono tracking-wider uppercase text-[#B5A295] border border-white/10">
              FIELD REFERENCE SAMPLE
            </div>
          </div>
          <h2 style={{ fontSize: 20, marginTop: 22, fontWeight: 600 }}>{t("photoTips")}</h2>
          <ol className="tips">
            {(["tip1", "tip2", "tip3"] as const).map((key, i) => (
              <li key={key}>
                <span>{i + 1}</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>
          <Notice tone="info">{t("review")}</Notice>
        </aside>
      </div>
    </>
  );
}