# PhytoX architecture and implementation plan

## Decisions

One Next.js App Router application, Supabase PostgreSQL/Auth/private Storage, and one internal FastAPI inference service. Ordinary requests use the authenticated user's JWT, so database RLS is a second authorization boundary. A server-only service-role client is used exclusively to finalize inference results; authenticated users cannot forge predictions using that RPC. Roles and officer region assignments are provisioned by a trusted database administrator, never by signup metadata.

Database design precedes feature queries. Diagnosis completion and report review use transactional database functions. Idempotency keys prevent duplicate diagnosis/report writes. Uploads use UUID paths and private signed reads. Failed inference never becomes a diagnosis success. Region insights aggregate verified reports only with a minimum cohort size; exact locations never enter farmer aggregates.

No trained model, dataset, class mapping, evaluation results, Supabase credentials, or existing source was supplied. A versioned TorchScript adapter will require an explicit manifest and return unavailable until configured. Softmax and margins are uncertainty heuristics, not validated out-of-distribution detection. All predictions require expert interpretation.

## Plan and checklist

- [ ] Foundation: workspace, theme, contracts, migrations, configuration.
- [ ] Public site and multilingual farmer onboarding.
- [ ] Genuine authentication, recovery, profiles, server role guards.
- [ ] Image upload → inference → saved result → report → history.
- [ ] FastAPI image validation, adapter, uncertainty and tests.
- [ ] Officer review, maps, filters, charts, signals, CSV exports.
- [ ] Build, unit/service tests, browser responsive QA, authorization tests.
- [ ] Deployment guide and honest validation report.

## Visual system

Forest green #163f30, lime #d6ed8b, warm paper #f6f7f2, ink #203b30. Functional colors: amber for uncertainty, red for failure, green for verified observations. System sans-serif fonts with Telugu/Devanagari fallbacks avoid network-dependent font loads. 4/8px spacing, 12/20px corner radii, 44px controls, fluid 320px–1920px layouts. Desktop workspace sidebar; farmer mobile bottom navigation. Motion is subtle and reduced-motion aware. Charts always have textual data equivalents.

## Boundaries

`lib/contracts.ts` validates external input. `lib/server.ts` authenticates and normalizes errors. `services/` orchestrates persistence and inference. PostgreSQL functions own atomic writes and regional authorization. UI reads data through route handlers; no fabricated operational records or client-side privilege claims. PWA caches only an offline document, never private responses or images.

## References checked

- https://nextjs.org/docs/app/getting-started/installation
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security
