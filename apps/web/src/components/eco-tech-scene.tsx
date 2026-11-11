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
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  createBotanicalLeafGeometry,
  createMistTexture,
  createMossCushionBlob,
  createMossHummockGeometry,
  createSculptedBoulder,
  createSeededRandom,
  createTerrainGeometry,
  createVelvetHairGeometry,
} from "./scene-helpers";

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
    vec2 cloudUv = vUv * vec2(3.2, 2.2) + vec2(uTime * 0.008, 0.0);
    float clouds = fbm(cloudUv + fbm(cloudUv * 0.7) * 0.6);

    vec3 stormUpper = vec3(0.41, 0.45, 0.41);
    vec3 overcastMid = vec3(0.68, 0.71, 0.68);
    vec3 mistHorizon = vec3(0.83, 0.86, 0.83);

    float verticalGrad = smoothstep(0.14, 0.9, vUv.y);
    vec3 skyBase = mix(mistHorizon, stormUpper, verticalGrad);
    vec3 skyColor = mix(skyBase, overcastMid, clouds * 0.52);

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
      <planeGeometry args={[76, 48]} />
    </mesh>
  );
}

/**
 * Fine clustered 3D moss sprigs anchoring into upper boulder pockets & cushions.
 */
function BoulderMossTufts({
  anchors,
  countCap = 900,
}: {
  anchors: Array<{ pos: THREE.Vector3; normal: THREE.Vector3; scale: number }>;
  countCap?: number;
}) {
  const instRef = useRef<THREE.InstancedMesh>(null);
  const sprigGeo = useMemo(() => createBotanicalLeafGeometry(0.058, 0.019, 0.02, 0.005), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.78,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    []
  );

  const count = Math.min(anchors.length, countCap);

  useEffect(() => {
    const mesh = instRef.current;
    if (!mesh || count === 0) return;

    const dummy = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion();
    const rand = createSeededRandom(4409);
    const palette = [
      new THREE.Color("#456f28"),
      new THREE.Color("#5b8c32"),
      new THREE.Color("#73a840"),
      new THREE.Color("#36591e"),
      new THREE.Color("#8ebc4d"),
    ];

    for (let i = 0; i < count; i++) {
      const a = anchors[i % anchors.length];
      dummy.position.copy(a.pos).addScaledVector(a.normal, -0.01);
      quat.setFromUnitVectors(up, a.normal);
      dummy.quaternion.copy(quat);
      dummy.rotateY(rand() * Math.PI * 2);
      dummy.rotateX((rand() - 0.5) * 0.75);
      const s = a.scale * (0.65 + rand() * 0.75);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, palette[Math.floor(rand() * palette.length)]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [anchors, count]);

  useEffect(() => {
    return () => {
      sprigGeo.dispose();
      mat.dispose();
    };
  }, [sprigGeo, mat]);

  if (count === 0) return null;

  return <instancedMesh ref={instRef} args={[sprigGeo, mat, count]} castShadow receiveShadow />;
}

/**
 * Detailed Compound Fern Cluster (Scene 3 Hero foreground left + midground companion).
 */
function CompoundFernCluster({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const fernSpec = useMemo(() => {
    const rand = createSeededRandom(8821);
    const frondConfigs = [
      { yaw: -0.22, tilt: 0.42, height: 1.08, lean: 0.62, pairs: 15 },
      { yaw: 0.34, tilt: 0.36, height: 1.18, lean: 0.56, pairs: 16 },
      { yaw: -0.78, tilt: 0.52, height: 0.96, lean: 0.68, pairs: 14 },
      { yaw: 0.88, tilt: 0.48, height: 1.0, lean: 0.6, pairs: 14 },
      { yaw: 0.08, tilt: 0.66, height: 0.84, lean: 0.72, pairs: 12 },
      { yaw: -1.32, tilt: 0.6, height: 0.88, lean: 0.68, pairs: 12 },
    ];

    const stems: THREE.BufferGeometry[] = [];
    const pinnaeMatrices: THREE.Matrix4[] = [];
    const pinnaeColors: THREE.Color[] = [];
    const dummy = new THREE.Object3D();

    frondConfigs.forEach((cfg) => {
      const cos = Math.cos(cfg.yaw);
      const sin = Math.sin(cfg.yaw);
      const p0 = new THREE.Vector3(0, 0, 0);
      const p1 = new THREE.Vector3(sin * 0.14, cfg.height * 0.44, cos * 0.14);
      const p2 = new THREE.Vector3(sin * cfg.lean * 0.68, cfg.height * 0.88, cos * cfg.lean * 0.68);
      const p3 = new THREE.Vector3(
        sin * cfg.lean,
        cfg.height * (0.95 - cfg.tilt * 0.18),
        cos * cfg.lean
      );

      const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
      stems.push(new THREE.TubeGeometry(curve, 18, 0.014, 6, false));

      for (let i = 0; i < cfg.pairs; i++) {
        const t = 0.24 + (i / (cfg.pairs - 1)) * 0.72;
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();
        const sizeEnvelope = Math.sin(Math.pow((i + 1) / cfg.pairs, 0.72) * Math.PI * 0.92);
        const leafScale = 0.5 + sizeEnvelope * 1.1;

        for (const side of [-1, 1]) {
          dummy.position.copy(point);
          dummy.lookAt(point.clone().add(tangent));
          dummy.rotateX(Math.PI * 0.48);
          dummy.rotateZ(side * (1.1 - t * 0.22));
          dummy.rotateY(side * 0.24 + (rand() - 0.5) * 0.12);
          dummy.scale.set(leafScale * 0.8, leafScale * 1.12, leafScale);
          dummy.updateMatrix();
          pinnaeMatrices.push(dummy.matrix.clone());

          const shade = new THREE.Color("#629a35").lerp(
            new THREE.Color("#8ec148"),
            t * 0.58 + rand() * 0.18
          );
          pinnaeColors.push(shade);
        }
      }
    });

    // Smooth lance-shaped arching foreground crop/fern blades at base
    const broadAngles = [-0.45, 0.15, 0.72, -0.95, 1.15];
    const broadMatrices: THREE.Matrix4[] = [];
    broadAngles.forEach((a, idx) => {
      dummy.position.set(Math.sin(a) * 0.1, 0.05 + idx * 0.035, Math.cos(a) * 0.1);
      dummy.rotation.set(0.95 + idx * 0.05, a, (idx - 2) * 0.18);
      dummy.scale.set(1.18, 1.28, 1.18);
      dummy.updateMatrix();
      broadMatrices.push(dummy.matrix.clone());
    });

    return { stems, pinnaeMatrices, pinnaeColors, broadMatrices };
  }, []);

  const pinnaGeo = useMemo(() => createBotanicalLeafGeometry(0.145, 0.025, 0.026, 0.005), []);
  const broadGeo = useMemo(() => createBotanicalLeafGeometry(0.44, 0.068, 0.14, 0.015), []);

  const stemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#436b28",
        roughness: 0.55,
      }),
    []
  );
  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.52,
        metalness: 0.02,
        emissive: new THREE.Color("#18300b"),
        emissiveIntensity: 0.2,
        side: THREE.DoubleSide,
      }),
    []
  );
  const broadMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4d822a",
        roughness: 0.46,
        emissive: new THREE.Color("#142909"),
        emissiveIntensity: 0.16,
        side: THREE.DoubleSide,
      }),
    []
  );

  const pinnaInstRef = useRef<THREE.InstancedMesh>(null);
  const broadInstRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const pMesh = pinnaInstRef.current;
    if (pMesh) {
      fernSpec.pinnaeMatrices.forEach((m, i) => {
        pMesh.setMatrixAt(i, m);
        pMesh.setColorAt(i, fernSpec.pinnaeColors[i]);
      });
      pMesh.instanceMatrix.needsUpdate = true;
      if (pMesh.instanceColor) pMesh.instanceColor.needsUpdate = true;
    }

    const bMesh = broadInstRef.current;
    if (bMesh) {
      fernSpec.broadMatrices.forEach((m, i) => {
        bMesh.setMatrixAt(i, m);
      });
      bMesh.instanceMatrix.needsUpdate = true;
    }
  }, [fernSpec]);

  useEffect(() => {
    return () => {
      fernSpec.stems.forEach((g) => g.dispose());
      pinnaGeo.dispose();
      broadGeo.dispose();
      stemMat.dispose();
      leafMat.dispose();
      broadMat.dispose();
    };
  }, [fernSpec, pinnaGeo, broadGeo, stemMat, leafMat, broadMat]);

  return (
    <group position={position} rotation={[0, 0.22, 0]} scale={scale}>
      {fernSpec.stems.map((geo, i) => (
        <mesh key={i} geometry={geo} material={stemMat} castShadow />
      ))}
      <instancedMesh
        ref={pinnaInstRef}
        args={[pinnaGeo, leafMat, fernSpec.pinnaeMatrices.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={broadInstRef}
        args={[broadGeo, broadMat, fernSpec.broadMatrices.length]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/**
 * Scene 4 Detailed Observation Station Mast with accurately bolted sensor struts.
 */
function ObservationMast({ position }: { position: [number, number, number] }) {
  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#bfc5bf",
        metalness: 0.72,
        roughness: 0.3,
      }),
    []
  );
  const darkMetalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2b302c",
        metalness: 0.55,
        roughness: 0.45,
      }),
    []
  );
  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e6ebe6",
        metalness: 0.1,
        roughness: 0.35,
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
      {/* Main Vertical Anodized Pole */}
      <mesh position={[0, 1.35, 0]} material={metalMat} castShadow>
        <cylinderGeometry args={[0.042, 0.048, 3.8, 16]} />
      </mesh>

      {/* Top Whip Antenna & Cap */}
      <mesh position={[0, 3.85, 0]} material={metalMat}>
        <cylinderGeometry args={[0.011, 0.014, 1.3, 10]} />
      </mesh>
      <mesh position={[0, 3.24, 0]} material={darkMetalMat}>
        <cylinderGeometry args={[0.048, 0.048, 0.05, 16]} />
      </mesh>

      {/* Upper & Center Collar Clamps */}
      <mesh position={[0, 2.72, 0]} material={metalMat}>
        <cylinderGeometry args={[0.068, 0.068, 0.08, 16]} />
      </mesh>
      <mesh position={[0, 2.02, 0]} material={metalMat}>
        <cylinderGeometry args={[0.075, 0.075, 0.16, 16]} />
      </mesh>

      {/* Horizontal Cross-Arm Tube */}
      <mesh
        position={[0.22, 2.02, 0]}
        rotation={[0, 0, Math.PI / 2]}
        material={metalMat}
        castShadow
      >
        <cylinderGeometry args={[0.032, 0.032, 1.85, 14]} />
      </mesh>

      {/* Right Pyranometer Sensor Boom Tip */}
      <mesh position={[1.18, 2.02, 0]} rotation={[0, 0, Math.PI / 2]} material={plateMat}>
        <cylinderGeometry args={[0.022, 0.03, 0.24, 12]} />
      </mesh>
      <mesh position={[1.29, 2.04, 0]} material={darkMetalMat}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
      </mesh>

      {/* Twin Louvered Radiation Shields with Exact Bolted Support Struts */}
      {sensors.map((sensor, sIdx) => {
        const dx = sensor.x - sensor.armX;
        const dy = sensor.y - 2.02;
        const len = Math.hypot(dx, dy);
        const angleZ = -Math.atan2(dx, dy);
        const midX = (sensor.armX + sensor.x) * 0.5;
        const midY = (2.02 + sensor.y) * 0.5;

        return (
          <group key={sIdx}>
            {/* Clamp Ring on Cross-Arm */}
            <mesh position={[sensor.armX, 2.02, 0]} rotation={[0, 0, Math.PI / 2]} material={darkMetalMat}>
              <cylinderGeometry args={[0.044, 0.044, 0.06, 12]} />
            </mesh>

            {/* Exact Diagonal Strut from Cross-Arm to Sensor Base */}
            <mesh position={[midX, midY, 0]} rotation={[0, 0, angleZ]} material={metalMat}>
              <boxGeometry args={[0.036, len, 0.055]} />
            </mesh>

            <group position={[sensor.x, sensor.y, 0]} scale={sensor.scale}>
              <mesh position={[0, 0.16, 0]} material={darkMetalMat}>
                <cylinderGeometry args={[0.105, 0.105, 0.34, 18]} />
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

      {/* Lower Guy-Wire Collar & 3 Guy Tension Wires */}
      <mesh position={[0, 1.05, 0]} material={metalMat}>
        <cylinderGeometry args={[0.06, 0.06, 0.07, 14]} />
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
 * Dense Rounded Ovate Leaf Crown Behind Scene 4 Station Outcrop.
 */
function ShrubFoliageCrown({
  position,
  leafCount = 860,
  radius = 1.65,
  seed = 901,
}: {
  position: [number, number, number];
  leafCount?: number;
  radius?: number;
  seed?: number;
}) {
  const instRef = useRef<THREE.InstancedMesh>(null);
  const leafGeo = useMemo(() => createBotanicalLeafGeometry(0.24, 0.078, 0.055, 0.012), []);
  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.44,
        metalness: 0.02,
        emissive: new THREE.Color("#162b0b"),
        emissiveIntensity: 0.16,
        side: THREE.DoubleSide,
      }),
    []
  );

  useEffect(() => {
    const mesh = instRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const rand = createSeededRandom(seed);
    const palette = [
      new THREE.Color("#456f27"),
      new THREE.Color("#5f8e34"),
      new THREE.Color("#7ba840"),
      new THREE.Color("#33551c"),
      new THREE.Color("#8ebc4d"),
    ];

    for (let i = 0; i < leafCount; i++) {
      const u = rand();
      const v = rand();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.42 + Math.pow(rand(), 0.42) * 0.58);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) * 0.85;
      const z = r * Math.sin(phi) * Math.sin(theta) * 0.72;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        (rand() - 0.5) * 1.6,
        rand() * Math.PI * 2,
        (rand() - 0.5) * 1.4
      );
      const s = 0.65 + rand() * 0.72;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, palette[Math.floor(rand() * palette.length)]);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [leafCount, radius, seed]);

  useEffect(() => {
    return () => {
      leafGeo.dispose();
      leafMat.dispose();
    };
  }, [leafGeo, leafMat]);

  return (
    <group position={position}>
      <instancedMesh ref={instRef} args={[leafGeo, leafMat, leafCount]} castShadow receiveShadow />
    </group>
  );
}

/**
 * Full 3D World rendered inside <Canvas>. Zero React setState inside useFrame.
 */
function EcoWorld({
  scrollProgressRef,
  mousePosRef,
  reducedMotion,
}: EcoTechSceneProps) {
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

  const [rockTex, mossTex, soilTex] = useTexture([
    "/images/rock-albedo.jpg",
    "/images/moss-albedo.jpg",
    "/images/soil-albedo.jpg",
  ]);

  useEffect(() => {
    [rockTex, mossTex, soilTex].forEach((tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      tex.needsUpdate = true;
    });
  }, [rockTex, mossTex, soilTex]);

  const assets = useMemo(() => {
    const mainBoulder = createSculptedBoulder(1.42, {
      seed: 17,
      segments: 34,
      scale: [1.18, 0.94, 1.05],
      cragStrength: 0.24,
      fracturePlanes: 6,
      uvScale: 2.0,
      mossBias: 0.25,
    });
    // Plush textured 3D moss caps hugging main rock crest & saddle
    const mossCapMain = createMossCushionBlob(0.85, [1.35, 0.48, 1.05], 11);
    const mossCapLeft = createMossCushionBlob(0.62, [1.15, 0.45, 0.92], 23);
    const mossCapRight = createMossCushionBlob(0.58, [1.1, 0.52, 0.95], 37);
    const mossCapFront = createMossCushionBlob(0.45, [1.2, 0.36, 0.85], 49);
    const satMossCap = createMossCushionBlob(0.32, [1.05, 0.45, 0.95], 63);

    const sat1 = createSculptedBoulder(0.46, {
      seed: 33,
      segments: 18,
      scale: [1.14, 0.86, 0.95],
      cragStrength: 0.22,
      fracturePlanes: 5,
      mossBias: -0.05,
    });
    const sat2 = createSculptedBoulder(0.56, {
      seed: 51,
      segments: 18,
      scale: [1.28, 0.8, 1.02],
      cragStrength: 0.2,
      fracturePlanes: 5,
      mossBias: 0.14,
    });
    const sat3 = createSculptedBoulder(0.24, {
      seed: 89,
      segments: 14,
      scale: [0.92, 1.2, 0.95],
      cragStrength: 0.2,
      fracturePlanes: 4,
      mossBias: 0.0,
    });

    const portalLeft = createSculptedBoulder(1.3, {
      seed: 112,
      segments: 16,
      scale: [1.0, 1.45, 1.2],
      mossBias: 0.35,
    });
    const portalRight = createSculptedBoulder(1.3, {
      seed: 129,
      segments: 16,
      scale: [1.0, 1.45, 1.2],
      mossBias: 0.35,
    });

    const terrainGeo = createTerrainGeometry(28, 18, 96, 68, 313);
    const frontMoss = createMossHummockGeometry(3.2, 2.2, 0.62, 505);
    const horizonMoss1 = createMossHummockGeometry(3.4, 1.6, 0.42, 607);
    const horizonMoss2 = createMossHummockGeometry(2.6, 1.4, 0.36, 709);

    const stationBluffLeft = createSculptedBoulder(1.35, {
      seed: 811,
      segments: 20,
      scale: [1.55, 0.82, 1.25],
      mossBias: 0.32,
    });
    const stationBluffRight = createSculptedBoulder(1.65, {
      seed: 823,
      segments: 22,
      scale: [1.85, 0.95, 1.3],
      mossBias: 0.38,
    });
    const mastPlinthRock = createSculptedBoulder(1.1, {
      seed: 857,
      segments: 18,
      scale: [1.85, 0.65, 1.25],
      mossBias: 0.42,
    });

    const pebbleGeo = createSculptedBoulder(0.085, {
      seed: 951,
      segments: 8,
      scale: [1.35, 0.65, 1.15],
      cragStrength: 0.18,
      fracturePlanes: 3,
      mossBias: -0.4,
    }).geometry;

    const velvetHairGeo = createVelvetHairGeometry(0.044, 0.0038);
    const mistTex = createMistTexture();

    return {
      mainBoulder,
      mossCapMain,
      mossCapLeft,
      mossCapRight,
      mossCapFront,
      satMossCap,
      sat1,
      sat2,
      sat3,
      portalLeft,
      portalRight,
      terrainGeo,
      frontMoss,
      horizonMoss1,
      horizonMoss2,
      stationBluffLeft,
      stationBluffRight,
      mastPlinthRock,
      pebbleGeo,
      velvetHairGeo,
      mistTex,
    };
  }, []);

  const materials = useMemo(() => {
    const rockMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      bumpMap: rockTex,
      bumpScale: 0.05,
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.03,
    });
    const mossyRockMat = new THREE.MeshStandardMaterial({
      map: rockTex,
      bumpMap: rockTex,
      bumpScale: 0.055,
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.03,
    });
    const soilMat = new THREE.MeshStandardMaterial({
      map: soilTex,
      bumpMap: soilTex,
      bumpScale: 0.055,
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.02,
    });
    const mossMat = new THREE.MeshStandardMaterial({
      map: mossTex,
      bumpMap: mossTex,
      bumpScale: 0.05,
      roughness: 0.92,
      metalness: 0.02,
      color: "#d9ebc2",
    });
    const fuzzMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.72,
      emissive: new THREE.Color("#2b4a16"),
      emissiveIntensity: 0.28,
      side: THREE.DoubleSide,
    });
    const pebbleMat = new THREE.MeshStandardMaterial({
      map: soilTex,
      roughness: 0.85,
      color: "#9d9282",
    });
    const mistSpriteMat = new THREE.SpriteMaterial({
      map: assets.mistTex,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
    });

    return {
      rockMat,
      mossyRockMat,
      soilMat,
      mossMat,
      fuzzMat,
      pebbleMat,
      mistSpriteMat,
    };
  }, [rockTex, mossTex, soilTex, assets.mistTex]);

  const pebbleInstRef = useRef<THREE.InstancedMesh>(null);
  const fuzzInstRef = useRef<THREE.InstancedMesh>(null);
  const pebbleCount = 80;
  const fuzzCount = Math.min(assets.frontMoss.fuzzAnchors.length, 1500);

  useEffect(() => {
    const pMesh = pebbleInstRef.current;
    if (pMesh) {
      const dummy = new THREE.Object3D();
      const rand = createSeededRandom(301);
      for (let i = 0; i < pebbleCount; i++) {
        const px = -2.2 + rand() * 7.8;
        const pz = -2.4 + rand() * 4.0;
        dummy.position.set(px, -0.02 + rand() * 0.08, pz);
        dummy.rotation.set(rand() * 0.6, rand() * Math.PI * 2, rand() * 0.6);
        const s = 0.45 + rand() * 1.35;
        dummy.scale.set(s, s * (0.62 + rand() * 0.38), s);
        dummy.updateMatrix();
        pMesh.setMatrixAt(i, dummy.matrix);
      }
      pMesh.instanceMatrix.needsUpdate = true;
    }

    const fMesh = fuzzInstRef.current;
    if (fMesh && fuzzCount > 0) {
      const dummy = new THREE.Object3D();
      const up = new THREE.Vector3(0, 1, 0);
      const q = new THREE.Quaternion();
      const rand = createSeededRandom(557);
      const greens = [
        new THREE.Color("#73a840"),
        new THREE.Color("#9bc95f"),
        new THREE.Color("#5c8a2f"),
        new THREE.Color("#aed86f"),
      ];
      for (let i = 0; i < fuzzCount; i++) {
        const a = assets.frontMoss.fuzzAnchors[i % assets.frontMoss.fuzzAnchors.length];
        dummy.position.copy(a.pos);
        q.setFromUnitVectors(up, a.normal);
        dummy.quaternion.copy(q);
        dummy.rotateY(rand() * Math.PI * 2);
        dummy.rotateX((rand() - 0.5) * 0.25);
        const s = a.scale * (0.85 + rand() * 0.6);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        fMesh.setMatrixAt(i, dummy.matrix);
        fMesh.setColorAt(i, greens[Math.floor(rand() * greens.length)]);
      }
      fMesh.instanceMatrix.needsUpdate = true;
      if (fMesh.instanceColor) fMesh.instanceColor.needsUpdate = true;
    }
  }, [assets, fuzzCount]);

  useEffect(() => {
    return () => {
      assets.mainBoulder.geometry.dispose();
      assets.mossCapMain.dispose();
      assets.mossCapLeft.dispose();
      assets.mossCapRight.dispose();
      assets.mossCapFront.dispose();
      assets.satMossCap.dispose();
      assets.sat1.geometry.dispose();
      assets.sat2.geometry.dispose();
      assets.sat3.geometry.dispose();
      assets.portalLeft.geometry.dispose();
      assets.portalRight.geometry.dispose();
      assets.terrainGeo.dispose();
      assets.frontMoss.geometry.dispose();
      assets.horizonMoss1.geometry.dispose();
      assets.horizonMoss2.geometry.dispose();
      assets.stationBluffLeft.geometry.dispose();
      assets.stationBluffRight.geometry.dispose();
      assets.mastPlinthRock.geometry.dispose();
      assets.pebbleGeo.dispose();
      assets.velvetHairGeo.dispose();
      assets.mistTex.dispose();

      Object.values(materials).forEach((m) => m.dispose());
    };
  }, [assets, materials]);

  const tmpVoidFog = useMemo(() => new THREE.Color("#111d13"), []);
  const tmpMistFog = useMemo(() => new THREE.Color("#c4cac3"), []);
  const tmpCurFog = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const time = clock.getElapsedTime();
    const targetP = scrollProgressRef.current;

    smoothedScroll.current = reducedMotion
      ? targetP
      : THREE.MathUtils.lerp(smoothedScroll.current, targetP, Math.min(1, dt * 8));
    const p = smoothedScroll.current;

    const targetMX = reducedMotion ? 0 : mousePosRef.current.x;
    const targetMY = reducedMotion ? 0 : mousePosRef.current.y;
    smoothedMouse.current.x = THREE.MathUtils.lerp(smoothedMouse.current.x, targetMX, Math.min(1, dt * 5));
    smoothedMouse.current.y = THREE.MathUtils.lerp(smoothedMouse.current.y, targetMY, Math.min(1, dt * 5));
    const mx = smoothedMouse.current.x;
    const my = smoothedMouse.current.y;

    const portraitBoost =
      camera instanceof THREE.PerspectiveCamera && camera.aspect < 1
        ? (1 - camera.aspect) * 3.15
        : 0;

    // -------------------------------------------------------------------------
    // Mist Atmosphere Blend (0 in Scenes 1-2 -> 1 in Scenes 3-5)
    // -------------------------------------------------------------------------
    const mistBlend = THREE.MathUtils.smoothstep(p, 0.28, 0.41);
    mistRef.current = mistBlend;

    if (scene.fog instanceof THREE.FogExp2) {
      tmpCurFog.copy(tmpVoidFog).lerp(tmpMistFog, mistBlend);
      scene.fog.color.copy(tmpCurFog);
      scene.fog.density = THREE.MathUtils.lerp(0.03, 0.045, mistBlend);
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.lerp(2.75, 1.95, mistBlend);
      keyLightRef.current.position.set(
        THREE.MathUtils.lerp(4.5, 2.0, mistBlend),
        THREE.MathUtils.lerp(5.5, 9.0, mistBlend),
        THREE.MathUtils.lerp(5.0, 3.0, mistBlend)
      );
    }
    if (backLightRef.current) {
      backLightRef.current.intensity = THREE.MathUtils.lerp(1.1, 2.5, mistBlend);
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.68, 1.48, mistBlend);
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
      const idleRot = reducedMotion ? 0 : Math.sin(time * 0.25) * 0.045;

      mainRockRef.current.position.set(
        THREE.MathUtils.lerp(0.32, 0.0, visionT),
        THREE.MathUtils.lerp(-0.04, 0.02, visionT) + plungeT * 4.5 + idleFloat,
        THREE.MathUtils.lerp(0.0, 0.25, visionT) - plungeT * 1.4
      );
      mainRockRef.current.rotation.set(
        0.16 - visionT * 0.08,
        -0.22 + visionT * 0.4 + idleRot,
        -0.06 + visionT * 0.06
      );
      const baseScale = THREE.MathUtils.lerp(1.0, 1.14, visionT) * (1 - plungeT * 0.2);
      mainRockRef.current.scale.setScalar(baseScale);

      if (sat1Ref.current) {
        sat1Ref.current.position.set(-2.55 - visionT * 3.1, -0.78 - visionT * 1.1 + idleFloat * 1.3, 0.55);
        sat1Ref.current.rotation.y = 0.5 + time * (reducedMotion ? 0 : 0.07);
        sat1Ref.current.scale.setScalar(Math.max(0.001, 1 - visionT * 0.45));
      }
      if (sat2Ref.current) {
        sat2Ref.current.position.set(2.68 + visionT * 3.1, -1.02 - visionT * 1.0 - idleFloat, 0.42);
        sat2Ref.current.rotation.y = -0.7 - time * (reducedMotion ? 0 : 0.05);
        sat2Ref.current.scale.setScalar(Math.max(0.001, 1 - visionT * 0.45));
      }
      if (sat3Ref.current) {
        sat3Ref.current.position.set(2.1 + visionT * 2.5, 1.38 + visionT * 1.8 + idleFloat, -1.1);
        sat3Ref.current.rotation.y = time * (reducedMotion ? 0 : 0.08);
        sat3Ref.current.scale.setScalar(Math.max(0.001, 1 - visionT * 0.6));
      }
    }

    // -------------------------------------------------------------------------
    // Diorama B Visibility + Mist Drift (Scenes 3 -> 5)
    // -------------------------------------------------------------------------
    if (dioramaBGroupRef.current) {
      dioramaBGroupRef.current.visible = p > 0.26;
    }
    if (mistSpritesRef.current && dioramaBGroupRef.current?.visible) {
      mistSpritesRef.current.children.forEach((child, idx) => {
        if (!reducedMotion) {
          child.position.x =
            (idx % 3 === 0 ? -0.9 : idx === 1 ? 1.5 : 5.1) + Math.sin(time * 0.22 + idx) * 0.55;
        }
      });
    }

    // -------------------------------------------------------------------------
    // Camera Flight Path Matched Cleanly to Runway Anchors (0..1 = 0..460vh)
    // -------------------------------------------------------------------------
    let camX = 0;
    let camY = 0.06;
    let camZ = 6.15 + portraitBoost;
    let lookX = 0.14;
    let lookY = 0.02;
    let lookZ = 0;

    if (p < 0.28) {
      // Scene 1 -> Scene 2 Vision peak (p=0.22)
      const t = THREE.MathUtils.smoothstep(p, 0.0, 0.22);
      camX = 0.0;
      camY = THREE.MathUtils.lerp(0.06, 0.04, t);
      camZ = THREE.MathUtils.lerp(6.15, 5.45, t) + portraitBoost;
      lookX = THREE.MathUtils.lerp(0.14, 0.0, t);
      lookY = 0.02;
      lookZ = 0;
    } else if (p < 0.44) {
      // Portal Plunge down onto Scene 3 Macro Fern & Velvet Moss
      const t = THREE.MathUtils.smoothstep(p, 0.28, 0.44);
      camX = THREE.MathUtils.lerp(0.0, -0.05, t);
      camY = THREE.MathUtils.lerp(0.04, -7.82, t);
      camZ = THREE.MathUtils.lerp(5.45, 3.55 + portraitBoost * 0.85, t);
      lookX = THREE.MathUtils.lerp(0.0, 0.18, t);
      lookY = THREE.MathUtils.lerp(0.02, -8.35, t);
      lookZ = THREE.MathUtils.lerp(0.0, -0.2, t);
    } else if (p < 0.66) {
      // Scene 3 Macro Fern Hold (0.44..0.56) -> Pan Right to Station Mast (0.56..0.66)
      const panT = THREE.MathUtils.smoothstep(p, 0.56, 0.66);
      camX = THREE.MathUtils.lerp(-0.05, 5.1, panT);
      camY = THREE.MathUtils.lerp(-7.82, -6.88, panT);
      camZ = THREE.MathUtils.lerp(3.55 + portraitBoost * 0.85, 3.9 + portraitBoost * 0.9, panT);
      lookX = THREE.MathUtils.lerp(0.18, 5.18, panT);
      lookY = THREE.MathUtils.lerp(-8.35, -6.78, panT);
      lookZ = THREE.MathUtils.lerp(-0.2, 0.0, panT);
    } else {
      // Scene 4 Hold (0.66..0.78) -> Gentle rise framing top louvers as white Scene 5 slides up
      const endT = THREE.MathUtils.smoothstep(p, 0.78, 0.94);
      camX = THREE.MathUtils.lerp(5.1, 5.15, endT);
      camY = THREE.MathUtils.lerp(-6.88, -6.58, endT);
      camZ = 3.9 + portraitBoost * 0.9;
      lookX = 5.18;
      lookY = THREE.MathUtils.lerp(-6.78, -6.42, endT);
      lookZ = 0.0;
    }

    camera.position.set(camX + mx * 0.22, camY - my * 0.14, camZ);
    lookTarget.current.set(lookX, lookY, lookZ);
    camera.lookAt(lookTarget.current);
  });

  return (
    <>
      <fogExp2 attach="fog" args={["#111d13", 0.03]} />

      <hemisphereLight ref={hemiLightRef} args={["#e6ece4", "#243526", 0.68]} />
      <directionalLight
        ref={keyLightRef}
        position={[4.5, 5.5, 5.0]}
        intensity={2.75}
        color="#fff6e3"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        ref={backLightRef}
        position={[-4.5, 3.0, -5.0]}
        intensity={1.1}
        color="#dfebd6"
      />
      <directionalLight position={[0, -4.0, 2.5]} intensity={0.45} color="#3b5e3f" />

      <SkyBackdrop mistRef={mistRef} />

      {/* ===================================================================== */}
      {/* DIORAMA A: SCENE 1 HERO & SCENE 2 VISION BOULDERS                    */}
      {/* ===================================================================== */}
      <group ref={dioramaAGroupRef}>
        <group ref={mainRockRef} position={[0.32, -0.04, 0]}>
          <mesh
            geometry={assets.mainBoulder.geometry}
            material={materials.mossyRockMat}
            castShadow
            receiveShadow
          />
          {/* Plush sculpted 3D velvet moss cushions covering top/right crest */}
          <mesh
            geometry={assets.mossCapMain}
            material={materials.mossMat}
            position={[0.16, 0.98, 0.08]}
            rotation={[0.08, -0.25, -0.18]}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={assets.mossCapLeft}
            material={materials.mossMat}
            position={[-0.58, 0.85, 0.22]}
            rotation={[0.15, 0.4, 0.35]}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={assets.mossCapRight}
            material={materials.mossMat}
            position={[0.92, 0.42, 0.28]}
            rotation={[0.25, -0.5, -0.62]}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={assets.mossCapFront}
            material={materials.mossMat}
            position={[0.35, -0.1, 1.05]}
            rotation={[0.85, 0.1, -0.25]}
            castShadow
            receiveShadow
          />
          <BoulderMossTufts anchors={assets.mainBoulder.mossAnchors} countCap={900} />
        </group>

        {/* Satellite Rock 1: Warm Sandstone Bottom-Left */}
        <group ref={sat1Ref} position={[-2.55, -0.78, 0.55]}>
          <mesh geometry={assets.sat1.geometry} material={materials.rockMat} castShadow receiveShadow />
        </group>

        {/* Satellite Rock 2: Moss-Capped Boulder Bottom-Right */}
        <group ref={sat2Ref} position={[2.68, -1.02, 0.42]}>
          <mesh geometry={assets.sat2.geometry} material={materials.mossyRockMat} castShadow receiveShadow />
          <mesh
            geometry={assets.satMossCap}
            material={materials.mossMat}
            position={[0.08, 0.32, 0.05]}
            rotation={[0.1, 0.3, -0.15]}
          />
        </group>

        {/* Satellite Rock 3: Small Hovering Fragment Upper-Right */}
        <mesh
          ref={sat3Ref}
          geometry={assets.sat3.geometry}
          material={materials.rockMat}
          position={[2.1, 1.38, -1.1]}
          castShadow
        />
      </group>

      {/* ===================================================================== */}
      {/* TRANSITION PORTAL WALLS                                              */}
      {/* ===================================================================== */}
      <mesh
        geometry={assets.portalLeft.geometry}
        material={materials.mossyRockMat}
        position={[-2.85, -4.3, 2.35]}
        rotation={[0.2, 0.5, -0.25]}
      />
      <mesh
        geometry={assets.portalRight.geometry}
        material={materials.mossyRockMat}
        position={[2.85, -4.3, 2.35]}
        rotation={[-0.15, -0.5, 0.22]}
      />

      {/* ===================================================================== */}
      {/* DIORAMA B: SCENE 3 MACRO FERN + SCENE 4 OBSERVATION STATION           */}
      {/* ===================================================================== */}
      <group ref={dioramaBGroupRef} position={[0, -9.05, 0]}>
        <mesh
          geometry={assets.terrainGeo}
          material={materials.soilMat}
          position={[3.5, 0, -0.4]}
          receiveShadow
        />

        <instancedMesh
          ref={pebbleInstRef}
          args={[assets.pebbleGeo, materials.pebbleMat, pebbleCount]}
          receiveShadow
        />

        {/* Scene 3 Hero Compound Fern Cluster squarely inside bottom-left frame */}
        <CompoundFernCluster position={[-0.92, -0.18, 1.32]} scale={0.92} />
        {/* Smaller Misty Background Fern */}
        <CompoundFernCluster position={[-1.95, 0.0, -0.55]} scale={0.68} />

        {/* Foreground Right Velvet Cushion Moss Mound + 1,500 Fine Velvet Hairs */}
        <group position={[1.15, -0.02, 1.48]}>
          <mesh geometry={assets.frontMoss.geometry} material={materials.mossMat} receiveShadow castShadow />
          {fuzzCount > 0 && (
            <instancedMesh
              ref={fuzzInstRef}
              args={[assets.velvetHairGeo, materials.fuzzMat, fuzzCount]}
            />
          )}
        </group>

        {/* Midground-Right Horizon Moss Cushion Mounds */}
        <mesh
          geometry={assets.horizonMoss1.geometry}
          material={materials.mossMat}
          position={[1.75, 0.14, -1.8]}
          receiveShadow
        />
        <mesh
          geometry={assets.horizonMoss2.geometry}
          material={materials.mossMat}
          position={[3.1, 0.24, -2.2]}
          receiveShadow
        />

        {/* Scene 4 Rocky Fieldstone Outcrops & Solid Mast Anchor Plinth */}
        <mesh
          geometry={assets.stationBluffLeft.geometry}
          material={materials.mossyRockMat}
          position={[4.45, 0.85, -1.25]}
          rotation={[0.05, 0.35, 0.1]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={assets.stationBluffRight.geometry}
          material={materials.mossyRockMat}
          position={[7.55, 0.95, -0.8]}
          rotation={[0.08, -0.4, -0.1]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={assets.mastPlinthRock.geometry}
          material={materials.mossyRockMat}
          position={[5.2, -0.1, 0.2]}
          rotation={[0.04, 0.2, 0.0]}
          castShadow
          receiveShadow
        />

        {/* Layered Botanical Shrub Crowns Behind & Around Station */}
        <ShrubFoliageCrown position={[4.75, 1.42, -1.5]} leafCount={860} radius={1.65} seed={901} />
        <ShrubFoliageCrown position={[3.65, 0.68, -1.75]} leafCount={360} radius={1.2} seed={907} />
        <ShrubFoliageCrown position={[6.8, 0.88, -1.95]} leafCount={380} radius={1.2} seed={919} />

        {/* Scene 4 Observation Station Mast Planted Solidly into Plinth */}
        <ObservationMast position={[5.2, 0.12, 0.12]} />

        {/* Low Ground Atmospheric Mist */}
        <group ref={mistSpritesRef}>
          {[
            { pos: [-0.9, 0.45, 2.2] as [number, number, number], scale: [4.2, 1.8, 1] as [number, number, number] },
            { pos: [1.5, 0.55, 2.0] as [number, number, number], scale: [4.8, 1.9, 1] as [number, number, number] },
            { pos: [5.1, 0.95, 2.1] as [number, number, number], scale: [6.0, 2.2, 1] as [number, number, number] },
            { pos: [6.4, 1.45, -0.2] as [number, number, number], scale: [5.4, 2.1, 1] as [number, number, number] },
          ].map((m, idx) => (
            <sprite key={idx} position={m.pos} scale={m.scale} material={materials.mistSpriteMat} />
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
        (canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
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
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        camera={{ fov: 40, near: 0.1, far: 80, position: [0, 0.06, 6.15] }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <Suspense fallback={null}>
          <EcoWorld {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
