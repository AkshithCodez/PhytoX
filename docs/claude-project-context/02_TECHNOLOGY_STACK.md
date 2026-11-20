# PhytoX — Complete Technology Stack & Dependency Specification

**Document Identifier:** `02_TECHNOLOGY_STACK.md`  
**Classification:** Technical Architecture Specification  
**Verification Standard:** Verified Against `apps/web/package.json`, `services/inference/requirements.txt`, and Checkpoints  
**Confidence Status:** VERIFIED FROM REPOSITORY CONFIGURATION  

---

## 1. Executive Dependency Summary

The PhytoX platform is engineered as a modern, polyglot, decoupled system comprising:
1. A **TypeScript / Next.js 16** full-stack web application functioning as a Progressive Web App (PWA) and a Backend-for-Frontend (BFF).
2. An asynchronous **Python 3.11+ / FastAPI** machine learning microservice running an optimized **ONNX Runtime** inference engine.
3. A managed **Supabase PostgreSQL 15+** database providing authentication, relational storage, and row-level authorization.
4. A **Capacitor 8.6.2** native bridge compiling the mobile web application into an Android binary package.

---

## 2. Frontend Layer (User Interface & Experience)

### 2.1 Core Framework & Language
* **Next.js:** Version `16.4.6` (App Router, Server Components, Route Handlers).
  - *Role:* Unified framework providing server-side rendering (SSR) for SEO and metadata, React Server Components for database security isolation, and API Route Handlers serving as the BFF layer.
  - *Source Files:* `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/src/app/`
  - *Justification:* Next.js App Router allows private server-only execution of database queries and inference calls, keeping secrets and service roles completely invisible to the browser.
* **React:** Version `19.2.0` (Core Runtime & React DOM).
  - *Role:* Component declarative UI model, React Actions, Concurrent features, hooks (`useRef`, `useState`, `useEffect`, `useTransition`).
  - *Source Files:* `apps/web/package.json`, `apps/web/src/app/page.tsx`, `apps/web/src/components/`
* **TypeScript:** Version `^5.9.0`.
  - *Role:* Strict type checking across the entire frontend codebase, interface enforcement with database schemas, and contract safety.
  - *Source Files:* `apps/web/tsconfig.json`, `apps/web/src/lib/contracts.ts`

### 2.2 Styling, Design Tokens & Fonts
* **Tailwind CSS:** Version `^4.1.0` (with `@tailwindcss/postcss ^4.1.0`).
  - *Role:* Utility-first responsive styling engine utilizing the new CSS-first configuration model.
  - *Source Files:* `apps/web/src/app/globals.css`, `apps/web/postcss.config.mjs`
  - *Design System:* Implements the official 7-color PhytoX Master Brand Palette:
    - Midnight Oil (`#0A0F12`) — Base canvas background.
    - Black Pearl (`#20292D`) — Primary cards and structural panels.
    - Glaucophobia (`#394045`) — Elevated modals, drawers, and secondary containers.
    - Summer Concrete (`#565A5C`) — Muted boundaries and divider rules.
    - Grapple (`#907768`) — Warm neutral accents and badge backgrounds.
    - Salsa Mexicana (`#A33715`) — High-visibility primary action buttons and highlight accents.
    - Net Worker (`#B5A295`) — Secondary UI text and muted captions.
* **Typography & Fonts:**
  - `Plus Jakarta Sans` (Display & headings)
  - `Noto Sans Telugu` (Telugu regional script rendering)
  - `Noto Sans Devanagari` (Hindi regional script rendering)
  - `IBM Plex Mono` (Technical metadata, coordinates, and diagnostic logs)

### 2.3 3D Graphics & Spatial Rendering
* **Three.js:** Version `^0.187.0` (with `@types/three ^0.187.0`).
  - *Role:* WebGL 3D rendering context, procedural lighting, shadow maps, geometry loading, and camera manipulation.
  - *Source Files:* `apps/web/src/components/eco-tech-scene.tsx`, `apps/web/src/components/botanical.tsx`
* **@react-three/fiber (R3F):** Version `^9.8.2`.
  - *Role:* Declarative React reconciler for Three.js, managing 3D scenes within the React component tree and handling render loops via `useFrame`.
* **@react-three/drei:** Version `^10.7.9`.
  - *Role:* Helper primitives for R3F, specifically `useGLTF` for loading binary glTF models (`.glb`), Draco geometry decompression (`/draco/`), and `Environment` for HDRI lighting.

### 2.4 Animations & Interactive Motion
* **GSAP (GreenSock Animation Platform):** Version `^3.15.1`.
  - *Role:* Cinematic landing page animations and physics-based scroll interpolation via `ScrollTrigger`. Controls the multi-stage camera journey across the 3D botanical island and transitions into the Living Data Landscape.
  - *Source Files:* `apps/web/src/app/page.tsx`
* **Motion (formerly Framer Motion):** Version `^12.23.0`.
  - *Role:* Layout transitions, modal enter/exit animations, scanner beam sweeping motion, and card elevation in the Farmer and Officer portals.
  - *Source Files:* `apps/web/src/components/farmer/scanner.tsx`, `apps/web/src/components/shell.tsx`

### 2.5 Form Handling, Validation & Icons
* **React Hook Form:** Version `^7.66.0` (with `@hookform/resolvers ^5.2.0`).
  - *Role:* Performant, un-rendered form state management for farmer observation reporting, plot registration, and officer review submissions.
* **Zod:** Version `^4.1.0`.
  - *Role:* Schema validation and runtime type coercion for API payloads, file metadata, and environment variables.
  - *Source Files:* `apps/web/src/lib/contracts.ts`, `apps/web/src/services/diagnosis.ts`
* **Lucide React:** Version `^0.468.0`.
  - *Role:* Modern, accessible SVG iconography across farmer scanner controls, status indicators, and administrative navigation.

---

## 3. Backend & BFF Layer

### 3.1 Next.js BFF (Backend-for-Frontend)
* **Route Handlers:** Next.js native API handlers (`apps/web/src/app/api/**/route.ts`).
  - *Role:* Acts as a secure intermediary between untrusted client browsers and internal microservices. Eliminates direct browser exposure to the inference engine or administrative database keys.
* **Sharp:** Version `^0.35.5`.
  - *Role:* High-performance C++ Libvips-backed image processing in Node.js. Performs input sanitation, decompression bomb protection (`limitInputPixels: 20_000_000`), EXIF auto-rotation, maximum dimension bounding ($2048 \times 2048$ inside), and JPEG quality recompression prior to inference dispatch.
  - *Source Files:* `apps/web/src/services/diagnosis.ts`
* **Node.js Crypto:** Native module.
  - *Role:* Generates cryptographic SHA-256 fingerprints of sanitized image buffers for deduplication, prediction cache indexing, and secure UUID generation.
* **Server-Only:** Version `^0.0.1`.
  - *Role:* Build-time guard preventing sensitive server modules (database clients, inference keys) from being imported into client components.

---

## 4. Artificial Intelligence & Machine Learning Stack

### 4.1 Inference Microservice (Runtime Service)
* **Python Runtime:** Version `3.11+` (Linux container environment).
* **FastAPI:** Version `>=0.115,<1` (Resolved `0.115.11`).
  - *Role:* Asynchronous web framework exposing `/v1/predict`, `/health`, and `/ready` endpoints.
  - *Source Files:* `services/inference/app/main.py`, `services/inference/app/schemas.py`
* **Uvicorn:** Version `[standard]>=0.34,<1` (Resolved `0.34.0`).
  - *Role:* ASGI web server executing FastAPI with high-throughput event loops.
* **ONNX Runtime:** Version `>=1.20,<2` (Resolved `1.20.1` / `1.31.1`).
  - *Role:* Ultra-fast, hardware-optimized CPU inference engine executing the exported `supplied.onnx` computation graph. Enforces intra-op thread pooling (`intra_op_num_threads = 2`) to deliver sub-30ms execution.
  - *Source Files:* `services/inference/app/model.py`
* **Pillow (PIL):** Version `>=11.1,<13` (Resolved `11.1.0`).
  - *Role:* Secondary server-side image decoding, EXIF orientation correction, decompression bomb safeguards, and luminance calculation (`ImageStat`).
* **NumPy:** Version `>=2.2,<3` (Resolved `2.2.3`).
  - *Role:* Tensor manipulation, ImageNet channel normalization, softmax probability conversion, and conditional masking.
* **Pydantic:** Version `>=2.10,<3` (Resolved `2.10.6`).
  - *Role:* Strict request/response validation adhering to OpenAPI specifications.
* **HTTPX:** Version `>=0.28,<1`.
  - *Role:* Async HTTP client for internal service-to-service communication.

### 4.2 Machine Learning Model & Training Artifacts
* **Architecture:** MobileNetV2 with custom classification head.
  - *Pretrained Base:* ImageNet-1K (`MobileNet_V2_Weights.IMAGENET1K_V1`), 1280-dimensional feature output.
  - *Classifier Head:* `Dropout(0.3) -> Linear(1280, 512) -> ReLU -> Dropout(0.15) -> Linear(512, 38)`.
* **PyTorch (Training Framework):** Version `2.6+` (`torch`, `torchvision`).
  - *Source Files:* `ml/src/model.py`, `ml/src/train.py`, `ml/src/dataset.py`, `ml/notebooks/train_colab.ipynb`
* **Model Checkpoint:** `ml/models/best_model.pt` (17.25 MB, recorded validation accuracy 96.04% at epoch 15).
* **Deployed ONNX Model:** `services/inference/models/supplied.onnx` (11.57 MB, SHA-256 `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`).
* **Model Manifest:** `services/inference/models/supplied.manifest.json` (38 classes, 14 crops, normalization constants).

---

## 5. Database & Cloud Services Stack

### 5.1 Relational Database Engine
* **PostgreSQL:** Version `15.x` (Cloud-hosted via Supabase).
  - *Role:* ACID-compliant relational data store with relational constraints, optimistic concurrency locking, and triggers.
  - *Extensions:* `pgcrypto` (cryptographic UUID generation and hashing).
  - *Security Enforcement:* 100% of public tables protected by Row Level Security (RLS).
  - *Source Files:* `supabase/migrations/202610310001_initial.sql`, `supabase/migrations/202611180001_farmer_management_and_monitoring.sql`

### 5.2 Supabase Client SDKs
* **@supabase/supabase-js:** Version `^2.80.0`.
  - *Role:* Unified JavaScript SDK for querying PostgreSQL, managing auth sessions, and invoking RPCs.
* **@supabase/ssr:** Version `^0.8.0`.
  - *Role:* Cookie-based authentication handler specifically designed for Next.js App Router (handles server components, middleware, and route handlers).
  - *Source Files:* `apps/web/src/lib/supabase/server.ts`, `apps/web/src/lib/supabase/browser.ts`, `apps/web/src/lib/supabase/trusted.ts`

### 5.3 Storage Subsystem
* **Supabase Storage:** Private S3-compatible object bucket named `crop-images`.
  - *Security Model:* Non-public bucket. Access requires cryptographic time-limited signed URLs generated via server-side service role (`trustedClient`).

---

## 6. Geospatial & Data Visualization Libraries

### 6.1 Interactive GIS Mapping
* **Leaflet:** Version `^1.9.4` (with `@types/leaflet ^1.9.20`).
  - *Role:* Lightweight open-source mapping engine rendering regional disease distribution maps in the Officer Portal.
  - *Tile Layer:* CartoDB Dark Matter / Positron tiles matching the dark brand aesthetic.
* **Leaflet.markercluster:** Version `^1.5.3` (with `@types/leaflet.markercluster ^1.5.6`).
  - *Role:* High-performance geographic clustering of farmer report coordinates, grouping proximate field blights into expandable cluster bubbles.

### 6.2 Data Analytics & Charting
* **Recharts:** Version `^3.3.0`.
  - *Role:* SVG-based charting library for the Agricultural Officer Command Dashboard. Renders:
    - 30-day temporal trend lines for regional disease progression.
    - Category-wise horizontal bar charts comparing disease frequencies across crops.
    - Risk distribution donuts.

---

## 7. Mobile Platform (PWA & Native Container)

### 7.1 Progressive Web App (PWA)
* **Web App Manifest:** `apps/web/public/manifest.json` and `manifest.webmanifest`.
  - *Display Mode:* `standalone`
  - *Orientation:* `portrait-primary`
  - *Theme / Background Color:* `#0A0F12` (Midnight Oil)
  - *Icons:* 192x192 PNG, 512x512 PNG, SVG vector icon, and maskable variants.
* **Service Worker:** `apps/web/public/sw.js`.
  - *Cache Strategy:* Network-first with offline fallback page (`offline.html`) for navigation; Cache-first with network fallback for images and UI static assets.

### 7.2 Native Mobile Container
* **Capacitor Core & CLI:** Version `^8.6.2`.
  - *Role:* Cross-platform web runtime bridge packaging the Next.js frontend into an installable mobile application.
  - *Configuration:* `apps/web/capacitor.config.ts` (`appId: "org.phytox.app"`, `appName: "PhytoX"`).
* **@capacitor/android:** Version `^8.6.2`.
  - *Role:* Android platform project using Gradle.
  - *Verified Output Artifact:* `apps/web/android/app/build/outputs/apk/debug/app-debug.apk` (4.12 MB).
* **@capacitor/ios:** Version `^8.6.2`.
  - *Role:* iOS platform project structure configured in `apps/web/ios/App/App`.

---

## 8. Testing & Quality Assurance Suite

### 8.1 Automated Test Runners
* **Vitest:** Version `^4.0.0` (Resolved `4.1.12`).
  - *Role:* High-speed unit and integration test runner for TypeScript, React components, and database logic.
  - *Source Files:* `apps/web/vitest.config.ts`, `apps/web/tests/`
* **@electric-sql/pglite:** Version `^0.5.13`.
  - *Role:* In-process WebAssembly PostgreSQL engine running inside Node.js during Vitest execution. Executes real database migrations and tests 18 Row Level Security policies locally without requiring a remote database connection.
  - *Source Files:* `apps/web/tests/database/authorization.test.ts`
* **Pytest:** Version `>=8.3,<10` (Resolved `9.2.0`).
  - *Role:* Python unit and contract test framework for FastAPI endpoints and ONNX tensor evaluation.
  - *Source Files:* `pytest.ini`, `services/inference/tests/`
* **Playwright:** Version `^1.56.0` (Resolved `1.52.0`).
  - *Role:* Headless and real-browser automation suite executing full end-to-end browser user journeys (Farmer, Officer, and Role Escalation denial).
  - *Source Files:* `apps/web/playwright.config.ts`, `apps/web/tests/e2e/live-browser-portal.spec.ts`
* **@axe-core/playwright:** Version `^4.14.0`.
  - *Role:* Automated WCAG 2.1 AA accessibility compliance testing for keyboard navigation and screen readers.

---

## 9. Cloud Infrastructure & Hosting

* **Vercel:** Hosts the Next.js 16 Web Application & BFF (`https://phytox.vercel.app`).
* **Render:** Hosts the containerized Python FastAPI ONNX inference service via Docker (`services/inference/Dockerfile`).
* **Supabase Cloud:** Managed PostgreSQL database, Supabase Auth service, and private cloud storage buckets.
