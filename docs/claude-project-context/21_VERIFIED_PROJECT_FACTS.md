# PhytoX — Canonical Verified Project Facts

**Document Identifier:** `21_VERIFIED_PROJECT_FACTS.md`  
**Classification:** Canonical Ground-Truth Fact Sheet  
**Standard:** 100% Verified from Source Code, Build Trees & Test Logs  
**Audience:** Claude Documentation Generation Engine & Project Evaluation Committee  

---

## 1. Technological Stack Facts

1. **Frontend Framework:** Next.js `16.4.6` (App Router, Server Components, Route Handlers) with React `19.2.0` and TypeScript `^5.9.0`.
2. **Styling Engine:** Tailwind CSS `^4.1.0` using PostCSS, implementing the 7-color PhytoX Master Brand Palette:
   - Midnight Oil (`#0A0F12`), Black Pearl (`#20292D`), Glaucophobia (`#394045`), Summer Concrete (`#565A5C`), Grapple (`#907768`), Salsa Mexicana (`#A33715`), and Net Worker (`#B5A295`).
3. **3D WebGL Graphics:** Three.js `^0.187.0`, `@react-three/fiber ^9.8.2`, and `@react-three/drei ^10.7.9` rendering binary glTF meshes (`/models/main_island_desktop.glb` and `/models/main_island_mobile.glb`) with Google Draco WASM decompression (`/draco/`).
4. **Cinematic Motion:** GSAP `^3.15.1` with `ScrollTrigger` orchestrating a 4-scene narrative runway coupled with custom WebGL GLSL procedural sky mist shaders (Fractal Brownian Motion).
5. **GIS & Analytics:** Leaflet `^1.9.4` with `leaflet.markercluster ^1.5.3` for geographic epidemiological maps, and Recharts `^3.3.0` for 30-day temporal trend charts.
6. **Inference Microservice:** Python `3.11+`, FastAPI `0.115.11`, Uvicorn `0.34.0`, Pillow `11.1.0`, and NumPy `2.2.3`.
7. **Inference Execution Engine:** Microsoft ONNX Runtime (`onnxruntime >= 1.20`) with pure CPU execution (`CPUExecutionProvider`, 2 intra-op worker threads).
8. **Relational Database:** PostgreSQL `15.x` hosted on Supabase Cloud with `pgcrypto` extension.
9. **Native Mobile Bridge:** Capacitor `8.6.2` (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/cli`).

---

## 2. Machine Learning Model Facts

1. **Neural Architecture:** Transfer-learned **MobileNetV2** (ImageNet-1K pretrained base features, 1,280-dimensional output vector).
2. **Custom Classification Head:**
   $$\text{Dropout}(p=0.30) \to \text{Linear}(1280, 512) \to \text{ReLU} \to \text{Dropout}(p=0.15) \to \text{Linear}(512, 38)$$
3. **Model Checkpoint Checksum:** SHA-256 `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`.
4. **Deployed Artifact:** `services/inference/models/supplied.onnx` (Exact size: **11,573,332 bytes**, ~**11.57 MB**, Opset 14, dynamic batch size $[B, 3, 224, 224]$).
5. **Recorded Validation Accuracy:** **96.04%** ($0.9603566009104704$) recorded at Epoch 15 in `ml/models/best_model.pt`.
6. **Input Preprocessing:** Bilinear resize to $224 \times 224$, scaled to $[0, 1]$, normalized with ImageNet mean $[0.485, 0.456, 0.406]$ and std $[0.229, 0.224, 0.225]$.
7. **Inference Latency:** **13.31 ms median CPU forward pass**; **28.40 ms full pipeline** (decode + luminance check + ONNX + crop conditioning).
8. **Quality Guards:** Rejects underexposed photographs ($B < 30$) and overexposed photographs ($B > 235$).
9. **Domain Crop Conditioning:** Dynamically subsets logits to the farmer-selected crop, renormalizes probabilities, flags crop mismatches when visual evidence $<25\%$, and conservatively abstains when confidence $<70\%$ or margin $<15\%$.

---

## 3. Dataset & Training Provenance Facts

1. **Dataset Name:** **New Plant Diseases Dataset (Augmented)** by vipoooool from Kaggle, based on the PlantVillage benchmark.
2. **Total Image Inventory:** **87,900 images total** on disk:
   - `train/`: 70,295 images across 38 classes.
   - `valid/`: 17,572 images across 38 classes.
   - Core Benchmark Images: $70,295 + 17,572 = 87,867$ images.
   - `test/test/`: 33 standalone evaluation images.
3. **Pathology Scope:** **38 disease and healthy classes across 14 crops** (Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, and Tomato).
4. **Data Partitioning:** Stratified splitting with fixed seed (`random_state=42`): 70% train, 15% validation, 15% test.
5. **Loss Function:** Weighted Cross-Entropy Loss with inverse-frequency class penalty weights:
   $$w_{i} = \frac{N_{\text{total}}}{38 \times N_{i}}$$
6. **Augmentation Strategy:** Tier-based dual pipeline (Standard for classes $\ge 500$ samples; Aggressive with Gaussian blur and random erasing for minority classes $< 500$ samples).
7. **Optimizer & Schedule:** Adam optimizer (head lr $10^{-3}$, backbone lr $10^{-4}$, weight decay $10^{-4}$), ReduceLROnPlateau (factor 0.5, patience 3), early stopping patience 5.
8. **Training Hardware:** Google Colab NVIDIA Tesla T4 GPU (16 GB VRAM), ~18–25 minutes duration.

---

## 4. Database & Relational Security Facts

1. **Table Count:** Exactly **13 relational tables** in PostgreSQL (`regions`, `user_profiles`, `officer_regions`, `diagnoses`, `diagnosis_predictions`, `farmer_reports`, `officer_reviews`, `monitored_plots`, `monitoring_schedules`, `crop_observations`, `monitoring_signals`, `monitoring_advisories`, `audit_logs`).
2. **Row Level Security (RLS):** **100% of public tables protected by 22 granular RLS policies**. Direct public table grants are revoked.
3. **Client Isolation:** Farmers can read and write only their own records; cross-farmer queries return 0 rows.
4. **Jurisdiction Isolation:** Officers can read reports and manage farmers strictly within their assigned administrative districts defined in `officer_regions`.
5. **Private Image Storage:** Leaf photographs are stored in a private bucket (`crop-images`) accessible only via time-limited cryptographic signed URLs (TTL 3600 seconds).
6. **Optimistic Concurrency:** Report reviews enforce version checking on an integer `version` token, preventing concurrent overwrites.
7. **k-Anonymity Privacy:** SQL stored procedure `public.regional_insights` withholds regional summaries unless at least 3 distinct farmers have contributed verified observations (`having count(distinct r.owner_id) >= 3`).
8. **In-Engine Test Proof:** 18 automated database authorization tests passing via in-process WebAssembly PostgreSQL (PGlite).

---

## 5. Mobile & Application Workflow Facts

1. **Progressive Web App (PWA):** Web App Manifest (`manifest.webmanifest`) configured with `display: "standalone"` and `#0A0F12` theme, backed by Service Worker (`sw.js`) implementing dual cache strategies and offline page fallback (`offline.html`).
2. **Compiled Android Binary:** Physical debug APK **`app-debug.apk`** (**4,118,894 bytes**, ~**4.12 MB**) compiled via Capacitor 8.6.2 and Gradle Build-Tools.
3. **iOS Platform State:** Configured in `apps/web/ios/App/App`; **no IPA compiled** due to Windows host environment.
4. **Cloud Inference Dependency:** **The mobile application does NOT execute on-device edge inference.** An active network connection is required to communicate with the cloud FastAPI microservice.
5. **Multilingual Support:** Complete native localization across **English, Telugu (తెలుగు), and Hindi (हिन्दी)** with cookie persistence.
6. **Hardened Prediction Caching:** Sub-10ms instantaneous response for repeated leaf photo submissions matching a 7-parameter composite SHA-256 signature.
7. **Longitudinal Plot Surveillance:** Dynamic Monday/Thursday observation scheduler advancing `next_due_date` across crop vegetative cycles.
8. **Deterministic Early Warning:** Heuristic recurrence alerts (sequential observations detecting same disease within 14 days) and regional cluster alerts ($\ge 3$ observations in district within 7 days).

---

## 6. Testing & Quality Assurance Facts

1. **Automated Unit & Integration Tests:** Exactly **67 tests passing 100%**:
   - Vitest (`apps/web`): 44 tests passing in 3.64 seconds.
   - Pytest (`services/inference`): 23 tests passing in 1.08 seconds.
2. **Playwright Real-Browser E2E Scenarios:** Exactly **3 passing specs** (`live-browser-portal.spec.ts`):
   - `E2E-01`: Farmer Diagnosis Live Workflow (PASS).
   - `E2E-02`: Officer Command & Review (PASS).
   - `E2E-03`: Cross-Role Authorization Denial (PASS).
3. **Grand Total Verified Scenarios:** **70 Scenarios**.
4. **Live Deployment:** Live and operational on Vercel at `https://phytox.vercel.app` with backend microservice on Render and Supabase Cloud.
