"use client";
import Link from "next/link";
import { useState } from "react";
import { ImageIcon, Plus } from "lucide-react";
import { useLocale } from "@/components/locale";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  PageHeading,
} from "@/components/ui";
import { useResource } from "@/lib/client";
import type { Diagnosis } from "@/lib/contracts";
export function HistoryView() {
  const { t, language } = useLocale();
  const [page, setPage] = useState(0),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("newest");
  const query = useResource<{ items: Diagnosis[]; total: number }>(
    `/api/diagnoses?page=${page}&q=${encodeURIComponent(search)}&sort=${sort}`,
  );
  return (
    <>
      <PageHeading
        eyebrow={t("history")}
        title={t("historyTitle")}
        text={t("historyIntro")}
        action={
          <Link className="button" href="/farmer">
            <Plus size={18} />
            {t("newScan")}
          </Link>
        }
      />
      <div className="toolbar">
        <label className="field search">
          {t("search")}
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="field">
          {t("date")}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
          >
            <option value="newest">{t("newest")}</option>
            <option value="oldest">{t("oldest")}</option>
          </select>
        </label>
      </div>
      {query.loading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState message={t("serviceError")} retry={query.reload} />
      ) : !query.data?.items.length ? (
        <div className="panel">
          <Empty title={t("noHistory")} text={t("noHistoryText")} />
        </div>
      ) : (
        <>
          <div className="history-grid">
            {query.data.items.map((d) => (
              <article className="panel history-card" key={d.id}>
                <Link href={`/farmer/diagnosis/${d.id}`}>
                  {d.image_url ? (
                    <img
                      src={d.image_url}
                      alt={d.result?.prediction.crop ?? t("diagnosis")}
                    />
                  ) : (
                    <div className="history-image-empty">
                      <ImageIcon size={28} />
                    </div>
                  )}
                  <div className="history-card-body">
                    <p>{d.result?.prediction.crop ?? t("diagnosis")}</p>
                    <h3>
                      {d.result?.prediction.disease ??
                        (d.status === "failed" ? t("failed") : t("inProgress"))}
                    </h3>
                    <time>
                      {new Date(d.created_at).toLocaleString(language)}
                    </time>
                    {d.result && (
                      <p>
                        {t("confidence")}:{" "}
                        {(d.result.prediction.confidence * 100).toFixed(1)}%
                      </p>
                    )}
                    {d.farmer_reports?.length ? (
                      <Badge status={d.farmer_reports[0].status} />
                    ) : (
                      <p style={{ marginTop: 12 }}>{t("noReport")}</p>
                    )}
                    <span className="text-link">{t("open")} →</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          <div className="pagination">
            <button
              className="button secondary small"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("previous")}
            </button>
            <span>
              {page + 1} / {Math.max(1, Math.ceil(query.data.total / 24))}
            </span>
            <button
              className="button secondary small"
              disabled={(page + 1) * 24 >= query.data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("next")}
            </button>
          </div>
        </>
      )}
    </>
  );
}
