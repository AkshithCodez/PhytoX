# PhytoX — Database Architecture, Schema Specification & Security Audit

**Document Identifier:** `09_DATABASE_AND_SECURITY.md`  
**Classification:** Database Architecture & Relational Security Audit  
**Database Engine:** PostgreSQL 15+ (Hosted on Supabase)  
**Security Standard:** 100% Tables Protected by Row Level Security (RLS)  
**Dynamic Test Verification:** 18 In-Engine Authorization Tests via PGlite (`authorization.test.ts`)  
**Confidence Status:** VERIFIED FROM REPOSITORY MIGRATIONS & TEST SUITE  

---

## 1. Database Architecture & Design Principles

The PhytoX database layer is designed around relational integrity, strict least-privilege authorization, and high auditability:
1. **Schema Partitioning:** Application data lives in `public`. Security helper functions (`is_admin`, `can_review`, `can_read_diagnosis`) are strictly quarantined inside a `private` schema with execution permissions revoked from public and anonymous callers.
2. **Default-Deny Authorization:** Default table grants are revoked (`revoke all on all tables in schema public from anon, authenticated`). Access is granted selectively via explicit RLS policies and `SECURITY DEFINER` stored procedures.
3. **Optimistic Concurrency Control:** Critical state transitions (such as officer report reviews) utilize integer `version` tokens to prevent race conditions during simultaneous reviews.
4. **Differential Privacy Enforcement:** Aggregated regional analytics enforce k-anonymity directly inside SQL queries, preventing identity disclosure of contributing growers.

---

## 2. Complete Inventory of Database Tables

The schema comprises exactly **13 relational tables** established across migrations in `supabase/migrations/`:

### Table 1: `public.regions`
* **Purpose:** Stores geographical administrative zones (districts) defining officer operational jurisdictions.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `name` (`text`, NOT NULL, UNIQUE, e.g., "Guntur", "Warangal", "Karimnagar")
  - `latitude` (`double precision`, NULLABLE, check `-90 <= latitude <= 90`)
  - `longitude` (`double precision`, NULLABLE, check `-180 <= longitude <= 180`)
* **RLS Policies:** `regions_read` (Permits select to `authenticated` users).

### Table 2: `public.user_profiles`
* **Purpose:** Extends Supabase Auth (`auth.users`) with application roles, contact details, and jurisdiction assignments.
* **Columns:**
  - `id` (`uuid`, Primary Key, References `auth.users(id)` ON DELETE CASCADE)
  - `display_name` (`text`, NOT NULL, default `''`, length $\le 100$)
  - `role` (`text`, NOT NULL, default `'farmer'`, check `role in ('farmer','officer','admin')`)
  - `language` (`text`, NOT NULL, default `'en'`, check `language in ('en','te','hi')`)
  - `region_id` (`uuid`, NULLABLE, References `public.regions(id)`)
  - `status` (`text`, NOT NULL, default `'active'`, check `status in ('invited','pending_activation','active','suspended','deactivated')`)
  - `invited_by` (`uuid`, NULLABLE, References `public.user_profiles(id)`)
  - `phone` (`text`, default `''`)
  - `village` (`text`, default `''`)
  - `farm_size` (`text`, default `''`)
  - `created_at` (`timestamptz`, NOT NULL, default `now()`)
* **RLS Policies:**
  - `profile_read`: Self-read (`id = auth.uid()`), Admin read (`private.is_admin()`), or Officer read for farmers within their assigned regions (`role = 'farmer' and region_id in (select region_id from officer_regions where officer_id = auth.uid())`).
  - `profile_update`: Self-update (`id = auth.uid()`).
  - `officer_manage_farmer`: Officers can update farmer status within their assigned regions.

### Table 3: `public.officer_regions`
* **Purpose:** Junction table mapping agricultural officers to their assigned administrative districts.
* **Columns:**
  - `officer_id` (`uuid`, References `public.user_profiles(id)` ON DELETE CASCADE)
  - `region_id` (`uuid`, References `public.regions(id)` ON DELETE CASCADE)
  - Primary Key: `(officer_id, region_id)`
* **RLS Policies:** Read permitted to authenticated users. Modifications restricted to admins.

### Table 4: `public.diagnoses`
* **Purpose:** Tracks diagnostic inference requests, processing state, private image references, and cached prediction JSON.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`)
  - `request_key` (`uuid`, NOT NULL): Client idempotency key.
  - `status` (`text`, NOT NULL, default `'processing'`, check `status in ('processing','complete','failed')`)
  - `image_path` (`text`, NULLABLE): Storage object path (`<owner>/<id>/image`).
  - `result` (`jsonb`, NULLABLE): Complete structured inference response from ML engine.
  - `error_code` (`text`, NULLABLE): Error code on failure.
  - `created_at` (`timestamptz`, NOT NULL, default `now()`)
* **Constraints:** `UNIQUE(owner_id, request_key)`, `CHECK(status <> 'complete' OR (result IS NOT NULL AND image_path IS NOT NULL))`.
* **RLS Policies:** `diagnosis_read` via `private.can_read_diagnosis(id)` (Farmer reads own diagnoses; officer reads diagnosis ONLY if attached to an active report in their assigned district). Direct client insert/update/delete denied; modified strictly via `SECURITY DEFINER` stored procedures.

### Table 5: `public.diagnosis_predictions`
* **Purpose:** Relational normalization of top-5 predicted classes for SQL querying and aggregation.
* **Columns:**
  - `diagnosis_id` (`uuid`, References `public.diagnoses(id)` ON DELETE CASCADE)
  - `rank` (`smallint`, check `rank between 1 and 5`)
  - `crop` (`text`, NOT NULL)
  - `disease` (`text`, NOT NULL)
  - `confidence` (`double precision`, NOT NULL, check `confidence between 0 and 1`)
  - Primary Key: `(diagnosis_id, rank)`
* **RLS Policies:** Read permitted if parent diagnosis is readable (`private.can_read_diagnosis(diagnosis_id)`).

### Table 6: `public.farmer_reports`
* **Purpose:** Formal observations voluntarily submitted by farmers requesting official officer verification.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`)
  - `diagnosis_id` (`uuid`, NOT NULL, References `public.diagnoses(id)`, UNIQUE)
  - `region_id` (`uuid`, NOT NULL, References `public.regions(id)`)
  - `crop` (`text`, NOT NULL)
  - `disease` (`text`, NOT NULL)
  - `notes` (`text`, NOT NULL, default `''`, length $\le 2000$)
  - `consent_at` (`timestamptz`, NOT NULL): Explicit timestamp of privacy consent.
  - `latitude` / `longitude` (`double precision`, NULLABLE): Optional field coordinates.
  - `status` (`text`, NOT NULL, default `'pending'`, check `status in ('pending','verified','rejected','follow_up')`)
  - `version` (`integer`, NOT NULL, default 1): Optimistic concurrency token.
  - `created_at` (`timestamptz`, NOT NULL, default `now()`)
* **RLS Policies:** `reports_read` (`owner_id = auth.uid() or private.can_review(region_id)`). Direct writes handled via `submit_report()` and `review_report()`.

### Table 7: `public.officer_reviews`
* **Purpose:** Immutable audit trail of human agronomist verification decisions and clinical notes.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `report_id` (`uuid`, NOT NULL, References `public.farmer_reports(id)`)
  - `officer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`)
  - `status` (`text`, NOT NULL, check `status in ('verified','rejected','follow_up')`)
  - `notes` (`text`, NOT NULL, check `length(notes) between 3 and 2000`)
  - `created_at` (`timestamptz`, NOT NULL, default `now()`)
* **RLS Policies:** `reviews_read` (Readable by report owner or officer with review rights in that region).

### Table 8: `public.monitored_plots`
* **Purpose:** Agricultural plots enrolled by farmers for longitudinal disease surveillance.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)` ON DELETE CASCADE)
  - `name` (`text`, NOT NULL, check `length(name) between 1 and 100`)
  - `crop` (`text`, NOT NULL, check `length(crop) between 1 and 50`)
  - `region_id` (`uuid`, NOT NULL, References `public.regions(id)`)
  - `planting_date` (`date`, NULLABLE)
  - `plot_area` (`text`, default `''`)
  - `status` (`text`, NOT NULL, default `'active'`, check `status in ('active','archived')`)
  - `created_at` / `updated_at` (`timestamptz`, default `now()`)
* **RLS Policies:** `plots_read` (`owner_id = auth.uid() or private.can_review(region_id)`), `plots_insert` (`owner_id = auth.uid()`).

### Table 9: `public.monitoring_schedules`
* **Purpose:** Observation scheduling parameters and dynamic next due dates.
* **Columns:**
  - `plot_id` (`uuid`, Primary Key, References `public.monitored_plots(id)` ON DELETE CASCADE)
  - `cadence` (`text`, NOT NULL, default `'twice_weekly'`, check `cadence in ('twice_weekly','weekly','custom')`)
  - `observation_days` (`text[]`, default `array['monday','thursday']`)
  - `next_due_date` (`date`, NOT NULL)
  - `updated_at` (`timestamptz`, default `now()`)
* **RLS Policies:** Enforces plot ownership or officer regional review authority.

### Table 10: `public.crop_observations`
* **Purpose:** Periodic time-series photographic entries submitted for monitored plots.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE)
  - `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)` ON DELETE CASCADE)
  - `observation_date` (`date`, NOT NULL, default `current_date`)
  - `image_path` (`text`, NOT NULL)
  - `symptoms` (`text[]`, default `array[]::text[]`)
  - `notes` (`text`, default `''`, length $\le 2000$)
  - `ai_assessment` (`jsonb`, default `'{}'::jsonb`)
  - `status` (`text`, NOT NULL, default `'submitted'`, check `status in ('submitted','reviewed','flagged')`)
  - `created_at` (`timestamptz`, default `now()`)
* **RLS Policies:** `observations_read` (`owner_id = auth.uid() or exists (monitored_plots where private.can_review)`), `observations_insert` (`owner_id = auth.uid()`).

### Table 11: `public.monitoring_signals`
* **Purpose:** System-generated early-warning indicators triggered by heuristic recurrence and clustering rules.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE)
  - `region_id` (`uuid`, NOT NULL, References `public.regions(id)`)
  - `signal_type` (`text`, NOT NULL, check `signal_type in ('recurrent_disease','confidence_shift','symptom_progression','regional_cluster')`)
  - `severity` (`text`, NOT NULL, default `'medium'`, check `severity in ('low','medium','high')`)
  - `suspected_condition` (`text`, NOT NULL)
  - `notes` (`text`, NOT NULL, length between 3 and 2000)
  - `status` (`text`, NOT NULL, default `'open'`, check `status in ('open','reviewed','dismissed','advisory_issued')`)
  - `created_at` (`timestamptz`, default `now()`)
  - `reviewed_by` (`uuid`, NULLABLE, References `public.user_profiles(id)`)
  - `reviewed_at` (`timestamptz`, NULLABLE)
* **RLS Policies:** Readable by assigned regional officers (`private.can_review(region_id)`) or the plot owner.

### Table 12: `public.monitoring_advisories`
* **Purpose:** Official agronomical guidance dispatched by officers back to growers.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `signal_id` (`uuid`, NULLABLE, References `public.monitoring_signals(id)` ON DELETE SET NULL)
  - `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE)
  - `officer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`)
  - `farmer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`)
  - `advisory_text` (`text`, NOT NULL, length between 5 and 3000)
  - `recommendations` (`jsonb`, default `'[]'::jsonb`)
  - `created_at` (`timestamptz`, default `now()`)
* **RLS Policies:** Readable by the recipient farmer (`farmer_id = auth.uid()`), the issuing officer, or authorized regional officers.

### Table 13: `public.audit_logs`
* **Purpose:** Immutable compliance and security log recording all administrative mutations.
* **Columns:**
  - `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  - `actor_id` (`uuid`, References `public.user_profiles(id)`)
  - `action` (`text`, NOT NULL, e.g., `'report.review'`, `'farmer.status_change'`, `'alert.open'`)
  - `record_id` (`uuid`, NOT NULL)
  - `region_id` (`uuid`, References `public.regions(id)`)
  - `details` (`jsonb`, default `'{}'`)
  - `created_at` (`timestamptz`, default `now()`)
* **RLS Policies:** Selectable by authorized regional officers or admins. Direct insert/update/delete strictly denied to clients.

---

## 3. Stored Procedures & Transactional RPCs

1. `reserve_diagnosis(p_key uuid)`:
   - Security: `SECURITY DEFINER set search_path = ''`.
   - Behavior: Idempotent initialization of a diagnosis row. Verifies caller is authenticated, checks for existing `(owner_id, request_key)`, and creates or returns the processing record.
2. `finish_diagnosis(p_id uuid, p_owner uuid, p_result jsonb, p_error text)`:
   - Security: Executable **strictly by `service_role`**; explicitly revoked from `authenticated` and `anon`.
   - Behavior: Atomically commits inference results or records failure codes.
3. `submit_report(p_diagnosis uuid, p_region uuid, p_notes text, p_consent boolean, p_lat float, p_lng float)`:
   - Behavior: Validates explicit consent (`if not p_consent then raise exception...`), verifies diagnosis ownership and completion, extracts top-1 predicted crop/disease, and creates `farmer_reports` with `version = 1`.
4. `review_report(p_id uuid, p_version integer, p_status text, p_notes text)`:
   - Behavior: Validates officer regional jurisdiction (`private.can_review`), enforces optimistic concurrency locking on `p_version`, records review in `officer_reviews`, updates report status, and logs audit trail.
5. `regional_insights(p_region uuid)`:
   - Behavior: Computes 30-day verified disease counts enforcing k-anonymity (`having count(distinct r.owner_id) >= 3`).

---

## 4. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    REGIONS ||--o{ USER_PROFILES : "contains"
    REGIONS ||--o{ OFFICER_REGIONS : "assigned_to"
    REGIONS ||--o{ FARMER_REPORTS : "located_in"
    REGIONS ||--o{ MONITORED_PLOTS : "encompasses"
    REGIONS ||--o{ MONITORING_SIGNALS : "surveils"
    REGIONS ||--o{ AUDIT_LOGS : "audits"

    USER_PROFILES ||--o{ OFFICER_REGIONS : "supervises"
    USER_PROFILES ||--o{ DIAGNOSES : "owns"
    USER_PROFILES ||--o{ FARMER_REPORTS : "submits"
    USER_PROFILES ||--o{ OFFICER_REVIEWS : "authors"
    USER_PROFILES ||--o{ MONITORED_PLOTS : "operates"
    USER_PROFILES ||--o{ CROP_OBSERVATIONS : "records"
    USER_PROFILES ||--o{ MONITORING_ADVISORIES : "receives_or_issues"
    USER_PROFILES ||--o{ AUDIT_LOGS : "triggers"

    DIAGNOSES ||--o{ DIAGNOSIS_PREDICTIONS : "yields"
    DIAGNOSES ||--o| FARMER_REPORTS : "escalated_into"

    FARMER_REPORTS ||--o{ OFFICER_REVIEWS : "reviewed_by"

    MONITORED_PLOTS ||--|| MONITORING_SCHEDULES : "governed_by"
    MONITORED_PLOTS ||--o{ CROP_OBSERVATIONS : "tracks"
    MONITORED_PLOTS ||--o{ MONITORING_SIGNALS : "generates"
    MONITORED_PLOTS ||--o{ MONITORING_ADVISORIES : "targeted_by"

    MONITORING_SIGNALS ||--o| MONITORING_ADVISORIES : "resolves_into"
```

---

## 5. Row Level Security Audit & Verification Evidence

The security implementation was verified dynamically using **PGlite** (in-process WebAssembly PostgreSQL) in `apps/web/tests/database/authorization.test.ts`.

### Test Summary (18 Tests Passed, 100% Success):
* **Tenant Isolation:** Farmer A attempting to select Farmer B's diagnoses returns 0 rows.
* **Storage Sandboxing:** Farmer inserting an image path outside `auth.uid() || '/%'` fails closed.
* **Jurisdiction Barrier:** Officer assigned to Region 1 attempting to view or review reports from Region 2 receives empty sets or HTTP 403 authorization exceptions.
* **Privileged Escalation Denial:** Authenticated client calling `finish_diagnosis` or `reconcile_stale_diagnoses` directly is blocked with permission denied.
* **Optimistic Concurrency:** Concurrent reviews with mismatched `version` tokens abort with conflict error `40001`.
