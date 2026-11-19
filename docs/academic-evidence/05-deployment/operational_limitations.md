# PhytoX — Operational Constraints & Cloud Platform Limitations

**Context:** Production Limitations Analysis for Matrusri Engineering College Mini Project Report  

---

## 1. Cloud Free-Tier Resource Constraints

### A. Render Free-Tier Container Spin-Down (Cold Start)
* **Observed Behavior:** On Render's free hobby tier, container instances spin down to zero active replicas after 15 minutes of inactivity.
* **Cold Start Latency:** When an idle container receives an incoming diagnosis request, container bootstrap, Python environment loading, and ONNX graph initialization take approximately **45 to 55 seconds**.
* **PhytoX Mitigation:** 
  - The Next.js BFF implements a non-blocking health polling mechanism.
  - The Farmer Portal detects when the inference engine is spinning up and gracefully presents:
    > *"Crop analysis service is connecting. The AI inference engine is spinning up from idle. You can select your crop and prepare your leaf image below."*
  - This prevents UI freezes or confusing blank errors.

### B. Vercel Serverless Function Execution Window
* **Hobby Tier Execution Timeout:** Vercel functions have a maximum execution timeout of 10 seconds (configurable up to 15 seconds on free tier).
* **Engineering Impact:** If a farmer submits an image while Render is cold-starting from idle (> 45s), the Vercel function may time out before Render responds. PhytoX handles this by decoupling image staging and reservation via `reserve_diagnosis` so the client can safely retry once the service reports ready.

---

## 2. Bandwidth & Storage Quotas

* **Supabase Storage:** The `crop-images` private bucket holds raw leaf photographs. To prevent storage exhaustion, `apps/web/src/components/farmer/scanner.tsx` enforces a client-side file size cap of 10 MB per image, and an hourly rate limit of 20 diagnoses per farmer account is enforced by PostgreSQL stored procedure `reserve_diagnosis()`.

---

## 3. Network & Offline Resilience

* **PWA Offline Mode:** The Progressive Web App caches UI shell assets, navigation bars, and language strings via Service Worker (`service-worker.js`), enabling farmers to open the app and view previously saved diagnosis histories while in rural areas without mobile cellular reception.
* **Online Gating for ML:** Image inference requires active network transmission to the cloud inference service; offline on-device WebAssembly execution of MobileNetV2 is identified as a high-value future extension.
