// domains/motorcycle/utils/configValidator.ts

import { MotorcycleConfiguration, PartOption, PartCategory } from '../types';
import { PART_CATEGORIES } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateConfiguration(
  config: MotorcycleConfiguration,
  partOptions: PartOption[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 필수 파츠 체크
  const installedCategories = new Set(config.parts.map(p => p.category));
  
  Object.values(PART_CATEGORIES).forEach(cat => {
    if (cat.required && !installedCategories.has(cat.id)) {
      errors.push(`필수 파츠 누락: ${cat.nameKo}`);
    }
  });

  // 유효한 파츠 옵션인지 체크
  config.parts.forEach(part => {
    const option = partOptions.find(o => o.id === part.partOptionId);
    if (!option) {
      errors.push(`존재하지 않는 파츠: ${part.partOptionId}`);
    }
  });

  // maxCount 초과 체크
  const countByCategory = config.parts.reduce((acc, part) => {
    acc[part.category] = (acc[part.category] || 0) + 1;
    return acc;
  }, {} as Record<PartCategory, number>);

  Object.entries(countByCategory).forEach(([cat, count]) => {
    const categoryInfo = PART_CATEGORIES[cat as PartCategory];
    if (count > categoryInfo.maxCount) {
      warnings.push(`${categoryInfo.nameKo} 최대 개수 초과 (${count}/${categoryInfo.maxCount})`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}