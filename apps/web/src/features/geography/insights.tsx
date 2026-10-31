"use client";
import { useState } from "react";
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
import type { Region, Alert } from "@/lib/contracts";
export function Insights() {
  const { t } = useLocale();
  const [region, setRegion] = useState("");
  const regions = useResource<Region[]>("/api/regions");
  const query = useResource<{
    counts: { crop: string; disease: string; observations: number }[];
    alerts: Alert[];
  }>(region ? `/api/insights?region=${region}` : null);
  return (
    <>
      <PageHeading
        eyebrow={t("insights")}
        title={t("insightsTitle")}
        text={t("insightsNote")}
      />
      <label className="field" style={{ maxWidth: 400 }}>
        {t("region")}
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">{t("chooseRegion")}</option>
          {regions.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      {regions.error && (
        <ErrorState message={t("serviceError")} retry={regions.reload} />
      )}
      <Notice>{t("noInsightsText")}</Notice>
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={t("serviceError")} retry={query.reload} />
      ) : (
        <>
          <section className="panel">
            <h2 style={{ fontSize: 23 }}>{t("observations")}</h2>
            {query.data?.counts.length ? (
              <div className="insight-list" style={{ marginTop: 22 }}>
                {query.data.counts.map((r) => (
                  <article key={r.crop + r.disease}>
                    <Badge status="verified" />
                    <h3>
                      {r.crop} · {r.disease}
                    </h3>
                    <strong className="insight-number">{r.observations}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <Empty title={t("noInsights")} text={t("insightsNote")} />
            )}
          </section>
          {!!query.data?.alerts.length && (
            <section className="panel" style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 23 }}>{t("verifiedAlerts")}</h2>
              {query.data.alerts.map((a) => (
                <Notice key={a.id} tone="warning">
                  {a.crop} · {a.disease}
                </Notice>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
