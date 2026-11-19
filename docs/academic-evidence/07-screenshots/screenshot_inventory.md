# PhytoX — Comprehensive Screenshot & Visual Evidence Inventory

**Standard:** University Academic Report Visual Catalog (Chapter 5 Results)  
**Location:** `docs/academic-evidence/07-screenshots/`  
**Authenticity Standard:** All screenshots captured from genuine running browser sessions and verified test executions. Zero synthetic mockups.  

---

## 1. Farmer Portal & Public Interface

| Figure ID | File Name | Subdirectory | Resolution | Caption & Demonstrated Capability |
|---|---|---|---|---|
| **Figure 5.1** | `fig_5_1_phytox_landing.png` | `farmer/` | 1920 × 960 | **PhytoX Cinematic Public Landing Page:** Showcases the interactive 3D botanical mesh, official 7-color palette, value proposition, and role-based portal entry points. |
| **Figure 5.1b**| `fig_5_1b_officer_login.png` | `officer/` | 1920 × 960 | **Agricultural Officer Portal Authentication:** Dedicated login view accessed via `?portal=officer`, featuring the state security seal, official verification badge, and role gating. |
| **Figure 5.2** | `fig_5_2_farmer_login.png` | `farmer/` | 1920 × 960 | **Farmer Workspace Authentication:** Clean, low-distraction authentication interface tailored for rural farmers with multilingual support. |
| **Figure 5.3** | `fig_5_3_crop_selection.png` | `farmer/` | 1200 × 800 | **14-Crop Visual Selector Grid:** Farmer selects crop (e.g., Tomato) prior to diagnosis, establishing the domain prior for crop-conditioning defense. |
| **Figure 5.4** | `fig_5_4_scanning_workflow.png` | `farmer/` | 1200 × 900 | **Photographic Preview & Active Scanning Beam:** Displays real-time uploaded leaf image with animated green scanline beam and exposure validation checks. |
| **Figure 5.5** | `fig_5_5_diagnosis_result.png` | `farmer/` | 1200 × 900 | **AI Crop Pathology Diagnosis Result:** Presents primary condition, confidence rating, alternative differential diagnoses, and responsible AI disclaimer. |
| **Figure 5.6** | `fig_5_6_farmer_monitoring.png`| `farmer/` | 1200 × 900 | **Longitudinal Crop Plot Monitoring:** Farmer view of registered field plots, twice-weekly surveillance schedules (Monday/Thursday), and observation history. |
| **Figure 5.6b**| `fig_5_6b_live_farmer_diagnosis.png` | `farmer/` | 1200 × 850 | **Live Browser Verified Diagnosis:** Browser-level recording from automated Playwright test demonstrating live diagnosis persistence. |

---

## 2. Agricultural Officer Portal & Surveillance

| Figure ID | File Name | Subdirectory | Resolution | Caption & Demonstrated Capability |
|---|---|---|---|---|
| **Figure 5.7** | `fig_5_7_officer_dashboard.png`| `officer/` | 1920 × 1080 | **Agricultural Officer Command Dashboard:** Real-time overview of assigned district jurisdiction, regional report volume, and rapid triage metrics. |
| **Figure 5.7b**| `fig_5_7b_officer_farmer_admin.png` | `officer/` | 1920 × 1080 | **Farmer Account Administration:** Officer controls to invite new farmers, view landholding details, and toggle account suspension/reactivation. |
| **Figure 5.8** | `fig_5_8_officer_review_queue.png` | `officer/` | 1920 × 1080 | **Farmer Report Verification Queue:** Detailed side-by-side review interface allowing officers to inspect leaf photos, verify AI suggestions, and append notes. |
| **Figure 5.9** | `fig_5_9_early_warning_signals.png`| `officer/` | 1920 × 1080 | **Regional Early-Warning & Outbreak Surveillance:** Automatic detection of recurrent diseases on single plots and regional pathogen clusters over 7 days. |

---

## 3. Backend & Infrastructure Evidence

| Figure ID | Evidence Description | Path | Status |
|---|---|---|---|
| **Figure 5.10**| Live Production API Health Response (`curl /api/status`) | `docs/academic-evidence/05-deployment/production_health_checks.md` | Verified Live |
| **Figure 5.11**| Vitest Test Suite Terminal Execution Record (44 Passing Tests) | `docs/academic-evidence/04-testing/test_execution_summary.md` | Verified Local |
| **Figure 5.12**| Pytest Inference Suite Terminal Execution Record (23 Passing Tests) | `docs/academic-evidence/04-testing/test_execution_summary.md` | Verified Local |
