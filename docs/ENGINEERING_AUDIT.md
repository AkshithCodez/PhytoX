# Engineering audit — 5 November 2026

## Scope and preservation

Audited the existing nested PhytoX repository, its route/auth boundaries, database migration and tests, private upload workflow, monitoring/analytics, inference contract, UI and deployment documentation. Existing uncommitted work was identified and preserved. No reset, duplicate application, model replacement, public deployment, or commit was performed. Original migration history is unchanged; fixes are new migrations.

## Findings and corrective actions

| Priority | Finding | Action and evidence |
| --- | --- | --- |
| P1 storage integrity | Upload policy accepted extra nested objects for one reserved diagnosis, circumventing the intended one-image boundary | New `202611050001_storage_boundaries.sql` requires the exact owner/diagnosis/image path. A regression first reproduced the unauthorized extra upload, then passed with the policy fix. |
| P1 reliability | Failed images lacked SELECT visibility needed for filtered owner DELETE, preventing ordinary cleanup | Owner-only failed-image read policy and canonical delete policy. Regression verifies other farmers cannot read/delete and owner deletion succeeds. |
| P1 operational recovery | Process interruption could leave diagnoses processing indefinitely and retain private objects | New `202611050002_processing_recovery.sql` and trusted CLI expire stale processing records and retry failed-image removal. Tests cover role denial, bounds, retry, recent/completed protection, and Storage API failures. Scheduler remains undeployed. |
| P2 inference | Non-ASCII API-key input raised an authentication exception | Compare byte sequences; regression verifies 401. |
| P2 inference | Incompatible fixed batch dimensions/output types could pass readiness | Validate single/dynamic batch and float output. Three regressions verify fail-closed loading. |
| P2 mobile usability | Officer table review actions and sixth navigation destination were offscreen | Mobile observation cards and all six navigation items; browser regression covers review navigation and current-page semantics. |
| P2 onboarding | Restricted localStorage could crash language selection | In-memory fallback with denied-storage regression. |
| P2 farmer clarity | Quality warnings displayed raw service codes | Centralized English/Telugu/Hindi advice with safe unknown-code fallback and three locale regressions. |
| P2 setup | Example APP_ORIGIN used localhost while documented dev server uses 127.0.0.1 | Corrected example origin; exact-origin mutation protection retained. |

## Confirmed strengths and architecture assessment

One shared Next.js app, separated inference service, centralized validation and messages, and feature-oriented components remain appropriate. No wholesale rewrite or additional runtime dependency was justified. Server user/role checks and RLS provide separate boundaries. Signup metadata cannot grant officer privileges. Review writes use expected versions and transactionally record audit history. Inference completion remains server-only. Private image reads use owner/assigned-region authorization, and farmer regional aggregates suppress small cohorts.

Report queries refuse results at the configured 1,000-row cap instead of silently presenting incomplete totals. CSV cells quote values and neutralize leading formula characters. Monitoring uses distinct contributors, verified counts, seven-day windows and a prior-window comparison; officers must investigate/confirm signals. Map fallback positions are identified as region centers rather than invented farmer coordinates. These are code/local-test findings, not live cloud guarantees.

## Recovery safety

Maintenance is a command for trusted operators, not a public endpoint. The database function checks the service role, bounds each batch, locks eligible processing rows with `FOR UPDATE SKIP LOCKED`, and changes only records older than 15 minutes. This serializes against prediction completion. Recent and completed records are untouched. Only canonical paths belonging to failed diagnoses are returned; the CLI validates paths and uses the Storage API to remove bytes. Failed storage deletions remain retryable. Overlapping workers may attempt the same failed-image deletion; no completed-image candidate is selected. SQL never deletes storage metadata directly.

This is bounded recovery for the current synchronous 60-second inference workflow. It is not a durable asynchronous job queue. Production scheduling, actual Storage semantics, backlog monitoring, and termination/concurrency tests against hosted services remain required. Old noncanonical objects created before the policy fix require a separate operator inventory; they are deliberately not broadly deleted by this command.

## Verification ledger

- `npm test`: **41 passed**, six files, after final storage/recovery changes. Covers actual migrations in PGlite plus unit/component regressions.
- `.\.venv\Scripts\python.exe -m pytest -q`: **20 passed**, one upstream Starlette deprecation warning; supplied ONNX execution is included.
- `npm run build`: passed, including TypeScript and route generation. `npm run test:e2e`: **29 passed** on that build in 1.9 minutes, covering all eight requested viewport dimensions.
- `node --env-file=apps/web/.env.local apps/web/scripts/reconcile.mjs`: safe configuration message and exit 1 with missing Supabase credentials. No live deletion attempted.
- `git check-ignore`: both local environment files and ONNX weights remain ignored.
- No standalone lint configuration/script exists; lint is not claimed. TypeScript and build validation are separate checks.

One sandbox test invocation failed before collecting tests due to Windows temporary-file rename permissions. The approved unsandboxed run executed successfully. Earlier regression failures reproduced the two storage defects before the new migration; no test was removed to hide them.

## Remaining priorities

1. **Blocked, external configuration:** Supabase URL/keys, callback/email settings, trusted officer provisioning, live farmer-to-officer and cross-account validation. See `INTEGRATION_STATUS.md`.
2. **Blocked, data:** independently labeled field and unrelated-image evaluation; synthetic model execution does not establish accuracy. See `ML_VALIDATION.md`.
3. **Partially implemented:** maintenance code is tested locally, scheduling and live Storage deletion are not deployed.
4. **Partially implemented:** core farmer localization exists; officer copy, model class names, some errors and domain terminology require additional localization/expert review.
5. **Not started in this audit:** production hosting/HTTPS, backup recovery drills, retention/account deletion operations, load testing, independent penetration testing, physical-device camera/PWA checks, and screen-reader/cross-browser verification.

The audit improves the local product and documents its boundaries. It does not certify production readiness.
