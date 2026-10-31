import { describe, it, expect } from "vitest";
import { signals, distribution, csvCell } from "@/lib/analytics";
import {
  reportSchema,
  resultSchema,
  profileSchema,
  filterSchema,
} from "@/lib/contracts";
import { en, hi, te } from "@/lib/messages";
import type { Report } from "@/lib/contracts";
const now = Date.parse("2026-10-31T12:00:00Z");
const report = (i: number, extra: Partial<Report> = {}): Report => ({
  id: String(i),
  owner_id: String(i % 3),
  diagnosis_id: String(i),
  region_id: "region-a",
  crop: "Tomato",
  disease: "Test condition",
  notes: "test only",
  status: i < 2 ? "verified" : "pending",
  latitude: null,
  longitude: null,
  created_at: new Date(now - 86400000).toISOString(),
  version: 1,
  ...extra,
});
describe("Monitoring evidence", () => {
  it("requires distinct contributors and verified evidence", () => {
    expect(
      signals(
        Array.from({ length: 5 }, (_, i) => report(i)),
        now,
      ),
    ).toHaveLength(1);
    expect(
      signals(
        Array.from({ length: 5 }, (_, i) => report(i, { owner_id: "same" })),
        now,
      ),
    ).toHaveLength(0);
    expect(
      signals(
        Array.from({ length: 5 }, (_, i) => report(i, { status: "pending" })),
        now,
      ),
    ).toHaveLength(0);
  });
  it("does not combine different crops, diseases or regions", () => {
    expect(
      signals(
        Array.from({ length: 5 }, (_, i) =>
          report(i, { crop: i === 4 ? "Other" : "Tomato" }),
        ),
        now,
      ),
    ).toHaveLength(0);
  });
  it("excludes rejected and future reports and avoids invented growth", () => {
    const input = Array.from({ length: 5 }, (_, i) => report(i));
    expect(signals(input, now)[0].growth).toBeNull();
    expect(
      signals(
        input.map((r) => ({ ...r, status: "rejected" })),
        now,
      ),
    ).toEqual([]);
    expect(
      signals(
        input.map((r) => ({
          ...r,
          created_at: new Date(now + 1).toISOString(),
        })),
        now,
      ),
    ).toEqual([]);
  });
  it("compares separate seven-day periods", () => {
    const input = [
      ...Array.from({ length: 5 }, (_, i) => report(i)),
      report(6, { created_at: new Date(now - 8 * 86400000).toISOString() }),
    ];
    expect(signals(input, now)[0]).toMatchObject({
      recent: 5,
      baseline: 1,
      growth: 4,
    });
  });
  it("aggregates observed counts only", () =>
    expect(distribution([report(1), report(2)], "crop")).toEqual([
      { name: "Tomato", reports: 2 },
    ]));
});
describe("Input contracts", () => {
  const valid = {
    diagnosis_id: "00000000-0000-4000-8000-000000000001",
    region_id: "00000000-0000-4000-8000-000000000002",
    notes: "",
    consent: true,
  };
  it("requires explicit geographic consent and coordinate pairs", () => {
    expect(reportSchema.safeParse(valid).success).toBe(true);
    expect(reportSchema.safeParse({ ...valid, consent: false }).success).toBe(
      false,
    );
    expect(reportSchema.safeParse({ ...valid, latitude: 12 }).success).toBe(
      false,
    );
    expect(
      reportSchema.safeParse({ ...valid, latitude: 100, longitude: 80 })
        .success,
    ).toBe(false);
  });
  it("rejects invalid confidence and incomplete predictions", () =>
    expect(
      resultSchema.safeParse({
        prediction: { crop: "Tomato", disease: "X", confidence: 1.2 },
      }).success,
    ).toBe(false));
  it("strips privilege fields from profile updates", () =>
    expect(
      profileSchema.parse({
        display_name: "Test",
        language: "en",
        region_id: null,
        role: "admin",
      }),
    ).not.toHaveProperty("role"));
  it("rejects reversed date filters", () =>
    expect(
      filterSchema.safeParse({ from: "2026-10-31", to: "2026-10-01" }).success,
    ).toBe(false));
});
it("escapes spreadsheet formulas and quote characters", () => {
  expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
  expect(csvCell("  +1")).toBe('"\'  +1"');
});
it("has complete essential farmer translations", () => {
  expect(Object.keys(te).sort()).toEqual(Object.keys(en).sort());
  expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
});
