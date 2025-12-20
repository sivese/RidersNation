import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { showBoundingBox } from '../utils/modular-system';

interface UseModelLoaderParams {
  scene: THREE.Scene | null;
  modelUrl: string | null;
}

export function useModelLoader({ scene, modelUrl }: UseModelLoaderParams) {
    const modelRef = useRef<THREE.Group | null>(null);
    const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!modelUrl || !scene) return;

        setIsLoading(true);
        setError(null);

        // 이전 모델 제거
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

                    // 머티리얼 저장 및 그림자 설정
                    model.traverse((child) => {
                        if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        originalMaterialsRef.current.set(mesh, mesh.material);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        }
                    });

                    // 모델 중앙 정렬 및 스케일 조정
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 3 / maxDim;

                    model.scale.multiplyScalar(scale);
                    model.position.x = -center.x * scale;
                    model.position.y = -center.y * scale;
                    model.position.z = -center.z * scale;

                    showBoundingBox(model, scene);

                    scene.add(model);
                    modelRef.current = model;
                    setIsLoading(false);
                    },
                    undefined,
                    (err) => {
                        console.error('Error loading model:', err);
                        setError(err instanceof Error ? err : new Error('Failed to load model'));
                        setIsLoading(false);
                    }
                );

            // cleanup
            return () => {
                if (modelRef.current && scene) {
                scene.remove(modelRef.current);
            }
        };
    }, [modelUrl, scene]);

    return {
        model: modelRef,
        originalMaterials: originalMaterialsRef,
        isLoading,
        error,
    };
}