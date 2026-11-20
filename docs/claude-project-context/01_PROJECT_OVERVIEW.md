# PhytoX — Comprehensive Project Overview

**Document Identifier:** `01_PROJECT_OVERVIEW.md`  
**Classification:** Academic Engineering Specification  
**Project Degree:** Bachelor of Engineering (B.E.) in Computer Science & Engineering  
**Academic Year:** 2026–2027  
**Institution:** Matrusri Engineering College, Saidabad, Hyderabad  
**Affiliation:** Osmania University  
**Confidence Status:** VERIFIED FROM REPOSITORY IMPLEMENTATION  

---

## 1. Project Identification

* **Official Project Name:** **PhytoX**
* **Preliminary Prototype Codename:** KrishiRakshak (used during initial Google Colab ML exploratory scripting, subsequently rebranded to PhytoX for the full-stack multi-role production platform).
* **Full Academic Project Title:** **PhytoX — AI-Assisted Agricultural Pathology Diagnosis, Longitudinal Crop Surveillance, and Regional Early-Warning Intelligence Platform**
* **Academic Domain:** Applied Artificial Intelligence, Agricultural Informatics (AgTech), Computer Vision, Cloud Application Engineering, Applied Spatial Epidemiology, Information Security (Row-Level Security).

---

## 2. Problem Statement

Agricultural crop loss due to phytopathological infestations (fungal blights, bacterial spots, viral mosaics, and insect-vector damage) represents one of the most critical threats to global food security and rural livelihoods. In developing agrarian economies, including India:

1. **Pathologist Inaccessibility:** The ratio of certified agricultural extension officers and plant pathologists to active farming households is acutely skewed (often exceeding 1 officer per 1,500–2,000 farmers). Smallholder farmers in remote rural mandals cannot obtain timely expert field visits.
2. **Diagnostic Latency & Crop Failure:** Foliar diseases spread exponentially. Traditional diagnostic processes (collecting leaf specimens, traveling to district research stations, or awaiting scheduled extension visits) frequently incur delays of 5 to 14 days, by which time fungal sporulation or viral spread has compromised the entire harvest.
3. **Indiscriminate Chemical Overuse:** Lacking precise diagnostic insights, farmers routinely apply broad-spectrum chemical fungicides, bactericides, and organophosphate pesticides based on speculative advice from commercial agrochemical retailers. This practice escalates input production costs, induces pesticide resistance, accelerates soil toxicity, and contaminates local groundwater.
4. **Absence of Regional Disease Intelligence:** Agricultural administrations lack real-time digital visibility into emerging spatial clusters of foliar infections. Infestation outbreaks are detected only after reaching epidemic proportions, precluding proactive quarantine or coordinated preventive spraying.

---

## 3. Motivation for Developing PhytoX

The development of PhytoX is driven by the conviction that computer vision, modern web technologies, and relational security architectures can democratize agronomical expertise while constructing a resilient surveillance feedback loop:

* **Bridging the Knowledge Gap:** Empowering rural growers with an instant, accessible diagnostic tool operable on standard smartphones directly in the field.
* **Preserving Agronomical Safety:** Recognizing that generic deep learning classifiers often output hallucinated or agriculturally nonsensical predictions (e.g., predicting an apple disease on a tomato leaf). PhytoX incorporates domain-specific constraints (Crop Conditioning) to enforce biological plausibility.
* **Connecting Growers to Agronomists:** Moving beyond isolated "toy" prediction apps by integrating a secure, formal reporting channel where farmers can request human agronomist verification and receive actionable field advisories.
* **Proactive Spatial Epidemiology:** Transforming individual farmer observations into privacy-preserving regional outbreak signals, allowing agricultural authorities to issue targeted alerts before diseases escalate across district boundaries.

---

## 4. Limitations of Traditional and Existing Systems

| Dimension | Traditional Visual & Laboratory Systems | Generic Smartphone Plant Apps | PhytoX Platform |
|---|---|---|---|
| **Turnaround Time** | 5 to 14 days (manual sample delivery or culturing) | Seconds (instant ML output) | Instant AI screening + rapid officer verification |
| **Domain Safety** | High (human expert judgment) | Low (unconstrained softmax over all classes, prone to cross-crop false positives) | **High (Foliar Crop Conditioning restricts probabilities to verified host pathologies)** |
| **Out-of-Distribution Handling** | Human recognizes non-leaf or irrelevant input | Forces top-1 prediction regardless of leaf relevance | **Calibrated uncertainty abstention + exposure/resolution quality warnings** |
| **Longitudinal Tracking** | Manual pen-and-paper farm logbooks (infrequently maintained) | None (isolated one-shot scans) | **Bi-weekly plot surveillance schedule (Mon/Thu) tracking symptom progression** |
| **Regional Intelligence** | Post-outbreak paper surveys compiled months late | Proprietary commercial silos; no administrative officer role | **Real-time GIS cluster detection + k-anonymity privacy aggregation** |
| **Data Privacy & Security** | Physical records vulnerable to loss | Unclear data mining of farmer photos | **100% PostgreSQL Row Level Security; signed private storage isolation** |
| **Linguistic Accessibility** | English/Regional pamphlets requiring high literacy | Frequently English-only | **Localized English, Telugu (తెలుగు), and Hindi (हिन्दी) workflows** |

---

## 5. The Proposed PhytoX Solution

PhytoX is a unified, dual-portal, multi-tenant agricultural health architecture:

1. **Farmer Progressive Web App (PWA):** A mobile-first interface allowing growers to select their preferred regional language (English, Telugu, Hindi), specify their crop from 14 verified varieties, capture or upload leaf photographs, receive instantaneous AI-assisted diagnostic feedback with explicit uncertainty metrics, maintain private plot records, and submit verified observations for expert agronomist review.
2. **Agricultural Officer Command Portal:** A desktop-first workstation for government or institutional agronomists restricted to their assigned administrative districts. Officers inspect an active review queue of farmer-submitted reports, examine high-resolution foliar imagery, verify or correct AI diagnoses, formulate targeted advisories, and monitor automated regional outbreak signals.
3. **Domain-Constrained AI Microservice:** A high-performance Python FastAPI service hosting a transfer-learned MobileNetV2 neural network exported to ONNX Runtime. The inference pipeline enforces:
   - Input dimension and quality validation (rejecting underexposed, overexposed, or low-resolution images).
   - Dynamic crop conditioning restricting the probability distribution strictly to diseases known to infect the selected crop.
   - Crop mismatch detection flagging an alert if leaf features deviate significantly from the selected crop ($<25\%$ evidence).
   - Conservative uncertainty abstention recommending expert human review whenever prediction confidence falls below 70% or class margin is tighter than 15%.
4. **Relational Data & Security Layer:** A Supabase PostgreSQL database governed by 22 granular Row Level Security (RLS) policies across 13 tables, ensuring strict tenant isolation, signed object storage access, and differential privacy ($k \ge 3$ contributors) for regional data aggregation.

---

## 6. How PhytoX Differs From a Basic Image Classification App

PhytoX explicitly rejects the simplistic paradigm of an isolated, client-side "leaf scanner." It differs through five foundational engineering innovations:

1. **Agricultural Safety Barrier (Crop Conditioning):** A standard CNN performs an unconstrained 38-class softmax over all categories. If a farmer photographs a diseased tomato leaf with ambiguous spots, a naive model might classify it as "Apple Scab" with 35% probability simply because that was the highest raw logit. PhytoX requires the farmer to designate their crop (or explicitly declare multi-crop uncertainty), subsets the candidate classes to that specific crop, and renormalizes conditional probabilities.
2. **Deterministic Quality & Exposure Guards:** Naive apps classify dark, blurry, or overexposed images, producing misleading high-confidence errors. PhytoX extracts luminance statistics and pixel dimensions; if an image is severely underexposed ($B < 30$) or overexposed ($B > 235$), the system flags quality warnings and conservatively abstains.
3. **Cryptographic Prediction Deduplication & Caching:** To prevent duplicate inference computation and malicious Denial-of-Service, the backend computes a SHA-256 fingerprint of normalized image bytes. It checks a composite cache key (`owner_id` + `image_hash` + `selected_crop` + `model_digest` + preprocessing version). Identical resubmissions by the same farmer return the verified result in $<10\text{ ms}$ without invoking the neural network.
4. **Bi-Weekly Longitudinal Plot Surveillance:** Crop health cannot be assessed in a vacuum. PhytoX implements a continuous surveillance data model (`monitored_plots` and `crop_observations`), scheduling twice-weekly check-ins (Monday and Thursday) to track whether foliar lesions are resolving or escalating after treatment.
5. **Surveillance Epidemiology & Officer Feedback Loop:** Diagnosis is coupled to public agronomical action. Observations submitted by farmers trigger deterministic spatial and temporal clustering algorithms (`monitoring_signals`). Officers can inspect emerging clusters on an interactive GIS map and broadcast official field advisories directly into the affected farmers' inboxes.

---

## 7. Project Objectives

### Primary Objectives:
1. **Develop an Edge-Optimized Pathology Classifier:** Fine-tune a lightweight deep neural network (MobileNetV2) capable of classifying 38 disease and healthy conditions across 14 crops with $>95\%$ validation accuracy and sub-30ms CPU inference latency.
2. **Implement Crop-Conditioned Diagnostic Inference:** Design and verify an inference algorithm that conditions classification logits on farmer-selected crop priors, detects biological cross-crop mismatches, and implements rigorous uncertainty abstention.
3. **Construct a Dual-Role Progressive Web Architecture:** Build a responsive, accessible Progressive Web App for farmers supporting offline caching, camera capture, and multilingual interaction (English, Telugu, Hindi), alongside a dedicated desktop command portal for agricultural officers.
4. **Implement Enterprise-Grade Database Security:** Enforce 100% Row Level Security across all database tables in PostgreSQL, ensuring complete privacy isolation between farmers, strict regional boundaries for officers, and signed private photo storage.
5. **Establish a Longitudinal Surveillance & Early-Warning Pipeline:** Engineer an end-to-end workflow for registering crop plots, tracking bi-weekly photographic observations, and triggering heuristic early-warning signals for recurrent diseases and regional clusters.
6. **Empirically Validate Application Rigor:** Verify full-stack functionality with an automated test suite comprising unit tests, database authorization tests, ONNX contract tests, and end-to-end browser automation workflows.

---

## 8. Project Scope

### In Scope (Implemented & Runtime-Verified):
- **14 Supported Crops:** Apple, Blueberry, Cherry, Corn (Maize), Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato.
- **38 Condition Classes:** Comprehensive spectrum of fungal, bacterial, viral, mite-induced, and healthy leaf conditions from the New Plant Diseases Dataset.
- **Farmer Web & PWA Workflows:** Language selection, user registration, JWT authentication, crop selector grid, photo upload/camera preview, animated scan line, AI assessment display, quality warnings, private history log, voluntary report submission with optional geolocation, monitored plot enrollment, and bi-weekly observation logging.
- **Officer Administrative Workflows:** Role-gated login, jurisdiction assignment, farmer management (inviting farmers, toggling active/suspended status), report review queue, verification decision recording, GIS cluster mapping with Leaflet, monitoring signals queue, and advisory dispatch.
- **Backend Architecture:** Next.js 16 Backend-for-Frontend (BFF) with Route Handlers, Sharp image processing, SHA-256 caching, and Python FastAPI ONNX Runtime microservice.
- **Database & Storage:** Supabase PostgreSQL with 13 tables, stored procedures, RLS policies, and private bucket file storage.
- **Mobile Container:** Android platform package configured with Capacitor 8.6.2 and verified debug APK artifact (`app-debug.apk`).
- **Automated Testing:** 67 automated unit/integration tests (Vitest and Pytest) + 3 Playwright real-browser scenarios.

### Out of Scope (Explicit Non-Goals for this Mini-Project):
- Native offline deep learning inference inside mobile device silicon (all inference is processed via the FastAPI cloud microservice).
- Automated satellite or drone hyperspectral imaging (the system is designed for foliar ground photographs).
- Autonomous robotic spraying or IoT actuator hardware integration.
- Open-set recognition of non-plant imagery (the model is trained on controlled foliar benchmarks; unknown images trigger uncertainty warnings rather than open-set rejection guarantees).

---

## 9. Target Users & User Personas

### 1. Smallholder & Marginal Farmers
- **Demographics:** Rural agricultural growers operating small to medium landholdings (1 to 5 acres) in regional agricultural districts.
- **Technical Literacy:** Moderate smartphone familiarity; primary usage of messaging and localized regional interfaces; varying English literacy.
- **Key Needs:** Fast, clear, native-language diagnosis of foliar symptoms; clear indication of whether a condition is severe; confidence that their farm photos are private; and direct communication with their local agricultural officer.

### 2. Village & Mandal Agricultural Extension Officers (AEOs)
- **Demographics:** Government-appointed or cooperative agricultural field officers responsible for monitoring crop health across specific mandals or districts.
- **Technical Literacy:** Proficient in desktop web applications, administrative reporting, and GIS software.
- **Key Needs:** Real-time visibility into farmer reports within their jurisdiction; tools to verify or reject AI diagnoses; automated notifications when disease clusters emerge; and a direct digital channel to send advisories to affected farmers.

### 3. District Agronomists & Agricultural Administrators
- **Demographics:** Senior agricultural scientists and district directors overseeing regional disease prevention programs.
- **Key Needs:** Aggregated statistical trends on crop disease prevalence; spatial heatmaps to allocate chemical and extension resources; and immutable audit trails of officer review actions.

---

## 10. Unique Contributions of PhytoX

1. **First-Class Crop Conditioning:** Eliminates biologically absurd cross-crop predictions by dynamically masking and renormalizing the probability distribution across the user-selected crop subset.
2. **Crop Mismatch Advisory:** Detects when a farmer may have misidentified their crop by comparing the unconditioned visual logit maximum against the selected crop subset, warning the user if visual evidence falls below 25%.
3. **Hardened Multi-Tenant Prediction Cache:** Implements a cryptographically sound composite caching key that guarantees sub-10ms response times for repeat uploads while preventing cross-user data leakage.
4. **k-Anonymity Differential Privacy for Agriculture:** Formally embeds privacy preservation into SQL stored procedures (`regional_insights`), withholding regional disease summaries unless at least 3 distinct farmers have contributed verified reports.
5. **Dual-Role Agronomical Lifecycle:** Unifies AI screening with human expert oversight, ensuring that machine learning outputs are never treated as unassailable medical/agronomical prescriptions without a path to officer verification.

---

## 11. Expected Benefits & Real-World Impact

* **Economic Savings:** Early detection enables targeted spot-treatment, avoiding widespread crop devastation and reducing unnecessary expenditure on broad-spectrum chemicals.
* **Environmental Protection:** Lower chemical runoff into waterways and decreased pesticide accumulation in food chains.
* **Administrative Efficiency:** Agricultural officers spend less time on routine preliminary screening and can focus their field visits on confirmed outbreak hotspots identified by the system.
* **Digital Rural Inclusion:** Localization in Telugu and Hindi bridges language barriers, making advanced deep learning accessible to rural communities.

---

## 12. Implemented Capabilities vs. Future Enhancements

| Architectural Subsystem | Implemented & Runtime-Verified | Proposed / Future Enhancement |
|---|---|---|
| **Diagnostic Model** | MobileNetV2 ONNX with $1280 \to 512 \to 38$ classifier head, running on cloud CPU. | Quantized INT8 MobileNetV3 running on-device via WebAssembly/ONNX Runtime Web for zero-connectivity offline diagnosis. |
| **Crop Conditioning** | Deterministic probability subsetting, crop evidence aggregation, mismatch alerts. | Multi-task convolutional network with joint crop-detection and pathology-classification heads. |
| **Surveillance Logic** | Rule-based signals for recurrent disease (sequential observations) and regional clusters ($\ge 3$ observations / 7 days). | Spatiotemporal Graph Neural Networks (GNNs) forecasting disease vector spread based on wind and humidity telemetry. |
| **Mobile App** | PWA with service worker caching + Capacitor Android container with verified APK. | Production distribution on Google Play Store and Apple App Store with push notification integrations. |
| **Advisory Channel** | In-app notification inbox linked to officer review actions. | Automated SMS / WhatsApp webhook dispatch for non-smartphone or basic feature phone integration. |
