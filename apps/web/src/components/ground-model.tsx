"use client";
import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { cloneTunedMaterial, extractMeshPart } from "./scene-helpers";

/** Option A: identical topology, bounded texture resolution, independent loading. */
export function GroundModel() {
  const gltf = useGLTF("/models/ground_ecosystem_2k.glb");
  const asset = useMemo(() => {
    const part = extractMeshPart(gltf.scene, "Mesh_0", "center");
    const material = cloneTunedMaterial(part.material, {
      colorHex: "#a6d868", roughness: 0.82, metalness: 0,
      envMapIntensity: 0.28, emissiveHex: "#1b3810", emissiveIntensity: 0.18,
      normalScale: 1.5, doubleSided: true,
    });
    return { geometry: part.geometry, material };
  }, [gltf]);
  useEffect(() => () => { asset.geometry.dispose(); asset.material.dispose(); }, [asset]);
  return <mesh name="ground-ecosystem" geometry={asset.geometry} material={asset.material}
    position={[0.22, 0.32, 0.12]} rotation={[0.02, -0.32, -0.01]}
    scale={[5.2, 3.95, 5.2]} receiveShadow />;
}
