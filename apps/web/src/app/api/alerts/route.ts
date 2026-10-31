import { NextResponse } from "next/server";
import { alertSchema } from "@/lib/contracts";
import { context, route, checkDb, jsonBody } from "@/lib/server";
import { z } from "zod";
export const GET = route(async (request) => {
  const { db } = await context(true);
  const region = new URL(request.url).searchParams.get("region");
  let query = db
    .from("monitoring_alerts")
    .select("*")
    .order("created_at", { ascending: false });
  if (region) query = query.eq("region_id", z.uuid().parse(region));
  const { data, error } = await query.limit(200);
  checkDb(error);
  return NextResponse.json(data);
});
export const POST = route(async (request) => {
  const { db } = await context(true);
  const v = alertSchema.parse(await jsonBody(request));
  const { data, error } = await db.rpc("open_alert", {
    p_region: v.region_id,
    p_crop: v.crop,
    p_disease: v.disease,
    p_notes: v.notes,
  });
  checkDb(error);
  return NextResponse.json({ id: data }, { status: 201 });
});
