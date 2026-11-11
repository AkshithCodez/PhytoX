# PhytoX implementation and validation status

Last updated: 5 November 2026 (Asia/Kolkata).

## Current audit outcome

Preserved the existing application and corrected storage authorization, interrupted-processing recovery, malformed inference-key handling, ONNX readiness validation, restricted-storage onboarding, raw quality-warning messages, and mobile officer navigation/review usability. See `ENGINEERING_AUDIT.md`, `UI_UX_REVIEW.md`, `INTEGRATION_STATUS.md`, and `ML_VALIDATION.md` for evidence and boundaries.

| State | Scope |
| --- | --- |
| Completed locally | Targeted code fixes, new policy/recovery migrations, trusted cleanup command, mobile cards/navigation, translated quality advice, audit documents |
| Tested | Production build/TypeScript, local PostgreSQL/unit/component tests, real ONNX/API tests, Chrome fixture/public browser checks recorded below |
| Partially implemented | Localization beyond core farmer copy; maintenance has code but no deployed schedule |
| Blocked by external inputs | Live Supabase/email/storage integration and model field evaluation |
| Not started | Public deployment, production operations, real-device/assistive-technology and broad cross-browser validation |

## Implemented

| Area | Delivered behavior |
| --- | --- |
| Public experience | Responsive landing page, portal entry points, labeled screenshots of the actual interfaces, language selection, privacy/AI limitations page |
| Farmer experience | English/Telugu/Hindi onboarding and preferences; auth/recovery forms; camera/file acquisition; preview/remove/replace; inference request; result, alternatives and uncertainty; paginated/searchable history; consent-based reports; review feedback; regional summaries; settings |
| Officer experience | Server role guard, assigned-region RLS, date/region/disease/status filters, overview, clustered Leaflet map, report inspection, versioned review decisions, review history, charts with data tables, CSV export, monitoring investigations and decisions |
| Persistence | PostgreSQL migration, private storage policies, ownership and region boundaries, trusted-only prediction completion, idempotent writes, audit entries, privacy suppression |
| Inference | FastAPI health/readiness/v1 prediction, request bounds, safe image decoding, TorchScript/ONNX adapters, manifest and fingerprint validation, real supplied ONNX execution, uncertainty heuristics |
| PWA | Manifest, 192/512px icons, safe offline document; no private-response caching or simulated offline submissions |
| Operations | Environment examples, local inference setup script, Dockerfile, API documentation, deployment guide, model card, npm and Python lockfiles |

## Verified

- TypeScript strict checking and a Next.js production build pass.
- **41 Vitest tests pass**, including embedded PostgreSQL authorization/transaction/recovery tests, maintenance CLI tests, multilingual onboarding and quality-message tests.
- **20 Pytest tests pass**, including malformed files/output, unavailable models, unauthorized access, request limits, uncertainty, fingerprint mismatch, ONNX contract rejection, and actual ONNX adapter/API execution.
- **29 Playwright tests pass** on the final build (1.9 minutes). Coverage includes public pages, language persistence, protected unavailable states, farmer upload/report/history, officer review, mobile case navigation, image validation, and automated WCAG A/AA checks on public/scanner/officer overview/report list/review/diagnosis screens.
- Public pages and 13 farmer/officer fixture routes were exercised at 320×720, 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1440×900, and 1920×1080, with no page-level horizontal overflow. Mobile officer observations use cards with visible review actions; desktop retains tables.
- Screenshots were inspected for the public page, mobile farmer interface, desktop officer overview, and mobile map. Browser findings were corrected: text contrast, map cluster module integration, and authentication heading structure.
- The model graph passes ONNX structural checking. Its 38-label mapping matches the adjacent checkpoint. Repeated synthetic-image inference produces a stable valid response through the real API.

## Verification boundaries

Authenticated browser journeys use an isolated fixture host and intercepted API responses. It lives under `apps/web/tests/harness`, is labeled as a test fixture, and is not a Next.js production route. Those journeys verify connected component behavior, **not** live Supabase authentication or persistence.

Database tests execute the real migration in PGlite with minimal Supabase auth/storage schema stand-ins. They verify PostgreSQL enforcement but do not test hosted GoTrue, PostgREST serialization, storage signed URLs, email delivery, or infrastructure configuration. The API normalizes PostgREST's one-to-one diagnosis/report relationship explicitly.

Map tests use deterministic substitute tiles. Real OpenStreetMap network availability and tile-service operating requirements need deployment validation. Automated accessibility checks are not a substitute for screen-reader and physical-device testing. Native camera permission behavior, device PWA installation, translations reviewed by native agricultural specialists, deployment load limits, and cross-browser testing remain unverified.

The Python suite has one upstream Starlette warning about eventual migration of its TestClient transport from `httpx`; tests pass and production serving is unaffected.

## Still required before live use

1. **Supabase project and credentials:** apply the migration/region seed; configure URL, publishable key, and server-only service-role key. No credentials were supplied or invented. Auth, saved history, real report review, and real regional analytics remain unavailable until connected.
2. **Live integration validation:** complete the farmer and officer smoke-test checklist in `DEPLOYMENT.md`, including email confirmation/recovery, cross-account access, storage access, and regional permissions.
3. **Model evaluation:** the discovered local artifact executes, but no validation images, independent evaluation report, calibration, or OOD evaluation are available. Do not claim diagnostic accuracy or deploy as an autonomous treatment/outbreak system.
4. **Hosting and operations:** provision the Next.js, Supabase, and inference hosts; configure HTTPS, keys, backups, monitoring, data retention, support contact, and account deletion handling. No public deployment was made.
5. **Abandoned-upload reconciliation:** tested SQL recovery and a trusted Storage cleanup CLI are implemented. Apply the new migrations, validate against hosted Storage, and schedule the command as documented in `DEPLOYMENT.md`. No scheduler is running here.

## Local model artifact

The discovered ONNX export was copied to `services/inference/models/supplied.onnx` (ignored by Git). Its manifest is tracked, and `scripts/import_onnx.py` recreates the import from the original model and class mapping. Local `.env` files were prepared without printing secrets or overwriting existing settings. The source artifact remains unchanged outside this repository. See the model card for fingerprint, architecture, preprocessing, and limitations.

## Optional techniques intentionally not claimed

No validated plant detector, calibrated unknown-image detector, Grad-CAM attribution, automated treatment advice, or automatic outbreak confirmation. The implementation uses an interpretable monitoring rule and requires human decisions.

## Final command evidence (5 November)

`npm test`: 41 passed. `npm run build`: passed, including strict TypeScript. `.\.venv\Scripts\python.exe -m pytest -q`: 20 passed, one upstream warning. `npm run test:e2e`: 29 passed. No lint script is configured, so lint is not claimed. Database and browser fixture boundaries above still apply.

VERDICT: PASS

This verdict covers the executed local checks, not production readiness or model accuracy.
