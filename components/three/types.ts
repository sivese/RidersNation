import * as THREE from 'three';

export interface ModelInstance {
  id: string;
  modelOptionId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
}

export interface Model3DViewerProps {
  modelOptions?: ModelOption[];
  instances?: ModelInstance[];           // 추가
  selectedInstanceId?: string | null;    // 추가
  onInstanceSelect?: (id: string) => void;
  onInstanceUpdate?: (instance: ModelInstance) => void;
  onInstanceDelete?: (id: string) => void;
  // 기존 props 유지
  selectedModelId?: string | null;
  onModelSelect?: (id: string) => void;
  onModelDelete?: (id: string) => void;
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  partType?: string;
}

export interface LightingSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalX: number;
  directionalY: number;
  directionalZ: number;
}

export type ViewMode = 'normal' | 'wireframe' | 'grayscale' | 'wireframe-grayscale';
export type EditMode = 'camera' | 'object';
