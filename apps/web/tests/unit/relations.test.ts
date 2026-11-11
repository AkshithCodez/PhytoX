import { expect, it } from "vitest";
import { normalizeReportRelation } from "@/lib/relations";

it("preserves a submitted report returned as a one-to-one PostgREST object", () => {
  expect(
    normalizeReportRelation({ id: "report-id", status: "verified" }),
  ).toEqual([{ id: "report-id", status: "verified" }]);
});
it("preserves the no-report state and existing array contracts", () => {
  expect(normalizeReportRelation(null)).toEqual([]);
  expect(
    normalizeReportRelation([{ id: "report-id", status: "pending" }]),
  ).toEqual([{ id: "report-id", status: "pending" }]);
});
