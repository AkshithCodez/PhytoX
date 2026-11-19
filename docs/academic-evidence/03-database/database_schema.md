# PhytoX — Comprehensive Database Schema Specification

**Database Engine:** PostgreSQL 15+ (Hosted on Supabase)  
**Schema Model:** Relational with Private Extensions & Schema Isolation  
**Security Model:** 100% Tables Protected by Row Level Security (RLS)  
**Total Tables:** 13 Tables  

---

## 1. Table Inventory & Entity Definitions

### 1. `public.regions`
Stores geographical administrative zones (districts) in which agricultural officers and farmers operate.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`): Unique identifier.
* `name` (`text`, NOT NULL, UNIQUE): Region name (e.g., "Guntur", "Warangal").
* `latitude` (`double precision`, NULLABLE): Centroid latitude ($-90 \le \text{lat} \le 90$).
* `longitude` (`double precision`, NULLABLE): Centroid longitude ($-180 \le \text{lng} \le 180$).

### 2. `public.user_profiles`
Maintains user identity, lifecycle status, contact details, and role metadata linked to Supabase Auth (`auth.users`).
* `id` (`uuid`, Primary Key, References `auth.users(id)` ON DELETE CASCADE).
* `display_name` (`text`, NOT NULL, default `''`, length $\le 100$).
* `role` (`text`, NOT NULL, default `'farmer'`, check `role in ('farmer','officer','admin')`).
* `language` (`text`, NOT NULL, default `'en'`, check `language in ('en','te','hi')`).
* `region_id` (`uuid`, NULLABLE, References `public.regions(id)`).
* `status` (`text`, NOT NULL, default `'active'`, check `status in ('invited','pending_activation','active','suspended','deactivated')`).
* `invited_by` (`uuid`, NULLABLE, References `public.user_profiles(id)`).
* `phone` (`text`, default `''`): Contact number for advisory dispatch.
* `village` (`text`, default `''`): Local village or mandal.
* `farm_size` (`text`, default `''`): Landholding area (e.g., "2.5 Acres").
* `created_at` (`timestamptz`, NOT NULL, default `now()`).

### 3. `public.officer_regions`
Junction table mapping agricultural officers to their assigned administrative districts.
* `officer_id` (`uuid`, References `public.user_profiles(id)` ON DELETE CASCADE).
* `region_id` (`uuid`, References `public.regions(id)` ON DELETE CASCADE).
* Primary Key: `(officer_id, region_id)`.

### 4. `public.diagnoses`
Core state machine tracking farmer analysis requests and private image references.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`).
* `request_key` (`uuid`, NOT NULL): Client idempotency key preventing duplicate billing/uploads.
* `status` (`text`, NOT NULL, default `'processing'`, check `status in ('processing','complete','failed')`).
* `image_path` (`text`, NULLABLE): Storage object path (`crop-images/<owner>/<id>/image`).
* `result` (`jsonb`, NULLABLE): Full structured inference response from ML engine.
* `error_code` (`text`, NULLABLE): Failure diagnosis code.
* `created_at` (`timestamptz`, NOT NULL, default `now()`).
* Constraints: `UNIQUE(owner_id, request_key)`, `CHECK(status <> 'complete' OR (result IS NOT NULL AND image_path IS NOT NULL))`.

### 5. `public.diagnosis_predictions`
Relational breakdown of top-K prediction ranks for SQL aggregation and reporting.
* `diagnosis_id` (`uuid`, References `public.diagnoses(id)` ON DELETE CASCADE).
* `rank` (`smallint`, check `rank between 1 and 5`).
* `crop` (`text`, NOT NULL): Detected crop.
* `disease` (`text`, NOT NULL): Detected pathology.
* `confidence` (`double precision`, NOT NULL, check `confidence between 0 and 1`).
* Primary Key: `(diagnosis_id, rank)`.

### 6. `public.farmer_reports`
Formal disease reports voluntarily submitted by farmers to seek agricultural officer verification.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`).
* `diagnosis_id` (`uuid`, NOT NULL, References `public.diagnoses(id)`, UNIQUE).
* `region_id` (`uuid`, NOT NULL, References `public.regions(id)`).
* `crop` (`text`, NOT NULL).
* `disease` (`text`, NOT NULL).
* `notes` (`text`, NOT NULL, default `''`, length $\le 2000$).
* `consent_at` (`timestamptz`, NOT NULL): Explicit timestamp of farmer privacy consent.
* `latitude` / `longitude` (`double precision`): Optional field coordinates.
* `status` (`text`, NOT NULL, default `'pending'`, check `status in ('pending','verified','rejected','follow_up')`).
* `version` (`integer`, NOT NULL, default 1): Optimistic concurrency token.
* `created_at` (`timestamptz`, NOT NULL, default `now()`).

### 7. `public.officer_reviews`
Immutable audit trail of officer interventions, verification decisions, and notes.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `report_id` (`uuid`, NOT NULL, References `public.farmer_reports(id)`).
* `officer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`).
* `status` (`text`, NOT NULL, check `status in ('verified','rejected','follow_up')`).
* `notes` (`text`, NOT NULL, check `length(notes) between 3 and 2000`).
* `created_at` (`timestamptz`, NOT NULL, default `now()`).

### 8. `public.monitored_plots`
Specific crop plots registered by farmers for longitudinal disease surveillance.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)` ON DELETE CASCADE).
* `name` (`text`, NOT NULL, length between 1 and 100, e.g., "North Acre Plot").
* `crop` (`text`, NOT NULL, length between 1 and 50).
* `region_id` (`uuid`, NOT NULL, References `public.regions(id)`).
* `planting_date` (`date`, NULLABLE).
* `plot_area` (`text`, default `''`).
* `status` (`text`, NOT NULL, default `'active'`, check `status in ('active','archived')`).
* `created_at` / `updated_at` (`timestamptz`, default `now()`).

### 9. `public.monitoring_schedules`
Surveillance cadence configuration (default twice-weekly: Monday and Thursday).
* `plot_id` (`uuid`, Primary Key, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `cadence` (`text`, NOT NULL, default `'twice_weekly'`, check `cadence in ('twice_weekly','weekly','custom')`).
* `observation_days` (`text[]`, default `array['monday','thursday']`).
* `next_due_date` (`date`, NOT NULL).
* `updated_at` (`timestamptz`, default `now()`).

### 10. `public.crop_observations`
Periodic time-series photographic entries submitted for a plot.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `owner_id` (`uuid`, NOT NULL, References `public.user_profiles(id)` ON DELETE CASCADE).
* `observation_date` (`date`, NOT NULL, default `current_date`).
* `image_path` (`text`, NOT NULL).
* `symptoms` (`text[]`, default `array[]::text[]`).
* `notes` (`text`, default `''`, length $\le 2000$).
* `ai_assessment` (`jsonb`, default `'{}'::jsonb`).
* `status` (`text`, NOT NULL, default `'submitted'`, check `status in ('submitted','reviewed','flagged')`).
* `created_at` (`timestamptz`, default `now()`).

### 11. `public.monitoring_signals`
Early-warning indicators triggered by heuristic spatial or temporal cluster rules.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `region_id` (`uuid`, NOT NULL, References `public.regions(id)`).
* `signal_type` (`text`, NOT NULL, check `signal_type in ('recurrent_disease','confidence_shift','symptom_progression','regional_cluster')`).
* `severity` (`text`, NOT NULL, default `'medium'`, check `severity in ('low','medium','high')`).
* `suspected_condition` (`text`, NOT NULL).
* `notes` (`text`, NOT NULL, length between 3 and 2000).
* `status` (`text`, NOT NULL, default `'open'`, check `status in ('open','reviewed','dismissed','advisory_issued')`).
* `created_at` (`timestamptz`, default `now()`).
* `reviewed_by` (`uuid`, NULLABLE, References `public.user_profiles(id)`).
* `reviewed_at` (`timestamptz`, NULLABLE).

### 12. `public.monitoring_advisories`
Targeted agricultural treatment and preventive guidance dispatched by officers to farmers.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `signal_id` (`uuid`, NULLABLE, References `public.monitoring_signals(id)` ON DELETE SET NULL).
* `plot_id` (`uuid`, NOT NULL, References `public.monitored_plots(id)` ON DELETE CASCADE).
* `officer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`).
* `farmer_id` (`uuid`, NOT NULL, References `public.user_profiles(id)`).
* `advisory_text` (`text`, NOT NULL, length between 5 and 3000).
* `recommendations` (`jsonb`, default `'[]'::jsonb`).
* `created_at` (`timestamptz`, default `now()`).

### 13. `public.audit_logs`
Immutable compliance and security log recording administrative actions.
* `id` (`uuid`, Primary Key, default `gen_random_uuid()`).
* `actor_id` (`uuid`, References `public.user_profiles(id)`).
* `action` (`text`, NOT NULL): Action identifier (e.g., `'report_reviewed'`, `'farmer_suspended'`).
* `record_id` (`uuid`, NOT NULL): Affected entity ID.
* `region_id` (`uuid`, References `public.regions(id)`).
* `details` (`jsonb`, default `'{}'`).
* `created_at` (`timestamptz`, default `now()`).
