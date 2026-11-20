# PhytoX — Software & Hardware Requirements Specification

**Document Identifier:** `18_REQUIREMENTS.md`  
**Classification:** System Requirements & Deployment Specification  
**Academic Chapter Alignment:** Chapter 2 (Requirement Analysis & System Specification)  
**Confidence Status:** VERIFIED FROM REPOSITORY CONFIGURATION & PLATFORM BENCHMARKS  

---

## 1. User & Client-Side Hardware Requirements

### 1.1 Farmer Client Device (Smartphone / Mobile PWA)
* **Operating System:** Android 5.1 Lollipop or higher (API Level 22+); iOS 14.0 or higher.
* **Processor (CPU):** 1.2 GHz Quad-Core ARMv7 / ARM64 processor or higher.
* **Memory (RAM):** 
  - *Minimum:* 1 GB RAM (sufficient for Progressive Web App execution).
  - *Recommended:* 2 GB+ RAM (ensures smooth WebGL 3D canvas rendering and camera preview).
* **Display Resolution:** Minimum $360 \times 640$ pixels (responsive CSS adapts seamlessly to standard mobile aspect ratios).
* **Integrated Hardware:**
  - Rear Primary Camera: $\ge 2.0$ Megapixels with autofocus capability (macro focus recommended for foliar lesion inspection).
  - GPS Geolocation Receiver (optional, for attaching field coordinates to submitted reports).
* **Internal Storage:** Minimum 15 MB free space (for PWA service worker cache or 4.12 MB Android APK installation).
* **Network Connectivity:** Active 2G/3G/4G/5G cellular data or Wi-Fi connectivity (minimum 256 kbps uplink for leaf photo transmission).

### 1.2 Agricultural Officer Device (Desktop Workstation)
* **Operating System:** Windows 10/11 (64-bit), macOS 12+ (Monterey or later), or Ubuntu Linux 20.04+ LTS.
* **Processor (CPU):** Dual-Core 2.0 GHz x86_64 or Apple Silicon (M1/M2/M3).
* **Memory (RAM):** Minimum 4 GB RAM (8 GB recommended for fluid Leaflet GIS map rendering with large marker clusters).
* **Display Resolution:** Minimum $1280 \times 720$ pixels (Full HD $1920 \times 1080$ recommended for high-resolution leaf photo inspection).
* **Browser Compatibility:** Google Chrome 100+, Microsoft Edge 100+, Mozilla Firefox 100+, or Safari 15+ (HTML5, WebGL 2.0, and ES2022 compliant).

---

## 2. Server & Cloud Infrastructure Requirements

### 2.1 Next.js Web Application & BFF Serverless Runtime (Vercel)
* **Compute Architecture:** Vercel Serverless Edge Runtime (AWS Lambda underlying).
* **Node.js Engine Version:** Node.js `20.x` or `22.x` LTS.
* **Function Memory Allocation:** 1,024 MB (sufficient for Libvips Sharp image decompression and resizing).
* **Function Timeout Window:** 15 seconds (default serverless invocation window).
* **Outbound Network:** Unrestricted HTTPS egress to communicate with Supabase Cloud and Render Inference.

### 2.2 Machine Learning Inference Microservice (Render)
* **Runtime Environment:** Linux x86_64 Container (Debian 12 Bookworm slim base via Docker).
* **Compute Resources (Measured Minimum):**
  - *Processor:* 0.5 to 1.0 Virtual CPU (vCPU).
  - *Memory (RAM):* **512 MB minimum** (ONNX Runtime and model weights require ~180 MB resident memory at steady state).
  - *Disk Storage:* 1 GB container disk allocation.
* **Python Engine:** Python `3.11.x`.
* **Hardware Acceleration:** **Pure CPU Silicon** (No GPU required). The ONNX Runtime CPU execution provider delivers sub-30ms execution on standard virtual cores.

### 2.3 Relational Database & Cloud Storage (Supabase)
* **Database Engine:** PostgreSQL `15.x`.
* **Database Extensions:** `pgcrypto` enabled.
* **Storage Allocation:**
  - PostgreSQL Database: 500 MB initial allocation.
  - S3 Object Storage (`crop-images`): 5 GB object storage allocation for leaf photograph archiving.
* **Connection Pooling:** Supavisor connection pooler enabled (Port 6543 / 5432) supporting up to 200 concurrent pooled client connections.

---

## 3. Development & Build Toolchain Requirements

To reproduce, build, test, and package the PhytoX platform from source code:

| Software Component | Verified Version | Purpose in Toolchain |
|---|---|---|
| **Operating System** | Windows 10/11 x64, Linux, or macOS | Development host OS |
| **Node.js** | `>=20.0.0` (Recommended: `22.14.0`) | JavaScript runtime and build engine |
| **npm (Node Package Manager)** | `>=10.0.0` | Monorepo package dependency management |
| **Python** | `3.11.x` (or `3.12.x`) | Machine learning inference and model scripting |
| **Git** | `>=2.40.0` | Version control and repository management |
| **Docker / Docker Desktop** | `>=24.0.0` | Local container building and inference testing |
| **Android Studio / SDK** | Android SDK Build-Tools 34.0.0 | Capacitor Android APK compilation |
| **Java Development Kit (JDK)** | OpenJDK 17 or 21 LTS | Gradle Android build compiler |
| **Supabase CLI** | `^3.0.0` | Local database migrations and RLS schema testing |

---

## 4. Network & Communication Requirements

* **Transport Layer Security:** All public and inter-service communication strictly enforced over **TLS 1.3 / HTTPS** (Port 443).
* **WebSocket / SSE:** Supported for real-time Supabase database change listeners.
* **Permitted Navigation Domains (Capacitor Config):**
  `allowNavigation: ["phytox.vercel.app", "127.0.0.1", "localhost"]`
* **Internal Microservice Header:** HTTP header `X-API-Key` with 256-bit entropy protecting `/v1/predict`.
* **Average Payload Sizes (Measured):**
  - Initial PWA Bundle: ~280 kB gzipped (excluding heavy 3D GLTF assets).
  - 3D Botanical Mesh (`main_island_desktop.glb`): ~3.8 MB (Draco compressed).
  - Sanitized Leaf Photograph Upload: ~180 kB to 420 kB (JPEG quality 90).
  - Inference Response JSON: ~1.2 kB.
