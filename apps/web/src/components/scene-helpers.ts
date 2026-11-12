import * as THREE from "three";

export function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hash3(ix: number, iy: number, iz: number, seed: number): number {
  let h = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 1597334677) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function noise3(x: number, y: number, z: number, seed = 42): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);

  const fx = fade(x - ix);
  const fy = fade(y - iy);
  const fz = fade(z - iz);

  const n000 = hash3(ix, iy, iz, seed);
  const n100 = hash3(ix + 1, iy, iz, seed);
  const n010 = hash3(ix, iy + 1, iz, seed);
  const n110 = hash3(ix + 1, iy + 1, iz, seed);
  const n001 = hash3(ix, iy, iz + 1, seed);
  const n101 = hash3(ix + 1, iy, iz + 1, seed);
  const n011 = hash3(ix, iy + 1, iz + 1, seed);
  const n111 = hash3(ix + 1, iy + 1, iz + 1, seed);

  const nx00 = THREE.MathUtils.lerp(n000, n100, fx);
  const nx10 = THREE.MathUtils.lerp(n010, n110, fx);
  const nx01 = THREE.MathUtils.lerp(n001, n101, fx);
  const nx11 = THREE.MathUtils.lerp(n011, n111, fx);

  const nxy0 = THREE.MathUtils.lerp(nx00, nx10, fy);
  const nxy1 = THREE.MathUtils.lerp(nx01, nx11, fy);

  return THREE.MathUtils.lerp(nxy0, nxy1, fz) * 2 - 1;
}

export function fbm3(
  x: number,
  y: number,
  z: number,
  octaves = 4,
  seed = 42
): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3(x * frequency, y * frequency, z * frequency, seed + i * 17);
    frequency *= 2.05;
    amplitude *= 0.5;
  }
  return value;
}

export function ridged3(
  x: number,
  y: number,
  z: number,
  octaves = 4,
  seed = 101
): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise3(x * frequency, y * frequency, z * frequency, seed + i * 31));
    value += amplitude * (n * n);
    frequency *= 2.1;
    amplitude *= 0.5;
  }
  return value;
}

export interface SurfaceAnchor {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
  scale: number;
}

/**
 * Deterministic terrain elevation in Diorama B coordinates
 * (terrain mesh is centered at x = 3.5, z = -0.4).
 */
export function getTerrainHeight(worldX: number, worldZ: number, seed = 313): number {
  const localX = worldX - 3.5;
  const localZ = worldZ + 0.4;
  const roll = fbm3(localX * 0.16, 0, localZ * 0.16, 3, seed) * 0.46;
  const microRidges = ridged3(localX * 0.54, 0.8, localZ * 0.54, 3, seed + 17) * 0.14;
  const stationRise = THREE.MathUtils.smoothstep(localX, 0.2, 6.2) * 0.72;
  const horizonDrop = THREE.MathUtils.smoothstep(-localZ, 1.0, 6.5) * 0.28;
  return roll + microRidges + stationRise + horizonDrop;
}

/**
 * High-resolution contoured scree & forest soil terrain bed for Scenes 3-4.
 */
export function createTerrainGeometry(
  width = 30,
  depth = 20,
  segX = 120,
  segZ = 84,
  seed = 313
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  const colors = new Float32Array(posAttr.count * 3);

  const drySoil = new THREE.Color("#cec4b4");
  const dampSoil = new THREE.Color("#73685c");
  const mossTint = new THREE.Color("#7d8b66");
  const c = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const localX = posAttr.getX(i);
    const localZ = posAttr.getZ(i);
    const y = getTerrainHeight(localX + 3.5, localZ - 0.4, seed);
    posAttr.setY(i, y);

    uvAttr.setXY(i, (localX + width * 0.5) * 0.65, (localZ + depth * 0.5) * 0.65);

    const macroShade = fbm3(localX * 0.28, 1.1, localZ * 0.28, 3, seed + 51);
    const t = THREE.MathUtils.clamp(0.46 + macroShade * 0.62 + y * 0.22, 0, 1);
    c.copy(dampSoil).lerp(drySoil, t);
    if (localX > -1.2) {
      c.lerp(mossTint, THREE.MathUtils.smoothstep(localX, -1.2, 4.5) * 0.26);
    }
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Undulating mossy cushion hummock base whose surface spawns instanced photogrammetry moss_01 tufts.
 */
export function createMossHummockGeometry(
  width = 2.8,
  depth = 2.1,
  height = 0.55,
  seed = 505
): { geometry: THREE.BufferGeometry; mossAnchors: SurfaceAnchor[] } {
  const geo = new THREE.PlaneGeometry(width, depth, 72, 56);
  geo.rotateX(-Math.PI / 2);

  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    const nx = x / (width * 0.5);
    const nz = z / (depth * 0.5);
    const radial = Math.max(0, 1 - (nx * nx + nz * nz * 0.9));
    const dome = Math.pow(radial, 0.68) * height;
    const cushionLobes = Math.abs(fbm3(x * 1.65, 0, z * 1.65, 3, seed)) * 0.24 * radial;
    const micro = fbm3(x * 5.8, 0, z * 5.8, 2, seed + 19) * 0.035 * radial;

    posAttr.setY(i, dome + cushionLobes + micro - 0.08);
    uvAttr.setXY(i, (x + width * 0.5) * 1.2, (z + depth * 0.5) * 1.2);
  }

  geo.computeVertexNormals();

  const normAttr = geo.attributes.normal as THREE.BufferAttribute;
  const rand = createSeededRandom(seed * 41);
  const mossAnchors: SurfaceAnchor[] = [];

  for (let i = 0; i < posAttr.count; i++) {
    const py = posAttr.getY(i);
    const ny = normAttr.getY(i);
    if (py > 0.02 && ny > 0.2 && rand() < 0.85) {
      mossAnchors.push({
        pos: new THREE.Vector3(posAttr.getX(i), py - 0.01, posAttr.getZ(i)),
        normal: new THREE.Vector3(normAttr.getX(i), ny, normAttr.getZ(i)).normalize(),
        scale: 0.78 + rand() * 0.72,
      });
    }
  }

  for (let i = mossAnchors.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = mossAnchors[i];
    mossAnchors[i] = mossAnchors[j];
    mossAnchors[j] = tmp;
  }

  return { geometry: geo, mossAnchors };
}

export interface ExtractedMeshPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
  size: THREE.Vector3;
}

/**
 * Extracts and centers/grounds an individual mesh node from a multi-asset Poly Haven GLB.
 */
export function extractMeshPart(
  root: THREE.Object3D,
  nodeName?: string,
  anchor: "center" | "base" = "center"
): ExtractedMeshPart {
  let targetMesh: THREE.Mesh | null = null;
  root.traverse((obj) => {
    if (targetMesh) return;
    if (obj instanceof THREE.Mesh && (!nodeName || obj.name === nodeName)) {
      targetMesh = obj;
    }
  });

  if (!targetMesh) {
    root.traverse((obj) => {
      if (!targetMesh && obj instanceof THREE.Mesh) {
        targetMesh = obj;
      }
    });
  }

  if (!targetMesh) {
    throw new Error(`Mesh node '${nodeName ?? "default"}' not found in GLTF scene.`);
  }

  const found = targetMesh as THREE.Mesh;
  const geometry = found.geometry.clone();
  geometry.computeBoundingBox();
  const box = geometry.boundingBox ?? new THREE.Box3();
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  if (anchor === "center") {
    geometry.translate(-center.x, -center.y, -center.z);
  } else {
    geometry.translate(-center.x, -box.min.y, -center.z);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return {
    geometry,
    material: found.material,
    size,
  };
}

/**
 * Samples natural clumped anchor points over upward-facing crevices of a photogrammetry rock.
 */
export function sampleRockMossAnchors(
  geo: THREE.BufferGeometry,
  options: {
    seed?: number;
    maxCount?: number;
    minNormalY?: number;
    frontBiasZ?: number;
    patchThreshold?: number;
  } = {}
): SurfaceAnchor[] {
  const {
    seed = 701,
    maxCount = 260,
    minNormalY = 0.24,
    frontBiasZ = 0.2,
    patchThreshold = -0.02,
  } = options;

  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const normAttr = geo.attributes.normal as THREE.BufferAttribute;
  if (!posAttr || !normAttr) return [];

  const rand = createSeededRandom(seed);
  const candidates: SurfaceAnchor[] = [];
  const stride = Math.max(1, Math.floor(posAttr.count / 4500));

  for (let i = 0; i < posAttr.count; i += stride) {
    const ny = normAttr.getY(i);
    const nz = normAttr.getZ(i);
    const px = posAttr.getX(i);
    const py = posAttr.getY(i);
    const pz = posAttr.getZ(i);

    const facingScore = ny + Math.max(0, nz) * frontBiasZ;
    if (facingScore < minNormalY) continue;

    const colony = fbm3(px * 2.4, py * 2.4, pz * 2.4, 3, seed);
    if (colony < patchThreshold) continue;

    candidates.push({
      pos: new THREE.Vector3(px, py, pz),
      normal: new THREE.Vector3(normAttr.getX(i), ny, nz).normalize(),
      scale: 0.72 + rand() * 0.68,
    });
  }

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }

  return candidates.slice(0, maxCount);
}

export interface MaterialTuneOptions {
  colorHex?: string;
  alphaTest?: number;
  roughnessScale?: number;
  envMapIntensity?: number;
  emissiveHex?: string;
  emissiveIntensity?: number;
  normalScale?: number;
  aoMapIntensity?: number;
  doubleSided?: boolean;
}

/**
 * Clones and calibrates a loaded GLTF PBR material for realistic overcast/studio AgX rendering.
 */
export function cloneTunedMaterial(
  source: THREE.Material | THREE.Material[],
  options: MaterialTuneOptions = {}
): THREE.MeshStandardMaterial {
  const base = Array.isArray(source) ? source[0] : source;
  const mat =
    base instanceof THREE.MeshStandardMaterial
      ? base.clone()
      : new THREE.MeshStandardMaterial({ color: "#556840" });

  if (options.colorHex) {
    mat.color.set(options.colorHex);
  }
  if (typeof options.alphaTest === "number") {
    mat.alphaTest = options.alphaTest;
    mat.transparent = false;
    mat.depthWrite = true;
  }
  if (typeof options.roughnessScale === "number") {
    mat.roughness = THREE.MathUtils.clamp(mat.roughness * options.roughnessScale, 0.25, 1);
  }
  if (typeof options.envMapIntensity === "number") {
    mat.envMapIntensity = options.envMapIntensity;
  }
  if (options.emissiveHex && typeof options.emissiveIntensity === "number") {
    mat.emissive.set(options.emissiveHex);
    mat.emissiveIntensity = options.emissiveIntensity;
  }
  if (typeof options.normalScale === "number" && mat.normalMap) {
    mat.normalScale.set(options.normalScale, options.normalScale);
  }
  if (typeof options.aoMapIntensity === "number" && mat.aoMap) {
    mat.aoMapIntensity = options.aoMapIntensity;
  }
  if (options.doubleSided !== undefined) {
    mat.side = options.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
  }

  mat.needsUpdate = true;
  return mat;
}

/**
 * Soft feathered atmospheric mist sprite canvas texture.
 */
export function createMistTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size * 0.5,
      size * 0.5,
      size * 0.04,
      size * 0.5,
      size * 0.5,
      size * 0.5
    );
    grad.addColorStop(0, "rgba(232, 236, 230, 0.42)");
    grad.addColorStop(0.45, "rgba(218, 224, 217, 0.16)");
    grad.addColorStop(1, "rgba(218, 224, 217, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
