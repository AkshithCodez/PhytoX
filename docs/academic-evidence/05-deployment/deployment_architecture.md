# PhytoX — Production Deployment Architecture

**Production Frontend URL:** `https://phytox.vercel.app`  
**Hosting Topology:** Multi-Cloud Distributed Architecture (Vercel Edge/Serverless + Render Docker Microservice + Supabase Managed PostgreSQL/Storage)  

---

## 1. Cloud Infrastructure Topology

```
                              ┌──────────────────────────────────────────┐
                              │              PUBLIC INTERNET             │
                              └────────────────────┬─────────────────────┘
                                                   │ HTTPS
                                                   ▼
                                    ┌─────────────────────────────┐
                                    │    Vercel Edge Network      │
                                    │   Global DNS / CDN / TLS    │
                                    └──────────────┬──────────────┘
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼                                                   ▼
         ┌───────────────────────────────┐                   ┌───────────────────────────────┐
         │     Next.js 16 Static UI      │                   │   Next.js 16 BFF Serverless   │
         │  (Farmer PWA / Officer Portal)│                   │     (Route Handlers / SSR)    │
         └───────────────────────────────┘                   └───────────────┬───────────────┘
                                                                             │
                                           ┌─────────────────────────────────┴─────────────────────────────────┐
                                           │ HTTPS (Internal API Key)                                          │ HTTPS (Supabase Service Key)
                                           ▼                                                                   ▼
                          ┌───────────────────────────────────┐                               ┌───────────────────────────────────┐
                          │         Render Cloud Host         │                               │       Supabase Cloud (AWS)        │
                          │   Docker Container / FastAPI      │                               │   PostgreSQL 15 + Supabase Auth   │
                          │  services/inference (Uvicorn)     │                               │      + Private Storage S3         │
                          │  ONNX Runtime (supplied.onnx)     │                               │                                   │
                          └───────────────────────────────────┘                               └───────────────────────────────────┘
```

---

## 2. Environment Configuration Matrix

| Variable Name | Hosting Scope | Purpose & Redaction Notice |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (Public) | Supabase project REST & Auth endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel (Public) | Client-safe anonymous JWT key for browser operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (Secret) | Server-side trusted key for `finish_diagnosis` RPC (`<REDACTED>`) |
| `INFERENCE_URL` | Vercel (Secret) | Render microservice HTTPS endpoint (`<REDACTED>`) |
| `INFERENCE_API_KEY` | Vercel & Render (Secret) | Shared secret key for authenticating BFF $\leftrightarrow$ Render requests (`<REDACTED>`) |
| `MODEL_PATH` | Render (Internal) | Path to ONNX model weights (`/service/models/supplied.onnx`) |
| `MANIFEST_PATH` | Render (Internal) | Path to class definition manifest (`/service/models/supplied.manifest.json`) |

---

## 3. Communication Protocols & Security Boundaries

1. **Client $\to$ BFF:** HTTPS with HTTP-only session cookies and custom CSRF origin validation.
2. **BFF $\to$ Inference Service:** Private HTTPS payload containing raw multipart image stream and custom header `x-api-key`.
3. **BFF $\to$ Supabase Database:** Encrypted PostgreSQL connection over SSL using the trusted service role.
4. **Client $\to$ Supabase Storage:** Signed URLs or authenticated scoped uploads restricted to the farmer's UID folder.
