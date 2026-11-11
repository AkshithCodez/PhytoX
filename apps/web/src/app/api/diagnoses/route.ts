import { NextResponse } from "next/server";
import { context, route, checkDb } from "@/lib/server";
import { analyze } from "@/services/diagnosis";
import { normalizeReportRelation } from "@/lib/relations";
export const GET = route(async (request) => {
  const { db, user } = await context();
  const url = new URL(request.url);
  const page = Math.max(
    0,
    Math.min(10000, Number(url.searchParams.get("page")) || 0),
  );
  let query = db
    .from("diagnoses")
    .select("*,farmer_reports(id,status)", { count: "exact" })
    .eq("owner_id", user.id)
    .order("created_at", {
      ascending: url.searchParams.get("sort") === "oldest",
    });
  const search = (url.searchParams.get("q") ?? "")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .slice(0, 100);
  if (search)
    query = query.or(
      `result->prediction->>crop.ilike.%${search}%,result->prediction->>disease.ilike.%${search}%`,
    );
  const { data, error, count } = await query.range(page * 24, page * 24 + 23);
  checkDb(error);
  const items = await Promise.all(
    (data ?? []).map(async (d) => ({
      ...d,
      farmer_reports: normalizeReportRelation(d.farmer_reports),
      image_url: d.image_path
        ? (
            await db.storage
              .from("crop-images")
              .createSignedUrl(d.image_path, 300)
          ).data?.signedUrl
        : null,
    })),
  );
  return NextResponse.json({ items, total: count ?? 0 });
});
export const POST = route(async (request) =>
  NextResponse.json(await analyze(request), { status: 201 }),
);
