# PhytoX — Deployment Infrastructure & Cloud Topology

**Document Identifier:** `13_DEPLOYMENT_ARCHITECTURE.md`  
**Classification:** Cloud Infrastructure & DevOps Specification  
**Production URLs:**  
- Web Application & BFF: `https://phytox.vercel.app`  
- Inference Host: Render Container Cloud  
- Database & Auth: Supabase Managed Cloud  
**Confidence Status:** VERIFIED FROM DOCKERFILE, CONFIGS & LIVE HEALTH CHECKS  

---

## 1. Cloud Topology & Physical Infrastructure

PhytoX leverages a modern multi-cloud deployment topology distributing compute across specialized serverless edge and container platforms:

```
                                 [ USERS / BROWSERS ]
                                          │
                                          ▼
                       Vercel Edge Network (Global CDN / Anycast)
                                          │
                       ┌──────────────────┴──────────────────┐
                       │                                     │
                 [ Static Assets ]                 [ Serverless BFF ]
                 (HTML, JS, WebP,                 (Next.js Route Handlers)
                  GLB 3D Meshes)                  (https://phytox.vercel.app)
                                                             │
                              ┌──────────────────────────────┴──────────────────────────────┐
                              │                                                             │
                              ▼ (HTTPS + X-API-Key)                                         ▼ (HTTPS + JWT / Service Key)
                   Render Container Cloud                                        Supabase Managed Cloud
               (services/inference/Dockerfile)                                    (AWS Cloud Infrastructure)
               ┌──────────────────────────────┐                              ┌──────────────────────────────┐
               │ • Docker Linux x86_64 Image  │                              │ • Supabase Auth Service      │
               │ • Uvicorn ASGI Server        │                              │ • PostgreSQL 15 Relational DB│
               │ • FastAPI 0.115 Engine       │                              │ • Private S3 Storage Bucket  │
               │ • ONNX Runtime CPU Engine    │                              │   (crop-images)              │
               │ • supplied.onnx (11.57 MB)   │                              └──────────────────────────────┘
               └──────────────────────────────┘
```

---

## 2. Subsystem Deployment Specifications

### 2.1 Web Application & BFF (Vercel)
* **Hosting Platform:** Vercel Serverless Edge Platform.
* **Production URL:** `https://phytox.vercel.app`
* **Framework Preset:** Next.js (App Router).
* **Node.js Runtime:** Node.js 20.x / 22.x LTS.
* **Build Command:** `npm run build -w apps/web` (executes `next build --webpack`).
* **Output Mode:** Standalone Serverless Functions.
* **DNS & SSL:** Automatic Let's Encrypt TLS certificate provisioning with HTTP/2 and HTTP/3 support.

### 2.2 Inference Microservice (Render)
* **Hosting Platform:** Render Web Services (Docker runtime).
* **Dockerfile Specification:** `services/inference/Dockerfile`:
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /srv
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY app ./app
  COPY models ./models
  EXPOSE 8000
  CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
* **Runtime Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
* **Resource Tier:** Standard CPU instance (512 MB – 1 GB RAM, 0.5 – 1 vCPU).
* **Hardware Accelerator:** Standard x86_64 CPU (GPU not required; ONNX Runtime delivers sub-30ms CPU execution).
* **Health Probes:**
  - Liveness: `GET /health` (returns `{"status": "ok"}`)
  - Readiness: `GET /ready` (returns `{"ready": true}`)

### 2.3 Relational Database & Storage (Supabase Cloud)
* **Hosting Platform:** Supabase Managed Cloud Platform.
* **Database Version:** PostgreSQL 15.x.
* **Extensions Active:** `pgcrypto` (cryptographic UUIDs and SHA-256 generation).
* **Storage Bucket:** `crop-images`
  - Bucket Privacy: **Private** (`public = false`).
  - Access Protocol: Cryptographic time-limited signed URLs (`createSignedUrl`, TTL 3600 seconds).

---

## 3. Environment Variables & Secret Configuration

To prevent security breaches, secret keys are never committed to the repository. The application reads configuration from environment variables:

| Environment Variable Key | Target Subsystem | Sensitivity | Functional Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Web App (Client/BFF) | Low (Public) | Supabase project API gateway endpoint URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web App (Client) | Low (Public) | Anonymous client key for Supabase Auth and RLS-scoped queries. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Web App (Client) | Low (Public) | Alternate alias for anon key (supported for Vercel harmonization). |
| `SUPABASE_SERVICE_ROLE_KEY` | Web App (BFF only) | **CRITICAL** | Privileged service key for `finish_diagnosis` and signed storage URLs. Never exposed to browser. |
| `INFERENCE_URL` | Web App (BFF only) | Medium | HTTPS URL pointing to the Render inference service (e.g., `https://phytox-inference.onrender.com`). |
| `INFERENCE_API_KEY` | Web App & Inference | **CRITICAL** | Shared secret header (`X-API-Key`) protecting the inference endpoint. |
| `MODEL_PATH` | Inference Container | Low | Path to ONNX model weights (`models/supplied.onnx`). |
| `MODEL_MANIFEST` | Inference Container | Low | Path to model class manifest (`models/supplied.manifest.json`). |

---

## 4. Model Loading & Integrity Verification Lifecycle

Implemented in `services/inference/app/model.py` (`ModelAdapter.load()`):

1. **Path Resolution:** Checks `MODEL_PATH` and `MODEL_MANIFEST` environment variables. If unset or non-existent, defaults to `services/inference/models/supplied.onnx` and `supplied.manifest.json`.
2. **Cryptographic Checksum Verification:**
   - Computes SHA-256 hash of the binary ONNX file on disk:
     $$\text{Digest} = \text{sha256}(\text{read\_bytes}(path))$$
   - Compares against `manifest.sha256`:
     $$\text{Digest} \stackrel{?}{=} \text{"fde9536ff18a419b69895a3624679638e797ef51018536fb0a9babdd56a907b4"}$$
   - If checksum deviates, loading aborts immediately with a validation error, preventing execution of corrupted or tampered weights.
3. **Graph Contract Inspection:**
   - Verifies input tensor contract: single tensor named `"input"`, floating-point, shape $[1, 3, 224, 224]$.
   - Verifies output tensor contract: single tensor named `"output"`, shape $[1, 38]$.
4. **Session Activation:** Initializes `ort.InferenceSession` with `CPUExecutionProvider` and sets `self.ready = True`.

---

## 5. Cold-Start Dynamics & Resilient Fallback

A significant operational consideration on cloud container platforms (such as Render's free/starter tier) is **service cold starts**:

### 5.1 The Cold-Start Phenomenon
* After 15 minutes of inactivity, the inference container is spun down to conserve resources.
* When a farmer submits an image while the service is dormant, container spin-up requires **30 to 50 seconds** (Docker container initialization, Python runtime start, and ONNX graph parsing).

### 5.2 Resilient BFF Handling: Zero Mock Prediction Guarantee
In adherence to academic integrity and clinical safety:
1. When the inference microservice does not respond within the timeout window or returns HTTP 503, the BFF catches the exception.
2. The BFF updates the diagnosis row to `status = 'failed'` or retains `status = 'processing'`.
3. The farmer interface displays a non-blocking informational state:
   > *"Crop analysis service is connecting. Please check your connection or wait a moment while the server initializes."*
4. **Zero Fabrication:** The system **never fabricates mock predictions, random diseases, or synthetic placeholder confidences** during downtime.

---

## 6. Local Development vs. Production Configuration

| Architectural Feature | Local Development Environment | Live Production Environment |
|---|---|---|
| **Web Server** | `next dev --webpack --hostname 127.0.0.1` (Port 3000) | Vercel Serverless Edge Network (`phytox.vercel.app`) |
| **Inference Server** | Python `uvicorn app.main:app --port 8000` | Render Container (`/v1/predict`) |
| **Database** | Local Supabase CLI / Docker PostgreSQL (Port 54322) | Supabase Cloud Managed PostgreSQL 15 |
| **Storage Bucket** | Local MinIO S3 Emulator | Supabase AWS S3 Object Storage |
| **Automated DB Testing** | In-Process WebAssembly PGlite (`authorization.test.ts`) | Continuous Integration pipeline |
| **SSL / HTTPS** | `http://127.0.0.1:3000` (Localhost loopback) | Strict TLS 1.3 HTTPS with HSTS |
