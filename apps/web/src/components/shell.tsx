"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ChartNoAxesCombined,
  ClipboardList,
  History,
  LayoutDashboard,
  Leaf,
  LogOut,
  Map,
  ScanLine,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "./ui";
import { LanguageGate, LanguageSelect, useLocale } from "./locale";
import { browserClient } from "@/lib/supabase/browser";
import { useState } from "react";
export function Shell({
  children,
  officer = false,
  name,
}: {
  children: React.ReactNode;
  officer?: boolean;
  name: string;
}) {
  const path = usePathname(),
    { t } = useLocale();
  const [error, setError] = useState("");
  const links = officer
    ? ([
        ["/officer", "Overview", LayoutDashboard],
        ["/officer/map", "Disease map", Map],
        ["/officer/reports", "Reports", ClipboardList],
        ["/officer/monitoring", "Monitoring", Activity],
        ["/officer/analytics", "Analytics", ChartNoAxesCombined],
        ["/officer/settings", "Settings", Settings],
      ] as const)
    : ([
        ["/farmer", t("diagnosis"), ScanLine],
        ["/farmer/history", t("history"), History],
        ["/farmer/insights", t("insights"), Map],
        ["/farmer/settings", t("settings"), Settings],
      ] as const);
  return (
    <LanguageGate>
      <div className={`workspace ${officer ? "officer" : "farmer"}`}>
        <aside className="sidebar">
          <Brand />
          <p className="nav-label">
            {officer ? "FIELD INTELLIGENCE" : t("farmerPortal")}
          </p>
          <nav aria-label="Workspace">
            {links.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={
                  (
                    href === "/farmer" || href === "/officer"
                      ? path === href
                      : path.startsWith(href)
                  )
                    ? "active"
                    : ""
                }
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <Leaf size={23} />
              <strong>Rooted in better decisions.</strong>
              <p>{t("aiNote")}</p>
            </div>
            <Link href="/privacy">{t("privacy")}</Link>
          </div>
        </aside>
        <div className="workspace-body">
          <header className="workspace-top">
            <span className="mobile-brand">
              <Brand />
            </span>
            <span className="desktop-only">
              <ShieldCheck size={17} />
              {officer ? "Authorized regional workspace" : t("farmerPortal")}
            </span>
            <div className="top-actions">
              <LanguageSelect />
              <span className="avatar" title={name}>
                {name.slice(0, 1).toUpperCase() || "P"}
              </span>
              <button
                aria-label={t("logout")}
                className="icon-button"
                onClick={async () => {
                  const { error } = await browserClient().auth.signOut();
                  if (error) setError(t("serviceError"));
                  else window.location.assign("/auth/login");
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>
          {error && <p role="alert">{error}</p>}
          <main id="main" className="workspace-main">
            {children}
          </main>
        </div>
        <nav className="mobile-nav" aria-label="Mobile workspace">
          {links.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "active" : ""}
            >
              <Icon size={21} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </LanguageGate>
  );
}
