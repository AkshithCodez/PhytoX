import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mockApi } from "./fixtures";
test("public page has no automated WCAG A/AA violations", async ({ page }) => {
  await page.goto("/");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
test("farmer scanner has no automated WCAG A/AA violations", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("http://127.0.0.1:5173/farmer");
  await expect(
    page.getByRole("heading", {
      name: "A healthier crop starts with a closer look.",
    }),
  ).toBeVisible();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
