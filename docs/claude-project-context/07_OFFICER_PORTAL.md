# PhytoX — Agricultural Officer Command Portal: Complete Specification

**Document Identifier:** `07_OFFICER_PORTAL.md`  
**Classification:** Desktop Workstation & Administrative Subsystem Specification  
**Target User Persona:** Certified Agricultural Extension Officers (AEOs), Mandal Agronomists, and District Agricultural Directors  
**Design Standard:** Desktop-First Responsive Command Center with GIS Mapping  
**Confidence Status:** VERIFIED FROM REPOSITORY SOURCE CODE & LIVE WORKFLOWS  

---

## 1. Subsystem Architecture Overview

The Agricultural Officer Command Portal is a secure, role-gated administrative suite rooted at `apps/web/src/app/officer/`. It provides agronomists with the tools necessary to supervise rural pathology trends, verify farmer diagnoses, manage grower registries, inspect GIS disease maps, and issue formal treatment advisories.

### Core Architectural Invariants:
1. **Strict Role-Based Authorization:** Access is granted strictly to authenticated users with `role in ('officer', 'admin')` in `public.user_profiles`. Non-officer users attempting to access `/officer/*` are rejected with HTTP 403 and redirected.
2. **Jurisdiction-Bounded Isolation:** Officers operate strictly within their assigned administrative districts defined in the `public.officer_regions` junction table. An officer cannot inspect reports, modify farmers, or review observations outside their assigned territory.
3. **Immutable Audit Trails:** Every administrative decision (report verification, rejection, farmer suspension, alert opening, advisory dispatch) writes an immutable record to `public.audit_logs`.
4. **Optimistic Concurrency Control:** Report reviews require an integer `version` token to prevent race conditions when multiple officers review simultaneous records.

---

## 2. Feature-by-Feature Detailed Breakdown

### Feature 1: Officer Authentication & Role Verification
* **Purpose:** Ensures only authorized agricultural personnel access sensitive district data.
* **User Workflow:** Navigating to `/auth/login?portal=officer` renders the specialized Officer Sign-in portal with distinct administrative branding. The officer authenticates using email and password.
* **Security & Verification:**
  - Upon credential verification, the server inspects `public.user_profiles.role`.
  - If `role !== 'officer' && role !== 'admin'`, the session is rejected with HTTP 403, and the user is redirected to `/farmer`.
* **Source Implementation:** `apps/web/src/app/auth/[mode]/page.tsx` and middleware checks in `apps/web/src/lib/server.ts`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME` (Tested in Playwright `E2E-03`).

### Feature 2: Officer Command Dashboard
* **Purpose:** Provides a high-level operational overview of active disease pressure within the officer's jurisdiction.
* **User Workflow:** Displays key executive metrics:
  - Total Active Farmers in Jurisdiction.
  - Pending Review Queue Count.
  - Active Outbreak Signals & Clusters.
  - 30-Day Disease Prevalence Breakdown.
* **Frontend Implementation:** `apps/web/src/app/officer/page.tsx`.
* **Database Interaction:** Aggregates counts across `farmer_reports`, `monitoring_signals`, and `user_profiles` filtered by `region_id in (select region_id from officer_regions where officer_id = auth.uid())`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 3: Regional Statistics & Disease Analytics
* **Purpose:** Visualizes epidemiological trends to assist agronomists in identifying emerging seasonal patterns.
* **Frontend Implementation:** Integrated using **Recharts** (`apps/web/src/components/officer/disease-distribution.tsx`).
* **Visual Components:**
  - 30-day temporal trend lines tracking weekly submission velocity.
  - Horizontal bar charts displaying class-wise disease distribution across crops.
  - Risk distribution donut chart (Fungal vs Bacterial vs Viral vs Healthy).
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 4: Farmer Directory & Administration
* **Purpose:** Equips extension officers with administrative oversight over growers operating within their assigned mandals.
* **User Workflow:** Navigating to `/officer/farmers` renders a searchable, filterable directory of all registered farmers within the officer's jurisdiction.
* **Displayed Metadata:** Farmer Name, Village/Mandal, Phone Number, Farm Size (e.g., "3.5 Acres"), Preferred Language, Account Status (`active`, `suspended`, `invited`), and Total Reports Submitted.
* **Frontend Implementation:** `apps/web/src/app/officer/farmers/page.tsx`.
* **Database Policy:** Enforced by RLS policy `profile_read` on `user_profiles`:
  ```sql
  create policy profile_read on public.user_profiles for select to authenticated using (
    id = auth.uid() or private.is_admin() or (
      role = 'farmer' and region_id in (
        select region_id from public.officer_regions where officer_id = auth.uid()
      )
    )
  );
  ```
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 5: Farmer Invitation Workflow
* **Purpose:** Enables agricultural officers to onboard local growers directly into the platform during village extension meetings.
* **User Workflow:** Officer clicks "Invite Farmer", opens modal, and enters:
  - Full Name.
  - Email Address.
  - Village / Mandal.
  - Contact Phone Number.
  - Farm Landholding Area.
  - Preferred Language (English, Telugu, Hindi).
* **Backend Interaction:** `POST /api/officer/farmers` validated via Zod `inviteFarmerSchema`:
  ```typescript
  export const inviteFarmerSchema = z.object({
    display_name: z.string().trim().min(2).max(100),
    email: z.string().email(),
    region_id: z.string().uuid(),
    village: z.string().trim().max(100).optional().default(""),
    language: z.enum(["en", "te", "hi"]).optional().default("en"),
    phone: z.string().trim().max(20).optional().default(""),
    farm_size: z.string().trim().max(50).optional().default(""),
  });
  ```
* **Database Action:** Creates user profile in `public.user_profiles` with `status = 'invited'` and `invited_by = auth.uid()`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 6: Farmer Status Lifecycle (Suspension & Reactivation)
* **Purpose:** Provides a mechanism to suspend abusive accounts, fraudulent submitters, or inactive profiles.
* **User Workflow:** In the farmer row menu, the officer selects "Suspend Farmer" or "Reactivate Farmer", enters a mandatory administrative reason, and confirms.
* **Backend Interaction:** `PATCH /api/officer/farmers/[id]` validated via Zod `updateFarmerStatusSchema` (`status in ('active', 'suspended', 'deactivated')`).
* **Database Policy:** Governed by RLS policy `officer_manage_farmer` on `user_profiles`.
* **Audit Logging:** Inserts audit trail into `public.audit_logs` (`action = 'farmer.status_change'`).
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 7: Report Review Queue
* **Purpose:** The core operational queue where incoming farmer observations are evaluated by human agronomists.
* **User Workflow:** Navigating to `/officer/reports` displays pending submissions filtered by region, crop, and date range. Clicking a report opens the full Diagnostic Inspection Dossier.
* **Dossier Inspection Components:**
  - High-resolution leaf photograph loaded via time-limited signed storage URL (`crop-images/<owner>/<diagnosis_id>/image`).
  - Model AI Prediction (e.g., "Tomato — Early blight, 94.2%").
  - Model Alternative Predictions with confidence distribution.
  - Quality Warnings (if any were flagged during inference).
  - Farmer Field Notes & Crop Context.
  - Observation Date & Optional Field Geolocation.
* **Frontend Implementation:** `apps/web/src/app/officer/reports/[id]/page.tsx`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 8: Human Verification, Rejection & Follow-Up
* **Purpose:** Allows the agronomist to issue an authoritative determination on the farmer's report.
* **User Workflow:** The officer selects one of three actions:
  1. **Verify (`verified`):** Confirms the AI diagnosis or provides a corrected disease classification.
  2. **Reject (`rejected`):** Discards invalid, non-plant, or unidentifiable photographs.
  3. **Follow-Up Requested (`follow_up`):** Requests additional leaf photos or stem samples from the farmer.
* **Mandatory Notes Constraint:** Officer must enter constructive clinical notes between **3 and 2,000 characters**.
* **Backend Interaction:** `POST /api/reports/[id]` validated via Zod `reviewSchema`:
  ```typescript
  export const reviewSchema = z.object({
    version: z.number().int().positive(),
    status: z.enum(["verified", "rejected", "follow_up"]),
    notes: z.string().trim().min(3).max(2000),
  });
  ```
* **Database Action:** Calls stored procedure `public.review_report(p_id, p_version, p_status, p_notes)`:
  - Verifies officer jurisdiction: `private.can_review(r.region_id)`.
  - Checks optimistic concurrency: `if r.version <> p_version then raise exception 'Conflict' using errcode='40001'`.
  - Inserts record into `public.officer_reviews`.
  - Updates `public.farmer_reports` (`status = p_status`, `version = version + 1`).
  - Inserts record into `public.audit_logs`.
* **Verification Status:** `VERIFIED FROM SOURCE AND EXECUTION` (Tested in Playwright `E2E-02`).

### Feature 9: GIS Regional Disease Distribution Map
* **Purpose:** Provides interactive spatial visualization of reported and verified agricultural diseases across the officer's administrative territory.
* **Frontend Implementation:** Built with **Leaflet** and **Leaflet.markercluster** (`apps/web/src/components/officer/map.tsx`).
* **Capabilities:**
  - Marker clustering: Groups dense nearby field reports into clustered numerical bubbles that expand on zoom.
  - Color-coded severity pins: Green for healthy, yellow for low-risk, red for high-severity blights and rusts.
  - Popup inspection cards showing thumbnail, crop, confirmed pathology, and date.
  - District boundary overlays.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 10: Surveillance Queue & Outbreak Signals
* **Purpose:** Surfaces automated early-warning indicators generated by the longitudinal monitoring engine.
* **User Workflow:** Navigating to `/officer/surveillance` (or `/officer/monitoring`) displays the active signals queue.
* **Signal Categories Displayed:**
  - `recurrent_disease`: Sequential observations on the same plot detecting unresolved pathology.
  - `regional_cluster`: 3 or more distinct field observations detecting the same disease within 7 days in that district.
* **Severity Levels:** `low`, `medium`, `high`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 11: Targeted Field Advisory Formulation
* **Purpose:** Closes the feedback loop by dispatching official agronomical guidance directly into the affected farmer's portal.
* **User Workflow:** When inspecting an outbreak signal or plot observation, the officer clicks "Issue Advisory". The officer inputs advisory text (5 to 3,000 characters) and structured recommendations (e.g., specific chemical/organic treatment, dosage, irrigation frequency).
* **Backend Interaction:** Handled by `issueMonitoringAdvisory()` in `apps/web/src/services/monitoring.ts`.
* **Database Action:** Inserts into `public.monitoring_advisories` and updates `public.monitoring_signals` (`status = 'advisory_issued'`, `reviewed_by = auth.uid()`, `reviewed_at = now()`).
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 12: Administrative Audit Log Inspection
* **Purpose:** Ensures compliance, accountability, and traceability for all administrative actions.
* **Database Interaction:** Queries `public.audit_logs` where `region_id in (...officer_regions)`.
* **Logged Fields:** `id`, `actor_id`, `action`, `record_id`, `region_id`, `details` (JSONB), `created_at`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.
