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
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  cloneTunedMaterial,
  extractMeshPart,
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
    vec3 darkVoid = vec3(0.039, 0.059, 0.071); // #0A0F12 Midnight Oil
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

function EcoWorld({
  scrollProgressRef,
  mousePosRef,
  reducedMotion,
}: EcoTechSceneProps) {
  const { scene, camera } = useThree();

  const smoothedScroll = useRef(scrollProgressRef.current);
  const smoothedMouse = useRef({ x: 0, y: 0 });
  const mistRef = useRef(0);
  const lookTarget = useRef(new THREE.Vector3(0.14, 0.02, 0));

  const dioramaAGroupRef = useRef<THREE.Group>(null);
  const mainRockRef = useRef<THREE.Group>(null);

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

  // Load ONLY the approved Meshy authored primary floating botanical island (6.24 MB)
  const mainIslandGltf = useGLTF("/models/main_island_desktop.glb");

  // Extract centered geometry + calibrated PBR material
  const sceneAssets = useMemo(() => {
    const mainIslandPart = extractMeshPart(mainIslandGltf.scene, "Mesh_0", "center");
    const mainIslandMat = cloneTunedMaterial(mainIslandPart.material, {
      roughnessScale: 0.94,
      envMapIntensity: 0.85,
      normalScale: 1.25,
      doubleSided: true,
    });

    return {
      mainIslandPart,
      mainIslandMat,
    };
  }, [mainIslandGltf]);

  useEffect(() => {
    return () => {
      sceneAssets.mainIslandPart.geometry.dispose();
      sceneAssets.mainIslandMat.dispose();
    };
  }, [sceneAssets]);

  const tmpVoidFog = useMemo(() => new THREE.Color("#0a0f12"), []);
  const tmpMistFog = useMemo(() => new THREE.Color("#7a8a80"), []);
  const tmpCurFog = useMemo(() => new THREE.Color(), []);

  useFrame(({ gl, scene, camera, clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.14);
    const time = clock.getElapsedTime();
    const targetP = scrollProgressRef.current;

    const jumpDelta = Math.abs(targetP - smoothedScroll.current);
    smoothedScroll.current =
      reducedMotion || jumpDelta > 0.35
        ? targetP
        : THREE.MathUtils.lerp(smoothedScroll.current, targetP, Math.min(1, dt * 11));
    const p = smoothedScroll.current;

    // Suspend rendering updates when covered by ground ecosystem (Scenes 3-4 plate)
    const isCovered = p >= 0.38 && p <= 0.65;
    if (reducedMotion && isCovered) {
      if (dioramaAGroupRef.current && dioramaAGroupRef.current.visible) {
        dioramaAGroupRef.current.visible = false;
      }
      return;
    }

    if (dioramaAGroupRef.current && !dioramaAGroupRef.current.visible) {
      dioramaAGroupRef.current.visible = true;
    }

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

    // Mist Atmosphere & HDRI Environment Intensity
    const mistBlend = THREE.MathUtils.smoothstep(p, 0.22, 0.38);
    mistRef.current = mistBlend;
    scene.environmentIntensity = THREE.MathUtils.lerp(0.38, 0.48, mistBlend);

    if (scene.fog instanceof THREE.FogExp2) {
      tmpCurFog.copy(tmpVoidFog).lerp(tmpMistFog, mistBlend);
      scene.fog.color.copy(tmpCurFog);
      scene.fog.density = THREE.MathUtils.lerp(0.028, 0.016, mistBlend);
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.lerp(3.2, 3.4, mistBlend);
      keyTarget.position.set(0.25, 0.0, 0.0);
      keyLightRef.current.position.set(4.5, 5.5, 4.8);
      keyTarget.updateMatrixWorld();
    }
    if (backLightRef.current) {
      backLightRef.current.intensity = THREE.MathUtils.lerp(1.45, 1.25, mistBlend);
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = THREE.MathUtils.lerp(0.55, 0.36, mistBlend);
    }

    // -------------------------------------------------------------------------
    // Diorama A: Hero Floating Botanical Island (p: 0 -> 0.14 -> Vision 0.18..0.38)
    // -------------------------------------------------------------------------
    if (mainRockRef.current) {
      const visionT = THREE.MathUtils.smoothstep(p, 0.03, 0.22);
      const exitT = THREE.MathUtils.smoothstep(p, 0.26, 0.40);

      const idleFloat = reducedMotion ? 0 : Math.sin(time * 0.65) * 0.04;
      const idleRot = reducedMotion ? 0 : Math.sin(time * 0.25) * 0.035;

      mainRockRef.current.position.set(
        THREE.MathUtils.lerp(0.32, 0.0, visionT),
        THREE.MathUtils.lerp(-0.16, 0.04, visionT) + idleFloat + exitT * 3.2,
        THREE.MathUtils.lerp(0.0, 0.25, visionT) - exitT * 1.6
      );
      mainRockRef.current.rotation.set(
        -visionT * 0.08,
        visionT * 0.42 + idleRot,
        visionT * 0.04
      );
      const baseScale = THREE.MathUtils.lerp(1.0, 1.14, visionT) * (1 - exitT * 0.3);
      mainRockRef.current.scale.setScalar(baseScale);
    }

    // Camera Flight Path (Scene 1 Hero -> Scene 2 Vision)
    let camX = 0;
    let camY = 0.06;
    let camZ = 6.15 + portraitBoost;
    let lookX = 0.14;
    let lookY = 0.02;
    let lookZ = 0;

    if (p < 0.24) {
      const t = THREE.MathUtils.smoothstep(p, 0.0, 0.20);
      camX = 0.0;
      camY = THREE.MathUtils.lerp(0.06, 0.04, t);
      camZ = THREE.MathUtils.lerp(6.15, 5.45, t) + portraitBoost;
      lookX = THREE.MathUtils.lerp(0.14, 0.0, t);
      lookY = 0.02;
      lookZ = 0;
    } else {
      const t = THREE.MathUtils.smoothstep(p, 0.24, 0.40);
      camX = THREE.MathUtils.lerp(0.0, -0.25, t);
      camY = THREE.MathUtils.lerp(0.04, -0.4, t);
      camZ = THREE.MathUtils.lerp(5.45, 5.85 + portraitBoost, t);
      lookX = THREE.MathUtils.lerp(0.0, 0.15, t);
      lookY = 0.02;
      lookZ = 0;
    }

    camera.position.set(camX + mx * 0.22, camY - my * 0.14, camZ);
    lookTarget.current.set(lookX, lookY, lookZ);
    camera.lookAt(lookTarget.current);
  });

  return (
    <>
      <fogExp2 attach="fog" args={["#0a0f12", 0.028]} />

      {/* Natural Overcast IBL HDRI for photorealistic reflections */}
      <Environment files="/hdri/belfast_open_field_1k.hdr" background={false} />

      <hemisphereLight ref={hemiLightRef} args={["#dbe8d8", "#182b1c", 0.55]} />
      {/* Cinematic Directional Key Light matching reference video */}
      <directionalLight
        ref={keyLightRef}
        position={[-5.2, 5.8, 4.6]}
        intensity={3.2}
        color="#fff8ed"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      {/* Subtle Rim Light catching foliage crest */}
      <directionalLight
        ref={backLightRef}
        position={[3.8, 4.2, -4.5]}
        intensity={1.45}
        color="#dff0e6"
      />
      {/* Soft Ambient Forest Bounce */}
      <directionalLight position={[4.0, -2.8, 2.5]} intensity={0.85} color="#27402f" />

      <SkyBackdrop mistRef={mistRef} />

      {/* Meshy AI Primary Floating Botanical Island — Calibrated Hero Silhouette */}
      <group ref={dioramaAGroupRef}>
        <group ref={mainRockRef} position={[0.32, -0.16, 0]}>
          <mesh
            geometry={sceneAssets.mainIslandPart.geometry}
            material={sceneAssets.mainIslandMat}
            scale={1.82}
            rotation={[0.18, -0.82, -0.02]}
            castShadow
            receiveShadow
          />
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [webGLOk, setWebGLOk] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isCovered, setIsCovered] = useState(false);

  useEffect(() => {
    setWebGLOk(checkWebGLSupport());
    setIsMobile(window.innerWidth < 768);
    setReady(true);

    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });

    let animId = 0;
    const updateOpacity = () => {
      animId = 0;
      if (containerRef.current) {
        const p = props.scrollProgressRef.current;
        // Smooth fade out as Image 1 comes into view (p: 0.32 -> 0.42)
        const alpha = p < 0.32 ? 1 : Math.max(0, 1 - (p - 0.32) / 0.10);
        containerRef.current.style.opacity = alpha.toFixed(3);
        containerRef.current.style.visibility = alpha > 0.01 ? "visible" : "hidden";
        setIsCovered(p >= 0.40 && p <= 0.65);
      }
    };

    const handleScroll = () => {
      if (!animId) {
        animId = requestAnimationFrame(updateOpacity);
      }
    };

    updateOpacity();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", handleScroll);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [props.scrollProgressRef]);

  if (!ready || !webGLOk) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-[#0a0f12]"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-35 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/farmers-leaf.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f12]/85 via-[#0a0f12]/60 to-[#0a0f12]" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0a0f12] will-change-[opacity]"
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
        onCreated={({ gl }) => {
          if (typeof window !== "undefined") {
            (window as unknown as { __threeRenderer: THREE.WebGLRenderer }).__threeRenderer = gl;
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              setWebGLOk(false);
            });
            const origRender = gl.render.bind(gl);
            gl.render = (scene: THREE.Scene, camera: THREE.Camera) => {
              const p = props.scrollProgressRef.current;
              if (props.reducedMotion && p >= 0.38 && p <= 0.65) {
                return;
              }
              origRender(scene, camera);
            };
          }
        }}
      >
        <Suspense fallback={null}>
          <EcoWorld {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/main_island_desktop.glb");
