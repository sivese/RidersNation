"use client";

import { useRef, useState, useEffect } from 'react';
import { Model3DViewerProps, EditMode } from './types';
import { useThreeScene } from './hooks/useThreeScene';
import { useModelLoader } from './hooks/useModelLoader';
import { useViewMode } from './hooks/useViewMode';
import { useDragControls } from './hooks/useDragControls';
import {
  ViewModeToolbar,
  ModelSelector,
  LoadingOverlay,
  EmptyState,
} from './components';

export function Model3DViewer({
  modelOptions = [],
  selectedModelId,
  onModelSelect,
  onModelDelete,
  className = '',
  autoRotate = false,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState<EditMode>('camera');

  // Scene 초기화
  const { scene, camera, renderer, controls } = useThreeScene({
    containerRef,
    autoRotate,
  });

  // 모델 로딩
  const currentModelUrl = selectedModelId
    ? modelOptions.find((m) => m.id === selectedModelId)?.url
    : modelOptions[0]?.url || null;

  const { model, originalMaterials, isLoading } = useModelLoader({
    scene: scene.current,
    modelUrl: currentModelUrl,
  });

  // 뷰 모드
  const { viewMode, setViewMode } = useViewMode({
    model,
    originalMaterials,
  });

  // 드래그 컨트롤
  useEffect(() => {
    if (controls.current) {
      controls.current.enabled = editMode === 'camera';
    }
  }, [editMode, controls]);

  useDragControls({
    scene: scene.current,
    camera: camera.current,
    renderer: renderer.current,
    orbitControls: controls.current,
    enabled: editMode === 'object',
  });

  return (
    <div className={`relative ${className}`}>
      <ViewModeToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        editMode={editMode}
        onEditModeChange={setEditMode}
      />

      <div className="relative">
        <div
          ref={containerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-border"
          style={{ minHeight: '600px' }}
        />

        <ModelSelector
          models={modelOptions}
          selectedModelId={selectedModelId}
          onSelect={onModelSelect}
          onDelete={onModelDelete}
        />

        {modelOptions.length === 0 && !isLoading && <EmptyState />}

        {isLoading && <LoadingOverlay />}
      </div>
    </div>
  );
}