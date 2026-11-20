# PhytoX — Farmer Portal: Complete Technical & Functional Specification

**Document Identifier:** `06_FARMER_PORTAL.md`  
**Classification:** Frontend & Mobile Subsystem Specification  
**Target User Persona:** Smallholder and Marginal Agricultural Growers  
**Design Standard:** Mobile-First Progressive Web App (PWA) with Offline Caching  
**Confidence Status:** VERIFIED FROM REPOSITORY SOURCE CODE & LIVE WORKFLOWS  

---

## 1. Subsystem Architecture Overview

The Farmer Portal is implemented as a mobile-optimized Progressive Web App rooted at `apps/web/src/app/farmer/`. It is engineered for accessibility on low-tier smartphones operating in intermittent rural network conditions.

### Core Design Principles:
1. **Linguistic Accessibility:** Immediate first-launch language gating (English, Telugu, Hindi) ensuring users navigate in their native tongue without complex sub-menus.
2. **Visual & Touch-First Controls:** High-contrast touch targets ($\ge 48\text{px}$ minimum height), clear iconography, and photographic crop cards rather than dense text menus.
3. **Conservative AI Transparency:** Explicit labeling of AI results as assistive recommendations rather than definitive medical/botanical mandates, supported by visible confidence percentages and exposure warnings.
4. **Tenant Isolation:** Total privacy of leaf images, plot records, and diagnosis history governed by PostgreSQL Row Level Security.

---

## 2. Feature-by-Feature Detailed Breakdown

### Feature 1: Language Selection & Regional Localization
* **Purpose:** Allows farmers to interact with all scanner workflows, error messages, and treatment advice in their primary spoken and read language.
* **User Workflow:** On first access (or by clicking "Language" in settings), the farmer is presented with three prominent language cards: English, Telugu (తెలుగు), and Hindi (हिन्दी). Clicking a card sets the active locale and redirects to the landing page or portal.
* **Frontend Implementation:** `apps/web/src/app/language/page.tsx` and `apps/web/src/components/locale.tsx`.
* **State & Persistence:** Stored in an HTTP-only browser cookie (`NEXT_LOCALE`), ensuring persistence across sessions and offline PWA restarts without requiring database writes.
* **Messages Inventory:** Exhaustive translation dictionary defined in `apps/web/src/lib/messages.ts` (424 lines) covering 85+ semantic translation keys across `en`, `te`, and `hi`.
* **Verification Status:** `VERIFIED FROM SOURCE AND EXECUTION` (Tested via `tests/unit/locale.test.tsx`).

### Feature 2: Farmer Registration & Authentication
* **Purpose:** Establishes secure, authenticated user identities linked to Supabase Auth (`auth.users`) and initializes a corresponding record in `public.user_profiles`.
* **User Workflow:** The farmer enters email and password (minimum 8 characters). Upon submission, a user record is generated.
* **Frontend Implementation:** `apps/web/src/app/auth/[mode]/page.tsx` (supporting `mode = 'login'`, `mode = 'register'`, and `mode = 'recovery'`).
* **Backend Interaction:** Next.js Route Handlers invoke `@supabase/ssr` to establish encrypted, secure HTTP-only session cookies.
* **Database Interaction:** Triggers an automatic row insert into `public.user_profiles` with `role = 'farmer'`, `status = 'active'`, and the selected language.
* **Security & Validation:** Form validated using Zod (`authSchema` in `apps/web/src/lib/contracts.ts`). Protects against SQL injection, brute force, and XSS.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 3: Farmer Dashboard
* **Purpose:** Serves as the central operational hub for the grower, providing quick navigation to New Scan, Plot Monitoring, Saved History, and Regional Advisories.
* **User Workflow:** Displays personalized greeting, quick action buttons ("New Diagnosis", "Monitor Plots"), recent scan summary, and local weather/alert status.
* **Frontend Implementation:** `apps/web/src/app/farmer/page.tsx`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 4: 14-Crop Visual Selector Grid
* **Purpose:** Enforces domain-specific agricultural safety (Crop Conditioning) by requiring the farmer to indicate the crop variety before diagnostic inference.
* **User Workflow:** The farmer is presented with a 2-column (mobile) or 4-column (desktop) grid featuring photographic tiles of the 14 supported crops: Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato. An additional card allows selecting *"I'm not sure (Multi-crop AI)"*.
* **Frontend Implementation:** `apps/web/src/components/farmer/crop-selector.tsx`.
* **Data Integration:** Filterable in real time via search input (`searchCrop`).
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 5: Camera Capture & Photographic Preview
* **Purpose:** Provides a responsive interface to capture a live field photograph or select an existing photo from the mobile gallery.
* **User Workflow:** The farmer clicks "Take a photo" (invoking device camera) or "Choose a photograph" (opening device gallery). The captured image is immediately displayed in an interactive preview pane with guidance tips ("Use natural light", "Fill frame with one affected leaf").
* **Frontend Implementation:** `apps/web/src/components/farmer/scanner.tsx`.
* **Client-Side Validation:** Enforces JPEG, PNG, or WebP formats and checks file size ($\le 3\text{ MiB}$). Displays localized alert if file is invalid.
* **Animated Feedback:** Features a cinematic animated scanning beam (GSAP/CSS) sweeping vertically across the leaf photograph during inference dispatch.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 6: Server-Side Image Sanitation & Validation
* **Purpose:** Protects the cloud infrastructure and inference microservice against malformed payloads, excessive resolution, and orientation errors.
* **Backend Implementation:** `analyze()` function in `apps/web/src/services/diagnosis.ts`.
* **Sanitation Steps (Sharp Libvips Engine):**
  1. Validates magic bytes (strictly JPEG, PNG, or WebP).
  2. Enforces input memory bound: `limitInputPixels: 20_000_000` (rejects decompression bombs).
  3. Verifies dimensions: $\min(W, H) \ge 64$ pixels.
  4. Corrects camera tilt: `image.rotate()` normalizes EXIF orientation.
  5. Resizes within bounding box: $2048 \times 2048$ pixels (`fit: 'inside'`).
  6. Re-compresses to clean JPEG at 90% quality.
* **Verification Status:** `VERIFIED FROM SOURCE AND EXECUTION`.

### Feature 7: Two-Phase Diagnosis Invocation & Processing
* **Purpose:** Executes the AI diagnostic transaction with atomic state tracking and idempotency.
* **Backend Interaction:**
  1. Calls `db.rpc('reserve_diagnosis', { p_key: request_key })`. Idempotently creates or retrieves `public.diagnoses` record with `status = 'processing'`.
  2. Uploads sanitized leaf bytes to private Supabase Storage at `crop-images/<owner_id>/<diagnosis_id>/image`.
  3. Checks prediction cache. If miss, dispatches HTTP POST to `${INFERENCE_URL}/v1/predict` with `X-API-Key`.
  4. On response, calls `db.rpc('finish_diagnosis', ...)` via service role to atomically commit predictions and transition status to `'complete'`.
* **Verification Status:** `VERIFIED FROM SOURCE AND EXECUTION`.

### Feature 8: Disease Prediction Presentation & Guidance
* **Purpose:** Delivers clear, calibrated diagnostic findings and actionable agronomic guidance to the grower.
* **User Workflow:** Upon completion, the screen displays:
  - Primary Diagnosis Name (e.g., "Tomato — Early blight").
  - Model Confidence Gauge (e.g., "94.2%").
  - Clear Guidance Box: Recommends non-chemical cultural practices, sanitation of tools, and consultation with local officers before spraying.
  - Alternative Predictions: Collapsible drawer revealing the next top-3 model candidates with respective confidence scores.
* **Frontend Implementation:** `apps/web/src/app/farmer/diagnosis/[id]/page.tsx`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 9: Crop Mismatch Warning & Quality Alerts
* **Purpose:** Prevents farmers from acting on erroneous predictions resulting from poor photography or incorrect crop selection.
* **Implemented Alert Behaviors:**
  - **Crop Mismatch Advisory:** If a farmer selects "Potato" but uploads a Tomato leaf that triggers Tomato features with $<25\%$ Potato evidence, a prominent yellow banner warns: *"You selected Potato, but the visual model detected features typical of Tomato with only 12.4% crop match. Please check your leaf photograph or consult an expert."*
  - **Exposure Warning:** If mean luminance $B < 30$, flags *"The photograph is too dark. Retake it in natural light."* If $B > 235$, flags *"The photograph is too bright. Retake it away from glare."*
  - **Resolution Warning:** If dimensions $< 224\text{px}$, flags *"Use a larger, clearer photograph so leaf details are visible."*
  - **Uncertainty Abstention:** If confidence $< 70\%$ or margin $< 15\%$, flags *"The model cannot make a confident assessment. Please ask an agricultural expert."*
* **Frontend Implementation:** `apps/web/src/components/farmer/quality-warnings.tsx`.
* **Verification Status:** `VERIFIED FROM SOURCE AND EXECUTION` (Tested via `tests/unit/quality-warnings.test.tsx` and Pytest).

### Feature 10: Private Diagnosis History
* **Purpose:** Allows farmers to review all past scans, monitor crop recovery, and track the status of reports submitted to officers.
* **User Workflow:** Scrollable feed showing chronological scan cards with thumbnail, date, crop, predicted disease, and status badge (`Verified`, `Pending`, `Follow-up`).
* **Frontend Implementation:** `apps/web/src/app/farmer/history/page.tsx`.
* **Database Interaction:** Queries `public.diagnoses` filtered by `owner_id = auth.uid()` via RLS.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 11: Cryptographic Prediction Caching & Deduplication
* **Purpose:** Provides sub-10ms instantaneous results for repeated photo submissions while eliminating redundant inference costs.
* **Implementation:** `apps/web/src/services/diagnosis.ts` (lines 96–149). Computes SHA-256 hash of normalized image bytes and matches composite cache key in `diagnoses.result`.
* **Verification Status:** `VERIFIED FROM SOURCE AND EXECUTION` (Empirically verified via `test_hardened_cache_e2e.cjs`).

### Feature 12: Voluntary Report Submission to Agricultural Officers
* **Purpose:** Enables a farmer to escalate an AI diagnosis to their district agricultural extension officer for official human verification.
* **User Workflow:** From any completed diagnosis, the farmer clicks "Submit an observation". They select their administrative region, enter field observations (e.g., "Symptoms appeared 3 days ago after heavy rain"), check mandatory privacy consent, and optionally click "Use current location" to attach GPS coordinates.
* **Frontend Implementation:** `apps/web/src/app/farmer/report/[id]/page.tsx`.
* **Backend Interaction:** `POST /api/reports` validated via Zod `reportSchema`.
* **Database Interaction:** Invokes stored procedure `public.submit_report(diagnosis_id, region_id, notes, consent, lat, lng)` which creates a `farmer_reports` record with `status = 'pending'`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 13: Monitored Plot Registration
* **Purpose:** Enrolls specific farm acreage into the longitudinal surveillance program.
* **User Workflow:** Farmer clicks "Add Monitored Plot", inputs Plot Name (e.g., "North Chili Acre"), Crop (e.g., "Bell Pepper"), Region, Planting Date, and Plot Area.
* **Frontend Implementation:** `apps/web/src/app/farmer/monitoring/page.tsx`.
* **Backend Interaction:** `POST /api/monitoring/plots` handled by `createMonitoredPlot()` in `apps/web/src/services/monitoring.ts`.
* **Database Interaction:** Inserts into `public.monitored_plots` and automatically generates a linked record in `public.monitoring_schedules`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 14: Bi-Weekly Surveillance & Observation Logging
* **Purpose:** Implements regular crop surveillance check-ins on Mondays and Thursdays.
* **User Workflow:** The plot dashboard indicates whether an observation is due. Farmer captures a periodic leaf photo, selects observed symptoms (e.g., "Yellowing", "Leaf Curling", "Brown Margins"), adds notes, and submits.
* **Backend Interaction:** `POST /api/monitoring/observations` handled by `recordCropObservation()` in `apps/web/src/services/monitoring.ts`.
* **Dynamic Scheduling:** Evaluates current day of week and sets `monitoring_schedules.next_due_date` to the subsequent scheduled check-in.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 15: Regional Insights View (k-Anonymity Protected)
* **Purpose:** Informs farmers of verified disease patterns circulating in their district without compromising neighbor privacy.
* **User Workflow:** Farmer selects a district (e.g., "Guntur") and views a summary of confirmed diseases over the past 30 days.
* **Backend Interaction:** `GET /api/insights?region={id}`.
* **Database Interaction:** Invokes `public.regional_insights(p_region uuid)`.
* **Privacy Rule:** Requires at least 3 distinct contributing farmers (`having count(distinct r.owner_id) >= 3`). If fewer than 3 farmers reported, the disease count is withheld.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 16: Targeted Officer Advisories Inbox
* **Purpose:** Delivers official agricultural treatment prescriptions dispatched by extension officers directly to the farmer.
* **User Workflow:** In the monitoring or settings view, farmers can inspect received advisories linked to their specific plots, displaying officer notes and structured recommendations (e.g., recommended bio-fungicide, dosage, irrigation pause).
* **Database Interaction:** Queries `public.monitoring_advisories` where `farmer_id = auth.uid()`.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.

### Feature 17: Session Management & Logout
* **Purpose:** Safely destroys active sessions across devices.
* **Implementation:** Clears Supabase auth cookies via `supabase.auth.signOut()` and redirects to the landing page.
* **Verification Status:** `VERIFIED FROM SOURCE AND RUNTIME`.
