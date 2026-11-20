# PhytoX — Comprehensive Testing & Quality Assurance Report

**Document Identifier:** `14_TESTING_AND_VALIDATION.md`  
**Classification:** Quality Assurance, Test Suite Execution & Verification Report  
**Execution Timestamp:** 19 November 2026  
**Total Automated Unit & Integration Tests:** **67 / 67 Passed (100% Pass Rate)**  
**Total E2E Real-Browser Scenarios:** **3 / 3 Passed (100% Pass Rate)**  
**Grand Total Verified Scenarios:** **70 Scenarios**  
**Confidence Status:** VERIFIED FROM LOCAL TEST RUNNER LOGS & REPOSITORY FILES  

---

## 1. Quality Assurance Strategy & Test Taxonomy

PhytoX employs a multi-tiered testing methodology verifying behavior from unit-level tensor transformations to real-browser end-to-end user journeys:

```
                  ┌───────────────────────────────┐
                  │    PLAYWRIGHT REAL-BROWSER    │
                  │         (3 E2E Scenarios)     │
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │      INTEGRATION & CONTRACT   │
                  │   • 18 DB RLS Tests (PGlite)  │
                  │   • 23 Pytest Inference Tests │
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  │      UNIT & COMPONENT TESTS   │
                  │   • 26 Vitest Frontend Tests  │
                  └───────────────────────────────┘
```

---

## 2. Test Execution Breakdown by Suite

### 2.1 Suite A: Vitest Full-Stack & Database Test Suite (`apps/web`)
* **Test Runner Command:** `npm --prefix apps/web test -- --run`
* **Test Engine:** Vitest 4.1.12 with JSDOM and PGlite WebAssembly PostgreSQL runtime.
* **Total Executed:** **44 passed**, 0 failed, 0 skipped.
* **Duration:** 3.64 seconds.

| Test File Path | Tests | Execution Scope & Objective | Status |
|---|:---:|---|:---:|
| `tests/unit/reconcile.test.ts` | 4 | Stale processing recovery, garbage collection of expired reservations. | **PASS** |
| `tests/unit/relations.test.ts` | 2 | Domain relational structures, entity transforms, and foreign key mappings. | **PASS** |
| `tests/unit/domain.test.ts` | 11 | Agricultural data validation, confidence formatting, crop entity boundaries. | **PASS** |
| `tests/unit/crop-conditioning.test.ts` | 3 | Foliar conditioning logic, probability renormalization, mismatch triggers. | **PASS** |
| `tests/unit/quality-warnings.test.tsx` | 3 | UI rendering of low-resolution, underexposed, and overexposed alerts. | **PASS** |
| `tests/unit/locale.test.tsx` | 3 | Multilingual language selection, cookie storage, and translation key completeness. | **PASS** |
| `tests/database/authorization.test.ts`| 18 | In-engine PostgreSQL WASM (PGlite) RLS policies, farmer isolation, storage security. | **PASS** |
| **Total Vitest Tests** | **44** | **Frontend Components, Domain Logic & Relational Security** | **100% PASS** |

### 2.2 Suite B: Pytest Inference Microservice Suite (`services/inference`)
* **Test Runner Command:** `python -m pytest tests -v`
* **Test Engine:** Pytest 9.2.0 with FastAPI `TestClient`, HTTPX, and ONNX Runtime.
* **Total Executed:** **23 passed**, 0 failed, 0 skipped.
* **Duration:** 1.08 seconds.

| Test File Path | Tests | Execution Scope & Objective | Status |
|---|:---:|---|:---:|
| `tests/test_inference.py` | 18 | Input bounds checking, byte size limits, exposure calculation, CSRF protection, API key auth, uncertainty abstention. | **PASS** |
| `tests/test_supplied_model.py` | 5 | Real `supplied.onnx` execution, SHA-256 fingerprint verification, invalid shape rejection, incompatible batch sizes. | **PASS** |
| **Total Pytest Tests** | **23** | **Tensor Operations, ONNX Graph Contracts & API Endpoints** | **100% PASS** |

### 2.3 Suite C: Playwright Real-Browser End-to-End Suite (`apps/web`)
* **Test Runner Command:** `npx playwright test tests/e2e/live-browser-portal.spec.ts`
* **Specification File:** `apps/web/tests/e2e/live-browser-portal.spec.ts`
* **Total Executed:** **3 passed**, 0 failed, 0 skipped.

| E2E Scenario ID | Scenario Name & Scope | Test Procedure & Assertions | Status |
|---|---|---|:---:|
| `E2E-01` | **Live Farmer Diagnosis Workflow** | Navigates to `/farmer` $\to$ authenticates $\to$ selects crop (Tomato) $\to$ uploads leaf photo $\to$ verifies scan beam animation $\to$ asserts AI diagnosis, confidence gauge, and guidance rendered. | **PASS** |
| `E2E-02` | **Live Officer Command & Review** | Navigates to `/auth/login?portal=officer` $\to$ logs into district workstation $\to$ verifies pending review queue $\to$ submits formal review with clinical notes $\to$ asserts status updates to "verified". | **PASS** |
| `E2E-03` | **Cross-Role Authorization Denial** | Farmer authenticated session navigates to `/officer` $\to$ server intercepts request $\to$ verifies HTTP 403 / redirect to `/farmer` $\to$ asserts zero officer UI elements exposed. | **PASS** |

---

## 3. Detailed Functional Test Cases (Academic Tables)

### 3.1 Domain & Crop Conditioning Test Cases

| Test ID | Test Description | Input Data | Expected Output | Actual Result | Status |
|---|---|---|---|---|:---:|
| `TC-DOM-01` | Crop Subsetting | Unconditioned 38-class logits; selected crop = `"Tomato"`. | Renormalizes probabilities across the 10 Tomato disease classes only. | Conditioned sum equals 1.0; top prediction belongs to Tomato. | **PASS** |
| `TC-DOM-02` | Crop Mismatch Detection | Selected crop = `"Potato"`; input leaf image exhibits strong Tomato features with $<25\%$ Potato evidence. | Returns `crop_mismatch_warning: true` with explanatory advisory text. | Mismatch banner triggered; uncertainty flagged. | **PASS** |
| `TC-DOM-03` | Uncertainty Abstention | Top-1 confidence = 62% ($<70\%$) or margin between top-2 classes = 8% ($<15\%$). | Returns `abstained: true` with human expert review recommendation. | Review recommended; abstention note rendered. | **PASS** |
| `TC-DOM-04` | Underexposure Warning | Grayscale mean luminance $B = 21$ ($<30$). | Appends `'underexposed'` to `quality_warnings` array. | Warning appended; abstention triggered. | **PASS** |
| `TC-DOM-05` | Low Resolution Warning | Image dimensions $120 \times 120$ pixels ($<224\text{px}$). | Appends `'low_resolution'` to `quality_warnings` array. | Warning appended. | **PASS** |

### 3.2 Database Authorization & RLS Test Cases (PGlite)

| Test ID | Test Description | Role / Caller | Security Rule / SQL Operation | Expected Database Behavior | Status |
|---|---|---|---|---|:---:|
| `TC-RLS-01` | Cross-Farmer Read Isolation | Farmer A | `SELECT * FROM diagnoses WHERE owner_id = 'farmer_b'` | Returns **0 rows** (RLS silent filter). | **PASS** |
| `TC-RLS-02` | Cross-Farmer Plot Isolation | Farmer A | `SELECT * FROM monitored_plots WHERE owner_id = 'farmer_b'` | Returns **0 rows**. | **PASS** |
| `TC-RLS-03` | Storage Path Sandboxing | Farmer A | `INSERT INTO storage.objects (name) VALUES ('farmer_b/diag/image')` | Database raises **RLS violation error**. | **PASS** |
| `TC-RLS-04` | Regional Officer Boundary | Officer (Region 1) | `SELECT * FROM farmer_reports WHERE region_id = 'region_2'` | Returns **0 rows** (Jurisdiction boundary). | **PASS** |
| `TC-RLS-05` | Privileged Function Denial | Authenticated Farmer | `SELECT finish_diagnosis(...)` | Execution denied (**42501 permission denied**). | **PASS** |
| `TC-RLS-06` | Concurrency Conflict Guard | Officer (Region 1) | `SELECT review_report(report_id, version=1, ...)` on report with version=2 | Aborts with exception **Conflict (40001)**. | **PASS** |
| `TC-RLS-07` | k-Anonymity Regional Filter | Authenticated User | `SELECT * FROM regional_insights(region_id)` where disease has 2 reporting farmers | Row withheld (**`count(distinct owner_id) >= 3`**). | **PASS** |

### 3.3 Inference Microservice Test Cases (Pytest)

| Test ID | Test Description | Endpoint & Input | Expected HTTP & Tensor Behavior | Status |
|---|---|---|---|:---:|
| `TC-INF-01` | Invalid API Key | `POST /v1/predict` with missing or incorrect `X-API-Key`. | Returns **HTTP 401 Unauthorized** with `{"detail": {"code": "unauthorized"}}`. | **PASS** |
| `TC-INF-02` | Corrupt Image File | `POST /v1/predict` with random arbitrary non-image text bytes. | Returns **HTTP 422 Unprocessable Content** (`"invalid_image"`). | **PASS** |
| `TC-INF-03` | Oversized File Rejection | `POST /v1/predict` with payload exceeding 8 MiB limit. | Returns **HTTP 413 Payload Too Large** before multipart decoding. | **PASS** |
| `TC-INF-04` | Real ONNX Inference | `POST /v1/predict` with valid $224\times 224$ JPEG leaf photograph. | Returns **HTTP 200 OK** with 38-class normalized softmax distribution. | **PASS** |
| `TC-INF-05` | Model Checksum Guard | Model startup with modified/tampered ONNX file bytes. | Model fails to initialize (`reason = "model_load_failed"`). | **PASS** |

---

## 4. Test Suite Reconciliations (Academic Discrepancy Resolution)

An earlier audit draft noted a discrepancy between "67 automated tests" and "70 tests":
* **Automated Unit & Integration Tests:** Exactly **67 tests** ($44 \text{ Vitest} + 23 \text{ Pytest} = 67$).
* **Real-Browser E2E Scenarios:** Exactly **3 Playwright specs** (`live-browser-portal.spec.ts`).
* **Reconciled Grand Total:** Exactly **70 verified test scenarios**.
