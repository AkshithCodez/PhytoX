# PhytoX — Verified Technical Audit Report

**Academic Context:** B.E. Computer Science & Engineering Mini Project (2026–2027)  
**Institution:** Matrusri Engineering College, Saidabad, Hyderabad  
**Audit Team:** Principal Software Architect, Senior ML Engineer, Senior Database Architect, Senior QA Engineer  
**Audit Date:** 19 November 2026  
**Repository Working Copy:** `PhytoX/` (Commit `1ba0b43`)  
**Overall System Status:** IMPLEMENTED AND RUNTIME-VERIFIED  

---

## 1. Executive Summary

This report establishes the verified technical state of **PhytoX**, an AI-assisted agricultural pathology diagnosis, longitudinal surveillance, and regional early-warning platform. Every claim is supported by direct source inspection, local automated test execution, and non-destructive live production health verification.

### Core Verified Findings:
1. **Full-Stack Implementation:** Built with Next.js 16.4.6, React 19.2.0, Tailwind CSS 4.1.0, and TypeScript.
2. **Dual-Portal Role Architecture:** Distinct Progressive Web App for Farmers (`/farmer`) and Desktop-First Command Portal for Agricultural Officers (`/officer`), governed by Supabase Auth and database role checks (`role in ('farmer','officer','admin')`).
3. **Machine Learning Pipeline:** Pretrained MobileNetV2 with custom classifier head ($1280 \to 512 \to 38$ classes), trained on Google Colab (T4 GPU) using the PlantVillage 38-class dataset across 14 crops. Exported to ONNX (opset 14, SHA-256 `fde9536ff18a...`) and served via Python FastAPI and ONNX Runtime. Achieved **96.04% validation accuracy** at epoch 15 in recorded training checkpoint.
4. **Domain-Specific Crop Conditioning:** Novel agricultural safety barrier requiring the farmer to select their crop prior to diagnosis. Restricts diagnosis probabilities to diseases known to affect that crop, and flags a `crop_mismatch_warning` if evidence indicates another crop with $<25\%$ match to the farmer's selection.
5. **Database & Row-Level Security:** 13 tables across Supabase PostgreSQL with 100% RLS enforcement, verified by 18 in-engine database authorization tests using PGlite.
6. **Automated Testing Suite:** Exactly **67 automated unit/integration tests** (44 Vitest tests + 23 Pytest tests) passing 100%, plus 3 Playwright end-to-end browser specs.
7. **Production Deployment:** Live on Vercel (`https://phytox.vercel.app`) with inference hosted on Render, verified operational with `status: ready`.

---

## 2. Technology Stack & Exact Dependency Inventory

| Layer | Component | Declared / Resolved Version | Purpose & Evidence |
|---|---|---|---|
| **Frontend Framework** | Next.js | `16.4.6` | App Router, Server Components, Route Handlers (`apps/web/package.json`) |
| **UI Library** | React | `19.2.0` | React core & DOM runtime (`apps/web/package.json`) |
| **Language** | TypeScript | `^5.9.3` | Strict type safety across web package (`tsconfig.json`) |
| **Styling** | Tailwind CSS | `^4.1.0` | PostCSS styling & official 7-color palette (`apps/web/src/app/globals.css`) |
| **Animations** | GSAP & Motion | `gsap ^3.14.2`, `framer-motion ^12.4.7` | Cinematic hero, scanning beam, layout transitions |
| **3D Rendering** | Three.js & R3F | `three ^0.180.0`, `@react-three/fiber ^9.1.2` | Interactive 3D botanical mesh (`landing-scene.tsx`) |
| **GIS & Mapping** | Leaflet & React-Leaflet | `leaflet ^1.9.4`, `react-leaflet ^5.0.0` | Regional epidemiological disease maps (`map.tsx`) |
| **Data Analytics** | Recharts | `^2.15.1` | Officer trend graphs and disease distributions (`disease-distribution.tsx`) |
| **Inference Framework** | FastAPI | `0.115.11` | High-performance Python async REST API (`services/inference/requirements.txt`) |
| **Inference Server** | Uvicorn | `0.34.0` | ASGI server runtime (`services/inference/requirements.txt`) |
| **ML Engine** | ONNX Runtime | `1.31.1` | CPU-optimized tensor inference (`services/inference/requirements.txt`) |
| **Image Processing** | Pillow & NumPy | `Pillow 11.1.0`, `numpy 2.2.3` | Image decoding, resizing, ImageNet normalization |
| **Database** | PostgreSQL | `15.x` (Supabase Hosted) | Relational engine with pgcrypto & RLS (`supabase/migrations/`) |
| **In-Process DB Test** | PGlite | `^0.3.15` | WASM PostgreSQL runtime for local RLS testing (`authorization.test.ts`) |
| **Frontend Test** | Vitest | `^4.1.12` | Unit, component, and database test runner (`vitest.config.ts`) |
| **Inference Test** | Pytest | `9.2.0` | Python inference test framework (`pytest.ini`) |
| **Browser Test** | Playwright | `^1.52.0` | Headless & real-browser E2E suite (`playwright.config.ts`) |

---

## 3. System Architecture & Boundaries

```
[ Farmer Mobile / PWA ]        [ Agricultural Officer Desktop ]
          │                                     │
          ▼                                     ▼
   Next.js 16 Web App (BFF)  ────────────►  Supabase Auth (JWT)
   (Vercel: https://phytox.vercel.app)          │
          │                                     │
          ├───► Private Route Handlers          ▼
          │     (/api/diagnoses, /api/officer)  PostgreSQL (Supabase)
          │                                     13 RLS Tables & Functions
          ▼
   FastAPI ONNX Microservice
   (Render: /predict, /health, /ready)
          │
          ▼
   MobileNetV2 (supplied.onnx, 38 classes)
```

### Key Architectural Invariants:
1. **Untrusted Client Isolation:** Clients never contact the ML inference microservice or Supabase service role directly. All calls route through Next.js BFF Route Handlers.
2. **Two-Phase Diagnosis Pipeline:**
   - Step 1: Farmer uploads an image; the BFF calls `reserve_diagnosis` (PostgreSQL RPC) to create a reservation and store raw bytes in private Supabase Storage (`crop-images/<owner_id>/<diagnosis_id>/image`).
   - Step 2: BFF forwards image to FastAPI `/predict`. Upon return, BFF calls `finish_diagnosis` (Service-Role RPC) to atomically persist predictions and finalize status.
3. **No Phantom Predictions:** If the ML service is down or cold, the system informs the farmer ("Crop analysis service is connecting") and never fabricates mock diagnoses.

---

## 4. Feature Verification Status

| Module | Subsystem / Feature | Source File | Status |
|---|---|---|---|
| **Landing** | 3D Interactive Botanical Hero | `landing-scene.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Landing** | Multilingual Language Picker | `apps/web/src/app/language/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Auth** | Farmer Dedicated Workspace Sign-in | `apps/web/src/app/auth/login/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Auth** | Officer Gated Login (`portal=officer`) | `apps/web/src/app/auth/login/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Farmer** | 14-Crop Visual Selector Grid | `crop-selector.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Farmer** | Photographic Preview & Scanning Beam | `scanner.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Farmer** | Crop-Conditioned ML Diagnosis | `services/inference/app/classifier.py` | VERIFIED FROM SOURCE AND RUNTIME |
| **Farmer** | Bi-Weekly Plot Surveillance | `monitoring/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Officer** | Jurisdiction-Restricted Dashboard | `officer/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Officer** | Farmer Administration (Invite/Suspend) | `officer/farmers/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Officer** | Report Verification / Rejection Queue | `officer/reports/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Officer** | Regional Early-Warning Signals | `officer/surveillance/page.tsx` | VERIFIED FROM SOURCE AND RUNTIME |
| **Officer** | Targeted Farmer Field Advisories | `monitoring_advisories` table | VERIFIED FROM SOURCE AND RUNTIME |
| **Security** | Origin / CSRF Enforcement | `apps/web/src/lib/api/protection.ts` | VERIFIED FROM SOURCE AND RUNTIME |
| **Security** | 100% Database Row Level Security | `supabase/migrations/` | VERIFIED FROM SOURCE AND EXECUTION |
