// Isolated component fixture host. Never included in the Next.js application.
import { createRoot } from "react-dom/client";
import { LocaleProvider } from "@/components/locale";
import { Shell } from "@/components/shell";
import { Scanner } from "@/features/diagnosis/scanner";
import { HistoryView } from "@/features/diagnosis/history";
import { ResultView, FarmerReport } from "@/features/diagnosis/result";
import { Insights } from "@/features/geography/insights";
import { SettingsView } from "@/features/auth/settings";
import { OfficerWorkspace } from "@/features/analytics/workspace";
import { OfficerReview } from "@/features/reporting/officer-review";
import "@/app/globals.css";
const path = window.location.pathname,
  id = path.split("/").at(-1)!;
let content = <Scanner />;
if (path === "/farmer/history") content = <HistoryView />;
if (path.includes("/farmer/diagnosis/")) content = <ResultView id={id} />;
if (path.includes("/farmer/report/")) content = <FarmerReport id={id} />;
if (path === "/farmer/insights") content = <Insights />;
if (path.endsWith("/settings")) content = <SettingsView />;
if (path === "/officer") content = <OfficerWorkspace view="overview" />;
if (
  path === "/officer/reports" ||
  path === "/officer/map" ||
  path === "/officer/analytics" ||
  path === "/officer/monitoring"
)
  content = (
    <OfficerWorkspace
      view={id as "reports" | "map" | "analytics" | "monitoring"}
    />
  );
if (path.includes("/officer/reports/")) content = <OfficerReview id={id} />;
createRoot(document.getElementById("root")!).render(
  <LocaleProvider>
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        textAlign: "center",
        fontSize: 9,
        background: "#fff0ce",
        color: "#684b1b",
        pointerEvents: "none",
      }}
    >
      TEST FIXTURE — illustrative records, never production data
    </div>
    <Shell officer={path.startsWith("/officer")} name="Test user">
      {content}
    </Shell>
  </LocaleProvider>,
);
