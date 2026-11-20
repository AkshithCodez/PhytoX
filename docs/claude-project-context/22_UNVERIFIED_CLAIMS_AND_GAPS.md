# PhytoX — Unverified Claims, Administrative Placeholders & Resolved Gaps

**Document Identifier:** `22_UNVERIFIED_CLAIMS_AND_GAPS.md`  
**Classification:** Academic Integrity Audit & Gap Analysis  
**Standard:** Gravitas Invariant 6 ("Say what you can't verify; downgrade confidence instead of fabricating certainty")  
**Target:** Claude Documentation Generation Engine  

---

## 1. Administrative Placeholders Requiring Student / Author Input

The following details cannot be deduced from static repository source code and must be supplied by the student authoring team when preparing the final institutional project report:

### 1.1 Project Team & Institutional Information
* **Student Author Names & Hall Ticket Numbers:**  
  *Candidate placeholder:* `[Student Name 1, Hall Ticket No. xxxx-xx-xxx-xxx]`  
  *Candidate placeholder:* `[Student Name 2, Hall Ticket No. xxxx-xx-xxx-xxx]`  
  *Candidate placeholder:* `[Student Name 3, Hall Ticket No. xxxx-xx-xxx-xxx]`  
  *Candidate placeholder:* `[Student Name 4, Hall Ticket No. xxxx-xx-xxx-xxx]`  
* **Faculty Project Supervisor / Guide:**  
  *Candidate placeholder:* `[Name of Faculty Guide, Designation (e.g., Assistant Professor), Department of Computer Science & Engineering, Matrusri Engineering College]`  
* **Head of Department (HOD):**  
  *Candidate placeholder:* `[Name of Head of Department, Department of Computer Science & Engineering, Matrusri Engineering College]`  
* **Academic Year & Batch:** B.E. Computer Science & Engineering (Final / Pre-Final Year, Academic Year 2026–2027).

### 1.2 Training Session Exact Wall-Clock Duration
* **Repository Record:** `ml/notebooks/train_colab.ipynb` notes an estimated runtime of `~18-25 mins on Colab T4 GPU`.
* **Action for Final Report:** If the student team preserved the exact wall-clock cell execution timestamp from their Google Colab session (e.g., `21 minutes 43 seconds`), that exact number should be substituted; otherwise, cite `~18–25 minutes (NVIDIA Tesla T4 GPU)`.

### 1.3 Regional Field Pilot Collaborations
* **Current Implementation:** Deployed and operating live on Vercel and Render with live Supabase database.
* **User Input for Chapter 6:** If any local Krishi Vigyan Kendra (KVK), agricultural research station (e.g., PJTSAU in Telangana), or specific village cooperative has been contacted for real-world pilot trials, the student should insert the specific partner organization's name in Chapter 6 (Future Scope).

---

## 2. Historical Audit Misattributions Resolved in this Review

During earlier preliminary audit drafts, four specific inconsistencies were identified and subsequently reconciled through deep artifact inspection:

### Discrepancy 1: Automated Test Count Inconsistency (67 vs. 70 Tests)
* **Earlier Draft Claim:** Some preliminary summaries cited "67 automated tests", while others cited "70 tests".
* **Resolution & Exact Ground Truth:**
  - `apps/web` Vitest suite: Exactly **44 tests** (unit, component, and in-process PGlite database authorization tests).
  - `services/inference` Pytest suite: Exactly **23 tests** (endpoint, input validation, and ONNX contract tests).
  - Sum of Automated Unit & Integration Tests: $44 + 23 = \mathbf{67}$ **tests** (100% passing).
  - `apps/web` Playwright suite: Exactly **3 end-to-end browser specifications** (`E2E-01`, `E2E-02`, `E2E-03`).
  - Total Verified Scenarios across all tiers: Exactly **70 scenarios**.

### Discrepancy 2: Machine Learning Training Provenance & Checkpoint
* **Earlier Draft Claim:** Preliminary notes marked training hyperparameters and validation accuracy as "UNKNOWN — ORIGINAL TRAINING ARTIFACT REQUIRED".
* **Resolution & Exact Ground Truth:**
  - Deep inspection located the original training codebase in the sibling `ml/` repository.
  - Inspected `ml/src/train.py`, `ml/src/model.py`, `ml/src/dataset.py`, `ml/src/export_onnx.py`, and `ml/notebooks/train_colab.ipynb`.
  - Checkpoint unpickling of `ml/models/best_model.pt` recovered the exact serialized training metadata:
    `epoch: 15`, `val_accuracy: 0.9603566009104704` (~**96.04%**), `backbone: mobilenetv2`, `num_classes: 38`.
  - The dataset was confirmed as the Kaggle New Plant Diseases Dataset (Augmented) by vipoooool.

### Discrepancy 3: Vercel Supabase Key Harmonization
* **Earlier Draft Claim:** Farmers encountered an error "Account services are not configured yet" on Vercel deployments.
* **Resolution & Exact Ground Truth:**
  - Vercel UI configured `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - The codebase originally checked only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - `apps/web/src/lib/supabase/config.ts` was updated to support both keys seamlessly.

### Discrepancy 4: GitGuardian Security Alert in E2E Specs
* **Earlier Draft Claim:** Static password string in Playwright tests triggered secret scanners.
* **Resolution & Exact Ground Truth:**
  - Commit `4c9e2be` removed the static string and substituted an ephemeral random secret generator: `Ephemeral_${runId}_${Math.random().toString(36).slice(2)}!`.

---

## 3. Strict Directives for Claude (What NOT to Fabricate)

When authoring the official academic project report from this knowledge base:

1. **DO NOT Fabricate Offline Mobile AI Inference:**  
   The application **does not** execute on-device edge neural networks. It is a cloud-connected Progressive Web App and Capacitor container that dispatches images over HTTPS to the FastAPI microservice. State this limitation clearly and objectively.
2. **DO NOT Claim iOS IPA Distribution:**  
   Capacitor iOS project files are configured in `apps/web/ios/App/App`, but no `.ipa` binary package has been compiled because development occurred on a Windows host lacking Xcode. Describe iOS as *"configured and architected, with binary packaging pending macOS build infrastructure."*
3. **DO NOT Fabricate Machine Learning Outbreak Forecasting:**  
   The surveillance subsystem utilizes **deterministic spatial and temporal agronomic heuristic rules** (detecting recurrent symptoms within 14 days, or 3 reports in a district within 7 days). Do not describe these rules as "AI epidemic forecasting", "RNNs", "LSTMs", or "time-series machine learning models."
4. **DO NOT Fabricate Synthetic Confusion Matrices or Per-Class F1 Tables:**  
   The recorded checkpoint confirms an overall top-1 validation accuracy of **96.04%** on the 15% stratified validation split. Detailed per-class precision/recall tables were not retained in the lightweight deployment repo. Document the verified 96.04% metric and discuss per-class dynamics qualitatively without fabricating synthetic decimal numbers.
5. **DO NOT Fabricate Student Names or Faculty Supervisors:**  
   Use clean, standard academic bracketed placeholders (`[Insert Student Name, Roll No.]`) so the student team can easily customize their institutional title page and certificates.
