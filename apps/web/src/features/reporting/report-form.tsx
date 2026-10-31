"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { useLocale } from "@/components/locale";
import { Notice } from "@/components/ui";
import { api, useResource } from "@/lib/client";
import type { Region } from "@/lib/contracts";
export function ReportForm({
  diagnosisId,
  onSaved,
}: {
  diagnosisId: string;
  onSaved: () => void;
}) {
  const { t } = useLocale();
  const regions = useResource<Region[]>("/api/regions");
  const [region, setRegion] = useState(""),
    [notes, setNotes] = useState(""),
    [consent, setConsent] = useState(false),
    [locationConsent, setLocationConsent] = useState(false),
    [location, setLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [locating, setLocating] = useState(false);
  function locate() {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage(t("locationFailed"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setMessage(t("locationFailed"));
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 0 },
    );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!region) {
      setMessage(t("regionRequired"));
      return;
    }
    if (!consent) {
      setMessage(t("consentRequired"));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await api("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          diagnosis_id: diagnosisId,
          region_id: region,
          notes,
          consent,
          ...(locationConsent && location
            ? location
            : { latitude: null, longitude: null }),
        }),
      });
      onSaved();
    } catch {
      setMessage(t("serviceError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <h2 style={{ fontSize: 23, marginBottom: 22 }}>{t("report")}</h2>
      {message && <Notice tone="warning">{message}</Notice>}
      {regions.error && <Notice tone="error">{t("serviceError")}</Notice>}
      <label className="field">
        {t("region")}
        <select
          required
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">{t("chooseRegion")}</option>
          {regions.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        {t("notes")}
        <textarea
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>{t("consent")}</span>
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={locationConsent}
          onChange={(e) => {
            setLocationConsent(e.target.checked);
            setLocation(null);
          }}
        />
        <span>{t("locationConsent")}</span>
      </label>
      {locationConsent && (
        <div className="form-actions">
          <button
            className="button secondary"
            type="button"
            onClick={locate}
            disabled={locating}
          >
            <MapPin size={16} />
            {locating
              ? t("loading")
              : location
                ? t("locationReady")
                : t("getLocation")}
          </button>
          {location && (
            <button
              type="button"
              className="text-button"
              onClick={() => setLocation(null)}
            >
              {t("clearLocation")}
            </button>
          )}
        </div>
      )}
      <div className="form-actions">
        <button className="button" disabled={busy || !regions.data?.length}>
          {busy ? t("working") : t("submit")}
        </button>
      </div>
    </form>
  );
}
