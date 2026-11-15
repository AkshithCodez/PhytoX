import { createRequire } from "module";
import fs from "fs";
import path from "path";

const require = createRequire(
  "C:/Users/reddy/Downloads/GoatFiles/project/Mini Project/PhytoX/PhytoX/apps/web/package.json"
);
const { chromium } = require("@playwright/test");

const OUT_DIR =
  "C:/Users/reddy/.gemini/antigravity/brain/ad2e4f50-6400-4da0-8c3a-3149a97f0ea5/scratch/hybrid_verification";
fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  console.log("Launching Chromium for Hybrid Architecture Verification...");
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: [
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--use-gl=angle",
      "--enable-gpu-rasterization",
      "--no-sandbox",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  const loadedGlbs = [];
  const loadedImages = [];
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.error("[Browser Error]:", msg.text());
    }
  });

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes(".glb")) {
      loadedGlbs.push(url.split("/").pop());
    }
    if (url.includes("/images/cinematic/")) {
      loadedImages.push(url.split("/").pop());
    }
  });

  console.log("Navigating to http://127.0.0.1:3000 ...");
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  console.log("GLBs requested by page:", loadedGlbs);
  console.log("Cinematic images requested:", loadedImages);

  const getScrollMetrics = async (targetP) => {
    return await page.evaluate(async (p) => {
      const runway = document.querySelector(".marketing-cinematic > main > div");
      const runwayLen = runway ? runway.offsetHeight : window.innerHeight * 4.6;
      window.scrollTo(0, p * runwayLen);
      await new Promise((r) => setTimeout(r, 800));

      // Sample 60 frames for FPS
      let frameCount = 0;
      let frameTimes = [];
      let lastTime = performance.now();

      await new Promise((resolve) => {
        function sample(now) {
          const delta = now - lastTime;
          lastTime = now;
          frameTimes.push(delta);
          frameCount++;
          if (frameCount < 60) {
            requestAnimationFrame(sample);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(sample);
      });

      const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const fps = 1000 / avgDelta;

      // Extract Three.js info if available
      let renderInfo = null;
      const canvas = document.querySelector("canvas");
      if (canvas && canvas.__r3f && canvas.__r3f.root) {
        try {
          const gl = canvas.__r3f.root.getState().gl;
          if (gl && gl.info) {
            renderInfo = {
              calls: gl.info.render.calls,
              triangles: gl.info.render.triangles,
              geometries: gl.info.memory.geometries,
              textures: gl.info.memory.textures,
            };
          }
        } catch (e) {}
      }

      return { p, fps, avgDelta, renderInfo };
    }, targetP);
  };

  // 1. Scene 1: Hero
  console.log("Capturing Scene 1 (Hero)...");
  const heroMetrics = await getScrollMetrics(0);
  await page.screenshot({
    path: path.join(OUT_DIR, "01_hero_desktop.png"),
    fullPage: false,
  });

  // 2. Scene 2: Vision
  console.log("Capturing Scene 2 (Vision)...");
  const visionMetrics = await getScrollMetrics(0.22);
  await page.screenshot({
    path: path.join(OUT_DIR, "02_vision_desktop.png"),
    fullPage: false,
  });

  // 3. Scene 3: Ground-Level Ecosystem
  console.log("Capturing Scene 3 (Ground Ecosystem)...");
  const groundMetrics = await getScrollMetrics(0.48);
  await page.screenshot({
    path: path.join(OUT_DIR, "03_ground_ecosystem_desktop.png"),
    fullPage: false,
  });

  // Test Hotspot interaction
  console.log("Testing Hotspot 1 click...");
  const hotspot1Btn = page.locator('button[aria-label*="38 CROP DISEASE CLASSES"]').first();
  if (await hotspot1Btn.isVisible()) {
    await hotspot1Btn.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, "03_ground_hotspot_active.png"),
      fullPage: false,
    });
  }

  // 4. Scene 4: Regional Crop Intelligence
  console.log("Capturing Scene 4 (Regional Crop Intelligence)...");
  const regMetrics = await getScrollMetrics(0.74);
  await page.screenshot({
    path: path.join(OUT_DIR, "04_regional_intelligence_desktop.png"),
    fullPage: false,
  });

  // Test Regional Node click on SVG
  console.log("Testing Regional Map Zone click...");
  const zoneNode = page.locator('text="Northern"').first();
  if (await zoneNode.isVisible()) {
    await zoneNode.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(OUT_DIR, "04_regional_node_active.png"),
      fullPage: false,
    });
  }

  // 5. Scene 5: Solutions Section
  console.log("Capturing Scene 5 (Solutions)...");
  await page.evaluate(() => {
    const el = document.getElementById("solutions");
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT_DIR, "05_solutions_desktop.png"),
    fullPage: false,
  });

  // Mobile testing: 390x844
  console.log("Testing Mobile Viewport (390x844)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);

  await getScrollMetrics(0);
  await page.screenshot({
    path: path.join(OUT_DIR, "06_hero_mobile.png"),
    fullPage: false,
  });

  await getScrollMetrics(0.48);
  await page.screenshot({
    path: path.join(OUT_DIR, "07_ground_ecosystem_mobile.png"),
    fullPage: false,
  });

  await getScrollMetrics(0.74);
  await page.screenshot({
    path: path.join(OUT_DIR, "08_regional_intelligence_mobile.png"),
    fullPage: false,
  });

  // Active scroll performance test: scroll continuously from p=0 to p=1
  console.log("Running Continuous Scroll Performance Benchmark...");
  const scrollPerf = await page.evaluate(async () => {
    const runway = document.querySelector(".marketing-cinematic > main > div");
    const runwayLen = runway ? runway.offsetHeight : window.innerHeight * 4.6;

    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));

    let frameDeltas = [];
    let lastTime = performance.now();
    let isRunning = true;

    function recordFrame(now) {
      if (!isRunning) return;
      frameDeltas.push(now - lastTime);
      lastTime = now;
      requestAnimationFrame(recordFrame);
    }
    requestAnimationFrame(recordFrame);

    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      window.scrollTo(0, (i / steps) * runwayLen);
      await new Promise((r) => setTimeout(r, 16));
    }

    isRunning = false;
    await new Promise((r) => setTimeout(r, 100));

    const avgDelta = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;
    const sorted = [...frameDeltas].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const max = sorted[sorted.length - 1];

    return {
      samples: frameDeltas.length,
      avgFps: 1000 / avgDelta,
      medianMs: sorted[Math.floor(sorted.length * 0.5)],
      p95Ms: p95,
      maxMs: max,
    };
  });

  const report = {
    loadedGlbs,
    loadedImages,
    consoleErrors,
    heroMetrics,
    visionMetrics,
    groundMetrics,
    regMetrics,
    scrollPerf,
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "benchmark_hybrid_results.json"),
    JSON.stringify(report, null, 2)
  );

  console.log("Benchmark Completed Successfully!");
  console.log("Results Summary:", JSON.stringify(report, null, 2));

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
