// domains/motorcycle/index.ts

// Types
export * from './types';

// Constants
export { PART_CATEGORIES, CATEGORY_ORDER } from './constants';

// Hooks
export { useMotorcycleConfig } from './hook/useMotorcycleConfig';
export { usePartInstances } from './hook/usePartInstances';
export { useDockingSpots } from './hook/useDockingSpots';

// Utils
export { validateConfiguration } from './utils/configValidator';
export type { ValidationResult } from './utils/configValidator';