import { test, expect } from "@playwright/test";
const sizes = [
  [320, 720],
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];
for (const [width, height] of sizes)
  test(`public site at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /A closer look/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: "Explore the platform" }).click();
    await expect(page.locator("#platform")).toBeInViewport();
    await page.screenshot({
      path: `test-results/screenshots/public-${width}.png`,
      fullPage: true,
    });
  });
test("language onboarding persists before authentication and setup remains honest", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await page.getByRole("button", { name: /తెలుగు/ }).click();
  await page.getByRole("button", { name: "కొనసాగించండి", exact: true }).click();
  await expect(page.getByRole("heading", { name: "సైన్ ఇన్" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "సైన్ ఇన్", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("heading", { name: "సైన్ ఇన్" })).toBeVisible();
  await page.goto("/farmer");
  await expect(
    page.getByRole("heading", {
      name: "మీ కార్యస్థలం అనుసంధానానికి సిద్ధంగా ఉంది",
    }),
  ).toBeVisible();
});
test("private APIs fail closed without configuration and mutation origins are checked", async ({
  request,
}) => {
  expect((await request.get("/api/diagnoses")).status()).toBe(503);
  expect((await request.get("/api/reports")).status()).toBe(503);
  expect(
    (
      await request.post("/api/reports", {
        data: {},
        headers: { origin: "https://untrusted.invalid" },
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/status")).status()).toBe(200);
});
test("authentication, privacy, and recovery routes fit small screens", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("phytox-language", "en"));
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of [
    "/auth/login",
    "/auth/register",
    "/auth/recovery",
    "/auth/update-password",
    "/privacy",
    "/language",
    "/officer",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      path,
    ).toBe(true);
  }
});
