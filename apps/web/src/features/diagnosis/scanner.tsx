"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Camera, ImagePlus, ScanLine, Upload, X } from "lucide-react";
import { useLocale } from "@/components/locale";
import { Notice, PageHeading } from "@/components/ui";
import { Botanical } from "@/components/botanical";
import { api, useResource } from "@/lib/client";
import type { Diagnosis } from "@/lib/contracts";
export function Scanner() {
  const { t } = useLocale(),
    router = useRouter(),
    reduced = useReducedMotion();
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const upload = useRef<HTMLInputElement>(null),
    camera = useRef<HTMLInputElement>(null);
  const readiness = useResource<{ database: boolean; model: boolean }>(
    "/api/status",
  );
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
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
    const body = new FormData();
    body.set("file", file);
    body.set("request_key", crypto.randomUUID());
    try {
      const result = await api<Diagnosis>("/api/diagnoses", {
        method: "POST",
        body,
      });
      router.push(`/farmer/diagnosis/${result.id}`);
    } catch {
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
            <Notice tone="warning">
              <strong>{t("unavailable")}</strong>
              <p>{t("modelNote")}</p>
            </Notice>
          )}
          {busy ? (
            <div className="progress-panel" role="status" aria-live="polite">
              <motion.div
                className="botanical-wrap"
                animate={reduced ? {} : { opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                <Botanical />
              </motion.div>
              <h3>{t("analyzing")}</h3>
              <p>{t("processing")}</p>
            </div>
          ) : (
            <>
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
                      onClick={() => upload.current?.click()}
                    >
                      <Upload size={17} />
                      {t("upload")}
                    </button>
                    <button
                      className="button secondary"
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
                  onClick={() => upload.current?.click()}
                >
                  {t("replace")}
                </button>
              )}
              <div className="scan-submit">
                <p>{t("aiNote")}</p>
                <button
                  className="button"
                  disabled={!file || !readiness.data?.model}
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
          <div className="tip-visual">
            <Botanical />
          </div>
          <h2 style={{ fontSize: 21, marginTop: 24 }}>{t("photoTips")}</h2>
          <ol className="tips">
            {(["tip1", "tip2", "tip3"] as const).map((key, i) => (
              <li key={key}>
                <span>{i + 1}</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ol>
          <Notice>{t("review")}</Notice>
        </aside>
      </div>
    </>
  );
}
