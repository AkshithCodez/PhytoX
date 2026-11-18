"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
import { isConfigured } from "@/lib/supabase/config";
import { LanguageGate, LanguageSelect, useLocale } from "@/components/locale";
import { Brand, Notice } from "@/components/ui";

type Mode = "login" | "register" | "recovery" | "update-password";

export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useLocale(),
    searchParams = useSearchParams(),
    portal = searchParams.get("portal"),
    isOfficer = portal === "officer",
    [error, setError] = useState(""),
    [message, setMessage] = useState("");

  const schema = z.object({
    email: mode === "update-password" ? z.string() : z.email(),
    password: mode === "recovery" ? z.string() : z.string().min(8).max(128),
    name: mode === "register" ? z.string().trim().min(1).max(100) : z.string(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", name: "" },
  });

  const title =
    mode === "recovery"
      ? t("recovery")
      : mode === "update-password"
        ? t("updatePassword")
        : mode === "register"
          ? t("register")
          : isOfficer
            ? "Sign in"
            : t("login");

  async function submit(values: z.infer<typeof schema>) {
    setError("");
    setMessage("");
    try {
      const client = browserClient();
      const origin = window.location.origin;

      if (mode === "register") {
        if (isOfficer) {
          setError(
            "Officer accounts cannot be created publicly. Contact your regional agricultural administrator for credentials.",
          );
          return;
        }
        const { data, error: signUpErr } = await client.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { display_name: values.name },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });
        if (signUpErr) throw signUpErr;
        if (data.session) window.location.assign("/farmer");
        else setMessage(t("checkEmail"));
      }

      if (mode === "login") {
        const { error: signInErr } = await client.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (signInErr) throw signInErr;
        window.location.assign(isOfficer ? "/officer" : "/farmer");
      }

      if (mode === "recovery") {
        const { error: resetErr } = await client.auth.resetPasswordForEmail(
          values.email,
          {
            redirectTo: `${origin}/auth/callback?next=/auth/update-password${
              isOfficer ? "&portal=officer" : ""
            }`,
          },
        );
        if (resetErr) throw resetErr;
        setMessage(t("checkEmail"));
      }

      if (mode === "update-password") {
        const { error: updateErr } = await client.auth.updateUser({
          password: values.password,
        });
        if (updateErr) throw updateErr;
        window.location.assign(isOfficer ? "/officer" : "/farmer");
      }
    } catch {
      setError(t("sessionError"));
    }
  }

  return (
    <LanguageGate>
      <main id="main" className="auth-page">
        <aside className="auth-aside">
          <Brand />
          <h2 className="auth-headline">
            {isOfficer
              ? "Regional intelligence. Verified crop protection."
              : t("authIntro")}
          </h2>
          <p className="auth-sub">
            {isOfficer
              ? "Secure access for authorized agricultural officers to review field observations, track disease clusters, and coordinate regional advisories."
              : t("aiNote")}
          </p>

          <div className="auth-aside-badge mt-auto pt-8 flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase text-[#B5A295]/80">
            <ShieldCheck size={14} className="text-[#a33715]" />
            <span>
              {isOfficer
                ? "DISTRICT SURVEILLANCE & RLS AUDIT VERIFIED"
                : "END-TO-END VERIFIED AGRICULTURAL INTELLIGENCE"}
            </span>
          </div>
        </aside>

        <div className="auth-content">
          <LanguageSelect />
          <form
            className="auth-form"
            onSubmit={handleSubmit(submit)}
            noValidate
          >
            <p className="eyebrow">
              {isOfficer
                ? "REGIONAL AGRICULTURAL INTELLIGENCE"
                : "YOUR FIELD. A CLEARER PICTURE."}
            </p>
            <h1>{title}</h1>
            <p className="auth-portal-sub">
              {isOfficer
                ? "Agricultural Officer Portal · PhytoX"
                : `${t("farmerPortal")} · PhytoX`}
            </p>

            {isOfficer && mode === "login" && (
              <div className="mb-4 p-3 rounded-[6px] bg-[#20292D]/70 border border-white/10 text-[12px] text-[#B5A295] leading-relaxed">
                Secure access to regional reports, crop-health analytics, and
                verification workflows.
              </div>
            )}

            {!isConfigured() && (
              <Notice tone="warning">{t("authUnavailable")}</Notice>
            )}
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="success">{message}</Notice>}

            {mode === "register" && !isOfficer && (
              <label className="field">
                {t("name")}
                <input
                  autoComplete="name"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <span className="field-error">{t("required")}</span>
                )}
              </label>
            )}

            {mode !== "update-password" && (
              <label className="field">
                {t("email")}
                <input
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <span className="field-error">{t("required")}</span>
                )}
              </label>
            )}

            {mode !== "recovery" && (
              <label className="field">
                {t("password")}
                <input
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                <small>{t("passwordHint")}</small>
                {errors.password && (
                  <span className="field-error">{t("passwordHint")}</span>
                )}
              </label>
            )}

            <button
              className="button full"
              disabled={!isConfigured() || isSubmitting}
            >
              {isSubmitting
                ? t("loading")
                : mode === "recovery"
                  ? t("sendReset")
                  : title}
              <ArrowRight size={18} />
            </button>

            <div className="auth-links">
              {mode === "login" ? (
                <>
                  <Link
                    href={
                      isOfficer
                        ? "/auth/recovery?portal=officer"
                        : "/auth/recovery"
                    }
                  >
                    {t("forgot")}
                  </Link>
                  {!isOfficer ? (
                    <span>
                      {t("createPrompt")}{" "}
                      <Link href="/auth/register">{t("register")}</Link>
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#B5A295]">
                      Need farmer access?{" "}
                      <Link href="/auth/login?portal=farmer">
                        Farmer Portal
                      </Link>
                    </span>
                  )}
                </>
              ) : (
                <Link
                  href={
                    isOfficer
                      ? "/auth/login?portal=officer"
                      : "/auth/login"
                  }
                >
                  {t("loginPrompt")} {t("login")}
                </Link>
              )}
              <Link href="/">{t("home")}</Link>
            </div>
          </form>
        </div>
      </main>
    </LanguageGate>
  );
}
