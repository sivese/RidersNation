// domains/motorcycle/hooks/useMotorcycleConfig.ts

import { useState, useCallback } from 'react';
import { 
  MotorcycleConfiguration, 
  InstalledPart, 
  PartOption, 
  PartCategory 
} from '../types';
import { PART_CATEGORIES } from '../constants';

interface UseMotorcycleConfigParams {
  initialConfig?: MotorcycleConfiguration;
  partOptions: PartOption[];
}

function createEmptyConfig(): MotorcycleConfiguration {
  return {
    id: `config-${Date.now()}`,
    name: '새 구성',
    parts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function useMotorcycleConfig({ 
  initialConfig, 
  partOptions 
}: UseMotorcycleConfigParams) {
  const [configuration, setConfiguration] = useState<MotorcycleConfiguration>(
    initialConfig || createEmptyConfig()
  );

  const addPart = useCallback((category: PartCategory, optionId: string) => {
    const option = partOptions.find(o => o.id === optionId);
    if (!option) return null;

    const categoryInfo = PART_CATEGORIES[category];
    
    let newPartId: string | null = null;

    setConfiguration(prev => {
      const existingCount = prev.parts.filter(p => p.category === category).length;
      let newParts = [...prev.parts];
      
      if (existingCount >= categoryInfo.maxCount) {
        const firstIndex = newParts.findIndex(p => p.category === category);
        if (firstIndex !== -1) {
          newParts.splice(firstIndex, 1);
        }
      }

      newPartId = `part-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      
      const newPart: InstalledPart = {
        id: newPartId,
        partOptionId: optionId,
        category,
        position: option.defaultTransform?.position || categoryInfo.defaultPosition,
        rotation: option.defaultTransform?.rotation || { x: 0, y: 0, z: 0 },
        scale: option.defaultTransform?.scale || 1,
      };

      return {
        ...prev,
        parts: [...newParts, newPart],
        updatedAt: new Date(),
      };
    });

    return newPartId;
  }, [partOptions]);

  const removePart = useCallback((partId: string) => {
    setConfiguration(prev => ({
      ...prev,
      parts: prev.parts.filter(p => p.id !== partId),
      updatedAt: new Date(),
    }));
  }, []);

  const updatePart = useCallback((partId: string, updates: Partial<InstalledPart>) => {
    setConfiguration(prev => ({
      ...prev,
      parts: prev.parts.map(p => 
        p.id === partId ? { ...p, ...updates } : p
      ),
      updatedAt: new Date(),
    }));
  }, []);

  const clearParts = useCallback(() => {
    setConfiguration(prev => ({
      ...prev,
      parts: [],
      updatedAt: new Date(),
    }));
  }, []);

  const getPartsByCategory = useCallback((category: PartCategory) => {
    return configuration.parts.filter(p => p.category === category);
  }, [configuration.parts]);

  const getInstalledOption = useCallback((partId: string) => {
    const part = configuration.parts.find(p => p.id === partId);
    if (!part) return null;
    return partOptions.find(o => o.id === part.partOptionId) || null;
  }, [configuration.parts, partOptions]);

  return {
    configuration,
    setConfiguration,
    addPart,
    removePart,
    updatePart,
    clearParts,
    getPartsByCategory,
    getInstalledOption,
  };
}