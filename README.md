# PhytoX

**Detect locally. Understand regionally. Respond intelligently.**

A responsive Next.js application for AI-assisted crop assessment and authorized regional disease monitoring. Supabase provides authentication, PostgreSQL, and private image storage. FastAPI provides a separate, versioned inference API.

## Run locally

Requires Node.js 20.9+ (tested with Node 24) and Python 3.11+. From this directory:

```powershell
npm ci
Copy-Item .env.example apps/web/.env.local
npm run dev
```

Open http://127.0.0.1:3000. Without credentials, the public website, language onboarding, and explicit unavailable states work. Private portals do **not** bypass authentication or show invented data.

To connect the application:

1. Create a Supabase project. Apply `supabase/migrations/202610310001_initial.sql`, then `supabase/seed.sql` using the SQL editor or Supabase CLI. The seed contains administrative region names only, no accounts, predictions, or reports.
2. Set the Supabase URL, publishable key, and **server-only** service-role key in `apps/web/.env.local`. Set `APP_ORIGIN` to the exact browser origin, including its port (for example `http://127.0.0.1:3000`). Never prefix the service-role key with `NEXT_PUBLIC_`.
3. Configure Supabase Auth site URL and allow `/auth/callback` plus `/auth/callback?next=/auth/update-password` redirects for your origin. Enable email/password auth and email confirmation; configure a production email provider before launch.
4. Register through the app. New users are always farmers. Provision officers and region assignments using the administrator procedure in `docs/DEPLOYMENT.md`.
5. Start the inference service and configure the same strong `INFERENCE_API_KEY` in both services. Supply a trusted trained TorchScript model and matching manifest to enable analysis.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/inference/requirements.txt
Copy-Item services/inference/.env.example services/inference/.env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir services/inference --env-file services/inference/.env --host 127.0.0.1 --port 8000
```

Without a model, `/health` succeeds, `/ready` reports false, and `/v1/predict` returns an explicit unavailable response. No model weights, labels, evaluation results, or credentials were supplied. See `services/inference/models/README.md` before configuring a model.

## Checks

```powershell
npm run typecheck
npm test
.\.venv\Scripts\python.exe -m pytest -q
npm run build
npm run test:e2e
```

Playwright uses installed Google Chrome and launches the production server plus an isolated component fixture host. The fixture host is in `apps/web/tests/harness` and is **not** part of the production application. Public-page checks exercise the real Next.js app; authenticated component checks use intercepted fixture API responses. These are not a substitute for live Supabase/model integration testing.

Database tests execute the actual migration in embedded PostgreSQL (PGlite), with minimal Supabase auth/storage schema stand-ins. They verify RLS, permissions, transactional workflows, and privacy thresholds. Run deployment smoke tests against an actual Supabase project before production.

## Structure

```text
apps/web/src/app/          Pages, protected layouts, API routes
apps/web/src/components/   Theme, navigation, locale, shared UI
apps/web/src/features/     Farmer and officer workflows
apps/web/src/lib/          Validated contracts, authorization, clients
apps/web/src/services/     Inference and report orchestration
services/inference/       FastAPI, TorchScript adapter, service tests
supabase/                 Migration and administrative region seed
docs/                     Architecture, deployment, API, validation
```

## Important behavior

- Image uploads are limited to 3 MiB in the web app and decoded with a 20-megapixel safety limit. Metadata is removed and images are converted to JPEG before storage/inference.
- Completed analyses are saved automatically. Reporting is a separate consent-based action. Optional coordinates are only shared with authorized officers.
- The server-only service-role client is used exclusively to finalize inference output. User JWTs and RLS protect normal operations.
- Officer review uses optimistic concurrency and an immutable audit history.
- Monitoring needs 5 reports, 3 distinct contributors, and 2 verified observations in 7 days. It never automatically confirms an outbreak.
- Farmer summaries include only verified observations with at least 3 contributing users per crop/disease group.
- PWA offline behavior caches only an offline page, never account data, images, API responses, or background report submissions.

See [docs/STATUS.md](docs/STATUS.md) for verified capabilities and remaining deployment requirements.
