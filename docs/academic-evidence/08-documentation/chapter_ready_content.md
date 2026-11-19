# PhytoX: Intelligent Crop Pathology Diagnosis, Longitudinal Surveillance and Regional Early-Warning Platform

**B.E. Computer Science & Engineering Mini Project Documentation (2026–2027)**  
**Department of Computer Science & Engineering**  
**Matrusri Engineering College, Saidabad, Hyderabad**  

---

# CHAPTER 1 — INTRODUCTION

## 1.1 Introduction to Project
Agricultural productivity forms the backbone of the global economy and food security, particularly in agrarian regions like India where over 50% of the workforce depends on farming. However, crop diseases caused by fungal, bacterial, and viral pathogens account for estimated annual yield losses exceeding 20–40% globally. Smallholder farmers often lack immediate access to certified agronomists or plant pathologists, resulting in delayed identification, indiscriminate broad-spectrum chemical pesticide applications, soil degradation, and catastrophic crop failure.

**PhytoX** is an end-to-end, AI-assisted agricultural health platform designed to bridge the operational gap between grassroots farmers and agricultural extension officers. Combining deep learning computer vision (MobileNetV2), a mobile-first Progressive Web Application (PWA), cloud-native microservices, and regional GIS surveillance, PhytoX enables rapid field-level disease identification, maintains longitudinal plot-health histories, and surfaces automated epidemiological early-warning signals to government agricultural officers before localized infections turn into regional outbreaks.

## 1.2 Project Category
* **Primary Domain:** Artificial Intelligence, Computer Vision, and Deep Learning (CNNs / ONNX).
* **Secondary Domain:** Cloud-Native Full-Stack Web Development, Progressive Web Apps (PWA), and Spatial Epidemiology.
* **Database & Security:** Relational PostgreSQL, Cryptographic Row-Level Security (RLS), and Role-Based Access Control (RBAC).

## 1.3 Objectives
1. **Accurate Field-Level Diagnosis:** Provide farmers with sub-second leaf disease classification across 38 distinct crop-condition classes spanning 14 major agricultural crops.
2. **Domain-Aware Diagnostic Safety:** Introduce crop-conditioned probability filtering and mismatch detection to eliminate intra-dataset cross-crop false positives.
3. **Multilingual Inclusivity:** Overcome linguistic barriers in rural India by providing native interface support for English, Telugu (`తెలుగు`), and Hindi (`हिन्दी`).
4. **Longitudinal Plot Surveillance:** Transition from isolated, episodic disease queries to systematic twice-weekly surveillance of designated farmer plots.
5. **Regional Outbreak Detection:** Aggregate localized crop observations geographically to alert agricultural officers of recurrent infections and regional pathogen clusters.
6. **Targeted Advisory Delivery:** Equip agricultural officers with an administrative command portal to verify farmer reports and dispatch targeted field advisories.

## 1.4 Scope of the Problem
The operational scope encompasses 14 agricultural crops critical to Indian and global food production: Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato. The system addresses both individual farmer crop pathology and macro-level regional surveillance across designated administrative districts.

## 1.5 Identification / Recognition of Need
* **Shortage of Agricultural Experts:** The ratio of agricultural extension officers to operational farm holdings in India is approximately 1:1,162, far exceeding the FAO recommended ratio of 1:400.
* **Diagnostic Delay:** Laboratory pathology or physical officer inspection often requires 5 to 10 days—by which time airborne fungal spores (e.g., *Phytophthora infestans* in Potato Late Blight) cause irreversible canopy destruction.
* **Lack of Historical Continuity:** Existing diagnostic apps treat leaf scans as ephemeral queries without tracking how a disease progresses over time across specific land parcels.

## 1.6 Existing System vs. Proposed System

| Parameter | Existing Traditional / Commercial Systems | Proposed PhytoX Platform |
|---|---|---|
| **Diagnostic Method** | Physical visual inspection by visiting officer or generic web searches | On-device PWA photograph capture with MobileNetV2 deep learning inference (< 30 ms) |
| **Out-of-Distribution Handling** | None; forces every image into closed-set output, generating dangerous false diagnoses | Pre-inference crop conditioning; flags `crop_mismatch_warning` if leaf does not match crop |
| **Language Access** | English-only or machine-translated unverified text | Curated trilingual interface (English, Telugu, Hindi) with language-first gating |
| **Surveillance Model** | Ad-hoc, unlinked individual scans | Longitudinal monitoring schedules (Monday/Thursday) tied to registered field plots |
| **Administrative Oversight** | Disconnected; officers have no real-time visibility into farmer observations | Dedicated Agricultural Officer Portal with GIS mapping, report verification, and farmer admin |
| **Epidemiological Signals** | Historical post-outbreak census reports | Heuristic rule-based early-warning signals (recurrent plot diseases and 7-day regional clusters) |

## 1.7 Unique Features of the System
1. **Pre-Inference Crop-Conditioning Shield:** Restricts probability mass to known conditions of the farmer-selected crop, abstaining from false claims when evidence is $<25\%$.
2. **Quality & Exposure Pre-Flight Engine:** Detects underexposed, overexposed, or sub-resolution uploads and guides the farmer to retake the photo in natural light.
3. **Dual-Role Sovereign Architecture:** Strict separation between the Farmer Progressive Web App (`/farmer`) and the Agricultural Officer Portal (`/officer`).
4. **100% Cryptographic RLS Enforcement:** Database authorization enforced directly inside PostgreSQL, ensuring zero cross-tenant data leaks even in the event of API logic errors.

---

# CHAPTER 2 — REQUIREMENT ANALYSIS AND SYSTEM SPECIFICATION

## 2.1 Feasibility Study
* **Technical Feasibility:** The architecture utilizes open standards: Next.js 16 (React 19), ONNX Runtime, and PostgreSQL. MobileNetV2's compact 11.5 MB footprint enables efficient execution on modest serverless/container tiers without expensive dedicated GPUs.
* **Economic Feasibility:** The system leverages cost-effective cloud tiers (Vercel serverless, Render containerization, Supabase managed PostgreSQL), minimizing deployment overhead for academic and governmental institutions.
* **Operational Feasibility:** The farmer interface is mobile-first, installable as a PWA, and optimized for intuitive, icon-driven touch interaction with minimal textual clutter.

## 2.2 Software Requirement Specification (SRS)

### Functional Requirements:
1. **FR-01: Multilingual Language Selection:** The system must intercept new users and enforce language preference (English, Telugu, Hindi) before account entry.
2. **FR-02: User Authentication & Role Isolation:** Users must authenticate via Supabase Auth; the system must direct farmers to `/farmer` and officers to `/officer`, strictly blocking cross-role privilege escalation.
3. **FR-03: Crop Selection & Image Ingestion:** The farmer must select from 14 supported crops and submit a photographic leaf image ($\le 10\text{ MB}$).
4. **FR-04: Deep Learning Inference:** The inference service must process normalized $224 \times 224 \times 3$ images and output class probabilities across 38 conditions.
5. **FR-05: Diagnostic Safety & Abstention:** The system must flag warnings for underexposure ($< 0.15$), low resolution ($< 224\text{ px}$), confidence $< 0.70$, or crop mismatch.
6. **FR-06: Longitudinal Plot Monitoring:** Farmers must be able to register plots, view twice-weekly observation schedules, and upload time-series monitoring photos.
7. **FR-07: Officer Report Review & Administration:** Officers must be able to verify/reject farmer reports, suspend/reactivate farmer accounts in their district, and issue targeted field advisories.
8. **FR-08: Early-Warning Detection:** The system must automatically trigger alert signals for recurrent plot conditions ($\ge 2$ consecutive) and regional clusters ($\ge 3$ plots over 7 days).

### Non-Functional Requirements:
* **NFR-01 (Performance):** Inference response time must remain under $50\text{ ms}$ on warm CPU instances.
* **NFR-02 (Security):** All database tables must have Row Level Security enabled with default-deny permissions. Client applications must never possess database service-role credentials.
* **NFR-03 (Availability):** Cold starts on container microservices must be handled gracefully with non-blocking status polling.
* **NFR-04 (Design Consistency):** The UI must strictly adhere to the approved 7-color PhytoX palette (`#0A0F12`, `#20292D`, `#394045`, `#565A5C`, `#907768`, `#A33715`, `#B5A295`).

## 2.3 Software Development Life Cycle (SDLC)
The project followed an **Iterative Agile & Test-Driven Development (TDD)** methodology. Each module (Authentication, Inference, Farmer Portal, Officer Surveillance, and Database Security) was developed in short iterative sprints backed by unit tests (Vitest), microservice contract tests (Pytest), and browser automation (Playwright).

---

# CHAPTER 3 — SYSTEM DESIGN

## 3.1 Architectural Design
PhytoX is organized into three decoupled architectural tiers:
1. **Client / Presentation Tier:** Next.js 16 App Router application delivering a mobile PWA experience for farmers and a responsive desktop command center for officers.
2. **Backend-for-Frontend (BFF) & Auth Tier:** Next.js Serverless Route Handlers executing behind global edge networks, managing session cookies, origin verification, and orchestrating RPC transactions.
3. **Machine Learning Microservice Tier:** Isolated FastAPI Python container executing ONNX Runtime for CPU-accelerated tensor operations.
4. **Data Persistence & Storage Tier:** Managed PostgreSQL 15 on Supabase with pgcrypto, PL/pgSQL stored procedures, and S3-compatible private object storage.

*(Refer to Figure 3.1: PhytoX Overall System Architecture Topology)*

## 3.2 Structured Analysis & UML Diagrams
* **Data Flow Diagram (Level 0 & Level 1):** Illustrates the movement of leaf images, predictions, and surveillance signals between Farmers, Officers, and Central Storage. *(Refer to Figures 3.2 & 3.3)*
* **Diagnosis Sequence Diagram:** Documents the two-phase commit protocol (`reserve_diagnosis` $\to$ `/predict` $\to$ `finish_diagnosis`). *(Refer to Figure 3.5)*
* **Authentication Flowchart:** Traces multilingual selection, credential verification, and role-based routing. *(Refer to Figure 3.4)*
* **Entity-Relationship Diagram:** Details all 13 relational entities, foreign keys, and multiplicity rules. *(Refer to Figure 3.7)*

## 3.3 Database Design & Relational Schema
The database schema consists of 13 strongly typed relational tables in PostgreSQL:
`regions`, `user_profiles`, `officer_regions`, `diagnoses`, `diagnosis_predictions`, `farmer_reports`, `officer_reviews`, `monitored_plots`, `monitoring_schedules`, `crop_observations`, `monitoring_signals`, `monitoring_advisories`, and `audit_logs`.

---

# CHAPTER 4 — IMPLEMENTATION, TESTING, AND MAINTENANCE

## 4.1 Technologies and Frameworks
* **Frontend:** Next.js 16.4.6, React 19.2.0, Tailwind CSS 4.1.0, TypeScript 5.9.3, Framer Motion, Three.js / React Three Fiber.
* **Backend:** Next.js Route Handlers, Python 3.11, FastAPI 0.115.11, Uvicorn 0.34.0.
* **Machine Learning:** PyTorch 2.x (training), ONNX Runtime 1.31.1 (serving), Pillow 11.1.0, NumPy 2.2.3.
* **Database & Auth:** Supabase PostgreSQL 15, Supabase Auth (GoTrue), Supabase Storage.
* **Testing:** Vitest 4.1.12, Pytest 9.2.0, PGlite 0.3.15, Playwright 1.52.0.

## 4.2 Machine Learning Pipeline & Training Provenance
* **Model:** MobileNetV2 pretrained on ImageNet-1K with custom classification head ($1280 \to 512 \to 38$).
* **Dataset:** New Plant Diseases Dataset (PlantVillage, 38 classes across 14 crops).
* **Training Platform:** Google Colab NVIDIA Tesla T4 GPU (~18–25 minutes).
* **Data Split:** Stratified 70% Training, 15% Validation, 15% Test (`random_state=42`).
* **Augmentations:** Tier-based standard augmentation (crops $\ge 500$ images) and aggressive augmentation (minority crops $< 500$ images).
* **Optimization:** Adam optimizer ($\text{lr} = 10^{-3}$, weight decay $= 10^{-4}$), ReduceLROnPlateau scheduler.
* **Recorded Performance:** Achieved **96.04% top-1 validation accuracy** at epoch 15 (`best_model.pt`).
* **Export:** Converted to ONNX v14 format with dynamic batching (SHA-256 `fde9536ff18a...`, 11.57 MB).

## 4.3 Testing Techniques & Execution Results
A multi-layered testing regimen was executed:
1. **Unit & Component Testing (Vitest):** 26 tests covering domain logic, formatting, language persistence, and UI warning banners.
2. **Database Security Testing (PGlite):** 18 tests executing actual SQL migrations against an in-process PostgreSQL engine to verify Row Level Security and role denial.
3. **Inference Microservice Testing (Pytest):** 23 tests verifying image bounds, exposure rejection, uncertainty abstention, CSRF, and ONNX model contract validation.
4. **End-to-End Browser Testing (Playwright):** 3 real-browser specs verifying farmer diagnosis, officer review, and cross-portal access denial.
* **Result:** **100% Pass Rate** across all 67 automated unit/integration tests and 3 E2E browser scenarios (Total: 70 verified test scenarios).

---

# CHAPTER 5 — RESULTS AND DISCUSSIONS

## 5.1 User Interface Representation & Screen Walkthroughs
* **Landing Page (Figure 5.1):** Features an interactive 3D botanical mesh with ambient lighting falloff, articulating the platform's core capabilities.
* **Farmer Mobile Experience (Figures 5.2 – 5.6):** Guides the farmer through language onboarding, 14-crop visual selection, photographic leaf preview with green scanline animation, immediate diagnosis, and bi-weekly plot surveillance.
* **Agricultural Officer Command Center (Figures 5.1b, 5.7 – 5.9):** Displays district jurisdiction metrics, farmer administration tools, a report verification queue, and early-warning outbreak signal monitors.

## 5.2 Inference Latency & Performance Benchmarks
Inference latency was benchmarked on standard CPU hardware (batch size = 1, $224 \times 224$ RGB image):
* **Model Warmup & Init:** 279.97 ms
* **Warm Single-Image Inference (Median):** **13.31 ms**
* **Full Pipeline Latency (Decode + Normalize + Inference + Softmax):** **28.40 ms**

## 5.3 Live Cloud Deployment Verification
Probes conducted against `https://phytox.vercel.app/api/status` returned:
```json
{"database": true, "model": true, "configured": true, "status": "ready", "reason": "ready"}
```
Confirming that the Vercel BFF, Supabase PostgreSQL, and Render FastAPI microservice are operating in full production synchrony.

---

# CHAPTER 6 — CONCLUSION AND FUTURE SCOPE

## 6.1 Conclusion
PhytoX demonstrates that modern deep learning models can be effectively deployed to solve critical agricultural challenges when paired with robust domain defenses, empathetic multilingual interfaces, and sound database security. By moving beyond isolated image classifications to longitudinal plot surveillance and regional early-warning detection, PhytoX provides a practical, scalable blueprint for modernizing plant health management in smallholder agricultural ecosystems.

## 6.2 Future Scope
1. **On-Device Edge Inference (WebAssembly / ONNX Web):** Compile MobileNetV2 directly to WebAssembly to allow instant offline diagnosis in remote rural fields with zero cellular connectivity.
2. **Multispectral Satellite & Weather Integration:** Correlate localized farmer leaf reports with Copernicus/Sentinel satellite vegetation indices (NDVI) and localized weather forecasts (humidity, temperature) to build predictive pathogen spore dispersal models.
3. **Automated WhatsApp / SMS Gateway:** Integrate twilio or government SMS gateways (e.g., Kisan SMS) to push officer advisories directly to basic feature phones.
4. **Expanded Regional Field Trials:** Deploy the platform in partnership with local Krishi Vigyan Kendras (KVKs) and agricultural universities for real-world pilot studies.

---

# REFERENCES & BIBLIOGRAPHY
1. Hughes, D., & Salathé, M. (2015). *An open access repository of images on plant health to enable the development of mobile disease diagnostics.* arXiv preprint arXiv:1511.08060.
2. Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L. C. (2018). *MobileNetV2: Inverted Residuals and Linear Bottlenecks.* Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR), 4510-4520.
3. Mohanty, S. P., Hughes, D. P., & Salathé, M. (2016). *Using deep learning for image-based plant disease detection.* Frontiers in Plant Science, 7, 1419.
4. Vercel Inc. (2026). *Next.js 16 Documentation: Server Components, Server Actions, and Edge Architecture.*
5. ONNX Runtime Authors. (2026). *ONNX Runtime: Cross-Platform, High Performance ML Inferencing Engine.* Linux Foundation.
6. Supabase Community. (2026). *PostgreSQL Row Level Security and Real-Time Architectures for Enterprise Applications.*
