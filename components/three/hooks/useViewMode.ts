import { useState, useEffect, RefObject } from 'react';
import * as THREE from 'three';
import { ViewMode, LightingSettings } from '../types';
import { loadGrayscaleShader } from '../utils/shaders';

interface UseViewModeParams {
  model: RefObject<THREE.Group | null>;
  originalMaterials: RefObject<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>;
  lightingSettings?: LightingSettings;
}

const DEFAULT_LIGHTING: LightingSettings = {
  ambientIntensity: 0.5,
  directionalIntensity: 0.8,
  directionalX: 5,
  directionalY: 10,
  directionalZ: 5,
};

export function useViewMode({
  model,
  originalMaterials,
  lightingSettings = DEFAULT_LIGHTING,
}: UseViewModeParams) {
  const [viewMode, setViewMode] = useState<ViewMode>('normal');

  useEffect(() => {
    applyViewMode(viewMode);
  }, [viewMode, model.current]);

  const applyViewMode = async (mode: ViewMode) => {
    if (!model.current) return;

    const shader = (mode === 'grayscale' || mode === 'wireframe-grayscale')
      ? await loadGrayscaleShader()
      : null;

    model.current.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;

      const mesh = child as THREE.Mesh;
      const originalMaterial = originalMaterials.current.get(mesh);
      if (!originalMaterial) return;

      switch (mode) {
        case 'normal':
          mesh.material = originalMaterial;
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.wireframe = false;
          }
          break;

        case 'wireframe':
          mesh.material = originalMaterial;
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.wireframe = true;
          }
          break;

        case 'grayscale':
        case 'wireframe-grayscale':
          if (shader) {
            mesh.material = new THREE.ShaderMaterial({
              vertexShader: shader.vertexShader,
              fragmentShader: shader.fragmentShader,
              wireframe: mode === 'wireframe-grayscale',
              uniforms: {
                ambientIntensity: { value: lightingSettings.ambientIntensity },
                directionalIntensity: { value: lightingSettings.directionalIntensity },
                lightDirection: {
                  value: new THREE.Vector3(
                    lightingSettings.directionalX,
                    lightingSettings.directionalY,
                    lightingSettings.directionalZ
                  ).normalize(),
                },
              },
            });
          }
          break;
      }
    });
  };

  return {
    viewMode,
    setViewMode,
  };
}