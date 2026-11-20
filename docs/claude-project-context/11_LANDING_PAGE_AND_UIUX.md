# PhytoX — Public Landing Page & UI/UX Design System

**Document Identifier:** `11_LANDING_PAGE_AND_UIUX.md`  
**Classification:** Frontend Design Engineering & WebGL 3D Specification  
**Visual Stack:** Next.js 16 + React Three Fiber + Three.js + GSAP ScrollTrigger  
**Brand Aesthetic:** Eco-Technical Cinematic Dark Mode  
**Confidence Status:** VERIFIED FROM SOURCE IMPLEMENTATION  

---

## 1. Design Philosophy: Eco-Technical Cinematic Aesthetic

The public entry point of PhytoX (`apps/web/src/app/page.tsx`) departs radically from generic agricultural software templates. It implements an **Eco-Technical Cinematic Design Language** that marries biological organic beauty with high-precision computer vision aesthetics:

1. **Dark Technical Atmosphere:** A deep midnight canvas provides high contrast for foliar photography, vibrant diagnostic indicators, and WebGL specular highlights.
2. **Spatial Dimensionality:** An interactive 3D botanical island serves as an interactive centerpiece, reacting physically to user mouse parallax and scroll position.
3. **Smooth Storytelling Journey:** The landing page is engineered as a choreographed 4-scene narrative journey driven by GSAP ScrollTrigger, taking the visitor from microscopic leaf pathology to macro-level regional agricultural intelligence.
4. **Restrained, Intentional Motion:** All motion is physically grounded and respects accessibility settings (`prefers-reduced-motion`).

---

## 2. Official PhytoX Master Brand Palette

The color system is codified in `apps/web/src/app/globals.css` (lines 3–49) and strictly adhered to across all portal components:

| Color Token Name | Hex Code | Semantic Role in PhytoX |
|---|---|---|
| **Midnight Oil** | `#0A0F12` | **Base Background Canvas:** Deepest dark slate, eliminates eye strain and enhances WebGL depth. |
| **Black Pearl** | `#20292D` | **Secondary Structural Panels:** Background for primary feature cards, diagnostic result panels, and tables. |
| **Glaucophobia** | `#394045` | **Elevated UI & Overlays:** Elevated modals, action sheets, dropdowns, and mobile drawers. |
| **Summer Concrete** | `#565A5C` | **Muted Borders & Rules:** Subtle structural hairline borders (`rgba(86, 90, 92, 0.45)`) and dividers. |
| **Grapple** | `#907768` | **Warm Neutral Accents:** Badge backgrounds, secondary tag borders, and organic earthy highlights. |
| **Salsa Mexicana** | `#A33715` | **Primary Action Accent:** High-contrast CTA buttons, active scanner beams, priority alert pins, and focus rings. |
| **Net Worker** | `#B5A295` | **Secondary UI & Muted Typography:** Captions, helper guidance, metadata labels, and inactive icons. |

### Semantic Highlight Tokens:
* `--green: #6EE7B7` (Healthy leaf condition, verified status)
* `--amber: #C28E38` (Pending review, low-confidence warning)
* `--red: #E04838` (High-severity disease, rejected report, critical outbreak signal)

---

## 3. WebGL 3D Botanical Island Architecture

Implemented in `apps/web/src/components/eco-tech-scene.tsx`:

### 3.1 3D Model Assets & Draco Decompression
* **Primary Desktop Mesh:** `/models/main_island_desktop.glb` (Optimized binary glTF).
* **Mobile-Optimized Mesh:** `/models/main_island_mobile.glb` (Reduced polygon count and simplified vertex normal buffers for mobile GPUs).
* **Geometry Decompression:** Powered by Google's Draco decoder loaded from `/draco/` (`draco_decoder.wasm`), reducing binary network transfer payload by over 65%.
* **Lighting Environment:** High Dynamic Range Image (HDRI) map loaded from `/hdri/belfast_open_field_1k.hdr`, generating realistic outdoor lighting reflections and soft ambient occlusion.

### 3.2 Custom GLSL Procedural Sky Shader
To create an immersive, dynamic atmospheric backdrop behind the 3D island, `eco-tech-scene.tsx` compiles custom WebGL vertex and fragment shaders implementing Fractal Brownian Motion (FBM):

```glsl
// GLSL Sky Fragment Shader (Excerpt from eco-tech-scene.tsx)
uniform float uMist;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.04 + vec2(1.7, 9.2);
  }
  return v;
}
```
* **Effect:** Renders procedural, drifting morning mist across the agricultural landscape that dynamically intensifies or clears based on user scroll velocity.

### 3.3 Responsive Camera & Parallax Control
* **Render Loop (`useFrame`):** Reads normalized mouse coordinates (`mousePosRef`) and dampens camera rotation using spherical lerp interpolation.
* **Scroll Coupling:** The 3D model translates along the Z-axis, rotating smoothly as the user progresses through the narrative runway.

---

## 4. The 4-Scene Scroll Narrative Architecture

The landing page experience is choreographed as four distinct narrative stages driven by **GSAP ScrollTrigger**:

```
[ SCENE 1: Botanical Hero ]
• Floating 3D Island Centered in Viewport
• Primary Headline: "Every leaf tells a story."
• Subtitle & Direct Role Portals: "Enter Farmer Workspace" / "Officer Command Portal"
• Interactive Parallax Mouse Tracking
          │
          ▼ (Scroll Progress 0.0 -> 0.30)
[ SCENE 2: The Diagnostic Scanner ]
• 3D Island Zooms and Tilts to Focus on Foliar Leaf Texture
• Spatial Hotspots Fade In:
  - Hotspot 1: 38 Crop Disease Classes screened via MobileNetV2 ONNX
  - Hotspot 2: Multilingual Guidance (English, Telugu, Hindi)
  - Hotspot 3: 100% PostgreSQL Row Level Security
          │
          ▼ (Scroll Progress 0.30 -> 0.65)
[ SCENE 3: The Living Data Landscape ]
• 3D Island Smoothly Exits Viewport
• Procedural Topographic Elevation Contours (SVG Bezier Paths) Emerge
• 8 Conceptual Regional Observation Nodes (OBS-2601 to OBS-2608) Illuminate
• Animated Regional Vector Connections Link Outbreak Points
          │
          ▼ (Scroll Progress 0.65 -> 1.00)
[ SCENE 4: Regional Command & Action ]
• Dual-Role Comparison Matrix
• Officer Administrative Capabilities
• Final High-Impact Call-to-Action
• Direct Routing to Farmer Scanner or Officer Dashboard
```

---

## 5. Living Data Landscape: Topographic Network Visualization

Implemented in `apps/web/src/components/living-data-landscape.tsx`:
* **Concept:** Bridges individual farm leaf scans with macro-level regional surveillance.
* **Topographic Contours:** 6 layered SVG contour lines representing agricultural elevation contours that dynamically reveal their strokeDashoffset as scroll progress traverses $p \in [0.28, 0.65]$.
* **Conceptual Observation Nodes:** 8 illustrated regional nodes tracking diverse crop pathologies:
  - `OBS-2601`: Tomato — Early Blight Risk (Active Observation)
  - `OBS-2602`: Cotton / Chili — Foliar Target Spot (Verified Cluster)
  - `OBS-2603`: Maize — Normal Health (Healthy Baseline)
  - `OBS-2604`: Grape — Black Rot Alert (Review Queued)
  - `OBS-2605`: Bell Pepper — Bacterial Spot (Active Observation)
  - `OBS-2606`: Potato — Late Blight Early (Under Review)
  - `OBS-2607`: Soybean — Normal Health (Healthy Baseline)
  - `OBS-2608`: Tomato — Yellow Leaf Curl (Priority Advisory)

---

## 6. Accessibility & Performance Optimizations

1. **Reduced Motion Adaptation:**
   - Detects `window.matchMedia('(prefers-reduced-motion: reduce)')`.
   - When active, disables WebGL camera lerp and 3D rotations, freezing the island in an optimal static hero pose and replacing smooth canvas transitions with immediate CSS opacity fades.
2. **GPU Performance Throttling:**
   - On low-power mobile viewports, the canvas drops pixel ratio scaling to $1.0\times$ (disabling heavy Retina supersampling) and loads the optimized `main_island_mobile.glb` mesh.
3. **WCAG 2.1 AA Compliance:**
   - Skip to main content link (`.skip-link`) for keyboard navigation.
   - All interactive buttons and inputs provide visible 2px Salsa Mexicana focus rings (`outline: 2px solid var(--accent); outline-offset: 4px;`).
   - High-contrast text ratios exceeding 4.5:1 against the Midnight Oil canvas.
