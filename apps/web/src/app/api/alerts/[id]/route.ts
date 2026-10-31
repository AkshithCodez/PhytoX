import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveSchema } from "@/lib/contracts";
import { context, route, checkDb, jsonBody } from "@/lib/server";
export const GET = route(async (request) => {
  const { db } = await context(true);
  const id = z.uuid().parse(new URL(request.url).pathname.split("/").at(-1));
  const [evidence, audit] = await Promise.all([
    db.from("alert_evidence").select("report_id").eq("alert_id", id),
    db.from("audit_logs").select("*").eq("record_id", id).order("created_at"),
  ]);
  checkDb(evidence.error);
  checkDb(audit.error);
  return NextResponse.json({ evidence: evidence.data, audit: audit.data });
});
export const PATCH = route(async (request) => {
  const { db } = await context(true);
  const id = z.uuid().parse(new URL(request.url).pathname.split("/").at(-1));
  const v = resolveSchema.parse(await jsonBody(request));
  const { error } = await db.rpc("resolve_alert", {
    p_id: id,
    p_status: v.status,
    p_notes: v.notes,
  });
  checkDb(error);
  return NextResponse.json({ ok: true });
});
