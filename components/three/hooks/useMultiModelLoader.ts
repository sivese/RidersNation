// hooks/useMultiModelLoader.ts
import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ModelOption, ModelInstance } from '../types';

interface UseMultiModelLoaderParams {
  scene: THREE.Scene | null;
  modelOptions: ModelOption[];
  instances: ModelInstance[];
  onInstanceLoaded?: (id: string, object: THREE.Group) => void;
}

export function useMultiModelLoader({
  scene,
  modelOptions,
  instances,
  onInstanceLoaded,
}: UseMultiModelLoaderParams) {
  const loadedModelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const originalMaterialsRef = useRef<Map<string, Map<THREE.Mesh, THREE.Material | THREE.Material[]>>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  
  // 모델 캐시 (같은 URL은 한 번만 로드)
  const modelCacheRef = useRef<Map<string, THREE.Group>>(new Map());

  const loadModel = useCallback(async (url: string): Promise<THREE.Group> => {
    // 캐시 확인
    if (modelCacheRef.current.has(url)) {
      return modelCacheRef.current.get(url)!.clone();
    }

    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          modelCacheRef.current.set(url, gltf.scene);
          resolve(gltf.scene.clone());
        },
        undefined,
        reject
      );
    });
  }, []);

  // 인스턴스 동기화
  useEffect(() => {
    if (!scene) return;

    const currentIds = new Set(instances.map(i => i.id));
    
    // 제거된 인스턴스 처리
    loadedModelsRef.current.forEach((obj, id) => {
      if (!currentIds.has(id)) {
        scene.remove(obj);
        loadedModelsRef.current.delete(id);
        originalMaterialsRef.current.delete(id);
      }
    });

    // 새 인스턴스 또는 업데이트된 인스턴스 처리
    instances.forEach(async (instance) => {
      const modelOption = modelOptions.find(m => m.id === instance.modelOptionId);
      if (!modelOption) return;

      const existingObj = loadedModelsRef.current.get(instance.id);
      
      if (existingObj) {
        // 위치/회전/스케일만 업데이트
        existingObj.position.set(instance.position.x, instance.position.y, instance.position.z);
        existingObj.rotation.set(instance.rotation.x, instance.rotation.y, instance.rotation.z);
        existingObj.scale.setScalar(instance.scale);
      } else {
        // 새로 로드
        setLoadingIds(prev => new Set(prev).add(instance.id));
        
        try {
          const model = await loadModel(modelOption.url);
          
          // 머티리얼 저장
          const materials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              materials.set(mesh, mesh.material);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });
          originalMaterialsRef.current.set(instance.id, materials);

          // 중앙 정렬 (내부 좌표계 기준)
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const baseScale = 3 / maxDim;
          
          model.children.forEach(child => {
            child.position.sub(center);
          });
          model.scale.setScalar(baseScale * instance.scale);

          // 인스턴스 트랜스폼 적용
          model.position.set(instance.position.x, instance.position.y, instance.position.z);
          model.rotation.set(instance.rotation.x, instance.rotation.y, instance.rotation.z);
          
          // userData에 인스턴스 ID 저장 (피킹용)
          model.userData.instanceId = instance.id;

          scene.add(model);
          loadedModelsRef.current.set(instance.id, model);
          onInstanceLoaded?.(instance.id, model);
          
        } catch (err) {
          console.error(`Failed to load model for instance ${instance.id}:`, err);
        } finally {
          setLoadingIds(prev => {
            const next = new Set(prev);
            next.delete(instance.id);
            return next;
          });
        }
      }
    });
  }, [scene, instances, modelOptions, loadModel, onInstanceLoaded]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scene) {
        loadedModelsRef.current.forEach(obj => scene.remove(obj));
      }
      loadedModelsRef.current.clear();
      originalMaterialsRef.current.clear();
    };
  }, [scene]);

  return {
    loadedModels: loadedModelsRef,
    originalMaterials: originalMaterialsRef,
    isLoading: loadingIds.size > 0,
    loadingIds,
  };
}