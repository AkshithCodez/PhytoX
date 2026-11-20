# PhytoX — Mobile Architecture: Android, iOS & Progressive Web App (PWA)

**Document Identifier:** `10_ANDROID_IOS_PWA.md`  
**Classification:** Mobile Engineering & Cross-Platform Runtime Specification  
**Frameworks:** Progressive Web App (Service Workers) + Capacitor 8.6.2 Native Container  
**Verified Binary Artifact:** `apps/web/android/app/build/outputs/apk/debug/app-debug.apk` (4.12 MB)  
**Confidence Status:** VERIFIED FROM CODEBASE & COMPILED ARTIFACTS  

---

## 1. Mobile Implementation Status Matrix

In compliance with academic honesty invariants, the mobile implementation status is rigorously categorized:

| Platform / Capability | Real Current Status | Verification Evidence |
|---|---|---|
| **Progressive Web App (PWA)** | **IMPLEMENTED AND TESTED** | `manifest.webmanifest`, `public/sw.js`, `offline.html`, verified in Chrome/Edge browsers |
| **PWA Install Prompt UI** | **IMPLEMENTED AND TESTED** | `apps/web/src/components/pwa-installer.tsx`, captures `beforeinstallprompt` event |
| **Offline Fallback Page** | **IMPLEMENTED AND TESTED** | `public/offline.html`, cached during service worker `install` event |
| **Capacitor Android Container** | **IMPLEMENTED AND TESTED** | `apps/web/android/` project, `capacitor.config.ts`, Gradle build executed |
| **Android Binary Artifact (APK)** | **COMPILED & VERIFIED** | **`app-debug.apk`** (**4,118,894 bytes**), built on 19 November 2026 |
| **Capacitor iOS Configuration** | **CONFIGURED ONLY (UNTESTED)**| `apps/web/ios/App/App`, `capacitor.config.ts` exists; **no `.ipa` compiled** (requires macOS with Xcode) |
| **Camera & Gallery Integration** | **IMPLEMENTED AND TESTED** | HTML5 File Input / Capture API (`scanner.tsx`), tested on physical mobile viewports |
| **Native Deep-Link Handling** | **CONFIGURED ONLY** | Android intent filters configured in `AndroidManifest.xml` |
| **Offline AI Inference on Device** | **NOT SUPPORTED (BLOCKED)** | **All inference requires network access to the cloud FastAPI microservice.** No on-device ONNX runtime or local weights exist inside the mobile bundle. |

---

## 2. Progressive Web App (PWA) Architecture

The primary mobile distribution vector for PhytoX is an installable, mobile-optimized Progressive Web App:

### 2.1 Web App Manifest Specification
Located at `apps/web/public/manifest.json` and `apps/web/public/manifest.webmanifest`:
```json
{
  "name": "PhytoX — Crop Health & Field Intelligence",
  "short_name": "PhytoX",
  "description": "AI-assisted crop disease diagnosis and regional agricultural monitoring platform.",
  "start_url": "/farmer",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#0A0F12",
  "theme_color": "#0A0F12",
  "categories": ["agriculture", "productivity", "utilities"],
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 2.2 Service Worker Caching Strategy
Implemented in `apps/web/public/sw.js` (Cache Name: `phytox-cache-v2`):

1. **Pre-Caching on Install:**
   - Pre-caches core offline shell assets: `/`, `/offline.html`, `/manifest.webmanifest`, `/icon-192.png`, `/icon-512.png`, `/icon.svg`, `/images/logo/logo-mark.png`.
   - Executes `self.skipWaiting()` for immediate activation.
2. **Cache Clean-Up on Activate:**
   - Automatically iterates `caches.keys()` and purges obsolete cache versions, followed by `self.clients.claim()`.
3. **Dual Fetch Interception Strategy:**
   - **Navigation Requests (`mode === 'navigate'`):** Utilizes **Network-First** strategy. If the user encounters complete network loss in rural fields, the service worker catches the network rejection and serves `/offline.html`, informing the farmer of offline status without throwing generic browser error screens.
   - **Static Assets & Media (Images, WebP, SVG, Icons):** Utilizes **Cache-First with Network Fallback**. Once downloaded, branding assets and UI textures are served from local cache, updating the cache in the background upon successful re-fetch.
   - **API Mutation Requests (`/api/*`):** Routed directly to the network without caching to preserve strict relational transactional consistency.

---

## 3. Capacitor Native Android Architecture

To support direct APK installation for agricultural field agents who prefer a native launcher icon, PhytoX integrates **Capacitor 8.6.2**:

### 3.1 Capacitor Configuration
Defined in `apps/web/capacitor.config.ts`:
```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "org.phytox.app",
  appName: "PhytoX",
  webDir: "out",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    iosScheme: "https",
    allowNavigation: ["phytox.vercel.app", "127.0.0.1", "localhost"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0A0F12",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0A0F12",
    },
  },
};

export default config;
```

### 3.2 Architectural Relationship: Native Container vs. Next.js Serverless BFF
An important technical question for academic documentation is how a native Capacitor shell interacts with a Next.js App Router application:
1. **Hybrid Web Container:** Capacitor embeds an Android WebView (`android.webkit.WebView`) initialized with the application bundle.
2. **Network Scheme Bridge:** The WebView is configured with `androidScheme: "https"` and allowed navigation targeting `phytox.vercel.app`.
3. **BFF Routing:** All heavy server operations (Sharp image validation, Supabase service-role mutations, and FastAPI inference dispatch) continue to execute on the Vercel/Render cloud infrastructure. The mobile container acts as an ultra-lean display and sensor capture layer.

### 3.3 Compiled Binary Verification
* **Artifact Path:** `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`
* **Artifact File Size:** **4,118,894 bytes** (~**4.12 MB**).
* **Package Identifier:** `org.phytox.app`
* **Minimum Android SDK:** API Level 22 (Android 5.1 Lollipop).
* **Target Android SDK:** API Level 34 (Android 14).
* **Build System:** Gradle 8.x with Android Gradle Plugin.

---

## 4. iOS Platform Status & Build Constraints

* **Configuration State:** The iOS project structure exists at `apps/web/ios/App/App` containing `capacitor.config.json` and CocoaPods definitions.
* **Absence of IPA Build Artifact:** No `.ipa` file exists in the repository.
* **Technical Reason:** Compiling an iOS application package requires macOS hardware, the Xcode toolchain, and an active Apple Developer provisioning profile. Because development and verification were conducted on a Windows x86_64 host, iOS compilation was not executed.
* **Report Instruction:** The final project report must accurately describe iOS as *"Configured via Capacitor cross-platform tooling, with compilation pending macOS Xcode build infrastructure."*

---

## 5. Camera & Sensor Integration

* **Foliar Photographic Capture:** Implemented using standard HTML5 Media Capture primitives in `scanner.tsx`:
  ```tsx
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    capture="environment"
    onChange={handleFileSelect}
  />
  ```
* **Camera Selection:** The `capture="environment"` attribute explicitly instructs the mobile operating system (Android and iOS) to default to the rear primary camera, which features superior macro focal capability for leaf symptom inspection.
* **Geolocation Integration:** Implemented in `report/[id]/page.tsx` via the W3C Geolocation API (`navigator.geolocation.getCurrentPosition`), allowing farmers to attach latitude and longitude coordinates with explicit user consent.

---

## 6. Offline AI Myth vs. Cloud Reality

### Critical Academic Clarification:
The final report must **not** claim that PhytoX performs offline edge AI inference on mobile devices:
1. **The Mobile Reality:** Running MobileNetV2 locally on device would require packaging an ONNX Runtime WebAssembly bundle (~15 MB) plus model weights (~11.6 MB) inside the client, alongside client-side image normalization.
2. **The Cloud Reality:** In the verified implementation, all inference calls are dispatched over the network to the cloud FastAPI microservice on Render. If a farmer attempts to analyze a photograph while completely offline, the system informs them that connectivity is required and queues the action.
3. **Future Research:** True offline on-device inference utilizing 8-bit quantized INT8 weights is recognized as an active future enhancement.
