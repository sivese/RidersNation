// domains/motorcycle/index.ts

// Types
export * from './types';

// Constants
export { PART_CATEGORIES, CATEGORY_ORDER } from './constants';

// Hooks
export { useMotorcycleConfig } from './hook/useMotorcycleConfig';
export { usePartInstances } from './hook/usePartInstances';

// Utils
export { calculateTotalPrice, calculatePriceByCategory } from './utils/priceCalculator';
export { validateConfiguration } from './utils/configValidator';
export type { ValidationResult } from './utils/configValidator';