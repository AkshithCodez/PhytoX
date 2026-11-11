import { z } from "zod";

const reportLink = z.object({ id: z.string(), status: z.string() });

/** PostgREST returns an object for the unique diagnosis_id foreign key. */
export function normalizeReportRelation(value: unknown) {
  if (value == null) return [];
  return z.array(reportLink).parse(Array.isArray(value) ? value : [value]);
}
