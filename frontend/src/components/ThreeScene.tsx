import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ThreeSceneProps {
  scrollProgress: number; // 0 to 1
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ scrollProgress }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Store mutable Three.js refs without causing React re-renders
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    plantGroup: THREE.Group | null;
    regionGroup: THREE.Group | null;
    particles: THREE.Points | null;
    hoverLight: THREE.PointLight | null;
    keyLight: THREE.DirectionalLight | null;
    rimLight: THREE.DirectionalLight | null;
    mouse: THREE.Vector2;
    targetMouse: THREE.Vector2;
    animFrameId: number;
    disposed: boolean;
    isReducedMotion: boolean;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    plantGroup: null,
    regionGroup: null,
    particles: null,
    hoverLight: null,
    keyLight: null,
    rimLight: null,
    mouse: new THREE.Vector2(0, 0),
    targetMouse: new THREE.Vector2(0, 0),
    animFrameId: 0,
    disposed: false,
    isReducedMotion: false,
  });

  // Track scrollProgress in ref for animation frame loop
  const scrollRef = useRef<number>(scrollProgress);
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const state = stateRef.current;
    state.disposed = false;

    // Check reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    state.isReducedMotion = reducedMotionQuery.matches;

    // 1. Renderer Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobile = window.innerWidth < 768;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    state.renderer = renderer;

    // 2. Scene & Camera
    const scene = new THREE.Scene();
    state.scene = scene;

    const camera = new THREE.PerspectiveCamera(38, width / Math.max(1, height), 0.1, 50);
    camera.position.set(0.6, 0.4, 3.8);
    state.camera = camera;

    // 3. Volumetric & Natural Lighting
    const hemiLight = new THREE.HemisphereLight(0xf2f5e8, 0x1a2418, 1.8);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e0, 2.8);
    keyLight.position.set(-2.5, 4.0, 3.5);
    scene.add(keyLight);
    state.keyLight = keyLight;

    const fillLight = new THREE.DirectionalLight(0x769b70, 1.2);
    fillLight.position.set(3.0, 1.5, -1.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xc58a45, 2.5);
    rimLight.position.set(1.5, -1.0, -2.5);
    scene.add(rimLight);
    state.rimLight = rimLight;

    // Pointer-following soft inspection light
    const hoverLight = new THREE.PointLight(0xa5d6a7, 1.5, 3.5, 1.2);
    hoverLight.position.set(0.8, 0.5, 1.5);
    scene.add(hoverLight);
    state.hoverLight = hoverLight;

    // 4. Floating Pollen & Micro-Dust Particles
    const particleCount = isMobile ? 120 : 300;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 6;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      particleScales[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('scale', new THREE.BufferAttribute(particleScales, 1));

    // Custom circle canvas texture for soft pollen
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d')!;
    const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(215, 240, 190, 0.9)');
    grad.addColorStop(0.4, 'rgba(180, 220, 160, 0.4)');
    grad.addColorStop(1, 'rgba(180, 220, 160, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 32, 32);

    const pTexture = new THREE.CanvasTexture(pCanvas);
    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    state.particles = particles;

    // 5. Cadastral Field Grid (used in regional surveillance stage)
    const regionGroup = new THREE.Group();
    regionGroup.position.set(0, -1.2, 0);
    regionGroup.visible = false;

    // Field grid plane
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 512;
    gridCanvas.height = 512;
    const gCtx = gridCanvas.getContext('2d')!;
    gCtx.fillStyle = '#080d09';
    gCtx.fillRect(0, 0, 512, 512);
    gCtx.strokeStyle = 'rgba(87, 167, 115, 0.18)';
    gCtx.lineWidth = 1.5;

    for (let x = 0; x <= 512; x += 32) {
      gCtx.beginPath();
      gCtx.moveTo(x, 0);
      gCtx.lineTo(x, 512);
      gCtx.stroke();
    }
    for (let y = 0; y <= 512; y += 32) {
      gCtx.beginPath();
      gCtx.moveTo(0, y);
      gCtx.lineTo(512, y);
      gCtx.stroke();
    }

    const gridTex = new THREE.CanvasTexture(gridCanvas);
    const gridMat = new THREE.MeshBasicMaterial({
      map: gridTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), gridMat);
    gridMesh.rotation.x = -Math.PI / 2;
    regionGroup.add(gridMesh);

    // Glowing telemetry cluster markers
    const markerGeo = new THREE.SphereGeometry(0.04, 12, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x57a773 });
    const alertMarkerMat = new THREE.MeshBasicMaterial({ color: 0xc58a45 });

    const markerCoords = [
      [-0.8, -0.4],
      [0.6, 0.3],
      [-0.2, 0.9],
      [1.2, -0.8],
      [-1.4, 0.7],
      [0.1, -0.2], // hotspot alert
    ];

    markerCoords.forEach(([mx, mz], idx) => {
      const marker = new THREE.Mesh(markerGeo, idx === 5 ? alertMarkerMat : markerMat);
      marker.position.set(mx, 0.04, mz);
      regionGroup.add(marker);
    });

    // Hotspot radar ring around the focal report
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc58a45,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.38, 32), ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(0.1, 0.05, -0.2);
    regionGroup.add(ringMesh);

    scene.add(regionGroup);
    state.regionGroup = regionGroup;

    // 6. Botanical Specimen Setup: Load GLB or Procedural Fallback
    const plantGroup = new THREE.Group();
    scene.add(plantGroup);
    state.plantGroup = plantGroup;

    const loader = new GLTFLoader();
    const modelUrl = '/models/TomatoPlant_Final.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        if (state.disposed) return;
        const root = gltf.scene;

        // Position & normalize plant bounds
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.4 / maxDim;

        root.position.sub(center.multiplyScalar(scale));
        root.scale.setScalar(scale);

        // Enhance botanical materials with organic subsurface feel
        root.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            if (mesh.material) {
              const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
              mat.roughness = Math.max(0.45, mat.roughness);
              mat.metalness = 0.05;
              mesh.material = mat;
            }
          }
        });

        plantGroup.add(root);
      },
      undefined,
      (err) => {
        console.warn('GLB load error, using high-end procedural botanical specimen:', err);
        if (state.disposed) return;
        buildProceduralBotanical(plantGroup);
      }
    );

    // 7. Mouse / Pointer Interaction Listeners
    const handlePointerMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      state.targetMouse.set(nx, ny);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // 8. Resize Listener
    const handleResize = () => {
      if (!container || !state.camera || !state.renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      state.camera.aspect = w / Math.max(1, h);
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(w, h);
      state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.25 : 1.75));
    };

    window.addEventListener('resize', handleResize);

    // 9. Animation & Render Loop
    const animate = (time: number) => {
      if (state.disposed) return;
      state.animFrameId = requestAnimationFrame(animate);

      // Smooth pointer damping
      state.mouse.x += (state.targetMouse.x - state.mouse.x) * 0.05;
      state.mouse.y += (state.targetMouse.y - state.mouse.y) * 0.05;

      const sp = scrollRef.current; // 0 to 1
      const isMob = window.innerWidth < 768;

      // ── Continuous Scroll Choreography across 6 sections ───────────────────
      // Section 1 (0.00 - 0.16): Hero -> Plant offset right, serene float
      // Section 2 (0.16 - 0.35): How It Works -> Plant rotates, moves slightly left
      // Section 3 (0.35 - 0.55): Farmer Experience -> Camera pushes close to leaf surface
      // Section 4 (0.55 - 0.75): Officer Intelligence -> Camera tilts up to cadastral grid
      // Section 5 (0.75 - 0.90): Human in the Loop -> Warm amber rim lighting, healthy foliage
      // Section 6 (0.90 - 1.00): Closing CTA -> Calm centered elevation

      let targetCamX = 0.0;
      let targetCamY = 0.25;
      let targetCamZ = isMob ? 4.2 : 3.4;
      let targetRotY = 0.2;
      let targetRotX = 0.05;
      let targetPlantX = isMob ? 0.0 : 1.15;
      let targetPlantY = isMob ? -0.2 : -0.1;
      let showRegion = false;
      let amberIntensity = 1.8;

      if (sp < 0.18) {
        // Hero: Plant firmly on right (x=1.15), text on left
        const t = sp / 0.18;
        targetPlantX = isMob ? 0.0 : 1.15;
        targetPlantY = isMob ? -0.25 : -0.1;
        targetCamY = 0.25;
        targetCamZ = isMob ? 4.2 : 3.4;
        targetRotY = THREE.MathUtils.lerp(0.15, 0.45, t);
        targetRotX = 0.05;
      } else if (sp < 0.38) {
        // How It Works: Plant remains on right (x=1.15), content on left
        const t = (sp - 0.18) / 0.20;
        targetPlantX = isMob ? 0.0 : 1.15;
        targetPlantY = isMob ? -0.3 : -0.1;
        targetCamZ = isMob ? 4.0 : 3.3;
        targetRotY = THREE.MathUtils.lerp(0.45, 1.35, t);
        targetRotX = 0.1;
      } else if (sp < 0.58) {
        // Farmer Experience: Plant switches to LEFT (x=-1.15), zoom close-up, content on right
        const t = (sp - 0.38) / 0.20;
        targetPlantX = isMob ? 0.0 : THREE.MathUtils.lerp(1.15, -1.15, t);
        targetPlantY = isMob ? -0.2 : 0.0;
        targetCamZ = isMob ? 3.4 : 2.5; // close-up inspection
        targetRotY = THREE.MathUtils.lerp(1.35, 2.2, t);
        targetRotX = -0.05;
      } else if (sp < 0.78) {
        // Officer Intelligence: Plant moves to RIGHT (x=1.15), reveal regional cadastral grid, content on left
        const t = (sp - 0.58) / 0.20;
        showRegion = true;
        targetPlantX = isMob ? 0.0 : THREE.MathUtils.lerp(-1.15, 1.15, t);
        targetPlantY = -0.4;
        targetCamY = THREE.MathUtils.lerp(0.25, 0.8, t);
        targetCamZ = isMob ? 4.2 : 3.6;
        targetRotX = THREE.MathUtils.lerp(-0.05, 0.35, t);
        targetRotY = 2.6;
      } else if (sp < 0.90) {
        // Human in the loop: Warm amber lighting, plant on right (x=1.2)
        const t = (sp - 0.78) / 0.12;
        targetPlantX = isMob ? 0.0 : 1.2;
        targetPlantY = -0.15;
        targetCamY = THREE.MathUtils.lerp(0.8, 0.25, t);
        targetCamZ = isMob ? 4.0 : 3.4;
        targetRotY = THREE.MathUtils.lerp(2.6, 3.14, t);
        targetRotX = 0.05;
        amberIntensity = 3.4;
      } else {
        // Final CTA: Calm, balanced, settled composition
        targetPlantX = 0.0;
        targetPlantY = isMob ? -0.45 : -0.3;
        targetCamY = 0.2;
        targetCamZ = isMob ? 4.4 : 3.6;
        targetRotY = 3.6;
        targetRotX = 0.0;
      }

      // Smooth camera interpolation
      camera.position.x += (targetCamX - camera.position.x) * 0.06;
      camera.position.y += (targetCamY - camera.position.y) * 0.06;
      camera.position.z += (targetCamZ - camera.position.z) * 0.06;

      // Mouse Parallax (subtle, natural damping)
      if (!state.isReducedMotion) {
        const mouseParallaxX = state.mouse.x * (isMob ? 0.08 : 0.25);
        const mouseParallaxY = state.mouse.y * (isMob ? 0.06 : 0.18);

        camera.position.x += mouseParallaxX * 0.04;
        camera.position.y += mouseParallaxY * 0.04;

        if (state.hoverLight) {
          state.hoverLight.position.x = camera.position.x + state.mouse.x * 1.5;
          state.hoverLight.position.y = camera.position.y + state.mouse.y * 1.5;
        }
      }

      camera.lookAt(0, targetPlantY + 0.2, 0);

      // Smooth plant movement & gentle organic breathing sway
      if (plantGroup) {
        const idleSway = state.isReducedMotion ? 0 : Math.sin(time * 0.0008) * 0.02;
        const idleSwayZ = state.isReducedMotion ? 0 : Math.cos(time * 0.0006) * 0.015;

        plantGroup.position.x += (targetPlantX - plantGroup.position.x) * 0.06;
        plantGroup.position.y += (targetPlantY + idleSway - plantGroup.position.y) * 0.06;

        // Pointer rotation influence
        const pointerRotY = state.isReducedMotion ? 0 : state.mouse.x * 0.18;
        const pointerRotX = state.isReducedMotion ? 0 : -state.mouse.y * 0.12;

        plantGroup.rotation.y += (targetRotY + pointerRotY - plantGroup.rotation.y) * 0.06;
        plantGroup.rotation.x += (targetRotX + pointerRotX - plantGroup.rotation.x) * 0.06;
        plantGroup.rotation.z += (idleSwayZ - plantGroup.rotation.z) * 0.06;
      }

      // Regional field grid visibility & animation
      if (regionGroup) {
        regionGroup.visible = showRegion;
        if (showRegion) {
          regionGroup.position.x = plantGroup ? plantGroup.position.x : 0;
          regionGroup.rotation.y = time * 0.0002;
        }
      }

      // Rim light modulation
      if (state.rimLight) {
        state.rimLight.intensity += (amberIntensity - state.rimLight.intensity) * 0.05;
      }

      // Drift floating pollen particles
      if (particles) {
        const positions = (particles.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += Math.sin(time * 0.001 + i) * 0.0008;
          positions[i * 3 + 0] += Math.cos(time * 0.0007 + i) * 0.0005;
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    state.animFrameId = requestAnimationFrame(animate);

    return () => {
      state.disposed = true;
      cancelAnimationFrame(state.animFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      // Clean WebGL resources
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      pTexture.dispose();
      gridTex.dispose();
      gridMat.dispose();
      markerGeo.dispose();
      markerMat.dispose();
      alertMarkerMat.dispose();
      ringMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Atmospheric depth vignette */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#050706]/90 via-[#050706]/35 to-[#050706]/75 pointer-events-none"
        style={{ mixBlendMode: 'normal' }}
      />
      <div
        className="absolute inset-0 bg-radial-gradient from-transparent via-[#050706]/30 to-[#050706]/90 pointer-events-none"
      />
    </div>
  );
};

// ── Procedural Botanical Specimen Fallback ─────────────────────────────────────
function buildProceduralBotanical(group: THREE.Group) {
  // Main organic stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0.08, -0.6, 0.04),
    new THREE.Vector3(-0.05, 0.1, -0.02),
    new THREE.Vector3(0.12, 0.7, 0.06),
    new THREE.Vector3(0.02, 1.3, 0.01),
  ]);

  const stemGeo = new THREE.TubeGeometry(stemCurve, 32, 0.045, 12, false);
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x2b4f2c,
    roughness: 0.7,
    metalness: 0.05,
  });
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  group.add(stemMesh);

  // Organic leaf shape
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.25, 0.3, 0.35, 0.8, 0, 1.4);
  leafShape.bezierCurveTo(-0.35, 0.8, -0.25, 0.3, 0, 0);

  const leafGeo = new THREE.ShapeGeometry(leafShape, 16);
  // Add slight curvature along Z
  const pos = leafGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    pos.setZ(i, -Math.sin(y * 1.5) * 0.12 + (1 - Math.abs(x)) * 0.06);
  }
  leafGeo.computeVertexNormals();

  const leafMatHealthy = new THREE.MeshStandardMaterial({
    color: 0x3d7a44,
    roughness: 0.5,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  const leafMatDetailed = new THREE.MeshStandardMaterial({
    color: 0x488a50,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // Attach realistic leaf clusters at natural angles
  const leafConfigs = [
    { pos: [0.06, -0.1, 0.03], rot: [0.4, 0.8, -0.6], scale: 0.85, mat: leafMatHealthy },
    { pos: [-0.04, 0.25, -0.01], rot: [0.2, -1.2, 0.7], scale: 1.0, mat: leafMatDetailed },
    { pos: [0.1, 0.65, 0.05], rot: [-0.3, 1.4, -0.4], scale: 0.95, mat: leafMatHealthy },
    { pos: [-0.02, 0.95, 0.02], rot: [0.5, -0.6, 0.8], scale: 0.75, mat: leafMatHealthy },
    { pos: [0.03, 1.25, 0.0], rot: [0.1, 0.2, -0.3], scale: 0.55, mat: leafMatHealthy },
  ];

  leafConfigs.forEach((cfg) => {
    const leaf = new THREE.Mesh(leafGeo, cfg.mat);
    leaf.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    leaf.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
    leaf.scale.setScalar(cfg.scale);
    group.add(leaf);
  });
}
