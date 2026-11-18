import { NextResponse } from "next/server";
import { isConfigured } from "@/lib/supabase/config";

export async function GET() {
  const rawUrl = process.env.INFERENCE_URL || "";
  const inferenceUrl = rawUrl.trim().replace(/\/+$/, "");
  const inferenceKey = (process.env.INFERENCE_API_KEY || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const configured = Boolean(inferenceUrl && inferenceKey && serviceKey);

  let model = false;
  let status = configured ? "connecting" : "unconfigured";
  let reason = configured ? "service_connecting" : "environment_unconfigured";

  if (configured) {
    try {
      // 8 second timeout to tolerate cloud cold-starts and cross-region latency
      const response = await fetch(`${inferenceUrl}/ready`, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) {
        const body = await response.json();
        model = body.ready === true;
        status = model ? "ready" : "model_initializing";
        reason = body.reason || "ok";
      } else {
        status = "unavailable";
        reason = `http_${response.status}`;
      }
    } catch (err: unknown) {
      status = "timeout_or_offline";
      reason = err instanceof Error ? err.message : "network_error";
    }
  }

  return NextResponse.json(
    {
      database: isConfigured(),
      model,
      configured,
      status,
      reason,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
