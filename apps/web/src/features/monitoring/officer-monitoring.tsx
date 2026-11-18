"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Filter,
  Flame,
  Layers,
  MapPin,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  Sprout,
  User,
  X,
} from "lucide-react";
import { PageHeading, Empty, Loading, ErrorState, Notice } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import type { MonitoringSignalRecord } from "@/services/monitoring";

export function OfficerMonitoring() {
  const signalsQuery = useResource<MonitoringSignalRecord[]>("/api/officer/monitoring");

  const [selectedSignal, setSelectedSignal] = useState<MonitoringSignalRecord | null>(null);
  const [showAdvisoryModal, setShowAdvisoryModal] = useState(false);
  const [advisoryText, setAdvisoryText] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [customRec, setCustomRec] = useState("");
  const [isSubmittingAdvisory, setIsSubmittingAdvisory] = useState(false);
  const [advisoryError, setAdvisoryError] = useState("");

  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const standardRecs = [
    "Apply protective copper-based foliar spray within 48 hours",
    "Suspend overhead sprinkler irrigation to minimize canopy moisture",
    "Prune and safely destroy lower infected leaves",
    "Inspect neighboring buffer rows for early lesion stippling",
    "Rotate mode-of-action fungicide group to mitigate resistance",
  ];

  function toggleRec(rec: string) {
    setRecommendations((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  }

  function addCustomRec() {
    if (customRec.trim() && !recommendations.includes(customRec.trim())) {
      setRecommendations((prev) => [...prev, customRec.trim()]);
      setCustomRec("");
    }
  }

  async function handleSendAdvisory(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSignal) return;
    if (!advisoryText.trim()) {
      setAdvisoryError("Please provide clear guidance instructions for the farmer.");
      return;
    }

    setIsSubmittingAdvisory(true);
    setAdvisoryError("");

    try {
      await api("/api/officer/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signal_id: selectedSignal.id,
          plot_id: selectedSignal.plot_id,
          farmer_id: selectedSignal.monitored_plots?.owner_id,
          advisory_text: advisoryText.trim(),
          recommendations,
        }),
      });

      setShowAdvisoryModal(false);
      setSelectedSignal(null);
      setAdvisoryText("");
      setRecommendations([]);
      signalsQuery.reload();
    } catch (err: any) {
      setAdvisoryError(err.message || "Failed to dispatch field advisory.");
    } finally {
      setIsSubmittingAdvisory(false);
    }
  }

  const filteredSignals = useMemo(() => {
    if (!signalsQuery.data) return [];
    return signalsQuery.data.filter((s) => {
      if (filterSeverity !== "all" && s.severity !== filterSeverity) return false;
      if (filterType !== "all" && s.signal_type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const cond = s.suspected_condition.toLowerCase();
        const plotName = s.monitored_plots?.name.toLowerCase() || "";
        const farmerName = s.monitored_plots?.user_profiles?.display_name.toLowerCase() || "";
        const village = s.monitored_plots?.user_profiles?.village?.toLowerCase() || "";
        if (!cond.includes(q) && !plotName.includes(q) && !farmerName.includes(q) && !village.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [signalsQuery.data, filterSeverity, filterType, searchQuery]);

  const metrics = useMemo(() => {
    const list = signalsQuery.data || [];
    const openCount = list.filter((s) => s.status === "open").length;
    const highCount = list.filter((s) => s.severity === "high" && s.status === "open").length;
    const clusterCount = list.filter((s) => s.signal_type === "regional_cluster").length;
    const resolvedCount = list.filter((s) => s.status === "advisory_issued").length;
    return { openCount, highCount, clusterCount, resolvedCount };
  }, [signalsQuery.data]);

  return (
    <div className="officer-monitoring-container pb-12">
      <div className="mb-6">
        <PageHeading
          eyebrow="Agricultural Officer"
          title="Crop-Health Surveillance & Early Warning"
          text="Monitor bi-weekly foliar reports, detect recurrent pathogen clusters, and deploy targeted advisories to farmers."
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-[10px] bg-[#20292D] border border-[#394045]">
          <div className="text-[12px] text-[#B5A295] flex items-center justify-between">
            <span>Active Signals</span>
            <AlertTriangle size={15} className="text-[#A33715]" />
          </div>
          <div className="text-[26px] font-bold text-white mt-1">{metrics.openCount}</div>
          <div className="text-[11px] text-[#A33715] mt-0.5">{metrics.highCount} high priority</div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#20292D] border border-[#394045]">
          <div className="text-[12px] text-[#B5A295] flex items-center justify-between">
            <span>Regional Clusters</span>
            <Flame size={15} className="text-amber-400" />
          </div>
          <div className="text-[26px] font-bold text-white mt-1">{metrics.clusterCount}</div>
          <div className="text-[11px] text-[#B5A295] mt-0.5">Multi-plot concentrations</div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#20292D] border border-[#394045]">
          <div className="text-[12px] text-[#B5A295] flex items-center justify-between">
            <span>Advisories Issued</span>
            <CheckCircle size={15} className="text-[#4ade80]" />
          </div>
          <div className="text-[26px] font-bold text-white mt-1">{metrics.resolvedCount}</div>
          <div className="text-[11px] text-[#B5A295] mt-0.5">Guidance dispatched</div>
        </div>

        <div className="p-4 rounded-[10px] bg-[#20292D] border border-[#394045]">
          <div className="text-[12px] text-[#B5A295] flex items-center justify-between">
            <span>Detection Cadence</span>
            <Activity size={15} className="text-[#B5A295]" />
          </div>
          <div className="text-[26px] font-bold text-white mt-1">2x / wk</div>
          <div className="text-[11px] text-[#B5A295] mt-0.5">Mon & Thu schedules</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-[10px] bg-[#20292D] border border-[#394045] mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-2.5 text-[#B5A295]" />
          <input
            type="text"
            placeholder="Search by pathogen, plot, farmer, or village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[12.5px] focus:outline-none focus:border-[#A33715]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-2.5 py-1.5 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[12px] focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[12px] focus:outline-none"
          >
            <option value="all">All Signal Types</option>
            <option value="recurrent_disease">Recurrent Disease</option>
            <option value="regional_cluster">Regional Cluster</option>
            <option value="symptom_progression">Symptom Progression</option>
          </select>
        </div>
      </div>

      {/* Signals Queue */}
      {signalsQuery.loading ? (
        <Loading />
      ) : signalsQuery.error ? (
        <ErrorState message={signalsQuery.error} retry={signalsQuery.reload} />
      ) : filteredSignals.length === 0 ? (
        <section className="panel">
          <Empty
            title="No signals in this view"
            text="No active pathogen signals or cluster warnings match your filter criteria in your assigned regions."
          />
        </section>
      ) : (
        <div className="grid gap-3.5">
          {filteredSignals.map((signal) => {
            const isHigh = signal.severity === "high";
            const isCluster = signal.signal_type === "regional_cluster";
            const farmerProfile = signal.monitored_plots?.user_profiles;

            return (
              <div
                key={signal.id}
                className={`p-5 rounded-[10px] bg-[#20292D] border transition-all ${
                  signal.status === "open"
                    ? isHigh
                      ? "border-l-4 border-l-[#A33715] border-y border-r border-[#394045]"
                      : "border-l-4 border-l-amber-500 border-y border-r border-[#394045]"
                    : "border-[#394045] opacity-75"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        isHigh
                          ? "bg-[#A33715]/20 text-[#e06d48] border border-[#A33715]/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {signal.severity} Priority
                    </span>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#394045] text-[#B5A295]">
                      {signal.signal_type.replace("_", " ").toUpperCase()}
                    </span>

                    <span className="text-[12px] text-[#B5A295]">
                      {signal.regions?.name || "Jurisdiction Sector"}
                    </span>
                  </div>

                  <div className="text-[11.5px] text-[#B5A295]">
                    Logged: {new Date(signal.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="my-2.5">
                  <h4 className="text-[16px] font-semibold text-white flex items-center gap-2">
                    <span>{signal.suspected_condition}</span>
                    <span className="text-[13px] font-normal text-[#B5A295]">
                      on {signal.monitored_plots?.name} ({signal.monitored_plots?.crop})
                    </span>
                  </h4>
                  <p className="text-[13px] text-[#B5A295] mt-1 leading-relaxed">{signal.notes}</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#394045]/60 text-[12px]">
                  <div className="flex items-center gap-4 text-[#B5A295]">
                    <span className="flex items-center gap-1">
                      <User size={13} />
                      <strong className="text-white">{farmerProfile?.display_name || "Enrolled Farmer"}</strong>
                    </span>
                    {farmerProfile?.village && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        <span>Village: {farmerProfile.village}</span>
                      </span>
                    )}
                    {farmerProfile?.phone && (
                      <span>Tel: {farmerProfile.phone}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {signal.status === "advisory_issued" ? (
                      <span className="text-[12px] text-[#4ade80] font-medium flex items-center gap-1">
                        <CheckCircle size={14} /> Advisory Dispatched
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSignal(signal);
                          setAdvisoryText(
                            `Based on bi-weekly surveillance detecting ${signal.suspected_condition} in your plot '${signal.monitored_plots?.name}', please apply immediate foliar containment.`
                          );
                          setShowAdvisoryModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white text-[12.5px] font-semibold transition-all shadow cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare size={13} />
                        <span>Issue Targeted Advisory</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory Modal */}
      {showAdvisoryModal && selectedSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[12px] bg-[#20292D] border border-[#565A5C] p-6 text-white shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#394045] mb-4">
              <div>
                <h3 className="text-[16px] font-semibold">Issue Field Advisory</h3>
                <p className="text-[12px] text-[#B5A295]">
                  To: {selectedSignal.monitored_plots?.user_profiles?.display_name} · Plot:{" "}
                  {selectedSignal.monitored_plots?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvisoryModal(false)}
                className="text-[#B5A295] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {advisoryError && <Notice tone="error">{advisoryError}</Notice>}

            <form onSubmit={handleSendAdvisory} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#B5A295] mb-1">
                  Advisory Directive *
                </label>
                <textarea
                  rows={4}
                  required
                  value={advisoryText}
                  onChange={(e) => setAdvisoryText(e.target.value)}
                  className="w-full px-3 py-2 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[13px] focus:outline-none focus:border-[#A33715]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#B5A295] mb-1.5">
                  Actionable Recommendations
                </label>
                <div className="space-y-1.5">
                  {standardRecs.map((rec) => {
                    const active = recommendations.includes(rec);
                    return (
                      <button
                        key={rec}
                        type="button"
                        onClick={() => toggleRec(rec)}
                        className={`w-full text-left text-[11.5px] p-2 rounded-[6px] border transition-colors flex items-center justify-between ${
                          active
                            ? "bg-[#A33715]/20 border-[#A33715] text-white"
                            : "bg-[#0A0F12] border-[#394045] text-[#B5A295] hover:border-[#565A5C]"
                        }`}
                      >
                        <span className="truncate mr-2">{rec}</span>
                        {active && <CheckCircle size={13} className="text-[#A33715] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add custom recommendation..."
                  value={customRec}
                  onChange={(e) => setCustomRec(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-[6px] bg-[#0A0F12] border border-[#394045] text-white text-[12px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomRec}
                  className="px-3 py-1.5 rounded-[6px] bg-[#394045] text-white text-[12px] hover:bg-[#565A5C] cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#394045]">
                <button
                  type="button"
                  onClick={() => setShowAdvisoryModal(false)}
                  className="px-3.5 py-2 rounded-[6px] bg-[#394045] text-white text-[13px] hover:bg-[#565A5C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdvisory}
                  className="px-4 py-2 rounded-[6px] bg-[#A33715] hover:bg-[#8e2e10] text-white text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>{isSubmittingAdvisory ? "Dispatching..." : "Dispatch Advisory"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
