# PhytoX — Unresolved Questions & User Inputs Required

**Academic Context:** B.E. Computer Science & Engineering Mini Project (2026–2027)  
**Institution:** Matrusri Engineering College, Saidabad, Hyderabad  
**Status:** Minimal Technical Questions (Majority of items were verified directly from source code and checkpoint artifacts)

---

## 1. Questions Resolved During Audit (No Longer Required)

The following items, which were previously flagged as missing in preliminary audits, were successfully recovered directly from the local repository and the sibling `../ml/` directory:

| Item | Previously Flagged Status | Resolved Finding | Evidence Source |
|---|---|---|---|
| **Training Dataset** | Unknown | PlantVillage dataset (38 classes, 14 crops) from Kaggle (`vipoooool/new-plant-diseases-dataset`) | `../ml/notebooks/train_colab.ipynb` |
| **Model Architecture** | Inferred | PyTorch MobileNetV2 with custom head (`Dropout(0.3) -> Linear(1280, 512) -> ReLU -> Dropout(0.15) -> Linear(512, 38)`) | `../ml/src/model.py` |
| **Training Epochs** | Unknown | 15 Epochs | `../ml/models/best_model.pt` (`epoch: 15`) |
| **Validation Metric** | Unknown | **96.04%** validation accuracy ($0.9603566$) | `../ml/models/best_model.pt` (`val_accuracy`) |
| **Train/Val/Test Split** | Unknown | 70% Train, 15% Validation, 15% Test (stratified, `random_state=42`) | `../ml/src/dataset.py` |
| **Optimizer & Scheduler** | Inferred | Adam ($10^{-3}$, weight decay $10^{-4}$), ReduceLROnPlateau ($0.5\times$ factor, patience 3) | `../ml/src/train.py` |
| **Automated Test Count** | Inconsistent (67 vs 70) | 44 Vitest tests + 23 Pytest tests = 67 unit/integration tests; 3 Playwright tests = 70 total | Direct test runner execution |

---

## 2. Outstanding Questions for Project Report Team

The following questions cannot be determined from static repository analysis and require author/student input for the final project report:

### Question 1: Official Project Team & Guide Information
* **Student Names & Hall Ticket Numbers:** Exact names and roll numbers of the project team members for the title page and certificate.
* **Internal Guide:** Name, designation, and department of the faculty supervisor/guide at Matrusri Engineering College.
* **Head of Department:** Name and designation of the HOD (Computer Science & Engineering).

### Question 2: Exact Google Colab Session Wall-Clock Time
* **Known Fact:** `train_colab.ipynb` notes estimated runtime as `~18-25 mins on Colab T4 GPU`.
* **User Input:** If the exact training session wall-clock seconds from the Colab notebook execution cell are recorded in personal notes (e.g., `21 minutes 43 seconds`), that exact number can replace the estimated range in Chapter 4.

### Question 3: Future Field Pilot Plans
* **Known Fact:** The application currently runs on Vercel and Render with live Supabase database.
* **User Input:** Has an agricultural research station, Krishi Vigyan Kendra (KVK), or specific farmer group in Telangana or Andhra Pradesh been contacted for real-world field trials of the PWA? (Useful for Chapter 6: Future Scope).
