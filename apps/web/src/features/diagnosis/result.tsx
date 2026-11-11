"use client";
import Link from "next/link";
import { useLocale } from "@/components/locale";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageHeading,
} from "@/components/ui";
import { useResource } from "@/lib/client";
import type { Diagnosis, PredictionResult, Report } from "@/lib/contracts";
import { ReportForm } from "@/features/reporting/report-form";
export function QualityWarnings({ warnings }: { warnings: string[] }) {
  const { t } = useLocale();
  const keys = {
    low_resolution: "qualityLowResolution",
    underexposed: "qualityUnderexposed",
    overexposed: "qualityOverexposed",
  } as const;
  if (!warnings.length) return null;
  return <Notice tone="warning"><strong>{t("quality")}</strong><ul>
    {[...new Set(warnings)].map((warning) => <li key={warning}>{t(keys[warning as keyof typeof keys] ?? "qualityUnknown")}</li>)}
  </ul></Notice>;
}
export function PredictionSummary({ result }: { result: PredictionResult }) {
  const { t } = useLocale();
  return (
    <>
      <p className="result-crop">{result.prediction.crop}</p>
      <h2 className="result-title">{result.prediction.disease}</h2>
      <Notice tone="warning">
        {result.abstained ? t("uncertain") : t("review")}
      </Notice>
      <div className="confidence-row">
        <span>{t("confidence")}</span>
        <strong>{(result.prediction.confidence * 100).toFixed(1)}%</strong>
      </div>
      <div className="confidence-bar">
        <span style={{ width: `${result.prediction.confidence * 100}%` }} />
      </div>
      <p style={{ fontSize: 11, marginTop: 12 }}>{t("aiNote")}</p>
      {result.alternatives.length > 0 && (
        <details>
          <summary>{t("alternatives")}</summary>
          {result.alternatives.map((p) => (
            <div className="alternative" key={p.crop + p.disease}>
              <span>
                {p.crop} · {p.disease}
              </span>
              <span>{(p.confidence * 100).toFixed(1)}%</span>
            </div>
          ))}
        </details>
      )}
      <QualityWarnings warnings={result.quality_warnings} />
      <dl className="detail-grid">
        <div>
          <dt>{t("modelVersion")}</dt>
          <dd>{result.model_version}</dd>
        </div>
        <div>
          <dt>{t("review")}</dt>
          <dd>{t("aiNote")}</dd>
        </div>
      </dl>
      <p style={{ fontSize: 13 }}>{t("guidance")}</p>
    </>
  );
}
export function ResultView({ id }: { id: string }) {
  const { t, language } = useLocale();
  const query = useResource<Diagnosis>(`/api/diagnoses/${id}`);
  if (query.loading) return <Loading />;
  if (query.error)
    return <ErrorState message={t("serviceError")} retry={query.reload} />;
  const d = query.data;
  if (!d) return null;
  return (
    <>
      <PageHeading
        eyebrow={t("result")}
        title={t("saved")}
        text={new Date(d.created_at).toLocaleString(language)}
        action={
          <Link href="/farmer/history" className="button secondary">
            {t("goHistory")}
          </Link>
        }
      />
      {d.status !== "complete" || !d.result ? (
        <div className="panel">
          <Empty
            title={d.status === "failed" ? t("failed") : t("inProgress")}
            text={t("aiNote")}
            action={
              <Link className="button" href="/farmer">
                {t("newScan")}
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="result-layout">
            <div className="panel">
              {d.image_url ? (
                <img
                  className="result-image"
                  src={d.image_url}
                  alt={d.result.prediction.crop}
                />
              ) : (
                <p>{t("noImage")}</p>
              )}
              <Notice>{t("saved")}</Notice>
            </div>
            <section className="panel">
              <PredictionSummary result={d.result} />
            </section>
          </div>
          <section className="panel" style={{ marginTop: 24 }}>
            {d.farmer_reports?.length ? (
              <>
                <Notice tone="success">{t("submitted")}</Notice>
                <Badge status={d.farmer_reports[0].status} />
                <Link
                  className="button secondary"
                  style={{ marginLeft: 15 }}
                  href={`/farmer/report/${d.farmer_reports[0].id}`}
                >
                  {t("viewReport")}
                </Link>
              </>
            ) : (
              <ReportForm diagnosisId={d.id} onSaved={query.reload} />
            )}
          </section>
        </>
      )}
    </>
  );
}
export function FarmerReport({ id }: { id: string }) {
  const { t, language } = useLocale();
  const q = useResource<Report>(`/api/reports/${id}`);
  if (q.loading) return <Loading />;
  if (q.error)
    return <ErrorState message={t("serviceError")} retry={q.reload} />;
  if (!q.data) return null;
  const r = q.data;
  return (
    <>
      <PageHeading
        eyebrow={t("reportDetails")}
        title={`${r.crop} · ${r.disease}`}
        text={r.regions?.name ?? ""}
      />
      <section className="panel">
        <Badge status={r.status} />
        <p style={{ marginTop: 20, whiteSpace: "pre-wrap" }}>{r.notes}</p>
        <h2 style={{ fontSize: 23, marginTop: 30 }}>{t("followup")}</h2>
        <div className="review-notes">
          {r.officer_reviews?.length ? (
            r.officer_reviews.map((review) => (
              <article className="review-note" key={review.id}>
                <Badge status={review.status} />
                <p>{review.notes}</p>
                <time>
                  {new Date(review.created_at).toLocaleString(language)}
                </time>
              </article>
            ))
          ) : (
            <p>{t("noReviews")}</p>
          )}
        </div>
      </section>
    </>
  );
}
