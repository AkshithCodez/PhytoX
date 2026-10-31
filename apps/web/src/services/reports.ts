import "server-only";
import { filterSchema, type Report } from "@/lib/contracts";
import { checkDb, ApiError, context } from "@/lib/server";
export async function reportList(request: Request) {
  const { db } = await context(true);
  const filters = filterSchema.parse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  let query = db
    .from("farmer_reports")
    .select("*,regions(*)")
    .order("created_at", { ascending: false });
  const from =
    filters.from ??
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  query = query.gte("created_at", from + "T00:00:00Z");
  if (filters.to)
    query = query.lt(
      "created_at",
      new Date(Date.parse(filters.to) + 86400000).toISOString(),
    );
  if (filters.region) query = query.eq("region_id", filters.region);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.disease) query = query.eq("disease", filters.disease);
  const { data, error } = await query.limit(1000);
  checkDb(error);
  if (data?.length === 1000)
    throw new ApiError(
      422,
      "narrow_filters",
      "More than 999 reports match. Narrow the date or region filters to get complete results.",
    );
  return (data ?? []) as Report[];
}
