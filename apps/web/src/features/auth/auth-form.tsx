"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { browserClient } from "@/lib/supabase/browser";
import { isConfigured } from "@/lib/supabase/config";
import { LanguageGate, LanguageSelect, useLocale } from "@/components/locale";
import { Brand, Notice } from "@/components/ui";
import { Botanical } from "@/components/botanical";
type Mode = "login" | "register" | "recovery" | "update-password";
export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useLocale(),
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
          : t("login");
  async function submit(values: z.infer<typeof schema>) {
    setError("");
    setMessage("");
    try {
      const client = browserClient();
      const origin = window.location.origin;
      if (mode === "register") {
        const { data, error } = await client.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: { display_name: values.name },
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.session) window.location.assign("/farmer");
        else setMessage(t("checkEmail"));
      }
      if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });
        if (error) throw error;
        window.location.assign(
          new URLSearchParams(window.location.search).get("portal") ===
            "officer"
            ? "/officer"
            : "/farmer",
        );
      }
      if (mode === "recovery") {
        const { error } = await client.auth.resetPasswordForEmail(
          values.email,
          { redirectTo: `${origin}/auth/callback?next=/auth/update-password` },
        );
        if (error) throw error;
        setMessage(t("checkEmail"));
      }
      if (mode === "update-password") {
        const { error } = await client.auth.updateUser({
          password: values.password,
        });
        if (error) throw error;
        window.location.assign("/farmer");
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
          <h2 className="auth-headline">{t("authIntro")}</h2>
          <p>{t("aiNote")}</p>
          <Botanical />
        </aside>
        <div className="auth-content">
          <LanguageSelect />
          <form
            className="auth-form"
            onSubmit={handleSubmit(submit)}
            noValidate
          >
            <p className="eyebrow">YOUR FIELD. A CLEARER PICTURE.</p>
            <h1>{title}</h1>
            <p>{t("farmerPortal")} · PhytoX</p>
            {!isConfigured() && (
              <Notice tone="warning">{t("authUnavailable")}</Notice>
            )}
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="success">{message}</Notice>}
            {mode === "register" && (
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
                  <Link href="/auth/recovery">{t("forgot")}</Link>
                  <span>
                    {t("createPrompt")}{" "}
                    <Link href="/auth/register">{t("register")}</Link>
                  </span>
                </>
              ) : (
                <Link href="/auth/login">
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
