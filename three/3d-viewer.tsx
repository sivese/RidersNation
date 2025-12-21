"use client";

import { useRef } from "react";
import { Model3DViewerProps, ModelOption } from "./types";
import { useThreeScene } from "./hooks/useThreeScene";
import { useModelLoader } from "./hooks/useModelLoader";
import { useDragControls } from "./hooks/useDragControls";
import { useViewModel } from "./hooks/useViewModel";
import { ViewModeToolbar } from "./components/ViewModeToolbar";
import { ModelSelector } from "./components/ModelSelector";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { EmptyState } from "./components/EmptyState";

// Re-export types for convenience
export type { ModelOption, Model3DViewerProps };

export function Model3DViewer({
  modelOptions = [],
  selectedModelId,
  onModelSelect,
  onModelDelete,
  className = "",
  autoRotate = false,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Three.js scene
  const { sceneRef, cameraRef, rendererRef } = useThreeScene({
    containerRef,
    autoRotate,
  });

  // Calculate current model URL
  const currentModelUrl = selectedModelId
    ? modelOptions.find((m) => m.id === selectedModelId)?.url || null
    : modelOptions[0]?.url || null;

  // Load model
  const { modelRef, originalMaterialsRef, isLoading } = useModelLoader({
    modelUrl: currentModelUrl,
    sceneRef,
  });

  // Setup drag controls
  useDragControls({
    rendererRef,
    cameraRef,
    sceneRef,
  });

  // Setup view mode
  const { viewMode, setViewMode } = useViewModel({
    modelRef,
    originalMaterialsRef,
  });

  return (
    <div className={`relative ${className}`}>
      {/* View Mode Toolbar */}
      <ViewModeToolbar viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Main Container */}
      <div className="relative">
        {/* 3D Viewer */}
        <div
          ref={containerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-border"
          style={{ minHeight: "600px" }}
        />

        {/* Model Selector Panel */}
        <ModelSelector
          modelOptions={modelOptions}
          selectedModelId={selectedModelId || null}
          onModelSelect={onModelSelect || (() => {})}
          onModelDelete={onModelDelete}
        />

        {/* Empty State */}
        <EmptyState show={modelOptions.length === 0 && !isLoading} />

        {/* Loading Overlay */}
        <LoadingOverlay isLoading={isLoading} />
      </div>
    </div>
  );
}
