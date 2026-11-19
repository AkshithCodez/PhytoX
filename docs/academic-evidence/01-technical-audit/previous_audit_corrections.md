# PhytoX — Corrections to Previous Technical Audit

**Audit Date:** 19 November 2026  
**Auditors:** Principal Software Architect & Senior QA Lead  

During this comprehensive audit, four specific inconsistencies and discrepancies in earlier preliminary audit drafts were identified and corrected:

---

### 1. Reconciling Automated Test Counts (67 vs 70 Tests)
* **Discrepancy in Earlier Draft:** An earlier summary stated "67 automated tests passing", but also listed "44 Vitest tests, 23 Pytest tests, 3 Playwright tests", which sums to 70.
* **Resolution & Exact Fact:**
  - **44 Vitest tests** are automated JavaScript/TypeScript unit, component, and in-process PostgreSQL RLS tests in `apps/web`.
  - **23 Pytest tests** are automated Python unit, integration, and ONNX contract tests in `services/inference`.
  - **Sum of Automated Unit & Integration Tests:** $44 + 23 = \mathbf{67}$ **tests**.
  - **3 Playwright tests** in `apps/web/tests/e2e/live-browser-portal.spec.ts` are end-to-end browser workflows (Farmer, Officer, and Role Access Denial) which run against a running browser instance.
  - **Total Test Suite:** Exactly 67 unit/integration tests + 3 E2E specs = 70 verified test scenarios.

---

### 2. Model Training Provenance & Validation Metrics
* **Discrepancy in Earlier Draft:** Earlier notes stated that model training hyperparameters and validation accuracy were "NOT VERIFIED — ORIGINAL TRAINING ARTIFACT REQUIRED".
* **Resolution & Exact Fact:**
  - The sibling directory `../ml/` was inspected.
  - Located `../ml/notebooks/train_colab.ipynb`, `../ml/src/train.py`, `../ml/src/model.py`, `../ml/src/dataset.py`, `../ml/src/export_onnx.py`, and `../ml/models/best_model.pt`.
  - Inspecting `best_model.pt` directly recovered the exact training metadata:
    - `epoch`: **15**
    - `val_accuracy`: **0.9603566009104704** (~**96.04%**)
    - `backbone`: **mobilenetv2**
    - `num_classes`: **38**
  - Dataset: Kaggle `vipoooool/new-plant-diseases-dataset` (PlantVillage 38 classes, 14 crops).
  - Training Environment: Google Colab T4 GPU (~18–25 minutes).
  - Optimizer: Adam (head_lr = $10^{-3}$, weight_decay = $10^{-4}$), ReduceLROnPlateau(patience=3, factor=0.5).
  - Loss: CrossEntropyLoss with inverse-frequency class weights.
  - The report now accurately states that **96.04% validation accuracy** was achieved during training on the validation split, while noting that the raw dataset images were kept on Colab ephemeral storage.

---

### 3. Vercel Environment Key Harmonization (`ANON_KEY` vs `PUBLISHABLE_KEY`)
* **Discrepancy:** The farmer portal showed an alert "Account services are not configured yet" when deployed to Vercel, despite keys being entered in Vercel.
* **Resolution & Exact Fact:**
  - Vercel UI configured `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - The codebase originally checked only `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  - Commit `4c9e2be` updated `apps/web/src/lib/supabase/config.ts` to support both keys seamlessly.

---

### 4. GitGuardian Alert Resolution
* **Discrepancy:** GitGuardian flagged a static password string in `live-browser-portal.spec.ts`.
* **Resolution & Exact Fact:**
  - Commit `4c9e2be` removed the static string `PhytoX_BrowserLive_2026!` and replaced it with an ephemeral random secret generator: `Ephemeral_${runId}_${Math.random().toString(36).slice(2)}!`.
