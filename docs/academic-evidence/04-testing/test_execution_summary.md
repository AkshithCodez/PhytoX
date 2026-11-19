# PhytoX — Comprehensive Test Execution Summary

**Execution Date:** 19 November 2026  
**Test Frameworks:** Vitest 4.1.12 (Node.js/TypeScript/PGlite), Pytest 9.2.0 (Python 3.11/FastAPI/ONNX), Playwright 1.52.0  
**Overall Automated Test Pass Rate:** 100% (67 / 67 Automated Unit & Integration Tests Passing)  
**Total Test Scenarios:** 70 (67 Automated + 3 Playwright E2E Browser Specs)  

---

## 1. Test Suite Execution Breakdown

### Suite A: Vitest Web & Database Test Suite (`apps/web`)
* **Runner Command:** `npm --prefix apps/web test -- --run`
* **Test Files Executed:** 7 files
* **Total Tests:** 44 passed, 0 failed, 0 skipped
* **Duration:** 3.64 seconds

| Test File | Tests Passed | Duration | Scope Verified |
|---|---|---|---|
| `tests/unit/reconcile.test.ts` | 4 | 15 ms | Stale processing recovery & cleanup of expired reservations |
| `tests/unit/relations.test.ts` | 2 | 10 ms | Domain relational structures and data transforms |
| `tests/unit/domain.test.ts` | 11 | 32 ms | Agricultural data validation, confidence formatting, crop models |
| `tests/unit/crop-conditioning.test.ts` | 3 | 15 ms | Crop conditioning probability weighting and top-class filtering |
| `tests/unit/quality-warnings.test.tsx` | 3 | 226 ms | Frontend rendering of exposure and resolution warnings |
| `tests/unit/locale.test.tsx` | 3 | 534 ms | Multilingual selection, cookie persistence, Telugu/Hindi/English gating |
| `tests/database/authorization.test.ts` | 18 | 3,026 ms | Real PostgreSQL WASM (PGlite) RLS policies, role escalation denial, storage paths |
| **Total Vitest** | **44** | **3.64 s** | **100% PASS** |

---

### Suite B: Pytest Inference Microservice Test Suite (`services/inference`)
* **Runner Command:** `python -m pytest tests -v`
* **Test Files Executed:** 2 files
* **Total Tests:** 23 passed, 0 failed, 0 skipped
* **Duration:** 1.08 seconds

| Test File | Tests Passed | Duration | Scope Verified |
|---|---|---|---|
| `tests/test_inference.py` | 18 | 0.82 s | Image decoding, bounds checking, exposure warning, uncertainty abstention, CSRF, malformed output, API auth |
| `tests/test_supplied_model.py` | 5 | 0.26 s | Real `supplied.onnx` execution, SHA-256 fingerprint validation, invalid tensor shapes, incompatible batch size rejection |
| **Total Pytest** | **23** | **1.08 s** | **100% PASS** |

---

### Suite C: Playwright Real-Browser End-to-End Suite (`apps/web`)
* **Runner Command:** `npx playwright test tests/e2e/live-browser-portal.spec.ts`
* **Specification File:** `apps/web/tests/e2e/live-browser-portal.spec.ts`
* **Total E2E Scenarios:** 3 passing end-to-end workflows

| E2E Scenario ID | Scenario Name | Test Steps & Verification Scope | Result |
|---|---|---|---|
| `E2E-01` | Live Farmer Diagnosis Workflow | Farmer login $\to$ select crop (Tomato) $\to$ preview leaf $\to$ activate scanner $\to$ receive diagnosis $\to$ inspect guidance | PASS |
| `E2E-02` | Live Officer Command & Review | Officer login $\to$ view assigned district $\to$ inspect farmer report queue $\to$ submit review $\to$ verify status update | PASS |
| `E2E-03` | Cross-Role Authorization Isolation | Farmer session attempts to access `/officer` $\to$ rejected with 403 / redirect to `/farmer` | PASS |

---

## 2. Combined Summary & Test Reconciliations

$$\text{Vitest Unit \& RLS Tests: } 44$$
$$\text{Pytest Inference Tests: } 23$$
$$\mathbf{\text{Total Automated Unit \& Integration Tests: }} \mathbf{67} \quad (\mathbf{100\% \text{ Passing}})$$
$$\text{Playwright Real-Browser Scenarios: } 3$$
$$\mathbf{\text{Grand Total Verified Test Scenarios: }} \mathbf{70}$$
