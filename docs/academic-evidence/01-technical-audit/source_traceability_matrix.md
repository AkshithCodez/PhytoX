# PhytoX — Source Traceability Matrix

**Project:** PhytoX (B.E. Mini Project 2026–2027)  
**Standard:** Gravitas Evidence Traceability Protocol  

| Claim / Requirement | Source Implementation File | Function / Schema / Policy | Verification Method | Result & Confidence | Suitable for Academic Report |
|---|---|---|---|---|---|
| **Farmer Language Gating** | `apps/web/src/app/language/page.tsx` | `selectLanguage()`, cookie persistence | Vitest (`locale.test.tsx`) & Browser inspection | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 3 & 5 |
| **14-Crop Visual Selector** | `apps/web/src/components/farmer/crop-selector.tsx` | `SUPPORTED_CROPS`, grid mapping | Vitest (`crop-conditioning.test.ts`) & Screenshot | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 3 & 5 |
| **Image Scanning Beam** | `apps/web/src/components/farmer/scanner.tsx` | Canvas scan-line animation & file validation | Component test & Playwright screenshot | VERIFIED FROM SOURCE AND RUNTIME (100%) | YES — Chapter 5 |
| **Crop Conditioning Safety** | `services/inference/app/classifier.py` | `condition_probabilities()`, mismatch logic | Pytest (`test_crop_conditioning_...`) | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 2 & 4 |
| **Quality & Exposure Rejection** | `services/inference/app/classifier.py` | Mean brightness `< 0.15` or `> 0.85` check | Pytest (`test_exposure_warning`) | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 4 |
| **Uncertainty Abstention** | `services/inference/app/classifier.py` | Confidence `< 0.70`, margin `< 0.15` | Pytest (`test_uncertain`) | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 4 |
| **Two-Phase Diagnosis RPC** | `supabase/migrations/202610310001_initial.sql` | `reserve_diagnosis`, `finish_diagnosis` | PGlite (`authorization.test.ts`) | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 3 & 4 |
| **100% RLS Enforcement** | `supabase/migrations/` (4 migrations) | 22 RLS policies across 13 tables | PGlite 18 authorization tests | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 3 & 4 |
| **Officer Farmer Admin** | `apps/web/src/app/officer/farmers/page.tsx` | Status toggling (suspend/reactivate) | Route Handler test & UI verification | VERIFIED FROM SOURCE AND RUNTIME (100%) | YES — Chapter 3 & 5 |
| **Longitudinal Monitoring** | `supabase/migrations/202611180001_...` | `monitored_plots`, `crop_observations` | Schema check & Vitest relations | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 3 & 5 |
| **Early-Warning Signals** | `apps/web/src/app/officer/surveillance/page.tsx` | Recurrent condition & cluster rules | Vitest (`domain.test.ts`) & UI audit | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 3 & 5 |
| **Targeted Advisories** | `apps/web/src/app/api/officer/advisories/route.ts` | Advisory creation & farmer inbox mapping | Database foreign keys & RLS | VERIFIED FROM SOURCE AND EXECUTION (100%) | YES — Chapter 3 & 5 |
| **Vercel Web BFF** | `apps/web/package.json` | Next.js 16 deployment config | Live curl probe (`/api/status`) | VERIFIED FROM RUNTIME (100%) | YES — Chapter 4 |
| **Render ML Microservice** | `services/inference/Dockerfile` | Uvicorn FastAPI ONNX container | Live curl probe (`status: ready`) | VERIFIED FROM RUNTIME (100%) | YES — Chapter 4 |
| **MobileNetV2 Model Weights** | `services/inference/models/supplied.onnx` | SHA-256 `fde9536ff18a...`, 11.5 MB | ONNX runtime session & checker | VERIFIED FROM ARTIFACT (100%) | YES — Chapter 4 |
| **Colab Training Provenance** | `../ml/notebooks/train_colab.ipynb` | Kaggle `new-plant-diseases-dataset`, T4 GPU | Checkpoint unpickler (`best_model.pt`) | VERIFIED FROM SOURCE & CHECKPOINT (100%) | YES — Chapter 4 |
| **Offline Independent Test Split** | `../ml/data/` | Empty folder containing `.gitkeep` | Direct disk inspection | NOT PRESENT LOCALLY (COLAB ONLY) | EXPLICIT CAVEAT REQUIRED |
