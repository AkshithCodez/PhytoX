"use client";
import { useState } from "react";
import { signals } from "@/lib/analytics";
import { api, useResource } from "@/lib/client";
import type { Alert, Report, Signal } from "@/lib/contracts";
import { Badge, Empty, ErrorState, Loading, Notice } from "@/components/ui";
export function Monitoring({
  reports,
  region,
}: {
  reports: Report[];
  region: string;
}) {
  const query = useResource<Alert[]>(
    `/api/alerts${region ? "?region=" + region : ""}`,
  );
  const candidates = signals(reports);
  return (
    <>
      <Notice tone="warning">
        <strong>Signals for investigation, not confirmed outbreaks.</strong>
        <p>
          A signal requires at least 5 reports from 3 distinct contributors and
          2 verified observations for the same crop, disease, and region within
          7 days. The preceding 7 days provide context. Reporting bias and small
          samples can distort these signals.
        </p>
      </Notice>
      <h2 style={{ fontSize: 24, margin: "28px 0 20px" }}>
        Potential concentrations
      </h2>
      <div className="monitoring-list">
        {candidates.length ? (
          candidates.map((s) => (
            <SignalCard
              key={s.region_id + s.crop + s.disease}
              signal={s}
              region={
                reports.find((r) => r.region_id === s.region_id)?.regions
                  ?.name ?? s.region_id
              }
              onSaved={query.reload}
            />
          ))
        ) : (
          <section className="panel">
            <Empty
              title="No signals meet the evidence threshold"
              text="This means there is insufficient reporting evidence for these rules. It does not mean the region is free of crop disease."
            />
          </section>
        )}
      </div>
      <h2 style={{ fontSize: 24, margin: "32px 0 20px" }}>
        Investigations & decisions
      </h2>
      <p className="filter-caption">
        Latest 200 investigations in the selected authorized regions.
      </p>
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={query.error} retry={query.reload} />
      ) : query.data?.length ? (
        <div className="monitoring-list">
          {query.data.map((a) => (
            <AlertCard key={a.id} alert={a} onSaved={query.reload} />
          ))}
        </div>
      ) : (
        <section className="panel">
          <Empty
            title="No investigations recorded"
            text="An officer can open an investigation from a signal when the minimum evidence is available."
          />
        </section>
      )}
    </>
  );
}
function SignalCard({
  signal: s,
  region,
  onSaved,
}: {
  signal: Signal;
  region: string;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/alerts", {
        method: "POST",
        body: JSON.stringify({
          region_id: s.region_id,
          crop: s.crop,
          disease: s.disease,
          notes,
        }),
      });
      setSaved(true);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel">
      <div className="signal-head">
        <div>
          <h3>
            {s.crop} · {s.disease}
          </h3>
          <p>{region}</p>
        </div>
        <Badge status="investigating" />
      </div>
      <div className="signal-evidence">
        <span>
          <strong>{s.recent}</strong>reports / 7 days
        </span>
        <span>
          <strong>{s.reporters}</strong>contributors
        </span>
        <span>
          <strong>{s.verified}</strong>verified
        </span>
        <span>
          <strong>{s.baseline}</strong>previous 7 days
        </span>
      </div>
      <p className="filter-caption">
        {s.growth === null
          ? "No baseline reports; a percentage change would be misleading."
          : `${(s.growth * 100).toFixed(0)}% change from the previous period.`}
      </p>
      {saved ? (
        <Notice tone="success">
          Investigation opened with linked report evidence.
        </Notice>
      ) : (
        <form onSubmit={submit}>
          {error && <Notice tone="error">{error}</Notice>}
          <label className="field">
            Investigation notes
            <textarea
              required
              minLength={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Open investigation"}
          </button>
        </form>
      )}
    </article>
  );
}
function AlertCard({
  alert: a,
  onSaved,
}: {
  alert: Alert;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(""),
    [status, setStatus] = useState("dismissed"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/alerts/${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel">
      <div className="signal-head">
        <div>
          <h3>
            {a.crop} · {a.disease}
          </h3>
          <p>{new Date(a.created_at).toLocaleString()}</p>
        </div>
        <Badge status={a.status} />
      </div>
      <p style={{ whiteSpace: "pre-wrap" }}>{a.notes}</p>
      <details>
        <summary>Evidence & audit history</summary>
        <AlertEvidence id={a.id} />
      </details>
      {a.status === "investigating" && (
        <details>
          <summary>Record investigation outcome</summary>
          <form onSubmit={submit}>
            {error && <Notice tone="error">{error}</Notice>}
            <label className="field">
              Decision
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="dismissed">Dismiss signal</option>
                <option value="confirmed">Confirm regional alert</option>
              </select>
            </label>
            <Notice tone="warning">
              Confirmed alerts become visible to farmers in regional insights.
              Record the evidence supporting your decision.
            </Notice>
            <label className="field">
              Evidence and decision notes
              <textarea
                required
                minLength={3}
                maxLength={2000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Record decision"}
            </button>
          </form>
        </details>
      )}
    </article>
  );
}
function AlertEvidence({ id }: { id: string }) {
  const q = useResource<{
    evidence: { report_id: string }[];
    audit: {
      id: string;
      action: string;
      created_at: string;
      details: { notes?: string; status?: string };
    }[];
  }>(`/api/alerts/${id}`);
  return q.loading ? (
    <Loading />
  ) : q.error ? (
    <ErrorState message={q.error} />
  ) : (
    <div>
      <p>Linked reports</p>
      <ul>
        {q.data?.evidence.map((e) => (
          <li key={e.report_id}>
            <a className="text-link" href={`/officer/reports/${e.report_id}`}>
              {e.report_id.slice(0, 8)} →
            </a>
          </li>
        ))}
      </ul>
      {q.data?.audit.map((a) => (
        <p key={a.id}>
          {a.action} · {new Date(a.created_at).toLocaleString()} ·{" "}
          {a.details.notes ?? ""}
        </p>
      ))}
    </div>
  );
}
