# PhytoX — Complete Academic Project Knowledge Base & System Dossier

**Project Name:** PhytoX  
**Full Academic Title:** PhytoX — AI-Assisted Agricultural Pathology Diagnosis, Longitudinal Crop Surveillance, and Regional Early-Warning Intelligence Platform  
**Target Academic Degree:** Bachelor of Engineering (B.E.) in Computer Science & Engineering (2026–2027)  
**Institution:** Matrusri Engineering College, Saidabad, Hyderabad (Affiliated with Osmania University)  
**Compilation Date:** 19 November 2026  
**Auditing Standard:** Gravitas Verification & Evidence Traceability Protocol  
**Repository State:** Runtime-Verified & Deployed (`PhytoX/`, Commit `1ba0b43`)  

---

# EXECUTIVE SUMMARY & PROJECT IDENTITY

**PhytoX** is an enterprise-grade, cloud-and-edge agricultural intelligence platform engineered to address one of the most critical challenges in global food security: the delayed diagnosis and uncoordinated surveillance of foliar plant diseases in smallholder farming systems. 

Unlike conventional, consumer-grade "leaf scanning" applications that execute unconstrained classification over arbitrary image inputs, PhytoX introduces **Foliar Crop Conditioning**, an agronomical safety layer that dynamically restricts deep learning predictions to biologically verified host-pathology combinations. Furthermore, the platform bridges the divide between individual field diagnosis and public disease containment through a **Dual-Portal Progressive Architecture**:
1. **The Farmer Progressive Web App (PWA):** A touch-first, multilingual (English, Telugu, Hindi) interface enabling growers to capture leaf photographs, receive calibrated AI-assisted diagnoses with explicit uncertainty metrics, maintain private plot records, and voluntarily escalate findings to district agronomists.
2. **The Agricultural Officer Command Portal:** A desktop-first workstation for certified extension officers and plant pathologists, providing jurisdiction-bounded report review queues, Leaflet-powered GIS disease maps, longitudinal surveillance monitoring, and targeted treatment advisory dispatch.

The platform is powered by a fine-tuned **MobileNetV2** deep neural network exported to **ONNX Runtime**, achieving **96.04% validation accuracy** across 38 disease classes spanning 14 agricultural crops, with a median CPU forward-pass latency of **13.31 milliseconds**. Data integrity, privacy isolation, and spatial compliance are guaranteed through a managed **Supabase PostgreSQL 15+** database enforcing **100% Row Level Security (RLS)** across all 13 relational tables, supported by cryptographic prediction deduplication and k-anonymity aggregation.

---

# PART 1 — PROBLEM STATEMENT, MOTIVATION & OBJECTIVES

## 1.1 The Agricultural Pathology Crisis
In developing agrarian economies, plant diseases caused by fungal pathogens (blights, rusts, mildews), bacterial infections (wilts, spots), and viral vectors (mosaic viruses, leaf curl) cause between **20% to 40% of global crop yield loss annually**. In countries like India, smallholder farmers face severe structural barriers:
* **Severe Pathologist Scarcity:** Certified agricultural extension officers and plant pathologists are acutely outnumbered by active growers (frequently exceeding 1 officer per 1,500–2,000 farmers). Smallholders in remote mandals cannot access timely field consultations.
* **Diagnostic Latency:** Traditional diagnostic methods (physical extension visits, dispatching leaf clippings to district universities, or fungal plate culturing) require **5 to 14 days**. By the time diagnosis is confirmed, airborne sporulation has caused irreversible harvest loss.
* **Speculative Agrochemical Overuse:** Lacking precise diagnosis, farmers resort to broad-spectrum chemical fungicides and organophosphate insecticides based on commercial retailer recommendations. This practice escalates production costs, induces pathogen resistance, degrades soil microbiomes, and contaminates rural groundwater.
* **Surveillance Blindspots:** Agricultural administrations lack real-time digital visibility into emerging spatial clusters. Outbreaks are recognized only after reaching epidemic proportions, precluding proactive regional containment.

## 1.2 Motivation for PhytoX
PhytoX was conceived to transform plant disease diagnosis from an isolated, speculative gamble into a synchronized, evidence-based public health workflow:
* **Democratizing Pathological Expertise:** Bringing instant, expert-level computer vision screening directly to smallholder farmers' smartphones in their native language.
* **Enforcing Agronomical Plausibility:** Eliminating dangerous deep learning hallucinations through domain-specific crop conditioning.
* **Closing the Public Health Loop:** Establishing a formal digital reporting channel where farmer observations inform regional surveillance and trigger expert-formulated treatment advisories.

## 1.3 Main Objectives
1. **Develop an Edge-Optimized Pathology Classifier:** Fine-tune MobileNetV2 on 38 disease categories across 14 crops, achieving $>95\%$ validation accuracy and sub-30ms CPU execution.
2. **Implement Foliar Crop Conditioning:** Engineer inference logic that conditions classification logits on farmer-selected crop priors, detects biological cross-crop mismatches, and enforces conservative uncertainty abstention.
3. **Build a Dual-Role Progressive Web Architecture:** Deliver a mobile-first PWA for farmers supporting offline shell caching, camera capture, and multilingual interaction (English, Telugu, Hindi), alongside a dedicated desktop command portal for agricultural officers.
4. **Enforce Enterprise Relational Security:** Enforce 100% Row Level Security across PostgreSQL, guaranteeing farmer tenant isolation, signed private photo storage, and k-anonymity privacy in regional reports.
5. **Establish Longitudinal Plot Surveillance:** Engineer an end-to-end workflow for tracking farm parcels over time with bi-weekly check-ins and deterministic early-warning outbreak signals.
6. **Empirically Validate the Platform:** Verify full-stack reliability with an automated test suite comprising unit tests, database authorization tests, ONNX contract tests, and end-to-end browser workflows.

---

# PART 2 — COMPLETE TECHNOLOGY STACK

| Layer | Component | Version | Role in PhytoX | Verification Source File |
|---|---|---|---|---|
| **Frontend Framework** | **Next.js** | `16.4.6` | App Router, Server Components, Route Handlers (BFF pattern). | `apps/web/package.json` |
| **UI Library** | **React** | `19.2.0` | Declarative UI, Concurrent React, hooks, server actions. | `apps/web/package.json` |
| **Language** | **TypeScript** | `^5.9.0` | Strict type safety, shared interfaces, and Zod schemas. | `apps/web/tsconfig.json` |
| **Styling** | **Tailwind CSS** | `^4.1.0` | CSS-first configuration, 7-color PhytoX Master Brand Palette. | `apps/web/src/app/globals.css` |
| **3D Engine** | **Three.js** | `^0.187.0` | WebGL rendering context, lighting, camera controls, materials. | `apps/web/package.json` |
| **React 3D Bridge** | **@react-three/fiber** | `^9.8.2` | Declarative React reconciler for Three.js render loops. | `apps/web/package.json` |
| **3D Helpers** | **@react-three/drei** | `^10.7.9` | `useGLTF` model loader, Draco WASM decoder, HDRI environment. | `apps/web/package.json` |
| **Animation Engine** | **GSAP** | `^3.15.1` | ScrollTrigger timeline, 4-scene narrative runway orchestration. | `apps/web/src/app/page.tsx` |
| **UI Motion** | **Motion** | `^12.23.0` | Layout animations, scanner beam sweeping motion, modal transitions. | `apps/web/package.json` |
| **GIS Mapping** | **Leaflet** | `^1.9.4` | Interactive epidemiological disease maps in Officer Portal. | `apps/web/package.json` |
| **Map Clustering** | **Leaflet.markercluster** | `^1.5.3` | High-performance spatial clustering of field report coordinates. | `apps/web/package.json` |
| **Analytics Charts** | **Recharts** | `^3.3.0` | 30-day temporal trend lines and disease distribution bar charts. | `apps/web/package.json` |
| **Image Sanitation** | **Sharp** | `^0.35.5` | Libvips C++ image decoding, auto-rotation, dimension bounding. | `apps/web/src/services/diagnosis.ts` |
| **Schema Validation**| **Zod** | `^4.1.0` | Runtime validation for API bodies, query params, and schemas. | `apps/web/src/lib/contracts.ts` |
| **Form Management** | **React Hook Form** | `^7.66.0` | Performant form state for observation logs and review modal. | `apps/web/package.json` |
| **Iconography** | **Lucide React** | `^0.468.0` | Accessible SVG icons across farmer and officer workspaces. | `apps/web/package.json` |
| **Inference Framework**| **FastAPI** | `0.115.11` | Asynchronous Python REST microservice (`/v1/predict`). | `services/inference/requirements.txt` |
| **ASGI Server** | **Uvicorn** | `0.34.0` | Production ASGI web server container execution. | `services/inference/requirements.txt` |
| **ML Inference Engine**| **ONNX Runtime** | `>=1.20` | High-speed CPU inference forward pass (`supplied.onnx`). | `services/inference/requirements-onnx.txt` |
| **Python Image Lib** | **Pillow** | `11.1.0` | Server-side decoding, decompression guards, luminance stats. | `services/inference/requirements.txt` |
| **Tensor Math** | **NumPy** | `2.2.3` | ImageNet normalization, stable softmax, conditional masking. | `services/inference/requirements.txt` |
| **Data Validation** | **Pydantic** | `2.10.6` | Request/response OpenAPI contract validation in FastAPI. | `services/inference/requirements.txt` |
| **Relational DB** | **PostgreSQL** | `15.x` | Relational storage, `pgcrypto`, 100% Row Level Security. | `supabase/migrations/` |
| **Supabase SDK** | **@supabase/supabase-js**| `^2.80.0` | Unified client for database queries, auth, and RPC calls. | `apps/web/package.json` |
| **SSR Auth Bridge** | **@supabase/ssr** | `^0.8.0` | Encrypted HTTP-only cookie session handling for App Router. | `apps/web/package.json` |
| **Native Mobile** | **Capacitor** | `8.6.2` | Android native container bridge, compiled debug APK (4.12 MB). | `apps/web/capacitor.config.ts` |
| **Unit Test Runner** | **Vitest** | `^4.0.0` | Fast TypeScript/React unit runner (44 tests in `apps/web`). | `apps/web/vitest.config.ts` |
| **In-Process DB Test**| **PGlite** | `^0.5.13` | WebAssembly PostgreSQL testing 18 RLS policies in Node.js. | `apps/web/tests/database/authorization.test.ts` |
| **Python Test Suite**| **Pytest** | `9.2.0` | Python test runner (23 tests in `services/inference`). | `pytest.ini` |
| **Browser E2E Suite**| **Playwright** | `^1.56.0` | Real-browser headless/headful automation (3 E2E specs). | `apps/web/playwright.config.ts` |

---

# PART 3 — COMPLETE SYSTEM ARCHITECTURE

## 3.1 Architectural Decomposition & Boundaries
PhytoX enforces strict architectural isolation:
1. **Client Isolation:** The browser and mobile container possess zero knowledge of raw ML service endpoints or privileged database credentials. All requests route through the **Next.js Backend-for-Frontend (BFF)**.
2. **Two-Phase Diagnosis Pipeline:**
   - **Phase 1 (Reservation):** When a farmer submits an image, the BFF calls stored procedure `reserve_diagnosis(p_key=UUID)`. PostgreSQL idempotently creates a record with `status = 'processing'`. The BFF uploads sanitized JPEG bytes to private storage: `crop-images/<owner_id>/<diagnosis_id>/image`.
   - **Phase 2 (Prediction & Commit):** The BFF checks the composite prediction cache. On a miss, it forwards the sanitized image and selected crop to the FastAPI microservice over internal HTTPS with header `X-API-Key`. On receipt of valid predictions, the BFF calls `finish_diagnosis` via the service role to commit predictions atomically and set `status = 'complete'`.
3. **Rollback Resilience:** If the inference service fails or times out, the BFF catches the exception, marks the diagnosis as `status = 'failed'` with an error code, purges the uploaded image, and returns an informative HTTP 503 error without leaving corrupted state.

## 3.2 Security & Threat Model
* **Origin & CSRF Defense:** Route Handlers strictly enforce Origin and Referer header checking against allowed hostnames (`apps/web/src/lib/api/protection.ts`).
* **100% Database Row Level Security (RLS):** 22 granular policies across 13 tables restrict data access at the database engine level. Farmers can only view and mutate their own records.
* **Jurisdiction Boundaries:** Agricultural Officers are restricted strictly to districts assigned in `public.officer_regions`. Cross-district queries return zero rows or throw authorization exceptions.
* **Private Storage Sandboxing:** Storage bucket `crop-images` is private. Uploads enforce path ownership `(storage.foldername(name))[1] = auth.uid()::text`. Read access requires time-limited signed URLs (TTL 3600s).
* **k-Anonymity Differential Privacy:** Aggregated regional disease counts (`public.regional_insights`) require at least 3 distinct contributing farmers (`having count(distinct r.owner_id) >= 3`), preventing farmer de-anonymization.

---

# PART 4 — MACHINE LEARNING & CROP CONDITIONING

## 4.1 MobileNetV2 Architecture & Transfer Learning
* **Neural Backbone:** Pretrained MobileNetV2 (ImageNet-1K weights), featuring 17 inverted residual blocks with linear bottlenecks and global average pooling yielding a 1,280-dimensional feature embedding.
* **Custom Classifier Head:** Verified in `ml/src/model.py`:
  $$\text{Dropout}(0.30) \to \text{Linear}(1280, 512) \to \text{ReLU} \to \text{Dropout}(0.15) \to \text{Linear}(512, 38)$$
* **ONNX Artifact:** `services/inference/models/supplied.onnx` (Opset 14, size **11.57 MB**, SHA-256 `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`).

## 4.2 Mathematical Formulation of Crop Conditioning
Implemented in `services/inference/app/model.py` (`postprocess()`):

1. **Numerically Stable Softmax:**
   Given raw output logits $z \in \mathbb{R}^{38}$:
   $$z_{i}' = z_{i} - \max_{j}(z_{j}), \quad P_{i} = \frac{e^{z_{i}'}}{\sum_{k=1}^{38} e^{z_{k}'}}$$
2. **Detected Visual Crop Extraction:**
   $$i_{\text{top}} = \arg\max_{i}(P_{i}), \quad C_{\text{det}} = \text{Crop}(\text{Label}_{i_{\text{top}}})$$
3. **Crop Candidate Subsetting & Evidence:**
   When the farmer has designated crop $C_{\text{sel}}$:
   $$I_{\text{crop}} = \{i \mid \text{Crop}(\text{Label}_{i}) = C_{\text{sel}}\}, \quad E_{\text{crop}} = \sum_{i \in I_{\text{crop}}} P_{i}$$
4. **Crop Mismatch Advisory Rule:**
   $$\text{Mismatch} = (C_{\text{det}} \ne C_{\text{sel}}) \land (E_{\text{crop}} < 0.25)$$
   If $\text{Mismatch} = \text{True}$, emits active mismatch banner and flags uncertainty.
5. **Conditional Probability Renormalization:**
   $$P(d_{i} \mid C_{\text{sel}}) = \frac{P_{i}}{E_{\text{crop}}}, \quad \forall i \in I_{\text{crop}}$$
   Top prediction: $i^{*} = \arg\max_{i \in I_{\text{crop}}} P(d_{i} \mid C_{\text{sel}})$, confidence $= P(d_{i^{*}} \mid C_{\text{sel}})$.
6. **Class Margin & Abstention:**
   $$\Delta = P(d_{i^{*}} \mid C_{\text{sel}}) - P(d_{i_{2}^{*}} \mid C_{\text{sel}})$$
   $$\text{Uncertain} = (\text{Confidence} < 0.70) \lor (\Delta < 0.15) \lor \text{Mismatch}$$
   $$\text{Abstained} = \text{Uncertain} \lor (\text{len}(\text{QualityWarnings}) > 0)$$

## 4.3 Cryptographic Prediction Caching
Constructs composite SHA-256 signature in `apps/web/src/services/diagnosis.ts`:
$$\text{Key} = \text{sha256}(\text{JSON}(\text{owner\_id}, \text{image\_hash}, \text{selected\_crop}, \text{model\_digest}, \text{pre\_version}, \text{post\_version}, \text{params}))$$
Indexable JSONB containment queries in PostgreSQL return cached predictions in **$<10\text{ ms}$**, eliminating redundant neural computation for duplicate photo submissions.

---

# PART 5 — DATASET, TRAINING & EMPIRICAL RESULTS

## 5.1 Dataset Identification & Inventory
* **Dataset Name:** **New Plant Diseases Dataset (Augmented)** by vipoooool on Kaggle (PlantVillage benchmark).
* **Disk Image Count:** Exactly **87,900 images total** on disk:
  - `train/`: 70,295 images across 38 classes.
  - `valid/`: 17,572 images across 38 classes.
  - Benchmark Core Images: $70,295 + 17,572 = 87,867$ images.
  - `test/test/`: 33 evaluation images.
* **Pathology Spectrum:** 38 classes across 14 crops (Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato).

## 5.2 Training Configuration & Checkpoint Proof
* **Execution Environment:** Google Colab Cloud Instance (NVIDIA Tesla T4 GPU, 16 GB VRAM).
* **Hyperparameters:** Batch size 32, Adam optimizer, initial head lr $10^{-3}$, backbone lr $10^{-4}$, weight decay $10^{-4}$, ReduceLROnPlateau (factor 0.5, patience 3), early stopping patience 5.
* **Loss Function:** Weighted Cross-Entropy Loss ($w_{i} = \frac{N_{\text{total}}}{38 \times N_{i}}$).
* **Tier-Based Augmentation:** Standard for $\ge 500$ images; Aggressive with Gaussian blur and random erasing for minority classes $< 500$ images.
* **Verified Metric:** Checkpoint `ml/models/best_model.pt` records **96.04% Validation Accuracy** ($0.9603566$) at **Epoch 15**.

## 5.3 Computational Latency Benchmarks
* Single-Image CPU Forward Pass (Median): **13.31 ms** (p95: **21.65 ms**).
* Full Backend Pipeline (Decode + Normalize + ONNX + Conditioning): **28.40 ms**.
* Full Serverless BFF HTTPS Roundtrip: **450–750 ms**.
* Hardened Prediction Cache Hit: **< 10 ms**.

---

# PART 6 — PORTAL WORKFLOWS & SURVEILLANCE

## 6.1 Farmer Progressive Web App Workflows
1. **Language Selection:** Instant gating between English, Telugu (తెలుగు), and Hindi (हिन्दी) via HTTP-only cookie.
2. **Crop Selector Grid:** 14 photographic crop tiles + multi-crop fallback.
3. **Camera & Preview:** Client-side format/size validation with animated GSAP scanning beam.
4. **Diagnostic Presentation:** Calibrated confidence gauge, alternative candidates drawer, and clear non-chemical cultural guidance.
5. **Crop Mismatch & Quality Banners:** Active warnings for wrong crop selection or improper exposure ($B < 30$ or $B > 235$).
6. **Private History:** Full historical log of scans and officer review badges.
7. **Voluntary Reporting:** One-click escalation to district extension officers with mandatory consent and optional GPS.
8. **Plot Surveillance:** Enrolling acreage and logging bi-weekly Monday/Thursday observations.

## 6.2 Agricultural Officer Command Workstation Workflows
1. **Role-Gated Authentication:** Verified via `public.user_profiles.role in ('officer', 'admin')`.
2. **Jurisdiction Scoping:** Queries bound to officer's assigned regions in `public.officer_regions`.
3. **Executive Dashboard:** Active review queues, farmer counts, and 30-day disease trend analytics (Recharts).
4. **Farmer Administration:** Searchable directory, invitation modal, and suspension/reactivation actions.
5. **Report Review Queue:** High-resolution photo inspection with optimistic concurrency lock on `version`.
6. **Clinical Determinations:** Verify, Reject, or Request Follow-up with mandatory clinical notes (3–2000 chars).
7. **GIS Disease Map:** Leaflet cluster mapping displaying spatial disease severity pins.
8. **Field Advisories:** Dispatches actionable treatment prescriptions directly to farmer inboxes.

## 6.3 Longitudinal Surveillance & Outbreak Rules
Operates via deterministic agronomic heuristics in `apps/web/src/services/monitoring.ts`:
* **Observation Scheduling:** Advances due dates across vegetative cycles using a dynamic Monday/Thursday algorithm.
* **Recurrent Disease Rule:** Sequential non-healthy detections on the same plot within 14 days $\to$ High severity alert.
* **Regional Cluster Rule:** $\ge 3$ distinct observations detecting the same disease in an administrative district within 7 days $\to$ High severity cluster alert.

---

# PART 7 — MOBILE APP & DEPLOYMENT TOPOLOGY

## 7.1 Mobile Platform Reality
* **PWA:** Production Service Worker (`sw.js`) implementing network-first navigation with `offline.html` fallback, and cache-first media assets.
* **Android Container:** Capacitor 8.6.2 Gradle package compiled into verified debug APK **`app-debug.apk`** (**4,118,894 bytes**, ~**4.12 MB**).
* **iOS Status:** Configured via Capacitor in `apps/web/ios/App/App`; compilation pending macOS Xcode build infrastructure.
* **Cloud Dependency:** The mobile app **does not execute on-device inference**; cellular/Wi-Fi network access is required to communicate with the cloud FastAPI service.

## 7.2 Multi-Cloud Deployment Topology
* **Web Frontend & BFF:** Vercel Edge Serverless Platform (`https://phytox.vercel.app`).
* **ML Inference Microservice:** Render Cloud Container (Docker Python 3.11-slim, Uvicorn, FastAPI, ONNX Runtime CPU).
* **Database & Storage:** Supabase Cloud (PostgreSQL 15, Auth, private `crop-images` bucket).
* **Cold-Start Resilience:** Render's 15-minute idle sleep triggers graceful connecting banners in the UI; zero mock predictions are ever fabricated.

---

# PART 8 — COMPREHENSIVE TEST SUITE EXECUTION

* **Automated Unit & Integration Tests:** Exactly **67 tests passing 100%**:
  - Vitest (`apps/web`): 44 tests passing in 3.64 seconds (including 18 PGlite WebAssembly PostgreSQL RLS tests).
  - Pytest (`services/inference`): 23 tests passing in 1.08 seconds (FastAPI endpoints and ONNX contracts).
* **Playwright Real-Browser E2E Scenarios:** Exactly **3 passing specs** (`live-browser-portal.spec.ts`):
  - `E2E-01`: Farmer Live Diagnosis Workflow (PASS).
  - `E2E-02`: Officer Command & Review Lifecycle (PASS).
  - `E2E-03`: Role Escalation Access Denial (PASS).
* **Grand Total Verified Test Scenarios:** Exactly **70 scenarios**.

---

# PART 9 — SYSTEM LIMITATIONS & FUTURE RESEARCH

## 9.1 Acknowledged Limitations
1. **Benchmark Domain Gap:** Laboratory background conditions of PlantVillage versus complex cluttered outdoor field foliage.
2. **Crop Vocabulary Boundary:** Restricted to 14 supported crops; major Indian staples like Rice and Cotton are unlisted in the current model weights.
3. **Cloud Egress Requirement:** No offline edge inference on device; requires active mobile data.
4. **Heuristic vs. Predictive ML:** Surveillance rules are deterministic heuristics, not predictive spatiotemporal neural network models.
5. **Mobile Platform Build:** Android APK compiled; iOS IPA pending macOS build hardware.

## 9.2 Future Scope & Research Agenda
1. **Zero-Connectivity Edge AI:** Compiling an 8-bit quantized INT8 MobileNetV3 model into WebAssembly via ONNX Runtime Web for offline smartphone inference.
2. **Regional Crop Expansion:** Retraining on Indian field datasets (Rice, Cotton, Chili, Sugarcane).
3. **Open-Set Out-of-Distribution Rejection:** Mahalanobis distance scoring to definitively reject non-plant inputs.
4. **Spatiotemporal Graph Neural Networks (ST-GNNs):** Forecasting disease propagation 48–72 hours in advance using weather station telemetry (relative humidity, precipitation, wind).
5. **Conversational Dialect Audio Interfaces:** Fine-tuned regional speech models (Telugu/Hindi) for voice-driven diagnosis.
6. **Automated SMS / WhatsApp Advisories:** Direct webhook dispatch to basic feature phones.

---

# INSTRUCTIONS FOR CLAUDE — ACADEMIC DOCUMENTATION GENERATION

When authoring the official B.E. Mini-Project Report from this knowledge base, adhere to the standard academic engineering curriculum structure mandated by Matrusri Engineering College (Affiliated with Osmania University):

### CHAPTER 1 — INTRODUCTION
* **1.1 Problem Statement:** Detail smallholder vulnerability, pathologist scarcity, diagnostic latency (5–14 days), and chemical overuse.
* **1.2 Motivation:** Rationale for combining edge computer vision with public agricultural governance.
* **1.3 Existing System & Limitations:** Traditional culturing/pamphlets and generic consumer plant apps (unconstrained softmax, biological absurdities, lack of privacy).
* **1.4 Proposed System:** PhytoX dual-portal platform with Foliar Crop Conditioning, 100% RLS, and longitudinal monitoring.
* **1.5 Objectives:** Enumerate the 6 primary engineering objectives.
* **1.6 Project Scope:** Scope boundaries (14 crops, 38 classes, PWA + Android, cloud inference).
* **1.7 Related Literature:** Critical survey of deep learning in plant pathology (PlantVillage, Mohanty et al., MobileNetV2 inverted residuals, differential privacy).

### CHAPTER 2 — REQUIREMENT ANALYSIS & SYSTEM SPECIFICATION
* **2.1 Functional Requirements:** Detailed functional requirements for Farmer (FR-1 to FR-8) and Officer (FR-9 to FR-16).
* **2.2 Non-Functional Requirements:** Security (RLS, CSRF), Performance (sub-30ms CPU forward pass), Linguistic Accessibility, and Reliability.
* **2.3 Feasibility Study:** Technical, Operational, Economic, and Social feasibility analysis.
* **2.4 Hardware & Software Requirements:** Tabulate client, server, and development toolchain specifications from `18_REQUIREMENTS.md`.

### CHAPTER 3 — SYSTEM DESIGN
* **3.1 System Architecture:** High-level multi-tier diagram and BFF pattern explanation.
* **3.2 UML Design Diagrams:** Use-Case Diagram, Class Diagram, Sequence Diagrams (Two-Phase Diagnosis, Report Review).
* **3.3 Data Flow Diagrams (DFDs):** Context-Level DFD (Level 0) and Level 1 Subsystem Decomposition.
* **3.4 Flowcharts:** Farmer Diagnostic Workflow and MobileNetV2 Inference Pipeline.
* **3.5 Database Design & ER Model:** Entity-Relationship (ER) diagram, 13 relational tables, normalization, constraints, and RLS policies.

### CHAPTER 4 — IMPLEMENTATION & TESTING
* **4.1 Technology Stack Implementation:** Next.js 16, React 19, Tailwind CSS (7 brand colors), Three.js botanical island, FastAPI, ONNX Runtime.
* **4.2 Deep Learning Model Implementation:** MobileNetV2 backbone, custom $1280 \to 512 \to 38$ classification head, ImageNet normalization, ONNX export.
* **4.3 Foliar Crop Conditioning & Caching Logic:** Mathematical formulation of candidate subsetting, mismatch detection, uncertainty margin, and SHA-256 caching.
* **4.4 Subsystem Implementation:** Farmer Portal (scanner, history, plot enrollment) and Officer Portal (GIS map, review queue, farmer directory).
* **4.5 Testing Methodology & Test Cases:** Vitest (44 tests), Pytest (23 tests), Playwright (3 E2E specs). Include detailed test case tables.

### CHAPTER 5 — RESULTS & DISCUSSION
* **5.1 Model Evaluation Metrics:** 96.04% validation accuracy at Epoch 15 on 15% stratified holdout.
* **5.2 Latency Benchmarks:** 13.31 ms median CPU inference, 28.40 ms full pipeline, sub-10 ms cache hits.
* **5.3 Diagnostic Demonstrations:** Case studies (Tomato Early Blight, Potato/Tomato mismatch alert, underexposure rejection).
* **5.4 Photographic Evidence Figures:** Reference all 11 figures (`fig_5_1` to `fig_5_9`) from `docs/academic-evidence/07-screenshots/`.
* **5.5 Android Binary Packaging:** Verification of `app-debug.apk` (4.12 MB).

### CHAPTER 6 — CONCLUSION & FUTURE SCOPE
* **6.1 Summary of Contributions:** Concise recap of achieved technical milestones.
* **6.2 System Limitations:** Honest academic discussion of domain shift, cloud dependency, 14-crop boundary, and heuristic rules.
* **6.3 Future Research Roadmap:** On-device WebAssembly edge AI, Indian cash crop expansion (Rice, Cotton), OOD rejection, Spatiotemporal GNNs, dialect voice queries, and SMS/WhatsApp webhooks.

### FORMATTING & TONE INSTRUCTIONS FOR CLAUDE:
1. **Academic Rigor:** Write in formal, third-person academic passive or objective voice ("The system was designed...", "Inference was executed...").
2. **Zero Hallucination:** Do not invent nonexistent microservices, synthetic confusion matrices, or unrecorded test outcomes. Cite the verified numbers documented in this dossier.
3. **Mathematical Precision:** Retain all KaTeX mathematical formulas (depthwise separable convolution cost reduction, softmax shift, crop conditioning renormalization, dynamic scheduling).
4. **Placeholders:** Maintain clean bracketed placeholders for student authors (`[Student Name, Roll No.]`), faculty guides, and HODs.
