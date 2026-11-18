"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  MapPin,
  Plus,
  Send,
  ShieldAlert,
  Sprout,
  Upload,
  X,
} from "lucide-react";
import { PageHeading, Empty, Loading, ErrorState, Notice } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import { SUPPORTED_CROPS } from "@/features/diagnosis/scanner";
import type { PlotRecord, AdvisoryRecord } from "@/services/monitoring";

export function FarmerMonitoring() {
  const plotsQuery = useResource<PlotRecord[]>("/api/monitoring/plots");
  const advisoriesQuery = useResource<AdvisoryRecord[]>("/api/monitoring/advisories");

  const [showAddPlotModal, setShowAddPlotModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedPlotForLog, setSelectedPlotForLog] = useState<PlotRecord | null>(null);

  // New plot form
  const [plotName, setPlotName] = useState("");
  const [plotCrop, setPlotCrop] = useState("Tomato");
  const [plotArea, setPlotArea] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [isSubmittingPlot, setIsSubmittingPlot] = useState(false);
  const [plotError, setPlotError] = useState("");

  // Observation log form
  const [obsNotes, setObsNotes] = useState("");
  const [obsSymptoms, setObsSymptoms] = useState<string[]>([]);
  const [obsFile, setObsFile] = useState<File | null>(null);
  const [obsPreview, setObsPreview] = useState("");
  const [isSubmittingObs, setIsSubmittingObs] = useState(false);
  const [obsError, setObsError] = useState("");

  const commonSymptoms = [
    "Foliar Yellowing (Chlorosis)",
    "Necrotic Spots / Lesions",
    "Leaf Curling / Distortion",
    "Wilting / Water-Soaked Patches",
    "Powdery / Downy Growth",
    "Stem Canker / Discoloration",
  ];

  function toggleSymptom(sym: string) {
    setObsSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  }

  async function handleCreatePlot(e: React.FormEvent) {
    e.preventDefault();
    if (!plotName.trim()) {
      setPlotError("Please enter a name for your plot.");
      return;
    }
    setIsSubmittingPlot(true);
    setPlotError("");

    try {
      await api("/api/monitoring/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: plotName.trim(),
          crop: plotCrop,
          plot_area: plotArea.trim(),
          planting_date: plantingDate || undefined,
        }),
      });

      setShowAddPlotModal(false);
      setPlotName("");
      setPlotArea("");
      setPlantingDate("");
      plotsQuery.reload();
    } catch (err: any) {
      setPlotError(err.message || "Failed to register monitored plot.");
    } finally {
      setIsSubmittingPlot(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setObsFile(f);
      setObsPreview(URL.createObjectURL(f));
    }
  }

  async function handleLogObservation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlotForLog) return;
    if (!obsFile) {
      setObsError("Please take or upload a leaf photograph for this observation.");
      return;
    }

    setIsSubmittingObs(true);
    setObsError("");

    try {
      // 1. Upload photo directly via diagnoses API endpoint to leverage storage bucket
      const uploadBody = new FormData();
      uploadBody.set("file", obsFile);
      uploadBody.set("request_key", crypto.randomUUID());
      uploadBody.set("selected_crop", selectedPlotForLog.crop);

      const diagRes = await api<{ id: string; condition: string; confidence: number; image_path: string }>(
        "/api/diagnoses",
        {
          method: "POST",
          body: uploadBody,
        }
      );

      // 2. Record longitudinal observation linked to plot and assessment
      await api("/api/monitoring/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plot_id: selectedPlotForLog.id,
          image_path: diagRes.image_path || `observations/${Date.now()}.webp`,
          symptoms: obsSymptoms,
          notes: obsNotes,
          ai_assessment: {
            disease: diagRes.condition,
            confidence: diagRes.confidence,
          },
        }),
      });

      setShowLogModal(false);
      setSelectedPlotForLog(null);
      setObsFile(null);
      setObsPreview("");
      setObsNotes("");
      setObsSymptoms([]);
      plotsQuery.reload();
    } catch (err: any) {
      setObsError(err.message || "Failed to submit observation record.");
    } finally {
      setIsSubmittingObs(false);
    }
  }

  return (
    <div className="farmer-monitoring-container pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeading
          eyebrow="Continuous Surveillance"
          title="Crop-Health Monitoring"
          text="Track foliar health progression twice weekly (Monday & Thursday) to catch pathogen emergence early."
        />
        <button
          type="button"
          onClick={() => setShowAddPlotModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#A33715] hover:bg-[#8e2e10] text-white text-[13.5px] font-semibold transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Register New Plot</span>
        </button>
      </div>

      {/* Cadence Notice */}
      <div className="mb-6 p-4 rounded-[10px] bg-[#20292D] border border-[#394045] flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#A33715]/15 border border-[#A33715]/30 flex items-center justify-center text-[#A33715] shrink-0 mt-0.5">
          <Calendar size={18} />
        </div>
        <div>
          <div className="text-[13.5px] font-semibold text-white">Twice-Weekly Field Inspection Cadence</div>
          <p className="text-[12.5px] text-[#B5A295] mt-0.5 leading-relaxed">
            Observations are scheduled for <strong>every Monday and Thursday</strong>. Consistent foliar photo records allow
            our time-series early-warning models and assigned extension officers to detect recurrent blight or foliar
            symptom expansion before irreversible crop damage occurs.
          </p>
        </div>
      </div>

      {/* Officer Advisories Banner */}
      {advisoriesQuery.data && advisoriesQuery.data.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={18} className="text-[#A33715]" />
            <h3 className="text-[15px] font-semibold text-white">Agricultural Officer Field Advisories</h3>
          </div>
          <div className="grid gap-3">
            {advisoriesQuery.data.map((adv) => (
              <div
                key={adv.id}
                className="p-4 rounded-[10px] bg-[#20292D] border-l-4 border-l-[#A33715] border-y border-r border-[#394045]"
              >
                <div className="flex items-center justify-between text-[12px] text-[#B5A295] mb-1.5">
                  <span className="font-semibold text-white">
                    {adv.officer?.display_name || "Regional Agricultural Officer"} · {adv.plot?.name || "Plot Advisory"}
                  </span>
                  <span>{new Date(adv.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-[13.5px] text-white leading-relaxed">{adv.advisory_text}</p>
                {adv.recommendations && adv.recommendations.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {adv.recommendations.map((rec, i) => (
                      <span
                        key={i}
                        className="text-[11.5px] px-2 py-0.5 rounded bg-[#394045]/60 text-[#B5A295] border border-[#565A5C]/40"
                      >
                        ✓ {rec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monitored Plots List */}
      <div>
        <h3 className="text-[16px] font-semibold text-white mb-3">Enrolled Plots ({plotsQuery.data?.length || 0})</h3>

        {plotsQuery.loading ? (
          <Loading />
        ) : plotsQuery.error ? (
          <ErrorState message={plotsQuery.error} retry={plotsQuery.reload} />
        ) : plotsQuery.data?.length === 0 ? (
          <section className="panel">
            <Empty
              title="No plots registered yet"
              text="Add your crop plots to start regular twice-weekly leaf monitoring and receive proactive early warning signals."
            />
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plotsQuery.data?.map((plot) => {
              const cropItem = SUPPORTED_CROPS.find((c) => c.name.toLowerCase() === plot.crop.toLowerCase());
              const isDueSoon = true; // Active schedule
              return (
                <div
                  key={plot.id}
                  className="rounded-[10px] bg-[#20292D] border border-[#394045] p-5 flex flex-col justify-between hover:border-[#565A5C] transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={cropItem?.image || "/images/crops/tomato.webp"}
                          alt={plot.crop}
                          className="w-10 h-10 rounded-[8px] object-cover border border-[#565A5C]"
                        />
                        <div>
                          <h4 className="text-[15px] font-semibold text-white leading-tight">{plot.name}</h4>
                          <span className="text-[12px] text-[#B5A295]">{plot.crop}</span>
                        </div>
                      </div>
                      <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-[#1b2b21] text-[#4ade80] border border-[#2d4d38]">
                        Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-3 py-3 border-y border-[#394045]/60 text-[12px]">
                      <div>
                        <span className="text-[#B5A295] block">Acreage</span>
                        <span className="text-white font-medium">{plot.plot_area || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-[#B5A295] block">Cadence</span>
                        <span className="text-white font-medium">Mon & Thu</span>
                      </div>
                      <div>
                        <span className="text-[#B5A295] block">Next Due</span>
                        <span className="text-[#A33715] font-semibold">
                          {plot.schedule?.next_due_date || "Coming up"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B5A295] block">Planting</span>
                        <span className="text-white font-medium">{plot.planting_date || "—"}</span>
                      </div>
                    </div>

                    {/* Recent Observation Preview */}
                    {plot.recent_observation ? (
                      <div className="p-2.5 rounded-[8px] bg-[#0A0F12]/60 border border-[#394045]/60 mb-3 flex items-center gap-3">
                        {plot.recent_observation.image_url ? (
                          <img
                            src={plot.recent_observation.image_url}
                            alt="Last leaf observation"
                            className="w-12 h-12 rounded-[6px] object-cover shrink-0 border border-[#394045]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-[6px] bg-[#20292D] flex items-center justify-center text-[#B5A295] shrink-0">
                            <Activity size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[10.5px] text-[#B5A295] flex items-center gap-1">
                            <Clock size={11} />
                            <span>{new Date(plot.recent_observation.observation_date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-[12.5px] font-semibold text-white truncate">
                            {plot.recent_observation.ai_assessment?.disease || "Routine foliar check"}
                          </div>
                          {plot.recent_observation.symptoms?.length > 0 && (
                            <div className="text-[11px] text-[#B5A295] truncate">
                              {plot.recent_observation.symptoms.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-[8px] bg-[#0A0F12]/30 border border-dashed border-[#394045]/60 mb-3 text-center text-[12px] text-[#B5A295]">
                        No observations recorded yet.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlotForLog(plot);
                      setShowLogModal(true);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-[6px] bg-[#394045] hover:bg-[#565A5C] text-white text-[12.5px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload size={14} />
                    <span>Log Bi-Weekly Observation</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Register New Plot */}
      {showAddPlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[12px] bg-[#20292D] border border-[#565A5C] p-6 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#394045] mb-4">
              <h3 className="text-[16px] font-semibold">Register Monitored Plot</h3>
              <button
                type="button"
                onClick={() => setShowAddPlotModal(false)}
                className="text-[#B5A295] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {plotError && <Notice tone="error">{plotError}</Notice>}

            <form onSubmit={handleCreatePlot} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#B5A295] mb-1">
                  Plot Identifier / Field Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Acre Tomato Block"
                  value={plotName}
                  onChange={(e) => setPlotName(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[13px] focus:outline-none focus:border-[#A33715]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#B5A295] mb-1">Target Crop *</label>
                <select
                  value={plotCrop}
                  onChange={(e) => setPlotCrop(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[13px] focus:outline-none focus:border-[#A33715]"
                >
                  {SUPPORTED_CROPS.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#B5A295] mb-1">Plot Area / Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 2.0 Acres"
                    value={plotArea}
                    onChange={(e) => setPlotArea(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[13px] focus:outline-none focus:border-[#A33715]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#B5A295] mb-1">Planting Date</label>
                  <input
                    type="date"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[13px] focus:outline-none focus:border-[#A33715]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-[6px] bg-[#0A0F12]/50 border border-[#394045] text-[11.5px] text-[#B5A295]">
                ✓ Default cadence is set to twice-weekly observation (Monday & Thursday).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#394045]">
                <button
                  type="button"
                  onClick={() => setShowAddPlotModal(false)}
                  className="px-3.5 py-2 rounded-[6px] bg-[#394045] text-white text-[13px] hover:bg-[#565A5C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlot}
                  className="px-4 py-2 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPlot ? "Registering..." : "Confirm Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Log Bi-Weekly Observation */}
      {showLogModal && selectedPlotForLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[12px] bg-[#20292D] border border-[#565A5C] p-6 text-white shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#394045] mb-4">
              <div>
                <h3 className="text-[16px] font-semibold">Log Bi-Weekly Observation</h3>
                <p className="text-[12px] text-[#B5A295]">
                  Plot: {selectedPlotForLog.name} ({selectedPlotForLog.crop})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-[#B5A295] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {obsError && <Notice tone="error">{obsError}</Notice>}

            <form onSubmit={handleLogObservation} className="space-y-4">
              {/* Photo Input */}
              <div>
                <label className="block text-[12px] font-semibold text-[#B5A295] mb-1.5">
                  Leaf Photograph (Required) *
                </label>
                {obsPreview ? (
                  <div className="relative rounded-[8px] overflow-hidden border border-[#565A5C] max-h-56 bg-black">
                    <img src={obsPreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setObsFile(null);
                        setObsPreview("");
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-black"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 rounded-[8px] border-2 border-dashed border-[#565A5C] hover:border-[#A33715] bg-[#0A0F12]/50 cursor-pointer p-4 transition-colors">
                    <Upload size={24} className="text-[#B5A295] mb-2" />
                    <span className="text-[13px] font-medium text-white">Click or tap to upload leaf photo</span>
                    <span className="text-[11px] text-[#B5A295] mt-1">JPEG, PNG, or WebP up to 3MB</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Observed Symptoms Checklist */}
              <div>
                <label className="block text-[12px] font-semibold text-[#B5A295] mb-1.5">
                  Visible Symptoms (Select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {commonSymptoms.map((sym) => {
                    const active = obsSymptoms.includes(sym);
                    return (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => toggleSymptom(sym)}
                        className={`text-left text-[11.5px] p-2 rounded-[6px] border transition-colors flex items-center justify-between ${
                          active
                            ? "bg-[#A33715]/20 border-[#A33715] text-white"
                            : "bg-[#0A0F12] border-[#394045] text-[#B5A295] hover:border-[#565A5C]"
                        }`}
                      >
                        <span className="truncate mr-1">{sym}</span>
                        {active && <CheckCircle2 size={13} className="text-[#A33715] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-[12px] font-semibold text-[#B5A295] mb-1">
                  Field Notes / Context
                </label>
                <textarea
                  rows={2}
                  value={obsNotes}
                  onChange={(e) => setObsNotes(e.target.value)}
                  placeholder="e.g. Symptoms noticed primarily on lower leaves after recent rainfall..."
                  className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[13px] focus:outline-none focus:border-[#A33715]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#394045]">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 rounded-[6px] bg-[#394045] text-white text-[13px] hover:bg-[#565A5C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingObs}
                  className="px-4 py-2 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingObs ? "Analyzing & Logging..." : "Submit Observation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
