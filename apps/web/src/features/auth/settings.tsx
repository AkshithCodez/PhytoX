"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale";
import { ErrorState, Loading, Notice, PageHeading } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import type { Profile, Region } from "@/lib/contracts";
export function SettingsView() {
  const { t, language, setLanguage } = useLocale();
  const profile = useResource<Profile>("/api/profile"),
    regions = useResource<Region[]>("/api/regions");
  const [name, setName] = useState(""),
    [region, setRegion] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (profile.data) {
      setName(profile.data.display_name);
      setRegion(profile.data.region_id ?? "");
    }
  }, [profile.data]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: name,
          language,
          region_id: region || null,
        }),
      });
      setMessage(t("savedProfile"));
    } catch {
      setError(t("serviceError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={t("settings")}
        title={t("profileTitle")}
        text={t("profileIntro")}
      />
      {profile.loading ? (
        <Loading />
      ) : profile.error ? (
        <ErrorState message={t("serviceError")} retry={profile.reload} />
      ) : (
        <form className="panel settings-panel" onSubmit={save}>
          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          <label className="field">
            {t("name")}
            <input
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
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
          <label className="field">
            {t("language")}
            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as "en" | "te" | "hi")
              }
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिन्दी</option>
            </select>
          </label>
          <button className="button" disabled={busy}>
            {busy ? t("working") : t("save")}
          </button>
        </form>
      )}
    </>
  );
}
