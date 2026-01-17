// domains/motorcycle/types.ts

export type PartCategory = 
  | 'frame' | 'seat' | 'muffler' | 'handle' 
  | 'mirror' | 'tank' | 'wheel' | 'fender' 
  | 'headlight' | 'taillight' | 'engine' 
  | 'exhaust' | 'dashboard' | 'brake'
  | 'wheel_front' | 'wheel_rear';

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

// 도킹 스팟 정의
export interface DockingSpot {
  id: string;
  name: string;
  category: PartCategory; // 이 스팟에 장착 가능한 파츠 카테고리
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  occupied: boolean; // 현재 파츠가 장착되어 있는지
  occupiedByPartId?: string; // 장착된 파츠 ID
}

export interface FrameConfiguration {
  framePartId?: string;
  dockingSpots: DockingSpot[];
}