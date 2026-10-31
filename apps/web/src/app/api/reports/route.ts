import { NextResponse } from "next/server";
import { reportSchema } from "@/lib/contracts";
import { context, route, checkDb, jsonBody } from "@/lib/server";
import { reportList } from "@/services/reports";
export const GET = route(async (request) =>
  NextResponse.json(await reportList(request)),
);
export const POST = route(async (request) => {
  const { db } = await context();
  const v = reportSchema.parse(await jsonBody(request));
  const { data, error } = await db.rpc("submit_report", {
    p_diagnosis: v.diagnosis_id,
    p_region: v.region_id,
    p_notes: v.notes,
    p_consent: v.consent,
    p_lat: v.latitude,
    p_lng: v.longitude,
  });
  checkDb(error);
  return NextResponse.json({ id: data }, { status: 201 });
});
