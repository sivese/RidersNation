export interface ModelOption {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  partType?: string;
}

export interface Model3DViewerProps {
  modelOptions?: ModelOption[];
  selectedModelId?: string | null;
  onModelSelect?: (id: string) => void;
  onModelDelete?: (id: string) => void;
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
}

export interface LightingSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalX: number;
  directionalY: number;
  directionalZ: number;
}

export type ViewMode =
  | "normal"
  | "wireframe"
  | "grayscale"
  | "wireframe-grayscale";
export type EditMode = "View" | "Move";
