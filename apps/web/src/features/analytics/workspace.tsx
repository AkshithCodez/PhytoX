"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageHeading,
} from "@/components/ui";
import { useResource } from "@/lib/client";
import type { Report, Region } from "@/lib/contracts";
import { signals } from "@/lib/analytics";
import { Monitoring } from "@/features/monitoring/monitoring";
const Charts = dynamic(() => import("./charts"), {
  ssr: false,
  loading: () => <Loading />,
});
const ReportMap = dynamic(() => import("@/features/geography/report-map"), {
  ssr: false,
  loading: () => <Loading />,
});
type View = "overview" | "reports" | "map" | "monitoring" | "analytics";
const headings = {
  overview: [
    "Your region, at a glance.",
    "Turn field observations into informed decisions. All indicators use submitted records within your assigned regions.",
  ],
  reports: [
    "Every observation deserves a closer look.",
    "Inspect photographs, review model assessments, and record your professional decision.",
  ],
  map: [
    "See the patterns in place.",
    "Explore authorized observations. Shared coordinates and approximate region centers are labeled separately.",
  ],
  monitoring: [
    "Early signals. Thoughtful investigation.",
    "Review concentrations of reports using transparent evidence thresholds.",
  ],
  analytics: [
    "From observations to understanding.",
    "Compare reporting patterns across crops, diseases, regions, and review status.",
  ],
} as const;
export function OfficerWorkspace({ view }: { view: View }) {
  const monitoring = view === "monitoring";
  const [from, setFrom] = useState(
      new Date(Date.now() - (monitoring ? 14 : 30) * 86400000)
        .toISOString()
        .slice(0, 10),
    ),
    [to, setTo] = useState(new Date().toISOString().slice(0, 10)),
    [region, setRegion] = useState(""),
    [status, setStatus] = useState(""),
    [disease, setDisease] = useState("");
  const params = new URLSearchParams({ from, to });
  if (region) params.set("region", region);
  if (status && !monitoring) params.set("status", status);
  if (disease && !monitoring) params.set("disease", disease);
  const query = useResource<Report[]>(`/api/reports?${params}`),
    regions = useResource<Region[]>("/api/regions");
  const reports = query.data ?? [];
  const title = headings[view];
  const [exportError, setExportError] = useState("");
  async function download() {
    setExportError("");
    try {
      const response = await fetch(`/api/export?${params}`);
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error.message);
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "phytox-reports.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError((e as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={`FIELD INTELLIGENCE / ${view.toUpperCase()}`}
        title={title[0]}
        text={title[1]}
        action={
          <button className="button secondary" onClick={query.reload}>
            <RefreshCw size={16} />
            Refresh
          </button>
        }
      />
      <div className="toolbar">
        {!monitoring && (
          <>
            <label className="field">
              From (UTC)
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="field">
              To (UTC)
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </>
        )}
        <label className="field">
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">All assigned regions</option>
            {regions.data?.map((r) => (
              <option value={r.id} key={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        {!monitoring && (
          <>
            <label className="field">
              Report status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="follow_up">Follow-up</option>
              </select>
            </label>
            <label className="field">
              Disease (exact name)
              <input
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                placeholder="All diseases"
                maxLength={160}
              />
            </label>
          </>
        )}
      </div>
      {exportError && <Notice tone="error">{exportError}</Notice>}
      {regions.error && (
        <ErrorState message={regions.error} retry={regions.reload} />
      )}
      <p className="filter-caption">
        {monitoring
          ? "Monitoring uses the last 14 days; qualifying signals use a rolling 7-day window."
          : "Counts represent reports, not disease prevalence. Only data permitted by your regional assignment is included."}
      </p>
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={query.error} retry={query.reload} />
      ) : (
        <>
          {view === "overview" && (
            <div className="stats-grid">
              {[
                ["Submitted reports", reports.length, "Within selected dates"],
                [
                  "Awaiting review",
                  reports.filter(
                    (r) => r.status === "pending" || r.status === "follow_up",
                  ).length,
                  "Pending or follow-up",
                ],
                [
                  "Verified observations",
                  reports.filter((r) => r.status === "verified").length,
                  "Officer reviewed",
                ],
                [
                  "Potential signals",
                  signals(reports).length,
                  "From selected evidence",
                ],
              ].map(([label, count, note]) => (
                <article className="panel stat" key={label}>
                  <span>{label}</span>
                  <strong>{count}</strong>
                  <p>{note}</p>
                </article>
              ))}
            </div>
          )}
          {monitoring ? (
            <Monitoring reports={reports} region={region} />
          ) : !reports.length ? (
            <section className="panel">
              <Empty
                title="No observations in this view"
                text="Submitted reports will appear when farmers share them with your assigned regions. Try a wider date range or check your region assignment with an administrator."
              />
            </section>
          ) : (
            <>
              {(view === "overview" || view === "analytics") && (
                <Charts reports={reports} full={view === "analytics"} />
              )}{" "}
              {view === "map" && (
                <section className="panel">
                  <ReportMap reports={reports} />
                </section>
              )}
              <section style={{ marginTop: 28 }}>
                <div className="panel-title">
                  <h2>
                    {view === "overview"
                      ? "Recent observations"
                      : "Submitted observations"}{" "}
                    <span className="muted">({reports.length})</span>
                  </h2>
                  <button className="button secondary small" onClick={download}>
                    <Download size={15} />
                    Export CSV
                  </button>
                </div>
                <ReportsTable
                  reports={view === "overview" ? reports.slice(0, 10) : reports}
                />
                {view === "overview" && reports.length > 10 && (
                  <Link href="/officer/reports" className="text-link">
                    View all reports →
                  </Link>
                )}
              </section>
            </>
          )}
        </>
      )}
    </>
  );
}
export function ReportsTable({ reports }: { reports: Report[] }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <caption className="sr-only">Authorized crop observations</caption>
        <thead>
          <tr>
            <th>Crop / prediction</th>
            <th>Region</th>
            <th>Submitted</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.crop}</strong>
                <br />
                {r.disease}
              </td>
              <td>{r.regions?.name ?? "Unknown"}</td>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
              <td>
                <Badge status={r.status} />
              </td>
              <td>
                <Link href={`/officer/reports/${r.id}`}>Review report →</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
