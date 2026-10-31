import { NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase/config";
export async function GET() {
  let model = false;
  if (
    process.env.INFERENCE_URL &&
    process.env.INFERENCE_API_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    try {
      const response = await fetch(`${process.env.INFERENCE_URL}/ready`, {
        cache: "no-store",
        signal: AbortSignal.timeout(2000),
      });
      model = response.ok && (await response.json()).ready === true;
    } catch {
      /* Readiness is false on network failure. */
    }
  return NextResponse.json(
    { database: isConfigured(), model },
    { headers: { "Cache-Control": "no-store" } },
  );
}
