// domains/motorcycle/utils/priceCalculator.ts

import { InstalledPart, PartOption } from '../types';

export function calculateTotalPrice(
  parts: InstalledPart[],
  partOptions: PartOption[]
): number {
  return parts.reduce((sum, part) => {
    const option = partOptions.find(o => o.id === part.partOptionId);
    return sum + (option?.price || 0);
  }, 0);
}

export function calculatePriceByCategory(
  parts: InstalledPart[],
  partOptions: PartOption[]
): Record<string, number> {
  return parts.reduce((acc, part) => {
    const option = partOptions.find(o => o.id === part.partOptionId);
    if (option) {
      acc[part.category] = (acc[part.category] || 0) + option.price;
    }
    return acc;
  }, {} as Record<string, number>);
}