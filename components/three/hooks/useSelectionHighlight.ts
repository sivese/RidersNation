import { useEffect } from "react";
import * as THREE from "three";

// hooks/useSelectionHighlight.ts
export function useSelectionHighlight({
  loadedModels,
  selectedInstanceId,
}: {
  loadedModels: Map<string, THREE.Group>;
  selectedInstanceId: string | null;
}) {
  useEffect(() => {
    loadedModels.forEach((obj, id) => {
      const isSelected = id === selectedInstanceId;
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // 아웃라인 효과나 emissive 색상으로 하이라이트
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.emissive.setHex(isSelected ? 0x333333 : 0x000000);
          }
        }
      });
    });
  }, [loadedModels, selectedInstanceId]);
}