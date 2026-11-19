# PhytoX — Production Health Check Records

**Date of Execution:** 19 November 2026 (Live Probe)  
**Target Environment:** Production (`https://phytox.vercel.app`)  
**Overall Status:** OPERATIONAL (`ready`)  

---

## 1. Live Public Health Endpoint Output

Executed live via PowerShell curl utility against the production deployment:
```bash
curl.exe -s https://phytox.vercel.app/api/status
```

### Exact Response Body:
```json
{
  "database": true,
  "model": true,
  "configured": true,
  "status": "ready",
  "reason": "ready"
}
```

### Interpretation:
1. `"database": true` confirms that Vercel Serverless connects successfully to Supabase PostgreSQL and can query `public.regions`.
2. `"model": true` confirms that the Next.js BFF reaches Render's FastAPI `/ready` endpoint, which returned 200 OK after verifying that `supplied.onnx` is loaded and the fingerprint hash matches.
3. `"configured": true` confirms all necessary environment keys are present.
4. `"status": "ready"` confirms the system is fully prepared to execute live farmer leaf diagnoses.

---

## 2. Protected Route Access Verification

Probed via Python requests to test edge security controls:

### Probe A: Direct Diagnoses POST without Origin Header
* **Endpoint:** `https://phytox.vercel.app/api/diagnoses`
* **Response:** `HTTP 403 Forbidden`
* **Body:** `{"error": {"code": "invalid_origin", "message": "Request origin is not permitted."}}`
* **Finding:** Edge CSRF shield successfully blocks unauthorized cross-site requests.

### Probe B: Diagnoses POST with Origin Header but No Auth Cookie
* **Endpoint:** `https://phytox.vercel.app/api/diagnoses` (with `Origin: https://phytox.vercel.app`)
* **Response:** `HTTP 401 Unauthorized`
* **Body:** `{"error": {"code": "unauthorized", "message": "Please sign in to continue."}}`
* **Finding:** Unauthenticated requests are rejected before consuming inference compute.
