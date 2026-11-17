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

test.describe("PhytoX Live Real-Browser End-to-End Workflow", () => {
  const runId = Date.now();
  const farmerEmail = `live.farmer.${runId}@phytox-verify.test`;
  const officerEmail = `live.officer.${runId}@phytox-verify.test`;
  const testPassword = "PhytoX_BrowserLive_2026!";

  let farmerId = "";
  let officerId = "";

  test.beforeAll(async () => {
    // Provision unique Farmer for this run
    const { data: fUser, error: fErr } = await adminClient.auth.admin.createUser({
      email: farmerEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { display_name: "Live Farmer Ramesh" },
    });
    if (fErr) throw fErr;
    farmerId = fUser.user.id;

    // Provision unique Officer for this run
    const { data: oUser, error: oErr } = await adminClient.auth.admin.createUser({
      email: officerEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { display_name: "Dr. Rao (Guntur Officer)" },
    });
    if (oErr) throw oErr;
    officerId = oUser.user.id;

    // Promote officer in user_profiles and assign to Guntur
    await adminClient.from("user_profiles").update({ role: "officer" }).eq("id", officerId);
    await adminClient.from("officer_regions").insert({
      officer_id: officerId,
      region_id: GUNTUR_REGION_ID,
    });
  });

  test.afterAll(async () => {
    // Cleanup records and accounts
    try {
      const { data: reports } = await adminClient
        .from("farmer_reports")
        .select("id, diagnosis_id")
        .eq("owner_id", farmerId);
      for (const r of reports || []) {
        await adminClient.from("officer_reviews").delete().eq("report_id", r.id);
        await adminClient.from("audit_logs").delete().eq("record_id", r.id);
        await adminClient.from("farmer_reports").delete().eq("id", r.id);
        await adminClient.from("diagnosis_predictions").delete().eq("diagnosis_id", r.diagnosis_id);
        await adminClient.from("diagnoses").delete().eq("id", r.diagnosis_id);
      }
      if (farmerId) await adminClient.auth.admin.deleteUser(farmerId);
      if (officerId) await adminClient.auth.admin.deleteUser(officerId);
    } catch {
      // ignore
    }
  });

  test("Real browser farmer login, live ONNX leaf diagnosis, report submission, and officer verification", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // Pre-seed language choice so LanguageGate does not block
    await page.addInitScript(() => {
      localStorage.setItem("phytox-language", "en");
    });

    // 1. Farmer Login via Web UI
    await page.goto("/auth/login?portal=farmer");
    await expect(page.locator("h1")).toContainText(/Sign in|Log in/i, { timeout: 15000 });

    await page.locator('input[type="email"]').fill(farmerEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.locator('button[type="submit"], button.button.full').click();

    // Should redirect to /farmer
    await expect(page).toHaveURL(/\/farmer/, { timeout: 20000 });
    await expect(page.locator(".avatar")).toHaveAttribute("title", /Farmer Ramesh/i, { timeout: 10000 });
    await expect(page.locator("body")).toContainText("Farmer workspace");

    // 2. Upload Real Leaf Image
    const leafPath = path.resolve(process.cwd(), "public/images/farmers-leaf.jpg");
    await page.setInputFiles('input[type="file"][accept*="jpeg"]', leafPath);

    // Verify image preview appears
    await expect(page.locator(".image-preview, img[alt*='scan']")).toBeVisible({ timeout: 10000 });

    // 3. Click Run Diagnosis
    const analyzeBtn = page.locator('button:has-text("Analyze photograph"), button:has-text("analyze")').first();
    await expect(analyzeBtn).toBeEnabled({ timeout: 10000 });
    await analyzeBtn.click();

    // 4. Wait for Real ONNX Model Result
    await expect(page).toHaveURL(/\/farmer\/diagnosis\//, { timeout: 45000 });
    await expect(page.locator("body")).toContainText(/Strawberry|Tomato|Apple|Healthy|Blight|Leaf/i, { timeout: 15000 });

    // Screenshot farmer diagnosis result directly to artifacts directory
    const artifactsDir = "C:/Users/reddy/.gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5";
    await page.screenshot({
      path: path.join(artifactsDir, "live_farmer_diagnosis_browser.png"),
      fullPage: true,
    });

    // 5. Submit Report to Officer
    const regionSelect = page.locator('form select, select[required]');
    await expect(regionSelect).toBeVisible({ timeout: 10000 });
    await regionSelect.selectOption({ label: "Guntur" });

    const notesInput = page.locator('form textarea');
    await notesInput.fill("Observed spreading leaf spots after recent rain in Guntur district.");

    const consentBox = page.locator('form input[type="checkbox"]').first();
    await consentBox.check();

    const submitReportBtn = page.locator('form button:has-text("Submit report"), form button:has-text("Submit")').first();
    await submitReportBtn.click();

    // Verify confirmation notice
    await expect(page.locator("body")).toContainText(/submitted|pending|Observation and reviews|View report/i, { timeout: 15000 });

    // 6. Navigate to officer login
    await page.goto("/auth/login?portal=officer");
    await expect(page.locator("h1")).toContainText(/Sign in|Log in/i, { timeout: 15000 });

    await page.locator('input[type="email"]').fill(officerEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.locator('button[type="submit"], button.button.full').click();

    // Should redirect to /officer
    await expect(page).toHaveURL(/\/officer/, { timeout: 20000 });

    // 7. Navigate to Reports Queue
    await page.goto("/officer/reports");
    await expect(page.locator("body")).toContainText(/Guntur|Strawberry|Tomato|Pending|Apple|Healthy/i, { timeout: 20000 });

    // Click into first report
    const viewReportLink = page.locator('a[href*="/officer/reports/"]:visible').first();
    await expect(viewReportLink).toBeVisible({ timeout: 10000 });
    await viewReportLink.click();

    await expect(page).toHaveURL(/\/officer\/reports\/[a-f0-9-]+/, { timeout: 15000 });

    // 8. Record Officer Verification Decision
    const reviewForm = page.locator('form');
    await expect(reviewForm).toBeVisible({ timeout: 10000 });

    const statusSelect = reviewForm.locator('select');
    await statusSelect.selectOption("verified");

    const officerNotes = reviewForm.locator('textarea');
    await officerNotes.fill("Live browser verified: diagnosis and field photo confirmed. Advisory issued for Guntur.");

    const saveReviewBtn = reviewForm.locator('button:has-text("Save review")');
    await saveReviewBtn.click();

    // Verify updated status badge / success notice
    await expect(page.locator("body")).toContainText(/Review saved|verified/i, { timeout: 15000 });

    // Screenshot officer verified detail directly to artifacts directory
    await page.screenshot({
      path: path.join(artifactsDir, "live_officer_verified_browser.png"),
      fullPage: true,
    });
  });
});
