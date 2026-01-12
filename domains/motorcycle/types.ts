// domains/motorcycle/types.ts

export type PartCategory = 
  | 'frame' | 'seat' | 'muffler' | 'handle' 
  | 'mirror' | 'tank' | 'wheel' | 'fender' 
  | 'headlight' | 'taillight';

export interface PartCategoryInfo {
  id: PartCategory;
  name: string;
  nameKo: string;
  required: boolean;
  maxCount: number;
  defaultPosition: { x: number; y: number; z: number };
}

export interface PartOption {
  id: string;
  category: PartCategory;
  name: string;
  brand?: string;
  price: number;
  modelUrl: string;
  thumbnail?: string;
  description?: string;
  colors?: string[];
  defaultTransform?: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    scale: number;
  };
}

export interface InstalledPart {
  id: string;
  partOptionId: string;
  category: PartCategory;
  color?: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

export interface MotorcycleConfiguration {
  id: string;
  name: string;
  baseModel?: string;
  parts: InstalledPart[];
  createdAt: Date;
  updatedAt: Date;
}