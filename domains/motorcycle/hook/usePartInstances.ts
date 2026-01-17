// domains/motorcycle/hooks/usePartInstances.ts

import { useMemo } from 'react';
import { ModelOption, ModelInstance } from '@/components/three/types';
import { PartOption, InstalledPart } from '../types';

// 도메인 데이터 → 3D 렌더링 데이터 변환
export function usePartInstances(
  partOptions: PartOption[],
  installedParts: InstalledPart[]
) {
  const modelOptions: ModelOption[] = useMemo(() => {
    return partOptions.map(opt => ({
      id: opt.id,
      name: opt.name,
      url: opt.modelUrl,
      thumbnail: opt.thumbnail,
    }));
  }, [partOptions]);

  const instances: ModelInstance[] = useMemo(() => {
    return installedParts.map(part => ({
      id: part.id,
      modelOptionId: part.partOptionId,
      position: part.position,
      rotation: part.rotation,
      scale: part.scale,
      metadata: {
        category: part.category,
        color: part.color,
      },
    }));
  }, [installedParts]);

  return { modelOptions, instances };
}