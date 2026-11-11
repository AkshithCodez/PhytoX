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

export interface BoulderOptions {
  seed?: number;
  segments?: number;
  scale?: [number, number, number];
  cragStrength?: number;
  fracturePlanes?: number;
  uvScale?: number;
  mossBias?: number;
}

export interface SculptedBoulderResult {
  geometry: THREE.BufferGeometry;
  mossAnchors: Array<{ pos: THREE.Vector3; normal: THREE.Vector3; scale: number }>;
}

/**
 * Generates an angular fractured sandstone boulder (no repeating sine ribs)
 * using spherized cube topology, tilted flat fracture cuts, FBM crag massing,
 * and crevice moss anchoring.
 */
export function createSculptedBoulder(
  radius: number,
  options: BoulderOptions = {}
): SculptedBoulderResult {
  const {
    seed = 7,
    segments = 32,
    scale = [1.18, 0.94, 1.04],
    cragStrength = 0.22,
    fracturePlanes = 5,
    uvScale = 2.0,
    mossBias = 0.2,
  } = options;

  const randPlane = createSeededRandom(seed * 131 + 19);
  const planes: Array<{ normal: THREE.Vector3; offset: number; strength: number }> = [];
  for (let p = 0; p < fracturePlanes; p++) {
    const n = new THREE.Vector3(
      randPlane() * 2 - 1,
      randPlane() * 2 - 1,
      randPlane() * 2 - 1
    ).normalize();
    planes.push({
      normal: n,
      offset: 0.58 + randPlane() * 0.28,
      strength: 0.16 + randPlane() * 0.14,
    });
  }

  const geo = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  const count = posAttr.count;
  const colors = new Float32Array(count * 3);

  const sandstone = new THREE.Color("#bfa983");
  const deepCrevice = new THREE.Color("#493d2d");
  const mossCrevice = new THREE.Color("#4c6f2c");
  const tmpColor = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    const x2 = v.x * v.x;
    const y2 = v.y * v.y;
    const z2 = v.z * v.z;
    const sx = v.x * Math.sqrt(Math.max(0, 1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3));
    const sy = v.y * Math.sqrt(Math.max(0, 1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3));
    const sz = v.z * Math.sqrt(Math.max(0, 1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3));

    const dir = new THREE.Vector3(sx, sy, sz).normalize();

    // Planar angular cliff bevels + broad geological massing (zero horizontal rings)
    let planeBevel = 0;
    for (let p = 0; p < planes.length; p++) {
      const d = dir.dot(planes[p].normal);
      if (d > planes[p].offset) {
        planeBevel -= (d - planes[p].offset) * planes[p].strength * 1.9;
      }
    }

    const macro = fbm3(dir.x * 1.15, dir.y * 1.15, dir.z * 1.15, 3, seed);
    const crags = (ridged3(dir.x * 1.65, dir.y * 1.55, dir.z * 1.65, 3, seed + 13) - 0.5) * cragStrength;
    const fine = fbm3(dir.x * 5.8, dir.y * 5.8, dir.z * 5.8, 2, seed + 71) * 0.045;

    const displacement = 1 + macro * 0.22 + crags + planeBevel + fine;
    const finalPos = new THREE.Vector3(
      dir.x * radius * scale[0] * displacement,
      dir.y * radius * scale[1] * displacement,
      dir.z * radius * scale[2] * displacement
    );

    posAttr.setXYZ(i, finalPos.x, finalPos.y, finalPos.z);
    uvAttr.setXY(i, uvAttr.getX(i) * uvScale, uvAttr.getY(i) * uvScale);

    const upwardness = THREE.MathUtils.clamp(dir.y * 0.72 + dir.z * 0.14 + mossBias, 0, 1);
    const cavity = THREE.MathUtils.clamp((crags * 2.5 + 0.5), 0, 1);
    tmpColor.copy(deepCrevice).lerp(sandstone, cavity * 0.78 + 0.22);
    const mossMask = fbm3(dir.x * 2.6 + 1.8, dir.y * 2.6, dir.z * 2.6, 3, seed + 99);
    const mossWeight = THREE.MathUtils.smoothstep(
      upwardness + mossMask * 0.32,
      0.34,
      0.72
    );
    tmpColor.lerp(mossCrevice, mossWeight * 0.62);

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const normAttr = geo.attributes.normal as THREE.BufferAttribute;
  const rand = createSeededRandom(seed * 97 + 11);
  const mossAnchors: Array<{ pos: THREE.Vector3; normal: THREE.Vector3; scale: number }> = [];

  for (let i = 0; i < count; i++) {
    const ny = normAttr.getY(i);
    const nz = normAttr.getZ(i);
    const px = posAttr.getX(i);
    const py = posAttr.getY(i);
    const pz = posAttr.getZ(i);

    const clusterNoise = fbm3(px * 1.35, py * 1.35, pz * 1.35, 3, seed + 211);
    const slopeScore = ny * 0.75 + Math.max(0, nz) * 0.18 + mossBias;
    if (slopeScore + clusterNoise * 0.35 > 0.38 && rand() < 0.36) {
      const normal = new THREE.Vector3(normAttr.getX(i), ny, nz).normalize();
      mossAnchors.push({
        pos: new THREE.Vector3(px, py, pz),
        normal,
        scale: 0.45 + rand() * 0.75,
      });
    }
  }

  return { geometry: geo, mossAnchors };
}

/**
 * Generates an organic multi-lobed 3D velvet moss cap dome to settle onto rocks.
 */
export function createMossCushionBlob(
  radius = 0.7,
  scale: [number, number, number] = [1.3, 0.55, 1.1],
  seed = 77
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(1, 1, 1, 18, 18, 18);
  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;

  for (let i = 0; i < posAttr.count; i++) {
    const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    const x2 = v.x * v.x;
    const y2 = v.y * v.y;
    const z2 = v.z * v.z;
    const sx = v.x * Math.sqrt(Math.max(0, 1 - y2 / 2 - z2 / 2 + (y2 * z2) / 3));
    const sy = v.y * Math.sqrt(Math.max(0, 1 - z2 / 2 - x2 / 2 + (z2 * x2) / 3));
    const sz = v.z * Math.sqrt(Math.max(0, 1 - x2 / 2 - y2 / 2 + (x2 * y2) / 3));
    const dir = new THREE.Vector3(sx, sy, sz).normalize();

    const cushionLobes = Math.abs(fbm3(dir.x * 2.6, dir.y * 2.6, dir.z * 2.6, 3, seed)) * 0.34;
    const disp = 0.88 + cushionLobes;
    posAttr.setXYZ(
      i,
      dir.x * radius * scale[0] * disp,
      dir.y * radius * scale[1] * disp,
      dir.z * radius * scale[2] * disp
    );
    uvAttr.setXY(i, uvAttr.getX(i) * 1.8, uvAttr.getY(i) * 1.8);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Contoured soil & rock terrain bed for Scene 3 and Scene 4.
 */
export function createTerrainGeometry(
  width = 28,
  depth = 18,
  segX = 96,
  segZ = 72,
  seed = 313
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  const colors = new Float32Array(posAttr.count * 3);

  const soilTone = new THREE.Color("#9e8c78");
  const deepLoam = new THREE.Color("#4f4135");
  const mossEdge = new THREE.Color("#4a6830");
  const c = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    const roll = fbm3(x * 0.18, 0, z * 0.18, 3, seed) * 0.5;
    const detail = ridged3(x * 0.65, 1.2, z * 0.65, 3, seed + 17) * 0.16;
    const ridgeRise = THREE.MathUtils.smoothstep(x, 1.5, 9.5) * 0.8;
    const horizonRoll = THREE.MathUtils.smoothstep(-z, 0.5, 6.5) * 0.32;

    const y = roll + detail + ridgeRise + horizonRoll;
    posAttr.setY(i, y);

    uvAttr.setXY(i, (x + width * 0.5) * 0.48, (z + depth * 0.5) * 0.48);

    const tintMix = THREE.MathUtils.clamp((y + 0.4) * 0.65, 0, 1);
    c.copy(deepLoam).lerp(soilTone, tintMix);
    if (x > 2.2) {
      c.lerp(mossEdge, THREE.MathUtils.smoothstep(x, 2.2, 7.0) * 0.4);
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
 * Undulating velvet cushion moss hummock for Scene 3 foreground & horizon ridges.
 */
export function createMossHummockGeometry(
  width = 2.8,
  depth = 2.1,
  height = 0.55,
  seed = 505
): { geometry: THREE.BufferGeometry; fuzzAnchors: Array<{ pos: THREE.Vector3; normal: THREE.Vector3; scale: number }> } {
  const geo = new THREE.PlaneGeometry(width, depth, 64, 52);
  geo.rotateX(-Math.PI / 2);

  const posAttr = geo.attributes.position as THREE.BufferAttribute;
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    const nx = x / (width * 0.5);
    const nz = z / (depth * 0.5);
    const radial = Math.max(0, 1 - (nx * nx + nz * nz * 0.92));
    const dome = Math.pow(radial, 0.66) * height;
    const lobes = Math.abs(fbm3(x * 1.45, 0, z * 1.45, 3, seed)) * 0.28 * radial;
    const micro = fbm3(x * 5.2, 0, z * 5.2, 2, seed + 19) * 0.04 * radial;

    posAttr.setY(i, dome + lobes + micro - 0.06);
    uvAttr.setXY(i, (x + width * 0.5) * 1.1, (z + depth * 0.5) * 1.1);
  }

  geo.computeVertexNormals();

  const normAttr = geo.attributes.normal as THREE.BufferAttribute;
  const rand = createSeededRandom(seed * 41);
  const fuzzAnchors: Array<{ pos: THREE.Vector3; normal: THREE.Vector3; scale: number }> = [];

  for (let i = 0; i < posAttr.count; i++) {
    const py = posAttr.getY(i);
    const ny = normAttr.getY(i);
    if (py > 0.03 && ny > 0.3 && rand() < 0.72) {
      fuzzAnchors.push({
        pos: new THREE.Vector3(posAttr.getX(i), py, posAttr.getZ(i)),
        normal: new THREE.Vector3(normAttr.getX(i), ny, normAttr.getZ(i)).normalize(),
        scale: 0.75 + rand() * 0.65,
      });
    }
  }

  return { geometry: geo, fuzzAnchors };
}

/**
 * Smooth multi-segment curved ovate botanical leaf blade with soft natural camber.
 */
export function createBotanicalLeafGeometry(
  length = 0.24,
  maxWidth = 0.072,
  arch = 0.055,
  crease = 0.011
): THREE.BufferGeometry {
  const segments = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * length;
    const zCurve = Math.sin(t * Math.PI * 0.8) * arch - t * t * arch * 0.58;
    // Ovate leaf silhouette: fuller mid-base tapering smoothly to an organic apex
    const widthProfile = Math.pow(Math.sin(Math.pow(t, 0.58) * Math.PI), 0.72) * maxWidth;
    const foldZ = crease * (1 - t);

    positions.push(-widthProfile, y, zCurve + foldZ);
    positions.push(0, y, zCurve);
    positions.push(widthProfile, y, zCurve + foldZ);

    uvs.push(0, t, 0.5, t, 1, t);
  }

  for (let i = 0; i < segments; i++) {
    const row = i * 3;
    const next = (i + 1) * 3;
    indices.push(row + 0, row + 1, next + 0);
    indices.push(row + 1, next + 1, next + 0);
    indices.push(row + 1, row + 2, next + 1);
    indices.push(row + 2, next + 2, next + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Ultra-fine velvety moss filament hair for Scene 3 velvet bryophyte cushions.
 */
export function createVelvetHairGeometry(length = 0.048, width = 0.0038): THREE.BufferGeometry {
  const segments = 3;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w = width * (1 - t * 0.85);
    const z = t * t * 0.008;
    positions.push(-w, t * length, z);
    positions.push(w, t * length, z);
  }
  for (let i = 0; i < segments; i++) {
    const r = i * 2;
    const n = (i + 1) * 2;
    indices.push(r, r + 1, n);
    indices.push(r + 1, n + 1, n);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Soft feathered mist sprite canvas texture.
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
    grad.addColorStop(0, "rgba(232, 236, 230, 0.45)");
    grad.addColorStop(0.45, "rgba(218, 224, 217, 0.18)");
    grad.addColorStop(1, "rgba(218, 224, 217, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
