"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  cloneTunedMaterial,
  createMistTexture,
  createMossHummockGeometry,
  createSeededRandom,
  createTerrainGeometry,
  extractMeshPart,
  getTerrainHeight,
  sampleRockMossAnchors,
  type SurfaceAnchor,
} from "./scene-helpers";

useGLTF.setDecoderPath("/draco/");

export interface EcoTechSceneProps {
  scrollProgressRef: MutableRefObject<number>;
  mousePosRef: MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
}

const SKY_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAGMENT_SHADER = `
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
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 darkVoid = vec3(0.066, 0.114, 0.075); // #111D13
    vec2 cloudUv = vUv * vec2(3.1, 2.0) + vec2(uTime * 0.006, 0.0);
    float clouds = fbm(cloudUv + fbm(cloudUv * 0.65) * 0.55);

    vec3 stormUpper = vec3(0.42, 0.45, 0.42);
    vec3 overcastMid = vec3(0.67, 0.70, 0.67);
    vec3 mistHorizon = vec3(0.84, 0.86, 0.84);

    float verticalGrad = smoothstep(0.14, 0.92, vUv.y);
    vec3 skyBase = mix(mistHorizon, stormUpper, verticalGrad);
    vec3 skyColor = mix(skyBase, overcastMid, clouds * 0.5);

    vec3 finalColor = mix(darkVoid, skyColor, smoothstep(0.0, 1.0, uMist));
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function SkyBackdrop({ mistRef }: { mistRef: MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERTEX_SHADER,
        fragmentShader: SKY_FRAGMENT_SHADER,
        uniforms: {
          uMist: { value: 0 },
          uTime: { value: 0 },
        },
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame(({ clock, camera }) => {
    material.uniforms.uMist.value = mistRef.current;
    material.uniforms.uTime.value = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.set(
        camera.position.x,
        camera.position.y - 0.5,
        camera.position.z - 22
      );
    }
  });

  return (
    <mesh ref={meshRef} material={material} position={[0, 0, -22]} renderOrder={-10}>
      <planeGeometry args={[84, 52]} />
    </mesh>
  );
}

interface MossBatchVariant {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

/**
 * Instanced photogrammetry bryophyte moss tufts seeded onto cushion mounds or rock crevices.
 */
function MossColonyInstanced({
  anchors,
  variants,
  baseScale = 2.4,
  yScaleRatio = 0.6,
  seed = 4409,
  maxInstances = 750,
  sink = 0.014,
  paletteHex = ["#d6e3be", "#c2d4a4", "#e5edd6", "#b2c693"],
}: {
  anchors: SurfaceAnchor[];
  variants: MossBatchVariant[];
  baseScale?: number;
  yScaleRatio?: number;
  seed?: number;
  maxInstances?: number;
  sink?: number;
  paletteHex?: string[];
}) {
  const count = Math.min(anchors.length, maxInstances);
  const inst0 = useRef<THREE.InstancedMesh>(null);
  const inst1 = useRef<THREE.InstancedMesh>(null);
  const inst2 = useRef<THREE.InstancedMesh>(null);

  const perBatch = useMemo(() => {
    const groups: SurfaceAnchor[][] = [[], [], []];
    for (let i = 0; i < count; i++) {
      groups[i % variants.length].push(anchors[i]);
    }
    return groups;
  }, [anchors, count, variants.length]);

  useEffect(() => {
    const refs = [inst0.current, inst1.current, inst2.current];
    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    const rand = createSeededRandom(seed);
    const colors = paletteHex.map((hex) => new THREE.Color(hex));

    perBatch.forEach((group, gIdx) => {
      const mesh = refs[gIdx];
      if (!mesh || group.length === 0) return;

      for (let i = 0; i < group.length; i++) {
        const a = group[i];
        dummy.position.copy(a.pos).addScaledVector(a.normal, -sink);
        q.setFromUnitVectors(up, a.normal);
        dummy.quaternion.copy(q);
        dummy.rotateY(rand() * Math.PI * 2);
        dummy.rotateX((rand() - 0.5) * 0.42);
        dummy.rotateZ((rand() - 0.5) * 0.36);
        const s = a.scale * baseScale * (0.78 + rand() * 0.52);
        dummy.scale.set(s * 1.15, s * yScaleRatio * (0.82 + rand() * 0.36), s * 1.15);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, colors[Math.floor(rand() * colors.length)]);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
  }, [perBatch, baseScale, yScaleRatio, seed, sink, paletteHex]);

  if (count === 0) return null;

  return (
    <>
      {variants.map((v, idx) => {
        const group = perBatch[idx];
        if (!group || group.length === 0) return null;
        const ref = idx === 0 ? inst0 : idx === 1 ? inst1 : inst2;
        return (
          <instancedMesh
            key={idx}
            ref={ref}
            args={[v.geometry, v.material, group.length]}
            receiveShadow
          />
        );
      })}
    </>
  );
}

/**
 * Photogrammetry evergreen bush cluster composed of multi-angled woody shrub_04 sprays.
 */
function PhotogrammetryShrubCluster({
  position,
  geometry,
  material,
  stemCount = 16,
  spread = 0.52,
  scaleRange = [1.55, 2.35],
  seed = 901,
}: {
  position: [number, number, number];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  stemCount?: number;
  spread?: number;
  scaleRange?: [number, number];
  seed?: number;
}) {
  const instRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = instRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const rand = createSeededRandom(seed);
    const shades = [
      new THREE.Color("#e8efe0"),
      new THREE.Color("#d5e2ca"),
      new THREE.Color("#f0f5ea"),
      new THREE.Color("#c7d8bb"),
    ];

    for (let i = 0; i < stemCount; i++) {
      const yaw = (i / stemCount) * Math.PI * 2 + (rand() - 0.5) * 0.35;
      const radial = rand() * spread;
      dummy.position.set(
        Math.cos(yaw) * radial,
        (rand() - 0.3) * 0.14,
        Math.sin(yaw) * radial * 0.72
      );
      // shrub_04 twigs grow obliquely along -X/+Y; tilt upward into natural bushy fan
      dummy.rotation.set(
        (rand() - 0.5) * 0.45,
        yaw,
        -0.72 + (rand() - 0.5) * 0.38
      );
      const s = THREE.MathUtils.lerp(scaleRange[0], scaleRange[1], rand());
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, shades[Math.floor(rand() * shades.length)]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [stemCount, spread, scaleRange, seed]);

  return (
    <group position={position}>
      <instancedMesh ref={instRef} args={[geometry, material, stemCount]} castShadow receiveShadow />
    </group>
  );
}

/**
 * Multi-rosette woodland fern clump using alpha-masked photogrammetry fern_02 scans.
 */
function PhotogrammetryFernCluster({
  position,
  parts,
  material,
  scale = 1,
  rotationY = 0.25,
}: {
  position: [number, number, number];
  parts: {
    a: THREE.BufferGeometry;
    b: THREE.BufferGeometry;
    c: THREE.BufferGeometry;
    d: THREE.BufferGeometry;
  };
  material: THREE.Material;
  scale?: number | [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh geometry={parts.b} material={material} position={[0, 0, 0]} scale={1.06} castShadow receiveShadow />
      <mesh
        geometry={parts.c}
        material={material}
        position={[0.14, -0.01, -0.1]}
        rotation={[0.05, 1.35, -0.04]}
        scale={0.94}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={parts.a}
        material={material}
        position={[-0.16, -0.01, 0.14]}
        rotation={[-0.06, -1.1, 0.04]}
        scale={1.08}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={parts.d}
        material={material}
        position={[0.12, 0.0, 0.2]}
        rotation={[0.04, 2.3, 0.03]}
        scale={0.95}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/**
 * Scene 4 Weather & Agricultural Micro-Climate Observation Mast.
 */
function ObservationMast({ position }: { position: [number, number, number] }) {
  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c8ceca",
        metalness: 0.78,
        roughness: 0.28,
        envMapIntensity: 1.25,
      }),
    []
  );
  const darkMetalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2b302c",
        metalness: 0.58,
        roughness: 0.42,
        envMapIntensity: 0.9,
      }),
    []
  );
  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ecefed",
        metalness: 0.08,
        roughness: 0.34,
        envMapIntensity: 0.9,
      }),
    []
  );

  useEffect(() => {
    return () => {
      metalMat.dispose();
      darkMetalMat.dispose();
      plateMat.dispose();
    };
  }, [metalMat, darkMetalMat, plateMat]);

  const louverOffsets = useMemo(() => Array.from({ length: 8 }, (_, i) => i * 0.044), []);

  const sensors = [
    { x: -0.66, armX: -0.45, y: 2.66, scale: 1.0 },
    { x: -0.34, armX: -0.18, y: 2.48, scale: 0.82 },
  ];

  return (
    <group position={position}>
      {/* Main Vertical Anodized Mast Pole */}
      <mesh position={[0, 1.35, 0]} material={metalMat} castShadow>
        <cylinderGeometry args={[0.042, 0.048, 3.8, 18]} />
      </mesh>

      {/* Top Whip Antenna & Cap */}
      <mesh position={[0, 3.85, 0]} material={metalMat}>
        <cylinderGeometry args={[0.011, 0.014, 1.3, 12]} />
      </mesh>
      <mesh position={[0, 3.24, 0]} material={darkMetalMat}>
        <cylinderGeometry args={[0.048, 0.048, 0.05, 16]} />
      </mesh>

      {/* Upper & Center Collar Clamps */}
      <mesh position={[0, 2.72, 0]} material={metalMat}>
        <cylinderGeometry args={[0.068, 0.068, 0.08, 18]} />
      </mesh>
      <mesh position={[0, 2.02, 0]} material={metalMat}>
        <cylinderGeometry args={[0.075, 0.075, 0.16, 18]} />
      </mesh>

      {/* Horizontal Cross-Arm Tube */}
      <mesh
        position={[0.22, 2.02, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={metalMat}
        castShadow
      >
        <cylinderGeometry args={[0.032, 0.032, 1.85, 16]} />
      </mesh>

      {/* Right Pyranometer Sensor Boom Tip */}
      <mesh position={[1.18, 2.02, 0]} rotation={[0, 0, Math.PI / 2]} material={plateMat}>
        <cylinderGeometry args={[0.022, 0.03, 0.24, 14]} />
      </mesh>
      <mesh position={[1.29, 2.04, 0]} material={darkMetalMat}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 14]} />
      </mesh>

      {/* Twin Louvered Radiation Shields with Bolted Struts */}
      {sensors.map((sensor, sIdx) => {
        const dx = sensor.x - sensor.armX;
        const dy = sensor.y - 2.02;
        const len = Math.hypot(dx, dy);
        const angleZ = -Math.atan2(dx, dy);
        const midX = (sensor.armX + sensor.x) * 0.5;
        const midY = (2.02 + sensor.y) * 0.5;

        return (
          <group key={sIdx}>
            <mesh
              position={[sensor.armX, 2.02, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={darkMetalMat}
            >
              <cylinderGeometry args={[0.044, 0.044, 0.06, 14]} />
            </mesh>
            <mesh position={[midX, midY, 0]} rotation={[0, 0, angleZ]} material={metalMat}>
              <boxGeometry args={[0.036, len, 0.055]} />
            </mesh>
            <group position={[sensor.x, sensor.y, 0]} scale={sensor.scale}>
              <mesh position={[0, 0.16, 0]} material={darkMetalMat}>
                <cylinderGeometry args={[0.105, 0.105, 0.34, 20]} />
              </mesh>
              <mesh position={[0, 0.35, 0]} material={plateMat} castShadow>
                <cylinderGeometry args={[0.11, 0.155, 0.04, 24]} />
              </mesh>
              {louverOffsets.map((lDy, lIdx) => (
                <mesh key={lIdx} position={[0, lDy, 0]} material={plateMat} castShadow>
                  <cylinderGeometry args={[0.155, 0.142, 0.024, 24]} />
                </mesh>
              ))}
            </group>
          </group>
        );
      })}

      {/* Lower Guy-Wire Collar & Anchored Tension Cables */}
      <mesh position={[0, 1.05, 0]} material={metalMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.07, 16]} />
      </mesh>
      {[
        { rotY: 0.25, tilt: 0.26 },
        { rotY: 2.3, tilt: 0.28 },
        { rotY: -1.9, tilt: 0.25 },
      ].map((wire, wIdx) => (
        <group key={wIdx} position={[0, 1.05, 0]} rotation={[0, wire.rotY, 0]}>
          <mesh position={[0.18, -0.62, 0]} rotation={[0, 0, wire.tilt]} material={metalMat}>
            <cylinderGeometry args={[0.005, 0.005, 1.35, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Full Photorealistic 3D World rendered inside <Canvas>. Zero React setState inside useFrame.
 */
function EcoWorld({ scrollProgressRef, mousePosRef, reducedMotion }: EcoTechSceneProps) {
  const { camera, scene } = useThree();
  const mistRef = useRef(0);
  const smoothedScroll = useRef(0);
  const smoothedMouse = useRef({ x: 0, y: 0 });
  const lookTarget = useRef(new THREE.Vector3(0.14, 0.02, 0));

  const dioramaAGroupRef = useRef<THREE.Group>(null);
  const mainRockRef = useRef<THREE.Group>(null);
  const sat1Ref = useRef<THREE.Group>(null);
  const sat2Ref = useRef<THREE.Group>(null);
  const sat3Ref = useRef<THREE.Mesh>(null);
  const dioramaBGroupRef = useRef<THREE.Group>(null);
  const mistSpritesRef = useRef<THREE.Group>(null);

  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const backLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const keyTarget = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    scene.add(keyTarget);
    if (keyLightRef.current) {
      keyLightRef.current.target = keyTarget;
    }
    return () => {
      scene.remove(keyTarget);
    };
  }, [scene, keyTarget]);

  // Load 6 compressed CC0 photogrammetry GLBs
  const boulderGltf = useGLTF("/models/boulder_01.glb");
  const mossRocks1Gltf = useGLTF("/models/rock_moss_set_01.glb");
  const mossRocks2Gltf = useGLTF("/models/rock_moss_set_02.glb");
  const fernGltf = useGLTF("/models/fern_02.glb");
  const mossGltf = useGLTF("/models/moss_01.glb");
  const shrubGltf = useGLTF("/models/shrub_04.glb");

  // Load full PBR texture sets (Diffuse + OpenGL Normal + Roughness + AO)
  const [
    groundCol,
    groundNor,
    groundRough,
    groundAo,
    mossyCol,
    mossyNor,
    mossyRough,
    mossyAo,
  ] = useTexture([
    "/textures/rocks_ground_02/rocks_ground_02_col_1k.jpg",
    "/textures/rocks_ground_02/rocks_ground_02_nor_gl_1k.jpg",
    "/textures/rocks_ground_02/rocks_ground_02_rough_1k.jpg",
    "/textures/rocks_ground_02/rocks_ground_02_ao_1k.jpg",
    "/images/moss-albedo.jpg",
    "/textures/mossy_rock/mossy_rock_nor_gl_1k.jpg",
    "/textures/mossy_rock/mossy_rock_rough_1k.jpg",
    "/textures/mossy_rock/mossy_rock_ao_1k.jpg",
  ]);

  useEffect(() => {
    [groundCol, mossyCol].forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
    });
    [
      groundCol,
      groundNor,
      groundRough,
      groundAo,
      mossyCol,
      mossyNor,
      mossyRough,
      mossyAo,
    ].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.channel = 0;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
    });
    [mossyCol, mossyNor, mossyRough, mossyAo].forEach((tex) => {
      tex.repeat.set(2.2, 2.2);
      tex.needsUpdate = true;
    });
  }, [groundCol, groundNor, groundRough, groundAo, mossyCol, mossyNor, mossyRough, mossyAo]);

  // Extract centered/grounded photogrammetry geometries + calibrate materials
  const sceneAssets = useMemo(() => {
    const boulderCore = extractMeshPart(boulderGltf.scene, "boulder_01", "center");

    const r1_01 = extractMeshPart(mossRocks1Gltf.scene, "rock_moss_set_01_rock01", "center");
    const r1_02 = extractMeshPart(mossRocks1Gltf.scene, "rock_moss_set_01_rock02", "center");
    const r1_03 = extractMeshPart(mossRocks1Gltf.scene, "rock_moss_set_01_rock03", "center");
    const r1_04 = extractMeshPart(mossRocks1Gltf.scene, "rock_moss_set_01_rock04", "center");
    const r1_05 = extractMeshPart(mossRocks1Gltf.scene, "rock_moss_set_01_rock05", "center");

    const r2_07 = extractMeshPart(mossRocks2Gltf.scene, "rock_moss_set_02_rock07", "center");
    const r2_08 = extractMeshPart(mossRocks2Gltf.scene, "rock_moss_set_02_rock08", "center");
    const r2_09 = extractMeshPart(mossRocks2Gltf.scene, "rock_moss_set_02_rock09", "center");
    const r2_12 = extractMeshPart(mossRocks2Gltf.scene, "rock_moss_set_02_rock12", "base");

    const fernA = extractMeshPart(fernGltf.scene, "fern_02_a", "base");
    const fernB = extractMeshPart(fernGltf.scene, "fern_02_b", "base");
    const fernC = extractMeshPart(fernGltf.scene, "fern_02_c", "base");
    const fernD = extractMeshPart(fernGltf.scene, "fern_02_d", "base");

    const mossA = extractMeshPart(mossGltf.scene, "moss_01_a_LOD0", "base");
    const mossB = extractMeshPart(mossGltf.scene, "moss_01_b_LOD0", "base");
    const mossI = extractMeshPart(mossGltf.scene, "moss_01_i_LOD0", "base");

    const shrubPart = extractMeshPart(shrubGltf.scene, "shrub_04", "base");

    // Sample organic crevice moss anchors directly on hero rock core + upper mossy cap
    const heroAnchorsCore = sampleRockMossAnchors(boulderCore.geometry, {
      seed: 109,
      maxCount: 340,
      minNormalY: 0.16,
      frontBiasZ: 0.28,
      patchThreshold: -0.06,
    });
    const heroAnchorsCap = sampleRockMossAnchors(r1_01.geometry, {
      seed: 211,
      maxCount: 240,
      minNormalY: 0.22,
      frontBiasZ: 0.22,
      patchThreshold: -0.1,
    });
    const sat2Anchors = sampleRockMossAnchors(r2_09.geometry, {
      seed: 317,
      maxCount: 110,
      minNormalY: 0.36,
      frontBiasZ: 0.12,
      patchThreshold: -0.02,
    });

    // Diorama B terrain & mossy hummock cushions
    const terrainGeo = createTerrainGeometry(30, 20, 120, 84, 313);
    const frontMoss = createMossHummockGeometry(3.2, 2.2, 0.56, 505);
    const horizonMoss1 = createMossHummockGeometry(3.4, 1.6, 0.38, 607);
    const horizonMoss2 = createMossHummockGeometry(2.6, 1.4, 0.34, 709);

    // Calibrated PBR Materials
    const boulderMat = cloneTunedMaterial(boulderCore.material, {
      colorHex: "#9e9882",
      roughnessScale: 0.96,
      envMapIntensity: 0.72,
      normalScale: 1.55,
      aoMapIntensity: 1.25,
      doubleSided: false,
    });
    const mossRock1Mat = cloneTunedMaterial(r1_01.material, {
      colorHex: "#a8aa90",
      roughnessScale: 0.94,
      envMapIntensity: 0.72,
      normalScale: 1.45,
      aoMapIntensity: 1.15,
      doubleSided: false,
    });
    const mossRock2Mat = cloneTunedMaterial(r2_07.material, {
      colorHex: "#a3a18f",
      roughnessScale: 0.95,
      envMapIntensity: 0.7,
      normalScale: 1.35,
      aoMapIntensity: 1.15,
      doubleSided: false,
    });

    const fernMat = cloneTunedMaterial(fernB.material, {
      colorHex: "#b2d178",
      alphaTest: 0.22,
      roughnessScale: 0.78,
      envMapIntensity: 0.95,
      emissiveHex: "#1c360b",
      emissiveIntensity: 0.2,
      normalScale: 1.15,
      aoMapIntensity: 0.75,
      doubleSided: true,
    });

    const mossClumpMat = cloneTunedMaterial(mossA.material, {
      colorHex: "#aed16a",
      alphaTest: 0.16,
      roughnessScale: 0.85,
      envMapIntensity: 0.88,
      emissiveHex: "#1e3a0d",
      emissiveIntensity: 0.22,
      normalScale: 1.2,
      aoMapIntensity: 0.78,
      doubleSided: true,
    });

    const shrubMat = cloneTunedMaterial(shrubPart.material, {
      colorHex: "#dce8cc",
      alphaTest: 0.32,
      roughnessScale: 0.8,
      envMapIntensity: 0.95,
      emissiveHex: "#162b0b",
      emissiveIntensity: 0.14,
      normalScale: 1.15,
      aoMapIntensity: 0.8,
      doubleSided: true,
    });

    const terrainMat = new THREE.MeshStandardMaterial({
      map: groundCol,
      normalMap: groundNor,
      normalScale: new THREE.Vector2(1.22, 1.22),
      roughnessMap: groundRough,
      aoMap: groundAo,
      aoMapIntensity: 0.82,
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.02,
      envMapIntensity: 0.56,
    });

    const hummockBaseMat = new THREE.MeshStandardMaterial({
      map: mossyCol,
      normalMap: mossyNor,
      normalScale: new THREE.Vector2(1.3, 1.3),
      roughnessMap: mossyRough,
      aoMap: mossyAo,
      aoMapIntensity: 0.88,
      color: "#7ea346",
      roughness: 0.9,
      metalness: 0.02,
      envMapIntensity: 0.72,
    });

    const mistTex = createMistTexture();
    const mistSpriteMat = new THREE.SpriteMaterial({
      map: mistTex,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });

    return {
      boulderCore,
      r1_01,
      r1_02,
      r1_03,
      r1_04,
      r1_05,
      r2_07,
      r2_08,
      r2_09,
      r2_12,
      fernParts: {
        a: fernA.geometry,
        b: fernB.geometry,
        c: fernC.geometry,
        d: fernD.geometry,
      },
      mossVariants: [
        { geometry: mossA.geometry, material: mossClumpMat },
        { geometry: mossB.geometry, material: mossClumpMat },
        { geometry: mossI.geometry, material: mossClumpMat },
      ] as MossBatchVariant[],
      shrubGeo: shrubPart.geometry,
      heroAnchorsCore,
      heroAnchorsCap,
      sat2Anchors,
      terrainGeo,
      frontMoss,
      horizonMoss1,
      horizonMoss2,
      boulderMat,
      mossRock1Mat,
      mossRock2Mat,
      fernMat,
      mossClumpMat,
      shrubMat,
      terrainMat,
      hummockBaseMat,
      mistTex,
      mistSpriteMat,
    };
  }, [
    boulderGltf,
    mossRocks1Gltf,
    mossRocks2Gltf,
    fernGltf,
    mossGltf,
    shrubGltf,
    groundCol,
    groundNor,
    groundRough,
    groundAo,
    mossyCol,
    mossyNor,
    mossyRough,
    mossyAo,
  ]);

  useEffect(() => {
    return () => {
      sceneAssets.boulderCore.geometry.dispose();
      sceneAssets.r1_01.geometry.dispose();
      sceneAssets.r1_02.geometry.dispose();
      sceneAssets.r1_03.geometry.dispose();
      sceneAssets.r1_04.geometry.dispose();
      sceneAssets.r1_05.geometry.dispose();
      sceneAssets.r2_07.geometry.dispose();
      sceneAssets.r2_08.geometry.dispose();
      sceneAssets.r2_09.geometry.dispose();
      sceneAssets.r2_12.geometry.dispose();
      sceneAssets.fernParts.a.dispose();
      sceneAssets.fernParts.b.dispose();
      sceneAssets.fernParts.c.dispose();
      sceneAssets.fernParts.d.dispose();
      sceneAssets.mossVariants.forEach((v) => v.geometry.dispose());
      sceneAssets.shrubGeo.dispose();
      sceneAssets.terrainGeo.dispose();
      sceneAssets.frontMoss.geometry.dispose();
      sceneAssets.horizonMoss1.geometry.dispose();
      sceneAssets.horizonMoss2.geometry.dispose();
      sceneAssets.mistTex.dispose();

      sceneAssets.boulderMat.dispose();
      sceneAssets.mossRock1Mat.dispose();
      sceneAssets.mossRock2Mat.dispose();
      sceneAssets.fernMat.dispose();
      sceneAssets.mossClumpMat.dispose();
      sceneAssets.shrubMat.dispose();
      sceneAssets.terrainMat.dispose();
      sceneAssets.hummockBaseMat.dispose();
      sceneAssets.mistSpriteMat.dispose();
    };
  }, [sceneAssets]);

  // Scatter photogrammetry scree stones embedded naturally into Scene 3 soil terrain
  const stoneInstRef = useRef<THREE.InstancedMesh>(null);
  const stoneCount = 72;

  useEffect(() => {
    const sMesh = stoneInstRef.current;
    if (!sMesh) return;
    const dummy = new THREE.Object3D();
    const rand = createSeededRandom(301);
    const tints = [
      new THREE.Color("#dedad0"),
      new THREE.Color("#c8c2b6"),
      new THREE.Color("#b5ae9f"),
      new THREE.Color("#e8e4da"),
    ];
    for (let i = 0; i < stoneCount; i++) {
      const px = -2.4 + rand() * 8.2;
      const pz = -2.8 + rand() * 5.0;
      const groundY = getTerrainHeight(px, pz);
      dummy.position.set(px, groundY - 0.03, pz);
      dummy.rotation.set((rand() - 0.5) * 0.4, rand() * Math.PI * 2, (rand() - 0.5) * 0.4);
      const s = 0.065 + rand() * 0.16;
      dummy.scale.set(s, s * (0.65 + rand() * 0.45), s);
      dummy.updateMatrix();
      sMesh.setMatrixAt(i, dummy.matrix);
      sMesh.setColorAt(i, tints[Math.floor(rand() * tints.length)]);
    }
    sMesh.instanceMatrix.needsUpdate = true;
    if (sMesh.instanceColor) sMesh.instanceColor.needsUpdate = true;
  }, []);

  const tmpVoidFog = useMemo(() => new THREE.Color("#111d13"), []);
  const tmpMistFog = useMemo(() => new THREE.Color("#c4cac3"), []);
  const tmpCurFog = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.14);
    const time = clock.getElapsedTime();
    const targetP = scrollProgressRef.current;

    const jumpDelta = Math.abs(targetP - smoothedScroll.current);
    smoothedScroll.current =
      reducedMotion || jumpDelta > 0.35
        ? targetP
        : THREE.MathUtils.lerp(smoothedScroll.current, targetP, Math.min(1, dt * 11));
    const p = smoothedScroll.current;

    const targetMX = reducedMotion ? 0 : mousePosRef.current.x;
    const targetMY = reducedMotion ? 0 : mousePosRef.current.y;
    smoothedMouse.current.x = THREE.MathUtils.lerp(
      smoothedMouse.current.x,
      targetMX,
      Math.min(1, dt * 5)
    );
    smoothedMouse.current.y = THREE.MathUtils.lerp(
      smoothedMouse.current.y,
      targetMY,
      Math.min(1, dt * 5)
    );
    const mx = smoothedMouse.current.x;
    const my = smoothedMouse.current.y;

    const portraitBoost =
      camera instanceof THREE.PerspectiveCamera && camera.aspect < 1
        ? (1 - camera.aspect) * 3.15
        : 0;

    // -------------------------------------------------------------------------
    // Mist Atmosphere & HDRI Environment Intensity Blend
    // -------------------------------------------------------------------------
    const mistBlend = THREE.MathUtils.smoothstep(p, 0.28, 0.41);
    mistRef.current = mistBlend;
    scene.environmentIntensity = THREE.MathUtils.lerp(0.38, 0.96, mistBlend);

    if (scene.fog instanceof THREE.FogExp2) {
      tmpCurFog.copy(tmpVoidFog).lerp(tmpMistFog, mistBlend);
      scene.fog.color.copy(tmpCurFog);
      scene.fog.density = THREE.MathUtils.lerp(0.028, 0.044, mistBlend);
    }

    // Reposition directional shadow frustum cleanly between Diorama A and Diorama B
    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.lerp(2.75, 1.85, mistBlend);
      if (mistBlend < 0.45) {
        keyTarget.position.set(0.25, 0.0, 0.0);
        keyLightRef.current.position.set(4.5, 5.5, 4.8);
      } else {
        keyTarget.position.set(2.4, -8.5, 0.0);
        keyLightRef.current.position.set(4.5, 0.5, 3.8);
      }
      keyTarget.updateMatrixWorld();
    }
    if (backLightRef.current) {
      backLightRef.current.intensity = THREE.MathUtils.lerp(0.85, 1.9, mistBlend);
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.26, 0.86, mistBlend);
    }

    // -------------------------------------------------------------------------
    // Diorama A (Hero 0..0.14 -> Vision 0.18..0.28 -> Plunge 0.28..0.44)
    // -------------------------------------------------------------------------
    if (dioramaAGroupRef.current) {
      dioramaAGroupRef.current.visible = p < 0.46;
    }

    if (mainRockRef.current && dioramaAGroupRef.current?.visible) {
      const visionT = THREE.MathUtils.smoothstep(p, 0.03, 0.19);
      const plungeT = THREE.MathUtils.smoothstep(p, 0.28, 0.44);

      const idleFloat = reducedMotion ? 0 : Math.sin(time * 0.65) * 0.04;
      const idleRot = reducedMotion ? 0 : Math.sin(time * 0.25) * 0.042;

      mainRockRef.current.position.set(
        THREE.MathUtils.lerp(0.32, 0.0, visionT),
        THREE.MathUtils.lerp(-0.04, 0.02, visionT) + plungeT * 4.5 + idleFloat,
        THREE.MathUtils.lerp(0.0, 0.25, visionT) - plungeT * 1.4
      );
      mainRockRef.current.rotation.set(
        0.12 - visionT * 0.06,
        -0.18 + visionT * 0.36 + idleRot,
        -0.05 + visionT * 0.05
      );
      const baseScale = THREE.MathUtils.lerp(1.0, 1.14, visionT) * (1 - plungeT * 0.2);
      mainRockRef.current.scale.setScalar(baseScale);

      if (sat1Ref.current) {
        sat1Ref.current.position.set(
          -2.58 - visionT * 3.1,
          -0.78 - visionT * 1.1 + idleFloat * 1.3,
          0.55
        );
        sat1Ref.current.rotation.y = 0.5 + time * (reducedMotion ? 0 : 0.07);
        sat1Ref.current.scale.setScalar(Math.max(0.001, 1 - visionT * 0.45));
      }
      if (sat2Ref.current) {
        sat2Ref.current.position.set(
          2.68 + visionT * 3.1,
          -1.02 - visionT * 1.0 - idleFloat,
          0.42
        );
        sat2Ref.current.rotation.y = -0.7 - time * (reducedMotion ? 0 : 0.05);
        sat2Ref.current.scale.setScalar(Math.max(0.001, 1 - visionT * 0.45));
      }
      if (sat3Ref.current) {
        sat3Ref.current.position.set(
          2.1 + visionT * 2.5,
          1.38 + visionT * 1.8 + idleFloat,
          -1.1
        );
        sat3Ref.current.rotation.y = time * (reducedMotion ? 0 : 0.08);
        sat3Ref.current.scale.setScalar(Math.max(0.001, 1 - visionT * 0.6));
      }
    }

    // -------------------------------------------------------------------------
    // Diorama B Visibility + Mist Drift (Scenes 3 -> 5)
    // -------------------------------------------------------------------------
    if (dioramaBGroupRef.current) {
      dioramaBGroupRef.current.visible = p > 0.26 && p < 0.98;
    }
    if (mistSpritesRef.current && dioramaBGroupRef.current?.visible) {
      mistSpritesRef.current.children.forEach((child, idx) => {
        if (!reducedMotion) {
          child.position.x =
            (idx % 3 === 0 ? -0.9 : idx === 1 ? 1.5 : 5.1) +
            Math.sin(time * 0.22 + idx) * 0.55;
        }
      });
    }

    // -------------------------------------------------------------------------
    // Camera Flight Path Matched to Runway Anchors (0..1 = 0..460vh)
    // -------------------------------------------------------------------------
    let camX = 0;
    let camY = 0.06;
    let camZ = 6.15 + portraitBoost;
    let lookX = 0.14;
    let lookY = 0.02;
    let lookZ = 0;

    if (p < 0.28) {
      const t = THREE.MathUtils.smoothstep(p, 0.0, 0.22);
      camX = 0.0;
      camY = THREE.MathUtils.lerp(0.06, 0.04, t);
      camZ = THREE.MathUtils.lerp(6.15, 5.45, t) + portraitBoost;
      lookX = THREE.MathUtils.lerp(0.14, 0.0, t);
      lookY = 0.02;
      lookZ = 0;
    } else if (p < 0.44) {
      const t = THREE.MathUtils.smoothstep(p, 0.28, 0.44);
      camX = THREE.MathUtils.lerp(0.0, -0.08, t);
      camY = THREE.MathUtils.lerp(0.04, -8.16, t);
      camZ = THREE.MathUtils.lerp(5.45, 3.22 + portraitBoost * 0.85, t);
      lookX = THREE.MathUtils.lerp(0.0, 0.16, t);
      lookY = THREE.MathUtils.lerp(0.02, -8.18, t);
      lookZ = THREE.MathUtils.lerp(0.0, -0.15, t);
    } else if (p < 0.66) {
      const panT = THREE.MathUtils.smoothstep(p, 0.56, 0.66);
      camX = THREE.MathUtils.lerp(-0.08, 5.1, panT);
      camY = THREE.MathUtils.lerp(-8.16, -6.92, panT);
      camZ = THREE.MathUtils.lerp(3.22 + portraitBoost * 0.85, 3.88 + portraitBoost * 0.9, panT);
      lookX = THREE.MathUtils.lerp(0.16, 5.18, panT);
      lookY = THREE.MathUtils.lerp(-8.18, -6.82, panT);
      lookZ = THREE.MathUtils.lerp(-0.15, 0.0, panT);
    } else {
      const endT = THREE.MathUtils.smoothstep(p, 0.78, 0.94);
      camX = THREE.MathUtils.lerp(5.1, 5.15, endT);
      camY = THREE.MathUtils.lerp(-6.92, -6.62, endT);
      camZ = 3.88 + portraitBoost * 0.9;
      lookX = 5.18;
      lookY = THREE.MathUtils.lerp(-6.82, -6.46, endT);
      lookZ = 0.0;
    }

    camera.position.set(camX + mx * 0.22, camY - my * 0.14, camZ);
    lookTarget.current.set(lookX, lookY, lookZ);
    camera.lookAt(lookTarget.current);
  });

  // Ground-anchored Diorama B elevations
  const heroFernY = getTerrainHeight(-0.98, 1.38) - 0.03;
  const bgFernY = getTerrainHeight(-1.88, -0.58) - 0.02;
  const frontMossY = getTerrainHeight(1.18, 1.48) - 0.04;
  const horizonMoss1Y = getTerrainHeight(1.75, -1.8) - 0.03;
  const horizonMoss2Y = getTerrainHeight(3.1, -2.2) - 0.03;
  const mastBaseY = getTerrainHeight(5.2, 0.12) + 0.02;

  return (
    <>
      <fogExp2 attach="fog" args={["#111d13", 0.028]} />

      {/* Natural Overcast IBL HDRI for photorealistic rock, moss, leaf, and aluminum reflections */}
      <Environment files="/hdri/belfast_open_field_1k.hdr" background={false} />

      <hemisphereLight ref={hemiLightRef} args={["#e4ebe3", "#243324", 0.45]} />
      <directionalLight
        ref={keyLightRef}
        position={[4.5, 5.5, 4.8]}
        intensity={2.45}
        color="#fff6e6"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0005}
        shadow-camera-near={0.5}
        shadow-camera-far={24}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <directionalLight
        ref={backLightRef}
        position={[-4.5, 3.0, -5.0]}
        intensity={0.95}
        color="#d8e6ce"
      />
      <directionalLight position={[0, -4.0, 2.5]} intensity={0.35} color="#345038" />

      <SkyBackdrop mistRef={mistRef} />

      {/* ===================================================================== */}
      {/* DIORAMA A: SCENE 1 HERO & SCENE 2 VISION PHOTOGRAMMETRY BOULDERS      */}
      {/* ===================================================================== */}
      <group ref={dioramaAGroupRef}>
        <group ref={mainRockRef} position={[0.32, -0.04, 0]}>
          {/* Fractured eroded photogrammetry crag core */}
          <group rotation={[0.18, 0.56, -0.14]} scale={[2.02, 1.92, 1.62]}>
            <mesh
              geometry={sceneAssets.boulderCore.geometry}
              material={sceneAssets.boulderMat}
              castShadow
              receiveShadow
            />
            <MossColonyInstanced
              anchors={sceneAssets.heroAnchorsCore}
              variants={sceneAssets.mossVariants}
              baseScale={2.2}
              yScaleRatio={0.68}
              seed={4409}
              maxInstances={220}
              sink={0.01}
              paletteHex={["#d8eba8", "#c2de8a", "#e6f2c2", "#a8c96e"]}
            />
          </group>

          {/* Upper-back mossy rock shelf interlocking over rear ridge */}
          <group position={[-0.08, 0.6, -0.16]} rotation={[0.2, -0.45, -0.15]} scale={[0.7, 0.64, 0.58]}>
            <mesh
              geometry={sceneAssets.r1_01.geometry}
              material={sceneAssets.mossRock1Mat}
              castShadow
              receiveShadow
            />
            <MossColonyInstanced
              anchors={sceneAssets.heroAnchorsCap}
              variants={sceneAssets.mossVariants}
              baseScale={3.5}
              yScaleRatio={0.68}
              seed={5113}
              maxInstances={160}
              sink={0.015}
              paletteHex={["#d8eba8", "#c2de8a", "#e6f2c2", "#a8c96e"]}
            />
          </group>

          {/* Right flank outcrop */}
          <mesh
            geometry={sceneAssets.r1_03.geometry}
            material={sceneAssets.mossRock1Mat}
            position={[0.64, -0.12, -0.14]}
            rotation={[0.35, 0.78, -0.45]}
            scale={[0.58, 0.54, 0.58]}
            castShadow
            receiveShadow
          />

          {/* Lower front dark mineral stratum */}
          <mesh
            geometry={sceneAssets.r2_07.geometry}
            material={sceneAssets.mossRock2Mat}
            position={[-0.36, -0.4, 0.26]}
            rotation={[-0.25, 0.42, 0.18]}
            scale={[0.52, 0.48, 0.5]}
            castShadow
            receiveShadow
          />

          {/* Lush photogrammetry fern rosettes tucked naturally inside hero rock crevices */}
          <mesh
            geometry={sceneAssets.fernParts.b}
            material={sceneAssets.fernMat}
            position={[0.42, -0.22, 0.84]}
            rotation={[0.5, 0.25, -0.28]}
            scale={0.78}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={sceneAssets.fernParts.a}
            material={sceneAssets.fernMat}
            position={[-0.26, 0.78, 0.22]}
            rotation={[0.16, -0.6, 0.22]}
            scale={0.72}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={sceneAssets.fernParts.c}
            material={sceneAssets.fernMat}
            position={[0.38, 0.76, 0.04]}
            rotation={[0.2, 0.85, -0.28]}
            scale={0.68}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={sceneAssets.fernParts.d}
            material={sceneAssets.fernMat}
            position={[-0.65, 0.42, 0.35]}
            rotation={[0.32, -1.1, 0.36]}
            scale={0.62}
            castShadow
            receiveShadow
          />
        </group>

        {/* Satellite Rock 1: Eroded Mossy Sandstone Bottom-Left */}
        <group ref={sat1Ref} position={[-2.58, -0.78, 0.55]}>
          <mesh
            geometry={sceneAssets.r1_04.geometry}
            material={sceneAssets.mossRock1Mat}
            rotation={[0.25, 0.7, -0.15]}
            scale={0.44}
            castShadow
            receiveShadow
          />
        </group>

        {/* Satellite Rock 2: Moss-Touched Boulder Bottom-Right */}
        <group ref={sat2Ref} position={[2.68, -1.02, 0.42]}>
          <group rotation={[0.1, -0.4, 0.08]} scale={[0.58, 0.6, 0.56]}>
            <mesh
              geometry={sceneAssets.r2_09.geometry}
              material={sceneAssets.mossRock2Mat}
              castShadow
              receiveShadow
            />
            <MossColonyInstanced
              anchors={sceneAssets.sat2Anchors}
              variants={sceneAssets.mossVariants}
              baseScale={4.5}
              seed={6029}
              maxInstances={85}
              sink={0.015}
            />
          </group>
        </group>

        {/* Satellite Rock 3: Floating Fragment Upper-Right */}
        <mesh
          ref={sat3Ref}
          geometry={sceneAssets.r2_08.geometry}
          material={sceneAssets.mossRock2Mat}
          position={[2.1, 1.38, -1.1]}
          rotation={[0.4, 0.9, -0.2]}
          scale={0.35}
          castShadow
        />
      </group>

      {/* ===================================================================== */}
      {/* TRANSITION PORTAL WALLS                                              */}
      {/* ===================================================================== */}
      <mesh
        geometry={sceneAssets.r1_02.geometry}
        material={sceneAssets.mossRock1Mat}
        position={[-2.85, -4.3, 2.35]}
        rotation={[0.3, 0.6, -0.45]}
        scale={[1.05, 1.35, 1.0]}
      />
      <mesh
        geometry={sceneAssets.r1_05.geometry}
        material={sceneAssets.mossRock1Mat}
        position={[2.85, -4.3, 2.35]}
        rotation={[-0.25, -0.55, 0.42]}
        scale={[1.05, 1.35, 1.0]}
      />

      {/* ===================================================================== */}
      {/* DIORAMA B: SCENE 3 MACRO FERN + SCENE 4 OBSERVATION STATION           */}
      {/* ===================================================================== */}
      <group ref={dioramaBGroupRef} position={[0, -9.05, 0]}>
        {/* Full PBR Scree & Rocky Forest Soil Terrain */}
        <mesh
          geometry={sceneAssets.terrainGeo}
          material={sceneAssets.terrainMat}
          position={[3.5, 0, -0.4]}
          receiveShadow
        />

        {/* Instanced Photogrammetry Scree Stones Embedded Along Terrain Elevation */}
        <instancedMesh
          ref={stoneInstRef}
          args={[sceneAssets.r2_12.geometry, sceneAssets.mossRock2Mat, stoneCount]}
          castShadow
          receiveShadow
        />

        {/* Scene 3 Hero Woodland Fern Cluster Grounded Flush in Foreground-Left Soil */}
        <PhotogrammetryFernCluster
          position={[-0.96, heroFernY + 0.05, 1.48]}
          parts={sceneAssets.fernParts}
          material={sceneAssets.fernMat}
          scale={[1.42, 2.25, 1.42]}
          rotationY={0.28}
        />
        {/* Misty Background Companion Fern */}
        <PhotogrammetryFernCluster
          position={[-1.88, bgFernY + 0.03, -0.58]}
          parts={sceneAssets.fernParts}
          material={sceneAssets.fernMat}
          scale={[1.05, 1.55, 1.05]}
          rotationY={-0.75}
        />

        {/* Foreground Right Velvet Cushion Moss Mound + 750 Soft Cushion moss_01 Clumps */}
        <group position={[1.18, frontMossY, 1.48]}>
          <mesh
            geometry={sceneAssets.frontMoss.geometry}
            material={sceneAssets.hummockBaseMat}
            receiveShadow
            castShadow
          />
          <MossColonyInstanced
            anchors={sceneAssets.frontMoss.mossAnchors}
            variants={sceneAssets.mossVariants}
            baseScale={2.35}
            yScaleRatio={0.46}
            seed={557}
            maxInstances={750}
            sink={0.012}
            paletteHex={["#d8eba8", "#c2de8a", "#e6f2c2", "#b4d478"]}
          />
        </group>

        {/* Midground-Right Horizon Moss Cushion Mounds */}
        <group position={[1.75, horizonMoss1Y, -1.8]}>
          <mesh
            geometry={sceneAssets.horizonMoss1.geometry}
            material={sceneAssets.hummockBaseMat}
            receiveShadow
          />
          <MossColonyInstanced
            anchors={sceneAssets.horizonMoss1.mossAnchors}
            variants={sceneAssets.mossVariants}
            baseScale={2.5}
            yScaleRatio={0.46}
            seed={659}
            maxInstances={220}
            sink={0.012}
            paletteHex={["#d8eba8", "#c2de8a", "#e6f2c2", "#b4d478"]}
          />
        </group>
        <group position={[3.1, horizonMoss2Y, -2.2]}>
          <mesh
            geometry={sceneAssets.horizonMoss2.geometry}
            material={sceneAssets.hummockBaseMat}
            receiveShadow
          />
          <MossColonyInstanced
            anchors={sceneAssets.horizonMoss2.mossAnchors}
            variants={sceneAssets.mossVariants}
            baseScale={2.4}
            yScaleRatio={0.46}
            seed={761}
            maxInstances={160}
            sink={0.012}
            paletteHex={["#d8eba8", "#c2de8a", "#e6f2c2", "#b4d478"]}
          />
        </group>

        {/* Scene 4 Photogrammetry Rock Outcrops & Solid Mast Anchor Plinth */}
        <mesh
          geometry={sceneAssets.r1_02.geometry}
          material={sceneAssets.mossRock1Mat}
          position={[4.25, getTerrainHeight(4.25, -1.25) + 0.18, -1.25]}
          rotation={[0.08, 0.42, 0.12]}
          scale={[1.08, 1.18, 0.96]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={sceneAssets.r1_01.geometry}
          material={sceneAssets.mossRock1Mat}
          position={[7.2, getTerrainHeight(7.2, -0.85) + 0.2, -0.85]}
          rotation={[0.1, -0.48, -0.12]}
          scale={[1.15, 1.25, 1.05]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={sceneAssets.boulderCore.geometry}
          material={sceneAssets.boulderMat}
          position={[6.25, getTerrainHeight(6.25, -1.05) + 0.1, -1.05]}
          rotation={[0.22, 1.15, -0.08]}
          scale={[1.25, 1.15, 1.1]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={sceneAssets.r1_05.geometry}
          material={sceneAssets.mossRock1Mat}
          position={[5.2, mastBaseY - 0.18, 0.12]}
          rotation={[0.05, 0.24, 0.0]}
          scale={[0.96, 0.82, 0.88]}
          castShadow
          receiveShadow
        />

        {/* Lean Photogrammetry Evergreen Shrub Clusters Flanking & Framing Station */}
        <PhotogrammetryShrubCluster
          position={[4.85, mastBaseY + 1.05, -1.42]}
          geometry={sceneAssets.shrubGeo}
          material={sceneAssets.shrubMat}
          stemCount={12}
          spread={0.62}
          scaleRange={[2.25, 3.15]}
          seed={901}
        />
        <PhotogrammetryShrubCluster
          position={[3.72, mastBaseY + 0.52, -1.55]}
          geometry={sceneAssets.shrubGeo}
          material={sceneAssets.shrubMat}
          stemCount={8}
          spread={0.48}
          scaleRange={[1.75, 2.55]}
          seed={907}
        />
        <PhotogrammetryShrubCluster
          position={[6.55, mastBaseY + 0.58, -1.65]}
          geometry={sceneAssets.shrubGeo}
          material={sceneAssets.shrubMat}
          stemCount={9}
          spread={0.55}
          scaleRange={[1.9, 2.65]}
          seed={919}
        />

        {/* Scene 4 Observation Station Mast Planted Solidly into Stone Plinth */}
        <ObservationMast position={[5.2, mastBaseY - 0.06, 0.12]} />

        {/* Low Ground Atmospheric Mist */}
        <group ref={mistSpritesRef}>
          {[
            { pos: [-0.9, 0.45, 2.2] as [number, number, number], scale: [4.2, 1.8, 1] as [number, number, number] },
            { pos: [1.5, 0.55, 2.0] as [number, number, number], scale: [4.8, 1.9, 1] as [number, number, number] },
            { pos: [5.1, 0.95, 2.1] as [number, number, number], scale: [6.0, 2.2, 1] as [number, number, number] },
            { pos: [6.4, 1.45, -0.2] as [number, number, number], scale: [5.4, 2.1, 1] as [number, number, number] },
          ].map((m, idx) => (
            <sprite key={idx} position={m.pos} scale={m.scale} material={sceneAssets.mistSpriteMat} />
          ))}
        </group>
      </group>
    </>
  );
}

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function EcoTechScene(props: EcoTechSceneProps) {
  const [ready, setReady] = useState(false);
  const [webGLOk, setWebGLOk] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setWebGLOk(checkWebGLSupport());
    setIsMobile(window.innerWidth < 768);
    setReady(true);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!ready || !webGLOk) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-[#111d13]"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-35 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/farmers-leaf.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#111d13]/85 via-[#111d13]/60 to-[#111d13]" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#111d13]"
      aria-hidden="true"
    >
      <Canvas
        shadows
        dpr={isMobile ? 1 : [1, 1.5]}
        camera={{ fov: 40, near: 0.1, far: 80, position: [0, 0.06, 6.15] }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.AgXToneMapping,
          toneMappingExposure: 1.02,
        }}
      >
        <Suspense fallback={null}>
          <EcoWorld {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
