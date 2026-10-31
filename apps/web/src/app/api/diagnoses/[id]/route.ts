import { NextResponse } from "next/server";
import { z } from "zod";
import { context, route, checkDb, ApiError } from "@/lib/server";
export const GET = route(async (request) => {
  const id = z.uuid().parse(new URL(request.url).pathname.split("/").at(-1));
  const { db } = await context();
  const { data, error } = await db
    .from("diagnoses")
    .select("*,farmer_reports(id,status)")
    .eq("id", id)
    .maybeSingle();
  checkDb(error);
  if (!data) throw new ApiError(404, "not_found", "Diagnosis not found.");
  const image_url = data.image_path
    ? (
        await db.storage
          .from("crop-images")
          .createSignedUrl(data.image_path, 300)
      ).data?.signedUrl
    : null;
  return NextResponse.json({ ...data, image_url });
});
