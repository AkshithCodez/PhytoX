import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewSchema } from "@/lib/contracts";
import { context, route, checkDb, ApiError, jsonBody } from "@/lib/server";
export const GET = route(async (request) => {
  const { db } = await context();
  const id = z.uuid().parse(new URL(request.url).pathname.split("/").at(-1));
  const { data, error } = await db
    .from("farmer_reports")
    .select("*,regions(*),diagnoses(*),officer_reviews(*)")
    .eq("id", id)
    .maybeSingle();
  checkDb(error);
  if (!data) throw new ApiError(404, "not_found", "Report not found.");
  if (data.diagnoses?.image_path)
    data.diagnoses.image_url = (
      await db.storage
        .from("crop-images")
        .createSignedUrl(data.diagnoses.image_path, 300)
    ).data?.signedUrl;
  return NextResponse.json(data);
});
export const PATCH = route(async (request) => {
  const { db } = await context(true);
  const id = z.uuid().parse(new URL(request.url).pathname.split("/").at(-1));
  const v = reviewSchema.parse(await jsonBody(request));
  const { error } = await db.rpc("review_report", {
    p_id: id,
    p_version: v.version,
    p_status: v.status,
    p_notes: v.notes,
  });
  checkDb(error);
  return NextResponse.json({ ok: true });
});
