// domains/motorcycle/constants.ts

import { PartCategoryInfo, PartCategory } from './types';

export const PART_CATEGORIES: Record<PartCategory, PartCategoryInfo> = {
  frame: {
    id: 'frame',
    name: 'Frame',
    nameKo: '프레임',
    required: true,
    maxCount: 1,
    defaultPosition: { x: 0, y: 0, z: 0 },
  },
  tank: {
    id: 'tank',
    name: 'Fuel Tank',
    nameKo: '연료탱크',
    required: true,
    maxCount: 1,
    defaultPosition: { x: 0, y: 0.5, z: 0.3 },
  },
  seat: {
    id: 'seat',
    name: 'Seat',
    nameKo: '시트',
    required: true,
    maxCount: 1,
    defaultPosition: { x: 0, y: 0.4, z: -0.3 },
  },
  muffler: {
    id: 'muffler',
    name: 'Muffler',
    nameKo: '머플러',
    required: false,
    maxCount: 2,
    defaultPosition: { x: 0.3, y: -0.2, z: -0.5 },
  },
  handle: {
    id: 'handle',
    name: 'Handlebar',
    nameKo: '핸들바',
    required: true,
    maxCount: 1,
    defaultPosition: { x: 0, y: 0.8, z: 0.6 },
  },
  mirror: {
    id: 'mirror',
    name: 'Mirror',
    nameKo: '미러',
    required: false,
    maxCount: 2,
    defaultPosition: { x: 0.3, y: 0.9, z: 0.5 },
  },
  wheel: {
    id: 'wheel',
    name: 'Wheel',
    nameKo: '휠',
    required: true,
    maxCount: 2,
    defaultPosition: { x: 0, y: 0, z: 0 },
  },
  fender: {
    id: 'fender',
    name: 'Fender',
    nameKo: '펜더',
    required: false,
    maxCount: 2,
    defaultPosition: { x: 0, y: 0.3, z: 0.8 },
  },
  headlight: {
    id: 'headlight',
    name: 'Headlight',
    nameKo: '헤드라이트',
    required: false,
    maxCount: 1,
    defaultPosition: { x: 0, y: 0.5, z: 0.9 },
  },
  taillight: {
    id: 'taillight',
    name: 'Taillight',
    nameKo: '테일라이트',
    required: false,
    maxCount: 1,
    defaultPosition: { x: 0, y: 0.3, z: -0.8 },
  },
};

export const CATEGORY_ORDER: PartCategory[] = [
  'frame', 'tank', 'seat', 'handle', 'mirror',
  'muffler', 'wheel', 'fender', 'headlight', 'taillight'
];