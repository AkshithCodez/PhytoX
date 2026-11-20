# PhytoX — Comprehensive REST API Specification & Reference

**Document Identifier:** `12_API_REFERENCE.md`  
**Classification:** Application Programming Interface (API) Reference  
**Interface Protocols:** HTTP/1.1 & HTTP/2 REST APIs (JSON & Multipart Form-Data)  
**Security Headers:** Encrypted Session Cookies (`@supabase/ssr`) & `X-API-Key` (HMAC-SHA256)  
**Confidence Status:** VERIFIED FROM ROUTE HANDLERS & FASTAPI SCHEMAS  

---

## 1. API Architecture & Security Conventions

The PhytoX API is divided into two distinct functional domains:
1. **Next.js BFF Route Handlers (`/api/*`):** Public and authenticated endpoints consumed by client web and mobile interfaces. Handles CSRF origin checking, session resolution, Sharp image validation, and database operations.
2. **FastAPI Inference Endpoints (`/v1/*`):** Private microservice endpoints consumed strictly by the Next.js BFF. Protected by static secret header `X-API-Key` validated via constant-time comparison.

### Common HTTP Status Codes Used Across the Platform:
* `200 OK`: Request succeeded; entity returned.
* `201 Created`: Entity created successfully.
* `400 Bad Request`: Malformed payload or validation schema failure.
* `401 Unauthorized`: Missing or invalid authentication token.
* `403 Forbidden`: Authenticated user lacks required role or regional jurisdiction.
* `404 Not Found`: Target entity does not exist.
* `409 Conflict`: Concurrency conflict (`version` mismatch) or duplicate in-flight upload.
* `413 Payload Too Large`: Image file exceeds maximum allowed bytes (3 MiB BFF / 8 MiB ML).
* `422 Unprocessable Content`: Invalid image format, dimension below $64\times 64$, or corrupt file.
* `502 Bad Gateway`: Downstream inference microservice returned malformed predictions.
* `503 Service Unavailable`: Downstream inference service is sleeping, cold-starting, or unconfigured.

---

## 2. System Status & Health Endpoints

### 2.1 Web Application Status Probe
* **Endpoint:** `GET /api/status`
* **Purpose:** Provides health status of the Next.js BFF and confirms database connectivity.
* **Authentication:** Public / Anonymous.
* **Response `200 OK`:**
```json
{
  "status": "ready",
  "version": "0.1.0",
  "framework": "Next.js 16.4.6",
  "timestamp": "2026-11-19T14:48:51.000Z"
}
```

### 2.2 Inference Microservice Health Probe
* **Endpoint:** `GET /health` (FastAPI)
* **Purpose:** Lightweight container liveness probe used by Render and Docker health checkers.
* **Authentication:** Public.
* **Response `200 OK`:**
```json
{
  "status": "ok",
  "schema_version": "1.0"
}
```

### 2.3 Inference Microservice Readiness Probe
* **Endpoint:** `GET /ready` (FastAPI)
* **Purpose:** Confirms whether the ONNX computational graph and manifest have successfully loaded into memory.
* **Authentication:** Public.
* **Response `200 OK`:**
```json
{
  "ready": true,
  "reason": "ready"
}
```

---

## 3. AI Inference Microservice API

### 3.1 Foliar Disease Prediction
* **Endpoint:** `POST /v1/predict` (FastAPI)
* **Purpose:** Performs tensor inference on an uploaded leaf photograph and returns calibrated predictions.
* **Authentication:** Header `X-API-Key: <SECRET_KEY>` (Constant-time `hmac.compare_digest`).
* **Request Payload (`multipart/form-data`):**
  - `file`: Raw binary image file (JPEG, PNG, or WebP; maximum 8 MiB).
  - `selected_crop`: (Optional Form field) String representing farmer-selected crop (e.g., `"Tomato"`).
  - `crop`: (Optional Query param) Fallback query parameter for selected crop.
* **Response `200 OK`:**
```json
{
  "schema_version": "1.0",
  "status": "success",
  "model_version": "local-onnx-fde9536ff18a",
  "prediction": {
    "crop": "Tomato",
    "disease": "Early blight",
    "confidence": 0.9421
  },
  "alternatives": [
    {
      "crop": "Tomato",
      "disease": "Target Spot",
      "confidence": 0.0384
    },
    {
      "crop": "Tomato",
      "disease": "Septoria leaf spot",
      "confidence": 0.0125
    }
  ],
  "quality_warnings": [],
  "review_recommended": true,
  "abstained": false,
  "uncertainty_note": "Model confidence is not proven accuracy. Unknown-image detection has not been validated.",
  "selected_crop": "Tomato",
  "crop_mismatch_warning": false,
  "crop_confidence": 0.9842,
  "detected_crop": "Tomato",
  "mismatch_message": null
}
```
* **Error Responses:**
  - `401 Unauthorized`: `{"detail": {"code": "unauthorized"}}`
  - `413 Payload Too Large`: `{"detail": {"code": "image_too_large"}}`
  - `422 Unprocessable Content`: `{"detail": {"code": "invalid_image", "message": "Image dimensions must be at least 64 × 64 pixels."}}`
  - `503 Service Unavailable`: `{"detail": {"code": "model_unconfigured"}}`

---

## 4. Diagnosis Subsystem (Next.js BFF)

### 4.1 Execute Diagnosis Transaction
* **Endpoint:** `POST /api/diagnoses`
* **Purpose:** Initiates the two-phase diagnosis pipeline (validation, storage upload, caching check, inference dispatch, and DB commit).
* **Authentication:** Required (`authenticated` session cookie).
* **Request Payload (`multipart/form-data`):**
  - `file`: Image file (JPEG, PNG, or WebP; $\le 3\text{ MiB}$).
  - `request_key`: Client UUID string (idempotency key).
  - `selected_crop`: (Optional) String representing selected crop (e.g., `"Tomato"` or `"not_sure"`).
* **Backend Processing:**
  - Sharp sanitizes image, validates bounds, auto-rotates, and normalizes to JPEG.
  - Computes image SHA-256 hash.
  - Invokes `reserve_diagnosis` RPC in PostgreSQL.
  - Uploads sanitized image to `crop-images/<owner_id>/<diagnosis_id>/image`.
  - Checks composite cache in `diagnoses.result`. If match found, commits immediately without calling inference.
  - If miss, calls FastAPI `/v1/predict` with `X-API-Key`.
  - Commits result via `finish_diagnosis` RPC.
* **Response `200 OK`:** Full `Diagnosis` JSON object with embedded `result` payload.

### 4.2 List Farmer Diagnoses History
* **Endpoint:** `GET /api/diagnoses`
* **Purpose:** Retrieves paginated private diagnosis records for the logged-in farmer.
* **Authentication:** Required (`authenticated`).
* **Query Parameters:**
  - `limit`: (Optional, default 20) Number of records to return.
  - `offset`: (Optional, default 0) Pagination offset.
* **Database Query:** Queries `public.diagnoses` filtered by `owner_id = auth.uid()` ordered by `created_at desc`.

### 4.3 Get Single Diagnosis Detail
* **Endpoint:** `GET /api/diagnoses/[id]`
* **Purpose:** Retrieves full details of a specific diagnosis, including time-limited signed image URL.
* **Authentication:** Required (`authenticated`).
* **Authorization:** Caller must be the owner (`owner_id = auth.uid()`) or an assigned regional officer if attached to a submitted report (`private.can_read_diagnosis(id)`).

---

## 5. Farmer Reporting Subsystem

### 5.1 Submit Observation Report to Officers
* **Endpoint:** `POST /api/reports`
* **Purpose:** Voluntarily escalates an AI diagnosis to the district agricultural extension officer.
* **Authentication:** Required (`authenticated`, role = `farmer`).
* **Request Body (`application/json`):**
```json
{
  "diagnosis_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "region_id": "4a2c1b3d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "notes": "Spotted on lower leaves following 3 days of high humidity.",
  "consent": true,
  "latitude": 16.3067,
  "longitude": 80.4365
}
```
* **Validation (Zod `reportSchema`):**
  - `consent` must be strictly `true`.
  - Coordinates must both be null or both be valid numeric coordinates.
* **Database Action:** Calls `public.submit_report(...)`.
* **Response `201 Created`:** Created `Report` record with `status = 'pending'`, `version = 1`.

### 5.2 List Reports
* **Endpoint:** `GET /api/reports`
* **Purpose:** Returns reports accessible to the user (farmers see own reports; officers see reports in assigned regions).
* **Query Parameters (Zod `filterSchema`):**
  - `region`: UUID filter.
  - `status`: Filter by `'pending'`, `'verified'`, `'rejected'`, or `'follow_up'`.
  - `disease`: Text filter for pathology name.
  - `from` / `to`: ISO date filters (`YYYY-MM-DD`).

### 5.3 Review Report (Officer Determination)
* **Endpoint:** `POST /api/reports/[id]`
* **Purpose:** Records human agronomist review decision (Verify, Reject, or Follow-up).
* **Authentication:** Required (`authenticated`, role in `('officer', 'admin')`).
* **Request Body (`application/json`):**
```json
{
  "version": 1,
  "status": "verified",
  "notes": "Verified Alternaria solani (Early Blight). Recommend copper oxychloride application at 2.5g/L."
}
```
* **Database Action:** Calls `public.review_report(...)` with optimistic locking check on `version`. Updates status, increments version to 2, inserts `officer_reviews`, and records audit log.
* **Response `200 OK`:** Success confirmation.

---

## 6. Longitudinal Crop Monitoring API

### 6.1 Register Monitored Plot
* **Endpoint:** `POST /api/monitoring/plots`
* **Purpose:** Enrolls a farm plot into the longitudinal surveillance schedule.
* **Authentication:** Required (`authenticated`).
* **Request Body (`application/json`):**
```json
{
  "name": "East Tomato Acre",
  "crop": "Tomato",
  "region_id": "4a2c1b3d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "planting_date": "2026-10-15",
  "plot_area": "1.5 Acres"
}
```
* **Response `201 Created`:** Created plot object with generated `monitoring_schedules` record.

### 6.2 Submit Periodic Plot Observation
* **Endpoint:** `POST /api/monitoring/observations`
* **Purpose:** Records a scheduled foliar observation and triggers early-warning heuristic checks.
* **Authentication:** Required (`authenticated`).
* **Request Body (`application/json`):**
```json
{
  "plot_id": "d3b07384-d113-4c56-9c8e-2895f87b8d8a",
  "image_path": "owner_id/obs_id/image",
  "symptoms": ["yellowing_margins", "concentric_rings"],
  "notes": "Lesions spreading to middle foliage.",
  "ai_assessment": {
    "crop": "Tomato",
    "disease": "Early blight",
    "confidence": 0.912
  },
  "observation_date": "2026-11-19"
}
```
* **Processing:**
  - Verifies plot ownership.
  - Inserts into `crop_observations`.
  - Recalculates `monitoring_schedules.next_due_date` using Monday/Thursday algorithm.
  - Evaluates heuristic recurrence and regional cluster rules in `services/monitoring.ts`. If triggered, creates `monitoring_signals` record.
* **Response `201 Created`:** Created observation record.

### 6.3 List Active Outbreak Signals (Officer Surveillance)
* **Endpoint:** `GET /api/officer/monitoring`
* **Purpose:** Retrieves active early-warning signals for plots in the officer's assigned regions.
* **Authentication:** Required (`authenticated`, role = `'officer'`).
* **Response `200 OK`:** Array of `MonitoringSignalRecord` objects with embedded plot and farmer contact details.

### 6.4 Issue Official Field Advisory
* **Endpoint:** `POST /api/officer/monitoring` (or `/api/monitoring/advisories`)
* **Purpose:** Dispatches clinical agronomical instructions directly to the farmer.
* **Authentication:** Required (`authenticated`, role = `'officer'`).
* **Request Body (`application/json`):**
```json
{
  "signal_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "plot_id": "d3b07384-d113-4c56-9c8e-2895f87b8d8a",
  "farmer_id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "advisory_text": "Immediate foliar spray of Mancozeb 75% WP at 2g/L recommended. Discontinue overhead irrigation for 48 hours.",
  "recommendations": [
    "Apply bio-fungicide within 24 hours",
    "Prune and burn infected lower foliage",
    "Pause furrow irrigation"
  ]
}
```
* **Database Action:** Inserts into `monitoring_advisories` and marks signal as `'advisory_issued'`.
* **Response `201 Created`:** Advisory record.

---

## 7. Regional Intelligence & Farmer Administration APIs

### 7.1 Regional Insights (k-Anonymity Protected)
* **Endpoint:** `GET /api/insights?region={uuid}`
* **Purpose:** Returns 30-day verified disease distribution for public/farmer visualization.
* **Authentication:** Required (`authenticated`).
* **Privacy Enforcement:** Queries `public.regional_insights()`. Groups with $<3$ distinct farmer contributors are withheld.

### 7.2 Officer Farmer Management
* **Endpoint:** `GET /api/officer/farmers`
  - *Purpose:* Lists registered farmers in the officer's assigned districts.
* **Endpoint:** `POST /api/officer/farmers`
  - *Purpose:* Creates an invited farmer profile (`inviteFarmerSchema`).
* **Endpoint:** `PATCH /api/officer/farmers/[id]`
  - *Purpose:* Suspends or reactivates a farmer profile (`updateFarmerStatusSchema`).
