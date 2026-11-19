# PhytoX — Row Level Security (RLS) & Authorization Audit

**Audit Methodology:** Static Policy Inspection + Dynamic In-Engine Role Simulation  
**Test Suite:** `apps/web/tests/database/authorization.test.ts` (18 passing tests)  
**Security Rating:** HIGH ASSURANCE (100% tables gated by RLS; default-deny public grants)  

---

## 1. Security Architecture & Threat Model

In PhytoX, the client application interacts with PostgreSQL using scoped JWTs (`anon`, `authenticated`, or `service_role`). All operational tables reside in `public`, but default privileges are revoked:
```sql
revoke all on all tables in schema public from anon, authenticated;
grant select on ... to authenticated;
```
Direct writes (INSERT/UPDATE/DELETE) on critical tables like `diagnoses`, `diagnosis_predictions`, and `officer_reviews` are denied to ordinary authenticated users and can only be executed via `SECURITY DEFINER` stored procedures.

---

## 2. Policy-by-Policy Audit Table

| Table | Policy Name | Permitted Roles | Policy Predicate (`USING` / `WITH CHECK`) | Security Objective |
|---|---|---|---|---|
| `regions` | `regions_read` | authenticated | `true` | Public read of district zones for selection |
| `user_profiles` | `profile_read` | authenticated | `id = auth.uid() OR private.is_admin() OR (role='farmer' AND region_id IN (...officer_regions))` | Prevents cross-farmer stalking; allows officers to see farmers in their region |
| `user_profiles` | `profile_update` | authenticated | `id = auth.uid()` | Self-profile update only (language, name) |
| `user_profiles` | `officer_manage_farmer` | authenticated | `role='farmer' AND region_id IN (...officer_regions)` | Officers can suspend/reactivate farmers strictly within their jurisdiction |
| `diagnoses` | `diagnosis_read` | authenticated | `private.can_read_diagnosis(id)` | Farmer reads only own diagnoses; officer reads diagnosis ONLY if attached to a submitted report in their region |
| `farmer_reports` | `reports_read` | authenticated | `owner_id = auth.uid() OR private.can_review(region_id)` | Farmer reads own reports; officer reads reports within their assigned region |
| `officer_reviews` | `reviews_read` | authenticated | `EXISTS (farmer_reports WHERE r.owner_id=auth.uid() OR private.can_review(r.region_id))` | Farmer sees review on their report; officer sees reviews in their region |
| `monitored_plots` | `plots_read` | authenticated | `owner_id = auth.uid() OR private.can_review(region_id)` | Privacy isolation of farmer crop plots |
| `monitored_plots` | `plots_insert` | authenticated | `owner_id = auth.uid()` | Prevents spoofing plot ownership |
| `crop_observations` | `observations_read` | authenticated | `owner_id = auth.uid() OR (monitored_plots WHERE private.can_review)` | Time-series photo surveillance isolation |
| `monitoring_signals` | `signals_read` | authenticated | `private.can_review(region_id) OR (monitored_plots WHERE owner_id=auth.uid())` | Outbreak signal privacy |
| `monitoring_advisories`| `advisories_read` | authenticated | `farmer_id = auth.uid() OR officer_id = auth.uid() OR private.can_review` | Targeted advisory delivery |
| `storage.objects` | `crop_images_upload_path` | authenticated | `bucket_id = 'crop-images' AND name LIKE auth.uid() || '/%'` | Prevents uploading into other farmers' folders |
| `storage.objects` | `crop_images_read_path` | authenticated | `bucket_id = 'crop-images' AND (owner OR officer in region)` | Private photo access control |

---

## 3. Dynamic RLS Test Scenarios Executed

All scenarios verified via `authorization.test.ts`:
1. **Farmer Isolation:** Farmer A cannot query Diagnoses or Plots created by Farmer B (returns 0 rows).
2. **Jurisdiction Boundary:** Officer of Region 1 cannot read farmer reports or monitoring signals from Region 2 (HTTP 403 / denied).
3. **Storage Sandboxing:** A farmer cannot insert an image with path `farmerB/diagnosis/image` (denied).
4. **Maintenance Security Definer:** Calling `reconcile_stale_diagnoses()` as an ordinary authenticated user raises an authorization exception; only `service_role` can invoke maintenance.
5. **Optimistic Locking:** Concurrent review submissions with mismatched `version` tokens fail with concurrency conflict errors.
