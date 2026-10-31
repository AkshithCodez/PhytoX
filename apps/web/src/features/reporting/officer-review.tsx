"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Badge,
  ErrorState,
  Loading,
  Notice,
  PageHeading,
} from "@/components/ui";
import { api, useResource } from "@/lib/client";
import type { Report } from "@/lib/contracts";
import { PredictionSummary } from "@/features/diagnosis/result";
export function OfficerReview({ id }: { id: string }) {
  const query = useResource<Report>(`/api/reports/${id}`);
  const [status, setStatus] = useState("verified"),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  async function review(e: React.FormEvent) {
    e.preventDefault();
    if (!query.data) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await api(`/api/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ version: query.data.version, status, notes }),
      });
      setSaved(true);
      setNotes("");
      query.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (query.loading) return <Loading />;
  if (query.error)
    return <ErrorState message={query.error} retry={query.reload} />;
  if (!query.data) return null;
  const r = query.data;
  return (
    <>
      <PageHeading
        eyebrow="REPORT REVIEW"
        title={`${r.crop} · ${r.disease}`}
        text={`${r.regions?.name ?? "Unknown region"} · ${new Date(r.created_at).toLocaleString()}`}
        action={
          <Link href="/officer/reports" className="button secondary">
            Back to reports
          </Link>
        }
      />
      {saved && (
        <Notice tone="success">
          Review saved. The report status and audit trail have been updated.
        </Notice>
      )}
      <div className="result-layout">
        <section className="panel">
          {r.diagnoses?.image_url ? (
            <img
              src={r.diagnoses.image_url}
              className="result-image"
              alt={`${r.crop} observation`}
            />
          ) : (
            <p>No photograph available.</p>
          )}
          <dl className="detail-grid">
            <div>
              <dt>Status</dt>
              <dd>
                <Badge status={r.status} />
              </dd>
            </div>
            <div>
              <dt>Location shared with officers</dt>
              <dd>
                {r.latitude !== null && r.longitude !== null
                  ? `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}`
                  : "Region only"}
              </dd>
            </div>
          </dl>
          <h3 style={{ fontSize: 20 }}>Farmer’s observation</h3>
          <p style={{ fontSize: 13, whiteSpace: "pre-wrap", marginTop: 14 }}>
            {r.notes || "No notes supplied."}
          </p>
        </section>
        <section className="panel">
          {r.diagnoses?.result ? (
            <PredictionSummary result={r.diagnoses.result} />
          ) : (
            <p>No model assessment available.</p>
          )}
        </section>
        <form className="panel" onSubmit={review}>
          <h2 style={{ fontSize: 24, marginBottom: 24 }}>Record your review</h2>
          {error && <Notice tone="error">{error}</Notice>}
          <Notice>
            Verify the observation using your professional assessment. This
            action does not confirm a regional outbreak.
          </Notice>
          <label className="field">
            Review decision
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="verified">Verify observation</option>
              <option value="rejected">Reject observation</option>
              <option value="follow_up">Request follow-up</option>
            </select>
          </label>
          <label className="field">
            Review notes
            <textarea
              required
              minLength={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <small>
              Explain your decision and any requested next steps. These notes
              are visible to the reporting farmer.
            </small>
          </label>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save review"}
          </button>
        </form>
        <section className="panel">
          <h2 style={{ fontSize: 24 }}>Review history</h2>
          <div className="review-notes">
            {r.officer_reviews?.length ? (
              [...r.officer_reviews]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((v) => (
                  <article key={v.id} className="review-note">
                    <Badge status={v.status} />
                    <p style={{ whiteSpace: "pre-wrap" }}>{v.notes}</p>
                    <time>{new Date(v.created_at).toLocaleString()}</time>
                  </article>
                ))
            ) : (
              <p>No reviews have been recorded.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
