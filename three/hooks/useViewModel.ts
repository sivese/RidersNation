import { useState, useEffect } from "react";
import * as THREE from "three";
import { ViewMode, LightingSettings } from "../types";
import { createGrayscaleShader } from "../utils/materials";

interface UseViewModeProps {
  modelRef: React.RefObject<THREE.Group | null>;
  originalMaterialsRef: React.RefObject<
    Map<THREE.Mesh, THREE.Material | THREE.Material[]>
  >;
}

export const useViewModel = ({
  modelRef,
  originalMaterialsRef,
}: UseViewModeProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [lightingSettings] = useState<LightingSettings>({
    ambientIntensity: 0.5,
    directionalIntensity: 0.8,
    directionalX: 5,
    directionalY: 10,
    directionalZ: 5,
  });

  const applyViewMode = (mode: ViewMode) => {
    if (!modelRef.current) return;

    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMaterial = originalMaterialsRef.current?.get(mesh);
        if (!originalMaterial) return;

        switch (mode) {
          case "normal":
            mesh.material = originalMaterial;
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = false;
            }
            break;

          case "wireframe":
            mesh.material = originalMaterial;
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = true;
            }
            break;

          case "grayscale":
          case "wireframe-grayscale":
            mesh.material = new THREE.ShaderMaterial({
              ...createGrayscaleShader(),
              wireframe: mode === "wireframe-grayscale",
              uniforms: {
                ambientIntensity: { value: lightingSettings.ambientIntensity },
                directionalIntensity: {
                  value: lightingSettings.directionalIntensity,
                },
                lightDirection: {
                  value: new THREE.Vector3(
                    lightingSettings.directionalX,
                    lightingSettings.directionalY,
                    lightingSettings.directionalZ
                  ).normalize(),
                },
              },
            });
            break;
        }
      }
    });
  };

  useEffect(() => {
    applyViewMode(viewMode);
  }, [viewMode, modelRef, originalMaterialsRef]);

  return {
    viewMode,
    setViewMode,
  };
};
