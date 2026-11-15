# Ground ecosystem evaluation — 15 November 2026

## Recommendation

Use the cinematic image as the default ground-level presentation, retaining optimized 3D at `/?ground=3d` for comparison and future creative work. The default and `/?ground=image` use the still. This decision is based on smaller delivery cost, eliminated covered-ground GPU draws, lower observed JS heap, reliable DOM interaction, and little functional value from the ground mesh's subtle camera motion. It is **not** a claim of higher sustained FPS on all devices or of substantially better underlying artwork.

The approved floating-island hero's mesh, transforms, camera path, lighting values, tone mapping, resolution settings, and editorial markup were retained. The transition fades the ground image in through the existing mist, pauses WebGL only when fully covered, then resumes it as the image fades into regional intelligence. Farmer/officer interfaces, backend services, Supabase, and existing source model files were not edited by this task.

## Visual comparison

Open [comparison.html](comparison.html) for before/Option A/Option B screenshots at desktop and mobile dimensions, plus hero → ground → regional continuity.

- [Original desktop](baseline-repeat-desktop-ground.png)
- [Optimized 3D desktop](3d-desktop-ground.png)
- [Image desktop](image-desktop-ground.png)
- [Original mobile viewport](baseline-repeat-mobile-ground.png)
- [Optimized 3D mobile viewport](3d-mobile-ground.png)
- [Image mobile viewport](image-mobile-ground.png)

Both options retain vegetation to the left, a central ground/path area, moss-covered geology, background depth and the clear upper editorial area. The image is a 2× production render of the existing ecosystem with all HUD descendants hidden, using the unchanged source topology and texture-only derivative. The user explicitly approved this source. No stock imagery, generated replacement terrain, or external artwork was introduced. Desktop and portrait stills are separate compositions from the existing camera system, rather than one aggressively cropped landscape image.

The source Meshy asset still has soft/merged foliage, muddy ground detail and a flat mist backdrop. Neither texture resizing nor freezing it into an image fixes these authored limitations. The image preserves a stable composition; 3D retains live perspective and lighting. A substantially more detailed cinematic landscape would require separately approved artwork or art direction beyond this task's preservation constraint.

## Measurement method

Production Next.js/Webpack build, installed headless Chrome, NVIDIA GeForce GTX 1650 via ANGLE/D3D11, local HTTP server on port 3100. Desktop viewport 1440×900 at browser DPR1; mobile viewport 390×844 at browser DPR2, with the existing Canvas mobile DPR1 retained. HTTP cache disabled per browser context. Browser/driver shader caches and OS caches are not guaranteed cold. No concurrent comparison browsers were intentionally run during frame sampling.

Each variant samples two five-second scroll runs over runway progress .48–.55 after visiting hero, ground and regional sections. Instrumentation records requestAnimationFrame cadence, Three renderer draw/triangle counters, CPU duration of `renderer.render`, React root commit notifications, long tasks, JS heap, resource timings and referenced texture dimensions. Raw data is in `baseline.json`, `baseline-repeat.json`, `ablations.json`, `3d.json`, `image.json`, and compact `summary.json`.

The FPS value is **browser animation callback cadence**, not a hardware presentation counter. GPU milliseconds, actual driver VRAM allocation, battery consumption and physical-phone thermal behavior were not measured. Resource timings are local HTTP observations, not mobile-network predictions. Draco/model parsing and texture upload/decoding were not independently timed; the readiness timestamp includes shared scene loading and rendering and must not be attributed solely to the ground asset.

## Before and after: desktop

| Metric | Original repeated baseline | Option A: optimized 3D | Option B: image |
| --- | ---: | ---: | ---: |
| Callback FPS, two runs | 120.1–120.2 | 120.1–120.2 | 120.0–120.2 |
| Frame interval p95 | 8.6–8.7 ms | 8.5 ms | 8.6 ms |
| Draw calls per ground frame | 47 | 18 | 0 |
| Submitted triangles per ground frame | 1,950,888 | 990,132 | 0 |
| Observed JS heap | 93.6–95.3 MiB | 87.9–88.6 MiB | 61.2–61.3 MiB |
| React commits during each scroll sample | 0 | 0 | 0 |
| Main-thread tasks over 50 ms during samples | 0 | 0 | 0 |

The image continues to composite in the browser; zero Three draws does not mean zero graphics work. The shared hero/regional renderer and its assets remain resident for continuity.

## Mobile viewport observations

| Metric | Original repeated baseline | Optimized 3D | Image |
| --- | ---: | ---: | ---: |
| Callback FPS | 120.0–120.1 | 119.2–120.1 | 120.1 |
| Frame interval p95 | 8.5–8.6 ms | 8.5 ms | 8.7 ms |
| Draw calls | 39–40 | 10–11 | 0 |
| Submitted triangles | approximately 1.24 million | approximately 279,000 | 0 |
| Observed JS heap | 93.4–93.7 MiB | 86.6–91.2 MiB | 61.9–62.2 MiB |

This uses the same desktop GPU at a smaller viewport. It does not demonstrate 120 FPS on a smartphone. Defaulting to the image reduces work without relying on unreliable device capability guesses. Real Android/iOS, low-end GPUs and thermal/battery validation remain necessary.

## Loading and memory

| Ground-specific asset | Original | Optimized 3D | Image |
| --- | ---: | ---: | ---: |
| File bytes, desktop | 7,033,764 | 3,543,792 | 413,572 |
| File bytes, mobile | same desktop model was loaded | 3,543,792 | 84,950 |
| Primary mesh topology | 220,000 triangles | same 220,000 | no runtime ground mesh |
| Base/normal texture resolution | 4096×4096 | 2048×2048 | WebP 2880×1800 / 780×1688 |
| Ground request local duration, desktop | 542 ms | 1,132 ms | 6 ms |
| Ground request local duration, mobile viewport | 381 ms | 429 ms | 3 ms |

Optimized 3D was slower to transfer in one local run despite its smaller file. Do not claim a general load-time speedup from those variable timings. The reproducible reductions are file size, ground texture resolution, and removal of the model request in image mode. Browser readiness varied: repeated original desktop/mobile approximately 3.8/3.0 s; optimized 8.2/5.9 s; final image 3.0/2.9 s. These include shared hero work and varying machine load; they are not isolated ground decode benchmarks.

Referenced material textures give a rough RGBA8-with-mipmaps budget of 512 MiB for the original full scene, 384 MiB optimized, and 299 MiB with the runtime ground mesh omitted. These are estimates from texture objects, not measured VRAM: shared image storage, formats, compression, render targets, HDRI and driver allocation complicate the actual total. The image adds approximately 19.8 MiB desktop or 5.0 MiB mobile of decoded RGBA pixels before browser overhead. Exact renderer texture counts are not compared because upload visibility differs between stages.

Original “mobile” ground GLB was 9.37 MB, larger than the 7.03 MB desktop file. It was not selected merely because of its filename. The new derivative retains all non-image bytes, meshes, accessors and Draco geometry; `asset-verification.json` records hashes and executable verification. No source model was overwritten.

## Bottleneck investigation and uncertainty

The first desktop scroll run measured only 22.1–22.3 FPS, p95 approximately 50 ms. Hiding only the primary mesh in that same run restored approximately 120 FPS. However, a fresh repeat and stationary material/shadow ablations all sustained approximately 120 FPS even with the original mesh. The first result demonstrates a transient rendering sensitivity but does **not** establish a repeatable ongoing defect caused solely by that asset. Shader/driver warm-up or system state remain possible explanations; they were not independently proven.

The ground mesh nevertheless has a measurable workload: two 4K textures, 220,000 triangles, repeated shadow rendering, and participation in a scene submitting almost two million triangles. Surrounding scree, shrubs, terrain and observation-station shadows account for much of the remaining geometry. Existing frustum culling and instancing were retained.

React does not re-render per sampled scroll in the final implementation. No sampled long task implicates GSAP as the main sustained bottleneck. Source inspection found both ScrollTrigger updates and a native scroll synchronization path updating HUD styles and reading layout. Their individual CPU costs were not isolated, so GSAP is not declared free or responsible; the approved shared sequence was preserved. A temporary redundant `setFrameloop` update introduced during development was detected by commit counters and corrected before final measurements.

## Implementation details and tradeoffs

- **Option A:** independent lazy ground component, same topology/material treatment, 2K texture derivative, no primary-mesh shadow casting, and cached shadow maps only during the stationary ground close-up. Shadow updates resume outside that interval; hero lights/settings remain unchanged. No geometry simplification was justified without risking foliage detail. KTX2 compression was not added without an existing transcoder/asset pipeline.
- **Option B/default:** clean WebP stills loaded near the approach to ground, a mist-aligned opacity transition and approximately two-pixel CSS drift, with no drift for reduced motion. WebGL pauses only after the still is decoded and fully opaque, then resumes before the regional transition.
- Hotspots remain React buttons, with keyboard activation, expanded state, larger mobile hit areas, responsive cover-coordinate placement and bounded detail panels. No interaction is baked into the still.
- Context loss and scene errors fall back without removing navigation or farmer access. Existing no-WebGL fallback is retained and includes the ground image. The existing 3D hero is not replaced on functioning devices.
- Rendering stops while the document is hidden. There is no per-frame React state update.

## Validation

Production build and strict TypeScript passed. Existing unit/database suite: **41 passed before and after**. Geometry/asset preservation validator passed. **All 8 ground checks pass** after corrections, and **all 12 existing portal checks passed** in the preceding combined run. `verification.json` records exact commands and the initial two failures. Initial browser checks caught a tablet detail-panel overflow, which was corrected, and an early renderer-readiness assumption in the reduced-motion test, which was replaced with an explicit readiness wait. No failing behavior was hidden by removing tests.

The final change only affects third-hotspot tooltip placement below1024px. It does not alter the1440px/390px performance samples, scene renderer, image bytes or texture budget. Build and all eight ground tests were rerun afterward. Owned preview servers were stopped at completion.

VERDICT: PASS

## Reproduction

From the repository root, build with `npm run build`; run the web workspace production server on port3100. From `apps/web` run `node scripts/ground-profile.mjs 3d`, then `node scripts/ground-profile.mjs image` sequentially. `ground-summary.mjs` refreshes the compact ledger; `ground-verify-assets.mjs` validates preserved model data. Baseline files were captured before implementation and must not be regenerated against the new default and mislabeled as original.

Run `npm run test:e2e -- tests/e2e/ground.spec.ts tests/e2e/workspaces.spec.ts` from the repository root for ground behavior and unchanged portal fixture regressions. These portal tests use the existing fixture host and do not claim live Supabase verification.

No dependency installation, trained-model modification, backend change, Supabase change, public deployment, or new terrain generation was performed.
