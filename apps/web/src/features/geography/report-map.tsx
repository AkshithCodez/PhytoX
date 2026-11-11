"use client";
import { useEffect, useRef, useState } from "react";
import type { Report } from "@/lib/contracts";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
export default function ReportMap({ reports }: { reports: Report[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [unlocated, setUnlocated] = useState(0);
  useEffect(() => {
    let active = true;
    let map: import("leaflet").Map | undefined;
    async function init() {
      const { default: L } = await import("leaflet");
      await import("leaflet.markercluster");
      if (!active || !container.current) return;
      map = L.map(container.current).setView([16.1, 80.4], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);
      const cluster = L.markerClusterGroup({ showCoverageOnHover: false });
      const points: import("leaflet").LatLngTuple[] = [];
      let missing = 0;
      for (const r of reports) {
        const exact = r.latitude !== null && r.longitude !== null;
        const lat = exact ? r.latitude : r.regions?.latitude,
          lng = exact ? r.longitude : r.regions?.longitude;
        if (lat == null || lng == null) {
          missing++;
          continue;
        }
        points.push([lat, lng]);
        const popup = document.createElement("div"),
          title = document.createElement("strong"),
          detail = document.createElement("p"),
          link = document.createElement("a");
        title.textContent = `${r.crop} · ${r.disease}`;
        detail.textContent = `${r.status.replaceAll("_", " ")} · ${exact ? "Shared location" : "Approximate region center"}`;
        link.textContent = "Inspect report";
        link.href = `/officer/reports/${r.id}`;
        popup.append(title, detail, link);
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: "report-pin",
            html: `<span style="display:block;background:${r.status === "verified" ? "#567c3a" : "#a57931"};width:18px;height:18px;border:3px solid white;border-radius:50%;box-shadow:0 1px 5px #0004"></span>`,
            iconSize: [18, 18],
          }),
          title: `${r.crop}: ${r.disease}`,
        })
          .bindPopup(popup)
          .addTo(cluster);
      }
      cluster.addTo(map);
      setUnlocated(missing);
      if (points.length)
        map.fitBounds(L.latLngBounds(points), {
          padding: [40, 40],
          maxZoom: 12,
        });
    }
    void init();
    return () => {
      active = false;
      map?.remove();
    };
  }, [reports]);
  return (
    <>
      <div
        ref={container}
        className="map-container"
        role="region"
        aria-label="Authorized crop reports map"
      />
      <div className="map-legend">
        <span>
          <i />
          Verified observation
        </span>
        <span>
          <i />
          Awaiting verification / other status
        </span>
      </div>
      <p className="filter-caption">
        Reports without shared coordinates use their region center. {unlocated}{" "}
        reports have no mappable location. Use the report list below as a
        keyboard-accessible alternative.
      </p>
    </>
  );
}
