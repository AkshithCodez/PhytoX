# PhytoX — work completed across both sessions

Updated: 1 November 2026 (Asia/Kolkata).

This document consolidates the implementation session and the continuation session. It records delivered code, fixes, verification, and remaining external setup. Test counts are the latest recorded results, not a claim that hosted integrations have been tested.

## Project location and objective

Current repository: `C:\Users\reddy\Downloads\GoatFiles\project\Mini Project\PhytoX\PhytoX`.

The original workspace was the parent `PhytoX` directory. On continuation, the generated project was found in this nested repository and subsequent work used that location.

The supplied specification called for an actual crop-assessment and regional-monitoring application: Next.js frontend, Supabase authentication/database/private storage, separate FastAPI inference, farmer and officer workflows, English/Telugu/Hindi, maps, charts, tests, and deployment documentation. Unavailable integrations must remain explicit rather than display fabricated production data.

## Session 1 — application implementation

### Foundation and interface

- Created an npm workspace with a Next.js/React/TypeScript web application and a separate Python inference service.
- Added strict TypeScript, Tailwind styling, shared components, validated contracts, and client/server Supabase helpers.
- Built a responsive green/paper/lime visual system with an original botanical SVG illustration.
- Built public landing, language selection, privacy/AI limitations, authentication, recovery, and password-update pages.
- Implemented desktop navigation and farmer mobile bottom navigation, responsive layouts, accessible controls, and clear empty/loading/error states.
- Centralized English, Telugu, and Hindi interface messages. Language selection persists locally and profile preferences can persist when Supabase is connected.
- Added a PWA manifest, generated icons, and an offline document. The service worker does not cache private responses or simulate offline submissions.

### Authentication and access control

- Implemented Supabase registration, login, logout, email callback, password recovery, and session refresh.
- Added server-side user and database-role checks for protected farmer/officer layouts.
- Kept protected layouts dynamic so user-specific state is not statically rendered.
- New accounts are farmers; officer privileges and assigned regions require trusted administrative provisioning.
- Missing Supabase configuration produces an explicit setup/unavailable state without an authentication bypass.

### Farmer workflows

- Built dashboard/scanner, history, diagnosis detail, reporting, insights, and settings screens.
- Added image acquisition through file/camera controls, image preview, replacement/removal, validation, and real request progress states.
- Added server image decoding, rotation, EXIF stripping, and JPEG re-encoding before private upload.
- Enforced bounded request bodies, a 3 MiB web upload limit, and a 20-megapixel decode limit.
- Connected inference orchestration, validated result contracts, transactional prediction completion, and failure cleanup attempts.
- Displayed confidence, alternative predictions, uncertainty, abstention, and review notes.
- Added private saved history with search/filter/sort/pagination and signed image access.
- Added consent-based farmer reports with optional coordinates, review feedback, and privacy-suppressed regional insights.

### Officer workflows

- Built overview, map, report list/detail, monitoring, analytics, and settings screens.
- Added assigned-region access checks and date/region/disease/status filters.
- Implemented verify/reject/follow-up decisions with expected-version checks, review history, and audit records.
- Added Leaflet marker clustering, authorized coordinates, and explicitly identified region-center fallback locations.
- Added Recharts analytics with accessible table alternatives and CSV export protected against spreadsheet formula injection.
- Implemented interpretable monitoring thresholds: at least five reports, three contributors, and two verified reports in seven days, with comparison against the preceding seven-day period.
- Added investigation evidence, human confirmation/dismissal, and audited monitoring decisions.

### Database and storage

- Created `supabase/migrations/202610310001_initial.sql` and a region-only seed, with no fabricated accounts or disease reports.
- Added regions, user profiles, officer-region assignments, diagnoses, predictions, farmer reports, officer reviews, monitoring alerts, alert evidence, and audit logs.
- Added foreign keys, constraints, indexes, row-level security, ownership boundaries, regional access, and limited profile-update permissions.
- Added transactional RPCs for diagnosis reservation/completion, report submission/review, regional insights/alerts, and investigation lifecycle.
- Restricted prediction completion to the server-only service-role client; ordinary user workflows use user credentials and RLS.
- Added idempotency and diagnosis reservation limits, optimistic review concurrency, and aggregate suppression below three contributors.
- Configured private crop-image storage policies for ownership, processing uploads, officer reads, and failed-upload deletion.

### Inference service and operational hardening

- Built FastAPI health, readiness, and prediction endpoints with shared-key authentication.
- Added bounded request/image sizes, safe PIL decoding, format/frame/dimension checks, and exposure/resolution warnings.
- Added validated model manifests, TorchScript support, output validation, confidence/margin heuristics, bounded concurrency, and safe unavailable/error responses.
- Kept model results review-recommended and did not claim a calibrated unknown-image detector or validated treatment advice.
- Added origin checks, security headers, server-secret separation, environment examples, dependency locks, and a non-root Dockerfile.
- Documented API contracts, architecture, local setup, deployment, officer provisioning, and operational cleanup requirements.

### Bugs resolved during implementation and QA

- Switched Next.js development/build commands to Webpack after Turbopack CSS workers failed in this Windows environment.
- Fixed Leaflet marker-cluster initialization by loading the Leaflet default export and awaiting the plugin.
- Improved muted-text and decorative-number contrast.
- Corrected authentication heading structure and the unfocused skip-link presentation.
- Corrected multilingual and region-selector test locators.
- Verified protected layouts remain dynamic and missing services never silently produce fake successful workflows.

## Session 2 — continuation, real model integration, and final verification

### Repository and model discovery

- Located the relocated nested repository and continued without replacing the existing implementation.
- Discovered an adjacent `ml` directory containing an ONNX model, PyTorch checkpoint, ordered 38-class mapping, and training/export/preprocessing source.
- Inspected source and model metadata without executing the external training code or unpickling the checkpoint.
- Used static checkpoint metadata inspection to verify that its 38 class names match `class_info.json`.
- Validated the ONNX graph and its input/output tensor contract. The graph is consistent with the supplied MobileNetV2 classifier.
- Confirmed the documented preprocessing: RGB, bilinear resize to 224×224, division by 255, and ImageNet mean/standard-deviation normalization.
- Left the source artifacts unchanged.

### Real ONNX integration

- Extended the inference manifest and adapter to support ONNX as well as TorchScript, with optional SHA-256 verification.
- Added CPU ONNX Runtime execution, bounded threading, and tensor/output validation.
- Added `services/inference/requirements-onnx.txt` and updated the Python dependency lock.
- Added `services/inference/scripts/import_onnx.py` to import the trusted artifact and ordered label mapping reproducibly.
- Copied the model into ignored local storage at `services/inference/models/supplied.onnx`; its manifest is tracked.
- Added `scripts/configure_local.py` to prepare compatible local service settings and a generated shared key while preserving existing configuration. Secret values were not printed.
- Prepared ignored frontend/inference environment files. Supabase credentials were not supplied or invented.
- Updated the Dockerfile and model card with runtime requirements, provenance, preprocessing, fingerprint, and evaluation limitations.
- Exercised the actual model and FastAPI prediction endpoint using deterministic synthetic input; added regression coverage for fingerprint mismatch.

Model version: `local-onnx-fde9536ff18a`.

SHA-256: `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`.

Successful inference demonstrates that the artifact loads and the pipeline executes. No independent validation dataset, accuracy report, calibration study, or field evaluation was available.

### Final application fixes and presentation

- Fixed the diagnosis/report relationship boundary: PostgREST can serialize a unique foreign-key relation as an object, while the UI expects an array.
- Added `apps/web/src/lib/relations.ts` to normalize object/null/array responses and applied it to both diagnosis API endpoints.
- Added regression tests for relationship normalization.
- Added labeled farmer/officer interface preview images to the public page. These come from the isolated test fixture and are explicitly identified as previews rather than live operational data.
- Updated README, architecture/deployment documentation, model documentation, and `docs/STATUS.md` to reflect the actual final state.

## Verification completed

| Check | Recorded outcome |
| --- | --- |
| Strict TypeScript | Passed |
| Next.js production build | Passed |
| Vitest web/database suite | 29 tests passed |
| Python inference suite | 16 tests passed |
| Full Playwright suite | 23 tests passed |
| Final public/accessibility rerun after preview changes | 13 targeted tests passed |
| ONNX graph and real synthetic-input execution | Passed |
| Git whitespace/diff check | Passed; line-ending warnings only |

Public pages were exercised at widths 320, 360, 390, 768, 1024, 1366, 1440, and 1920 pixels. Farmer/officer component routes were checked at seven requested viewport dimensions from 360×800 through 1920×1080. Page-level horizontal overflow was checked; wide tables scroll within their containers.

Browser coverage includes language persistence, protected unavailable states, farmer upload/result/report/history, officer review, invalid images, unavailable inference, and automated WCAG A/AA checks on the public page and scanner. Screenshots were inspected for the public page, mobile farmer interface, officer overview, and mobile map.

### What these checks do and do not establish

- Authenticated browser journeys run in an isolated, visibly labeled fixture host with intercepted API responses. They verify component workflows, not hosted Supabase integration.
- Database tests execute the real migration in PGlite with minimal Supabase auth/storage schema stand-ins. They verify PostgreSQL permissions, RLS, transactional behavior, privacy thresholds, and audit transitions.
- Hosted GoTrue, PostgREST, storage signed URLs, email delivery, and real account-to-account flows still require live validation.
- Map tests use deterministic substitute tiles; real tile availability and operational terms require deployment validation.
- Automated accessibility checks do not replace screen-reader, physical-device, or cross-browser review.
- Native-camera permissions, real-device PWA installation, and translations reviewed by agricultural language specialists remain unverified.
- Python tests report one upstream Starlette TestClient transport deprecation warning; the suite passes.

## Remaining work before live use

1. Provision Supabase, apply the migration/seed, and supply its URL, publishable key, and server-only service-role key.
2. Configure authentication callbacks, confirmation/recovery email delivery, officer accounts, and region assignments.
3. Run the live farmer/officer integration checklist in `docs/DEPLOYMENT.md`, including cross-account and storage-access checks.
4. Evaluate the model against independent, representative real images; measure accuracy, calibration, and out-of-distribution behavior before operational diagnostic claims.
5. Provision frontend and inference hosting, HTTPS, backups, monitoring, retention, support, and account-deletion operations. No public deployment was performed.
6. Deploy a maintenance scheduler to reconcile stale processing records/private uploads after process interruptions. Ordinary inference failures attempt cleanup, but no scheduled reconciler is running.

No validated plant detector, Grad-CAM explanation, calibrated unknown-image detector, automatic treatment recommendation, or automatic outbreak confirmation is claimed. Monitoring decisions require human review.

## Local startup

From the nested repository directory:

```powershell
npm run dev
```

In a second terminal, after installing the documented ONNX requirements:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir services/inference --env-file services/inference/.env --host 127.0.0.1 --port 8000
```

The frontend uses `http://127.0.0.1:3000`. A running preview server is not guaranteed by this handoff. Without Supabase settings, public pages and explicit setup states are available, while private workflows remain unavailable.

## Main handoff files

- `README.md`: setup, startup, checks, and repository structure.
- `docs/STATUS.md`: implementation matrix, evidence, and outstanding setup.
- `docs/ARCHITECTURE.md`: application structure and implementation checklist.
- `docs/API.md`: endpoint contracts and errors.
- `docs/DEPLOYMENT.md`: infrastructure setup, trusted officer provisioning, smoke tests, and operations.
- `services/inference/models/README.md`: model card and evaluation boundaries.
- `supabase/tests/README.md`: database test scope and limitations.

No assistant-created commit or public deployment was made. The repository contained a user-created baseline when continuation began; continuation changes remain available locally for review. Credentials and model weights are excluded from Git.
