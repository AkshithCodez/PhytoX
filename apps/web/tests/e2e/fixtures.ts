import type { Page } from "@playwright/test";
export const regionId = "20000000-0000-4000-8000-000000000001",
  diagnosisId = "30000000-0000-4000-8000-000000000001",
  reportId = "40000000-0000-4000-8000-000000000001";
export const region = {
  id: regionId,
  name: "Fixture region",
  latitude: 16.3,
  longitude: 80.4,
};
export const result = {
  schema_version: "1.0",
  status: "success",
  model_version: "TEST-FIXTURE",
  prediction: {
    crop: "Tomato",
    disease: "Fixture condition",
    confidence: 0.72,
  },
  alternatives: [
    { crop: "Tomato", disease: "Other fixture condition", confidence: 0.28 },
  ],
  quality_warnings: [],
  review_recommended: true,
  abstained: false,
  uncertainty_note: "Test fixture, not inference.",
};
export const diagnosis = {
  id: diagnosisId,
  status: "complete",
  result,
  image_path: "test/image",
  image_url: null,
  created_at: new Date().toISOString(),
  error_code: null,
  farmer_reports: [],
};
export const report = {
  id: reportId,
  owner_id: "fixture-user",
  diagnosis_id: diagnosisId,
  region_id: regionId,
  crop: "Tomato",
  disease: "Fixture condition",
  notes: "Test fixture: symptoms recorded for automated UI checks.",
  status: "pending",
  latitude: null,
  longitude: null,
  created_at: new Date().toISOString(),
  version: 1,
  regions: region,
  diagnoses: diagnosis,
  officer_reviews: [],
};
export async function mockApi(page: Page) {
  let submitted = false,
    reviewed = false;
  await page.addInitScript(() => localStorage.setItem("phytox-language", "en"));
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname;
    let data: unknown = {};
    if (path === "/api/status") data = { database: true, model: true };
    else if (path === "/api/regions") data = [region];
    else if (path === "/api/profile")
      data = {
        id: "fixture-user",
        display_name: "Test user",
        role: "farmer",
        language: "en",
        region_id: regionId,
      };
    else if (path === "/api/diagnoses")
      data =
        req.method() === "POST"
          ? diagnosis
          : {
              items: [
                {
                  ...diagnosis,
                  farmer_reports: submitted
                    ? [
                        {
                          id: reportId,
                          status: reviewed ? "verified" : "pending",
                        },
                      ]
                    : [],
                },
              ],
              total: 1,
            };
    else if (path.startsWith("/api/diagnoses/"))
      data = {
        ...diagnosis,
        farmer_reports: submitted
          ? [{ id: reportId, status: reviewed ? "verified" : "pending" }]
          : [],
      };
    else if (path === "/api/reports" && req.method() === "POST") {
      submitted = true;
      data = { id: reportId };
    } else if (path === "/api/reports")
      data = Array.from({ length: 6 }, (_, i) => ({
        ...report,
        id:
          i === 0
            ? reportId
            : `40000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        owner_id: `user-${i % 3}`,
        status: i < 2 || reviewed ? "verified" : "pending",
      }));
    else if (path.startsWith("/api/reports/")) {
      if (req.method() === "PATCH") reviewed = true;
      data = {
        ...report,
        status: reviewed ? "verified" : "pending",
        version: reviewed ? 2 : 1,
        officer_reviews: reviewed
          ? [
              {
                id: "review-fixture",
                status: "verified",
                notes: "Checked the fixture evidence.",
                created_at: new Date().toISOString(),
              },
            ]
          : [],
      };
    } else if (path === "/api/alerts") data = [];
    else if (path === "/api/insights")
      data = {
        counts: [
          { crop: "Tomato", disease: "Fixture condition", observations: 4 },
        ],
        alerts: [],
      };
    else if (path === "/api/export") {
      await route.fulfill({
        contentType: "text/csv",
        body: "id,crop\nfixture,Tomato",
      });
      return;
    }
    await route.fulfill({ json: data });
  });
  // Avoid external tile dependencies in deterministic UI tests.
  await page.route("https://*.tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e9ede5"/><path d="M0 128h256M128 0v256" stroke="#d1dac9"/></svg>',
    }),
  );
}
