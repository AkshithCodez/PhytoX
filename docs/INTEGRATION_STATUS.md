# Integration status — 5 November 2026

## Verified local boundaries

- The production Next.js application renders public routes and honest unavailable states. Protected routes require server authentication and database roles.
- FastAPI executes the supplied 38-class ONNX model. See `ML_VALIDATION.md` for current tests and measured local inference latency.
- PGlite executes the real SQL migrations against minimal auth/storage stand-ins. Database tests check permissions, transactions, ownership, regional boundaries, and maintenance behavior.
- Browser farmer/officer workflows use an explicitly labeled fixture host and intercepted APIs. Those tests do not establish live persistence.
- Maintenance has a trusted CLI and SQL RPC, with database and command tests. No scheduler has been deployed.

## External configuration inspection

The frontend local environment contains inference URL/key and application origin, but no Supabase URL, publishable key, or service-role key. Only presence was inspected; secret values were not printed. Therefore live authentication, email recovery, signed image delivery, report persistence, and farmer-to-officer integration remain blocked by external configuration.

No cloud project, production host, public deployment, or operational monitoring was provisioned. Native camera permissions, installed PWA behavior, physical devices, and cross-browser operation remain unverified.

## Minimal setup checklist

1. Create a dedicated Supabase project; apply **all** `supabase/migrations/*.sql` in filename order and then `supabase/seed.sql`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` in the frontend environment. Configure `APP_ORIGIN` to match the actual URL exactly.
3. Configure authentication callback URLs, confirmation/recovery email delivery, and trusted officer-region provisioning as described in `DEPLOYMENT.md`.
4. Start the inference service with the supplied model and the shared key. Execute the deployment smoke checklist using two farmers and an officer in a nonproduction environment.
5. Schedule the documented reconciliation CLI on a trusted worker; monitor failures and backlog. Validate actual Storage deletion before launch.
6. Provision HTTPS hosting, backups, retention/deletion operations, support, and monitoring. Perform real-device checks and independent model evaluation.

## Demonstration boundaries

Public presentation and fixture UI previews can be demonstrated now. A real saved farmer-to-officer workflow requires the above integration setup. Synthetic model execution proves runtime compatibility, not agricultural accuracy. No credentials, geographic observations, evaluation statistics, or operational records were invented.
