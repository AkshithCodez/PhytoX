# PhytoX Academic Project Knowledge Base — Read Me First

**Project Name:** PhytoX  
**Full Academic Title:** PhytoX — AI-Assisted Agricultural Pathology Diagnosis, Longitudinal Crop Surveillance, and Regional Early-Warning Intelligence Platform  
**Target Academic Degree:** Bachelor of Engineering (B.E.) in Computer Science & Engineering (2026–2027)  
**Institution:** Matrusri Engineering College, Saidabad, Hyderabad (Affiliated with Osmania University)  
**Document Generation Date:** 19 November 2026  
**Auditors & Authors:** Principal Software Architect, Senior ML Engineer, Database Architect, Technical Documentation Specialist  
**Document Standard:** Gravitas Evidence Traceability Protocol (100% Repository-Grounded)

---

## 1. Purpose of This Knowledge Base

This dedicated documentation repository (`docs/claude-project-context/`) serves as the definitive, source-verified knowledge base for the **PhytoX** engineering mini-project. It has been extracted directly from the working repository, including its source code, PyTorch training scripts, ONNX model weights, Supabase database migrations, test suites, and deployed infrastructure.

This knowledge base is specifically structured to be provided to an AI technical author (Claude) to generate the complete, publication-grade B.E. Mini-Project Report adhering to institutional engineering standards.

### Core Non-Negotiable Invariants Applied During Extraction:
1. **Zero Fabrication:** No synthetic training curves, unrecorded test metrics, nonexistent algorithms, or imaginary microservices have been fabricated.
2. **Explicit Confidence Tagging:** Every technical statement is tagged as `VERIFIED`, `REPORTED`, `PARTIAL`, `PLANNED`, or `UNKNOWN`.
3. **Repository Grounding:** Every architectural claim points directly to verified source files, line ranges, database migrations, or test execution logs.
4. **Honest Separation:** Implemented features are strictly distinguished from conceptual, planned, or proposed future work.

---

## 2. Directory Structure & Document Navigation

The knowledge base is organized into 24 dedicated files covering every architectural facet:

| File Name | Primary Topic & Academic Scope |
|---|---|
| `00_READ_ME_FIRST.md` | Executive guide, project identity, file organization, usage instructions |
| `01_PROJECT_OVERVIEW.md` | Domain, problem statement, motivation, objectives, scope, contributions |
| `02_TECHNOLOGY_STACK.md` | Exhaustive dependency inventory across frontend, backend, ML, DB, mobile, and testing |
| `03_SYSTEM_ARCHITECTURE.md` | Multi-tier architecture, BFF pattern, two-phase diagnosis, security boundaries |
| `04_MACHINE_LEARNING_MODEL.md` | MobileNetV2 architecture, custom classifier head, ONNX export, crop conditioning logic |
| `05_DATASET_AND_TRAINING.md` | New Plant Diseases Dataset (Augmented), 87,900 images, Colab T4 training provenance |
| `06_FARMER_PORTAL.md` | Farmer PWA workflow: crop selection, scanning beam, diagnoses, private history, reporting |
| `07_OFFICER_PORTAL.md` | Agricultural Officer desktop workflow: jurisdiction boundaries, report review, GIS map |
| `08_CROP_MONITORING.md` | Longitudinal plot tracking, twice-weekly scheduling, deterministic early-warning signals |
| `09_DATABASE_AND_SECURITY.md` | 13 PostgreSQL tables, 22 RLS policies, stored procedures, private storage sandboxing |
| `10_ANDROID_IOS_PWA.md` | Capacitor 8.6.2 mobile container, Android APK artifact, PWA service worker, iOS status |
| `11_LANDING_PAGE_AND_UIUX.md` | Three.js botanical island, custom mist shaders, Living Data Landscape, 7-color palette |
| `12_API_REFERENCE.md` | Exhaustive REST API reference for Next.js Route Handlers and FastAPI endpoints |
| `13_DEPLOYMENT_ARCHITECTURE.md` | Vercel BFF, Render inference container, Supabase Cloud, cold-start handling |
| `14_TESTING_AND_VALIDATION.md` | 67 automated unit/integration tests (Vitest + Pytest) + 3 Playwright E2E browser specs |
| `15_RESULTS_AND_DISCUSSION.md` | Recorded validation accuracy (96.04%), CPU inference benchmarks, live test results |
| `16_SYSTEM_DIAGRAMS.md` | 14 complete, editable Mermaid diagrams covering all UML, DFD, and architectural views |
| `17_EXISTING_VS_PROPOSED.md` | Rigorous academic comparison against traditional manual and generic digital systems |
| `18_REQUIREMENTS.md` | Hardware and software specifications for development, deployment, and end users |
| `19_LIMITATIONS_AND_FUTURE_SCOPE.md` | Real-world constraints (domain shift, cold starts, rules vs ML) and future research |
| `20_SOURCE_TRACEABILITY.md` | Comprehensive traceability matrix linking claims to exact source code locations |
| `21_VERIFIED_PROJECT_FACTS.md` | Canonical summary of immutable, 100% verified engineering facts |
| `22_UNVERIFIED_CLAIMS_AND_GAPS.md` | Explicit catalog of unverified items and student/guide administrative placeholders |
| `PHYTOX_COMPLETE_PROJECT_CONTEXT.md` | **The Master Document:** Comprehensive, self-contained dossier for Claude handoff |

---

## 3. Verified Facts vs. Areas Requiring User Confirmation

### Proven Beyond Doubt (VERIFIED from Repository Artifacts):
- **Project Frameworks:** Next.js 16.4.6, React 19.2.0, TypeScript, Tailwind CSS 4.1.0, Three.js 0.187.0, FastAPI 0.115.11, ONNX Runtime, Supabase PostgreSQL 15+.
- **Model Checkpoint:** PyTorch MobileNetV2 with custom $1280 \to 512 \to 38$ classification head, exported to ONNX (SHA-256 `fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4`, size 11.57 MB).
- **Validation Accuracy:** **96.04%** ($0.9603566$) recorded at epoch 15 in `best_model.pt`.
- **Dataset:** New Plant Diseases Dataset (Augmented) by vipoooool from Kaggle (70,295 train + 17,572 val = 87,867 images; 38 classes across 14 crops).
- **Database Architecture:** 13 tables, 100% RLS coverage, verified by 18 in-engine database authorization tests using PGlite.
- **Automated Tests:** Exactly **67 automated unit/integration tests** (44 Vitest + 23 Pytest) passing 100%, plus 3 Playwright real-browser E2E specs (total 70 scenarios).
- **Android APK:** Generated debug APK `apps/web/android/app/build/outputs/apk/debug/app-debug.apk` (4,118,894 bytes).
- **Production Status:** Deployed and live on Vercel (`https://phytox.vercel.app`) with Render inference backend.

### Areas Requiring User Input for Final Report Submission:
1. **Student Team Details:** Specific names, roll numbers / hall ticket numbers of the project team members for the cover page, declaration, and certificate.
2. **Project Supervisor / Guide:** Name, academic title, and department of the faculty guide at Matrusri Engineering College.
3. **Department Head:** Name and title of the Head of Department (Computer Science & Engineering).
4. **Colab Training Wall-Clock Time:** Estimated as ~18–25 minutes; if the exact log timestamp is preserved in personal student notes, it may be inserted.
5. **Field Trial Collaborations:** Whether any local Krishi Vigyan Kendra (KVK) or farming cooperative in Telangana/Andhra Pradesh has been engaged for pilot testing.

---

## 4. How Claude Should Generate the Academic Report

When authoring the official B.E. Mini-Project Report:
1. Use `PHYTOX_COMPLETE_PROJECT_CONTEXT.md` as the primary reference document, and consult individual topic files (`01` through `22`) for deep granular specifics.
2. Structure the final document according to the college-mandated format:
   - **Chapter 1: Introduction** (Problem, Motivation, Objectives, Scope, Literature)
   - **Chapter 2: Requirement Analysis & Specification** (Functional, Non-Functional, Hardware/Software)
   - **Chapter 3: System Design** (Architecture, UML Diagrams, DFDs, ER Diagram, Flowcharts, Modules)
   - **Chapter 4: Implementation & Testing** (Technologies, Model Pipeline, Portals, Database, Test Suites)
   - **Chapter 5: Results & Discussion** (Metrics, Empirical Proofs, Latency Benchmarks, Screenshots, Output Tables)
   - **Chapter 6: Conclusion & Future Scope** (Summary, Contributions, Real Limitations, Future Roadmap)
3. Maintain an objective, academic engineering tone. Emphasize architectural rigor, security boundaries (RLS and k-anonymity), domain safety (crop-conditioning), and empirical validation over marketing superlatives.
4. Do not invent synthetic experimental results, non-existent datasets, or unsupported claims. Cite the verified metrics and source files documented in this knowledge base.
