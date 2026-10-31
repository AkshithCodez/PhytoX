"use client";
import Link from "next/link";
import { AlertCircle, ArrowRight, Leaf, Loader2, Sprout } from "lucide-react";
import { useLocale } from "./locale";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="PhytoX home">
      <span className="brand-icon">
        <Sprout size={23} />
      </span>
      Phyto<span className="brand-x">X</span>
    </Link>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning" | "error" | "success";
}) {
  return (
    <div
      className={`notice ${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <AlertCircle size={19} />
      <div>{children}</div>
    </div>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Leaf size={30} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Loading() {
  const { t } = useLocale();
  return (
    <div className="loading" role="status">
      <Loader2 className="spin" size={22} />
      {t("loading")}
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  text,
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
      {action}
    </header>
  );
}
export function Badge({ status }: { status: string }) {
  const { t } = useLocale();
  const label =
    status === "pending" ||
    status === "verified" ||
    status === "rejected" ||
    status === "follow_up"
      ? t(status)
      : status.replaceAll("_", " ");
  return (
    <span className={`badge ${status}`}>
      <i />
      {label}
    </span>
  );
}
export function Setup() {
  const { t } = useLocale();
  return (
    <main id="main" className="setup">
      <Brand />
      <div className="panel">
        <span className="empty-icon">
          <Sprout size={36} />
        </span>
        <h1>{t("setupTitle")}</h1>
        <p>{t("setupText")}</p>
        <Link className="button" href="/">
          {t("home")}
          <ArrowRight size={18} />
        </Link>
      </div>
    </main>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  const { t } = useLocale();
  return (
    <Notice tone="error">
      <p>{message}</p>
      {retry && (
        <button className="text-button" onClick={retry}>
          {t("retry")}
        </button>
      )}
    </Notice>
  );
}
