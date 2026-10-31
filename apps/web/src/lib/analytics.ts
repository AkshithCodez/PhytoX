import type { Report, Signal } from "./contracts";
export const MONITORING_RULE = {
  days: 7,
  reports: 5,
  reporters: 3,
  verified: 2,
} as const;
export function signals(reports: Report[], now = Date.now()): Signal[] {
  const week = 7 * 24 * 60 * 60 * 1000;
  const groups = new Map<string, { signal: Signal; owners: Set<string> }>();
  for (const r of reports) {
    const age = now - Date.parse(r.created_at);
    if (r.status === "rejected" || age < 0 || age >= 2 * week) continue;
    const key = JSON.stringify([r.region_id, r.crop, r.disease]);
    const g = groups.get(key) ?? {
      signal: {
        region_id: r.region_id,
        crop: r.crop,
        disease: r.disease,
        recent: 0,
        baseline: 0,
        verified: 0,
        reporters: 0,
        growth: null,
      },
      owners: new Set<string>(),
    };
    if (age < week) {
      g.signal.recent++;
      g.owners.add(r.owner_id);
      if (r.status === "verified") g.signal.verified++;
    } else g.signal.baseline++;
    groups.set(key, g);
  }
  return [...groups.values()]
    .map(({ signal: s, owners }) => ({
      ...s,
      reporters: owners.size,
      growth: s.baseline ? (s.recent - s.baseline) / s.baseline : null,
    }))
    .filter(
      (s) =>
        s.recent >= MONITORING_RULE.reports &&
        s.reporters >= MONITORING_RULE.reporters &&
        s.verified >= MONITORING_RULE.verified,
    );
}
export function distribution(
  reports: Report[],
  key: "crop" | "disease" | "status" | "region_id",
) {
  const grouped = new Map<string, number>();
  for (const r of reports) grouped.set(r[key], (grouped.get(r[key]) || 0) + 1);
  return [...grouped]
    .map(([name, reports]) => ({ name, reports }))
    .sort((a, b) => b.reports - a.reports);
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function reportsCsv(reports: Report[]) {
  const columns = [
    "id",
    "crop",
    "disease",
    "status",
    "region_id",
    "created_at",
  ] as const;
  return [
    columns.join(","),
    ...reports.map((r) => columns.map((c) => csvCell(r[c])).join(",")),
  ].join("\r\n");
}
