import { NextResponse } from "next/server";
import { z } from "zod";
import { context, route, checkDb } from "@/lib/server";
export const GET = route(async (request) => {
  const { db } = await context();
  const id = z.uuid().parse(new URL(request.url).searchParams.get("region"));
  const [counts, alerts] = await Promise.all([
    db.rpc("regional_insights", { p_region: id }),
    db.rpc("regional_alerts", { p_region: id }),
  ]);
  checkDb(counts.error);
  checkDb(alerts.error);
  return NextResponse.json({ counts: counts.data, alerts: alerts.data });
});
