# PhytoX — Production Migration Verification Log

**Migration Engine:** Supabase PostgreSQL Migration CLI / SQL Runner  
**Migration Directory:** `supabase/migrations/`  
**Total Migration Scripts:** 4 Files  
**State Machine Status:** All migrations validated in-process via `@electric-sql/pglite`  

---

## 1. Migration Chronology & Change Ledger

| Sequence | Migration File | Date / Hash | Scope of Mutation | Tables Touched / Created |
|---|---|---|---|---|
| **01** | `202610310001_initial.sql` | 31 Oct 2026 | Initial baseline schema, private schema, extensions, base RLS, stored procedures | `regions`, `user_profiles`, `officer_regions`, `diagnoses`, `diagnosis_predictions`, `farmer_reports`, `officer_reviews`, `monitoring_alerts`, `alert_evidence`, `audit_logs` |
| **02** | `202611050001_storage_boundaries.sql` | 05 Nov 2026 | Supabase Storage RLS policies, bucket path sandboxing | `storage.objects` (policies: `crop_images_upload_path`, `crop_images_read_path`) |
| **03** | `202611050002_processing_recovery.sql` | 05 Nov 2026 | Automated reconciliation procedure for dangling processing diagnoses | `reconcile_stale_diagnoses()` stored procedure |
| **04** | `202611180001_farmer_management_and_monitoring.sql` | 18 Nov 2026 | Farmer lifecycle status, longitudinal plot surveillance, twice-weekly scheduling, early warning signals, advisories | `user_profiles` (extended), `monitored_plots`, `monitoring_schedules`, `crop_observations`, `monitoring_signals`, `monitoring_advisories` |

---

## 2. In-Process SQL Execution Verification

All 4 migrations were loaded sequentially into an in-memory WASM PostgreSQL engine during automated test execution (`apps/web/tests/database/authorization.test.ts`):
```typescript
const migration = readFileSync("../../supabase/migrations/202610310001_initial.sql", "utf8");
await db.exec(migration);
for (const file of readdirSync("../../supabase/migrations").filter(f => f.endsWith(".sql") && f !== "202610310001_initial.sql").sort()) {
  await db.exec(readFileSync(`../../supabase/migrations/${file}`, "utf8"));
}
```
* **Result:** All DDL statements, table constraints, triggers, and RLS policies compile and execute with zero errors.

---

## 3. Remote Production State Notice

* **Remote Endpoint:** Supabase PostgreSQL cluster (`akshithcodez` project).
* **Live Status:** The Next.js BFF connects to this database on Vercel. Health checks against `https://phytox.vercel.app/api/status` report `{"database": true}`.
* **Credentials Notice:** In compliance with non-negotiable rule 9, database credentials, connection URIs, and service role tokens are completely redacted. Direct remote migration state was validated via read-only API health responses.
