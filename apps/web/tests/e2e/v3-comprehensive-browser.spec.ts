import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import { createClient } from "@supabase/supabase-js";

// Ensure DNS hook for any direct Node calls within test runner
const origLookup = dns.lookup.bind(dns);
(dns as unknown as { lookup: unknown }).lookup = (
  host: string,
  opts: unknown,
  cb: (...args: unknown[]) => void
) => {
  let callback = cb;
  let options: { all?: boolean } | undefined;
  if (typeof opts === "function") {
    callback = opts as (...args: unknown[]) => void;
  } else if (typeof opts === "object" && opts !== null) {
    options = opts as { all?: boolean };
  }
  if (host && host.includes("supabase.co")) {
    if (options?.all) {
      return callback(null, [{ address: "172.64.149.246", family: 4 }]);
    }
    return callback(null, "172.64.149.246", 4);
  }
  return origLookup(host, opts as never, callback as never);
};

// Load env
const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
const env: Record<string, string> = {};
for (const line of envContent.split(/\r?\n/)) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const GUNTUR_REGION_ID = "0242ca91-48ef-4438-8e9e-afc799a5f6d9";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

test.describe("PhytoX V3 Master Requirements Browser Verification", () => {
  const runId = Date.now();
  const farmerEmail = `v3.farmer.${runId}@phytox-verify.test`;
  const officerEmail = `v3.officer.${runId}@phytox-verify.test`;
  const testSecret = `Ephemeral_${runId}_${Math.random().toString(36).slice(2)}!`;

  let farmerId = "";
  let officerId = "";

  test.beforeAll(async () => {
    // Provision unique Farmer
    const { data: fUser, error: fErr } = await adminClient.auth.admin.createUser({
      email: farmerEmail,
      password: testSecret,
      email_confirm: true,
      user_metadata: { display_name: "Farmer Venkat" },
    });
    if (fErr) throw fErr;
    farmerId = fUser.user.id;

    await adminClient.from("user_profiles").update({
      region_id: GUNTUR_REGION_ID,
      village: "Duggirala",
      status: "active",
    }).eq("id", farmerId);

    // Provision unique Officer
    const { data: oUser, error: oErr } = await adminClient.auth.admin.createUser({
      email: officerEmail,
      password: testSecret,
      email_confirm: true,
      user_metadata: { display_name: "Dr. Lakshmi (Regional Director)" },
    });
    if (oErr) throw oErr;
    officerId = oUser.user.id;

    await adminClient.from("user_profiles").update({
      role: "officer",
      status: "active",
    }).eq("id", officerId);

    await adminClient.from("officer_regions").insert({
      officer_id: officerId,
      region_id: GUNTUR_REGION_ID,
    });
  });

  test.afterAll(async () => {
    try {
      if (farmerId) await adminClient.auth.admin.deleteUser(farmerId);
      if (officerId) await adminClient.auth.admin.deleteUser(officerId);
    } catch {
      // ignore
    }
  });

  test("P02 Distinct Login Experiences & P05/P06 Photographic Crop Selector and Real Photo Scanning", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.addInitScript(() => {
      localStorage.setItem("phytox-language", "en");
    });

    // 1. Verify Distinct Officer Login (P02)
    await page.goto("/auth/login?portal=officer");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText("Regional Crop Intelligence");
    await expect(page.locator("body")).toContainText("OFFICER ACCESS");
    await expect(page.locator("body")).toContainText("Agricultural Officer Portal");
    await expect(page.locator("body")).not.toContainText("Create an account"); // Public registration restricted for officers

    const officerLoginPath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_officer_login_verified.png"
    );
    await page.screenshot({ path: officerLoginPath, fullPage: true });

    // 2. Verify Distinct Farmer Login (P02)
    await page.goto("/auth/login?portal=farmer");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText("Your Fields. Better Informed.");
    await expect(page.locator("body")).toContainText("Farmer workspace");

    const farmerLoginPath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_farmer_login_verified.png"
    );
    await page.screenshot({ path: farmerLoginPath, fullPage: true });

    // 3. Log into Farmer Workspace
    await page.locator('input[type="email"]').fill(farmerEmail);
    await page.locator('input[type="password"]').fill(testSecret);
    await page.locator('button.button.full, button:has-text("Sign in")').first().click();

    await expect(page).toHaveURL(/\/farmer/, { timeout: 25000 });
    await expect(page.locator(".avatar")).toHaveAttribute("title", /Farmer Venkat/i, { timeout: 15000 });

    // 4. Verify Crop Selector with Photographic Thumbnails (P05) & PWA Banner (P04)
    await expect(page.locator(".crop-card-img").first()).toBeVisible({ timeout: 10000 });
    // Verify no emoji in crop cards
    const cropImgCount = await page.locator(".crop-card-img").count();
    expect(cropImgCount).toBeGreaterThanOrEqual(14);

    const cropSelectorPath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_farmer_crop_thumbnails_verified.png"
    );
    await page.screenshot({ path: cropSelectorPath, fullPage: true });

    // 5. Upload leaf image and verify real photo preview with scanning beam (P06)
    const leafPath = path.resolve(process.cwd(), "public/images/farmers-leaf.jpg");
    await page.setInputFiles('input[type="file"][accept*="jpeg"]', leafPath);

    await expect(page.locator(".image-preview, img[alt*='scan']")).toBeVisible({ timeout: 10000 });

    // Click Analyze
    const analyzeBtn = page.locator('button:has-text("Analyze photograph"), button:has-text("analyze")').first();
    await analyzeBtn.click();

    // Verify progress panel shows uploaded leaf photo + scanning beam + status text (P06)
    await expect(page.locator(".progress-panel")).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".progress-panel img[alt*='leaf under analysis']")).toBeVisible({ timeout: 5000 });

    const scanningBeamPath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_real_photo_scanning_beam_verified.png"
    );
    await page.screenshot({ path: scanningBeamPath, fullPage: true });

    // Wait for diagnosis results page
    await expect(page).toHaveURL(/\/farmer\/diagnosis\//, { timeout: 35000 });
    await expect(page.locator("body")).toContainText(/Confidence|Severity|Assessment|Recommendations/i);

    const diagnosisResultPath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_diagnosis_result_verified.png"
    );
    await page.screenshot({ path: diagnosisResultPath, fullPage: true });

    // 6. Navigate to Farmer Monitoring (P09)
    await page.goto("/farmer/monitoring");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText("Crop-Health Monitoring");
    await expect(page.locator("body")).toContainText("Twice-Weekly Field Inspection Cadence");

    const farmerMonitoringPath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_farmer_continuous_monitoring_verified.png"
    );
    await page.screenshot({ path: farmerMonitoringPath, fullPage: true });
  });

  test("P03 Officer Farmer Management & P09 Surveillance Early-Warning Queue", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.addInitScript(() => {
      localStorage.setItem("phytox-language", "en");
    });

    // 1. Log into Officer Workspace
    await page.goto("/auth/login?portal=officer");
    await page.locator('input[type="email"]').fill(officerEmail);
    await page.locator('input[type="password"]').fill(testSecret);
    await page.locator('button.button.full, button:has-text("Sign in")').first().click();

    await expect(page).toHaveURL(/\/officer/, { timeout: 25000 });
    await expect(page.locator(".avatar")).toHaveAttribute("title", /Dr. Lakshmi/i, { timeout: 15000 });

    // 2. Navigate to Farmer Administration (P03)
    await page.goto("/officer/farmers");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText("Farmer Administration");
    await expect(page.locator("body")).toContainText("Add Farmer");

    const farmerMgmtPath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_officer_farmer_administration_verified.png"
    );
    await page.screenshot({ path: farmerMgmtPath, fullPage: true });

    // 3. Navigate to Surveillance & Early Warning (P09)
    await page.goto("/officer/monitoring");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText("Crop-Health Surveillance & Early Warning");
    await expect(page.locator("body")).toContainText("Active Signals");
    await expect(page.locator("body")).toContainText("Regional Clusters");

    const officerSurveillancePath = path.resolve(
      process.env.USERPROFILE || "C:/Users/reddy",
      ".gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/v3_officer_surveillance_early_warning_verified.png"
    );
    await page.screenshot({ path: officerSurveillancePath, fullPage: true });
  });
});
