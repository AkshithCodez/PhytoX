# Deployment and operations

## Supabase

Apply the migration as a trusted project database administrator. Use a dedicated Supabase project for this app: the migration revokes default public-schema table/function access before granting narrowly scoped permissions. Apply the region seed or supply your own real region catalog. Do not use test fixture records in production.

Officers must first register an ordinary account. Confirm the user's identity through your organization's process, then run an administrator-only transaction (replace the example IDs with actual users/regions):

```sql
begin;
update public.user_profiles set role = 'officer' where id = '<verified-user-uuid>';
insert into public.officer_regions(officer_id,region_id)
values ('<verified-user-uuid>','<authorized-region-uuid>');
commit;
```

Remove assignments to revoke regional access; set role back to `farmer` to revoke all officer access. Provision `admin` only through the same trusted database process. There is no public role-management endpoint or self-assignment field. The SQL operator should retain their own provisioning audit through the hosting platform.

Verify email confirmation, recovery redirect URLs, SMTP delivery, password policy, and Auth rate limits. Enforce HTTPS and configure your deployment's exact origin. Review Supabase backups and recovery procedures. Set a real support contact, retention policy, and account/data deletion procedure before public use; those require deployment-specific decisions.

## Next.js / Vercel

Use repository root as the project root so npm workspaces and the lockfile are respected. Install with `npm ci`, build with `npm run build`, and configure the Next.js output from `apps/web`. Alternatively use Vercel's monorepo support with the project root `apps/web` and include workspace files outside that root. Confirm these settings in a preview deployment before production.

Environment values:

| Variable                             | Scope            | Purpose                                              |
| ------------------------------------ | ---------------- | ---------------------------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL             | Browser + server | Project endpoint                                     |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Browser + server | Publishable API key; RLS remains mandatory           |
| SUPABASE_SERVICE_ROLE_KEY            | Server only      | Trusted prediction completion, never general queries |
| APP_ORIGIN                           | Server only      | Exact approved mutation origin                       |
| INFERENCE_URL                        | Server only      | Reachable HTTPS inference host                       |
| INFERENCE_API_KEY                    | Server only      | Shared, strong inference credential                  |

The web upload limit is 3 MiB, keeping multipart requests below Vercel's typical 4.5 MB request limit. Analysis has a 60-second upstream timeout; choose a hosting plan with a suitable function duration. For slower models, introduce a durable job queue rather than increasing user-facing synchronous timeouts indefinitely. Verify actual host limits at deployment time.

The checked build uses Webpack (`next build --webpack`) because this Windows environment's Turbopack CSS worker failed to start. No application behavior depends on that bundler choice.

## Inference hosting

Use Python 3.11+, install the locked service dependencies, and add the CPU or GPU PyTorch distribution appropriate to your host via `requirements-model.txt`. Keep the inference host private where possible; otherwise use TLS, a strong service key, ingress rate limits, and resource limits. Set `MODEL_PATH` and `MODEL_MANIFEST` to trusted artifacts mounted read-only. Do not accept serialized models from users. `/ready` is false until both the adapter and service key are configured.

The included Dockerfile runs a non-root CPU service. It does not include PyTorch or model weights; extend it with your tested runtime and mount model files. Requests are capped before multipart parsing. CPU inference is serialized per adapter, with two concurrent requests admitted per worker. Use one worker initially to avoid duplicating model memory. Add structured metrics/alerts and load testing before scaling.

## Partial failures and cleanup

Inference errors mark the diagnosis failed and attempt to remove the uploaded image. An interrupted server process or ambiguous upload failure can leave a `processing` record and private image. A deployment maintenance job should reconcile records older than the maximum processing window and remove abandoned images. Do not mark an active request failed. This scheduler is not deployed by this repository.

History remains honest about incomplete/failed analyses. Successful results and predictions are saved together in a database transaction. Review status, review notes, and audit entries are also transactional. Repeated diagnosis request keys and repeated report submissions cannot create duplicate records.

## Release smoke test (requires configured services)

1. Register two farmers, confirm their emails, sign in/out, recover a password, and verify persistent sessions after refresh.
2. Configure an evaluated real model; analyze a known validation image and compare output to offline inference. Also submit unrelated and poor-quality images and assess abstention limitations.
3. Verify the image is private, EXIF metadata is removed, and user B cannot access user A's history or storage object.
4. Submit with/without optional coordinates. Confirm reporting requires consent and duplicate submissions create one report.
5. Assign an officer to one region, verify report/image visibility there only, and exercise verify/reject/follow-up. Check stale review conflict behavior.
6. Add sufficient **test-environment** evidence to investigate a signal, then confirm/dismiss it. Verify the audit trail and farmer summary threshold.
7. Check map tile access, CSV export, camera acquisition, multilingual text, PWA installation, offline fallback, and the target viewport sizes on physical devices.
8. Configure monitoring, backups, retention, key rotation, deletion handling, and a public support contact. Never promote fixture test outcomes to production efficacy claims.
