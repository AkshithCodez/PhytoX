import { test, expect } from "@playwright/test";
import { mockApi, diagnosisId, reportId } from "./fixtures";
const fixture = "http://127.0.0.1:5173";
const sizes = [
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
for (const [width, height] of sizes)
  test(`workspace component layouts at ${width}×${height} (fixture API)`, async ({
    page,
  }) => {
    await mockApi(page);
    await page.setViewportSize({ width, height });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const path of [
      "/farmer",
      "/farmer/history",
      `/farmer/diagnosis/${diagnosisId}`,
      "/farmer/insights",
      "/farmer/settings",
      "/officer",
      "/officer/reports",
      `/officer/reports/${reportId}`,
      "/officer/map",
      "/officer/monitoring",
      "/officer/analytics",
      "/officer/settings",
    ]) {
      await page.goto(fixture + path);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText("Loading…", { exact: true })).toHaveCount(0);
      if (path === "/officer/map")
        await expect(
          page.locator(".leaflet-marker-icon").first(),
        ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path,
      ).toBe(true);
      if (
        path === "/farmer" ||
        path === "/officer" ||
        (width === 390 && path === "/officer/map")
      )
        await page.screenshot({
          path: `test-results/screenshots/${path.slice(1).replaceAll("/", "-")}-${width}.png`,
          fullPage: true,
        });
    }
    expect(errors).toEqual([]);
  });
test("farmer upload → result → report → history uses connected components (fixture API)", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto(fixture + "/farmer");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlUAAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(
    page.getByRole("button", { name: "Analyze photograph" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Analyze photograph" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved to your private history" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Region", exact: true })
    .selectOption("20000000-0000-4000-8000-000000000001");
  await page
    .getByLabel("What have you observed?")
    .fill("Automated fixture observation.");
  await page.getByLabel(/I consent to sharing/).check();
  await page
    .getByRole("button", { name: "Submit report", exact: true })
    .click();
  await expect(
    page.getByText("Observation submitted for officer review."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Go to history" }).click();
  await expect(page.getByText("Pending review")).toBeVisible();
});
test("officer review updates the record and exposes review history (fixture API)", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto(fixture + `/officer/reports/${reportId}`);
  await page.getByLabel("Review notes").fill("Checked the fixture evidence.");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(
    page.getByText(
      "Review saved. The report status and audit trail have been updated.",
    ),
  ).toBeVisible();
  await expect(page.getByText("Checked the fixture evidence.")).toBeVisible();
});
test("image validation and unavailable model do not invent a result", async ({
  page,
}) => {
  await mockApi(page);
  await page.route("**/api/status", (route) =>
    route.fulfill({ json: { database: true, model: false } }),
  );
  await page.goto(fixture + "/farmer");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("bad"),
    });
  await expect(page.getByRole("alert")).toContainText("Choose a JPEG");
  await expect(
    page.getByRole("button", { name: "Analyze photograph" }),
  ).toBeDisabled();
  await expect(page.getByText("Analysis is not available yet")).toBeVisible();
});
