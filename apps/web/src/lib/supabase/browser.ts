"use client";
import { createBrowserClient } from "@supabase/ssr";
import { isConfigured, getSupabaseAnonKey } from "./config";
export function browserClient() {
  if (!isConfigured()) throw new Error("Authentication is not configured.");
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseAnonKey(),
  );
}
