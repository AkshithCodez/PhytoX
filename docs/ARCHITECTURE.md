# PhytoX architecture and implementation plan

## Decisions

One Next.js App Router application, Supabase PostgreSQL/Auth/private Storage, and one internal FastAPI inference service. Ordinary requests use the authenticated user's JWT, so database RLS is a second authorization boundary. A server-only service-role client finalizes inference results; a separate trusted maintenance CLI uses the service role to expire interrupted processing and delete failed uploads. Authenticated users cannot invoke either trusted RPC. Roles and officer region assignments are provisioned by a trusted database administrator, never by signup metadata.

Database design precedes feature queries. Diagnosis completion and report review use transactional database functions. Idempotency keys prevent duplicate diagnosis/report writes. Uploads use UUID paths and private signed reads. Failed inference never becomes a diagnosis success. Region insights aggregate verified reports only with a minimum cohort size; exact locations never enter farmer aggregates.

The initial project directory contained no source or model. After the project was relocated into a nested folder, a sibling `ml` directory was discovered containing a PyTorch checkpoint, ONNX export, ordered 38-class mapping, and preprocessing source. The ONNX export is now imported locally, fingerprinted, and tested through the real inference API. No evaluation dataset, evaluation metrics, or Supabase credentials are available. The adapter supports TorchScript and ONNX, requires an explicit manifest, and fails closed on load/contract/fingerprint errors. Softmax and margins are uncertainty heuristics, not validated out-of-distribution detection. All predictions require expert interpretation.

## Plan and checklist

- [x] Foundation: workspace, theme, contracts, migrations, configuration.
- [x] Public site and multilingual farmer onboarding.
- [x] Authentication, recovery, profiles, server role guards implemented; live Supabase validation remains pending.
- [x] Image upload → inference → saved result → report → history implemented; live persistence remains pending Supabase.
- [x] FastAPI image validation, real ONNX adapter execution, uncertainty and service tests.
- [x] Officer review, maps, filters, charts, signals, CSV exports implemented.
- [x] Browser responsive/accessibility verification and validation report; live external integration limitations recorded in `STATUS.md`.
- [x] Deployment guide; external infrastructure has not been provisioned.

## Visual system

Forest green #163f30, lime #d6ed8b, warm paper #f6f7f2, ink #203b30. Functional colors: amber for uncertainty, red for failure, green for verified observations. System sans-serif fonts with Telugu/Devanagari fallbacks avoid network-dependent font loads. 4/8px spacing, 12/20px corner radii, 44px controls, fluid 320px–1920px layouts. Desktop workspace sidebar; farmer mobile bottom navigation. Motion is subtle and reduced-motion aware. Charts always have textual data equivalents.

## Boundaries

`lib/contracts.ts` validates external input. `lib/server.ts` authenticates and normalizes errors. `services/` orchestrates persistence and inference. PostgreSQL functions own atomic writes and regional authorization. UI reads data through route handlers; no fabricated operational records or client-side privilege claims. PWA caches only an offline document, never private responses or images.

## References checked

- https://nextjs.org/docs/app/getting-started/installation
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/docs/guides/database/postgres/row-level-security
