import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { showBoundingBox } from "../modular-system";
import {
  centerAndScaleModel,
  enableShadows,
  storeOriginalMaterials,
} from "../utils/sceneHelpers";

interface UseModelLoaderProps {
  modelUrl: string | null;
  sceneRef: React.RefObject<THREE.Scene | null>;
}

export const useModelLoader = ({ modelUrl, sceneRef }: UseModelLoaderProps) => {
  const modelRef = useRef<THREE.Group | null>(null);
  const originalMaterialsRef = useRef<
    Map<THREE.Mesh, THREE.Material | THREE.Material[]>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;

    setIsLoading(true);
    const scene = sceneRef.current;

    // Remove previous model
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current = null;
      originalMaterialsRef.current.clear();
    }

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Store original materials and enable shadows
        storeOriginalMaterials(model, originalMaterialsRef.current);
        enableShadows(model);

        // Center and scale model
        centerAndScaleModel(model);

        // Show bounding box
        showBoundingBox(model, scene);

        scene.add(model);
        modelRef.current = model;
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        setIsLoading(false);
      }
    );
  }, [modelUrl, sceneRef]);

  return {
    modelRef,
    originalMaterialsRef,
    isLoading,
  };
};
