"use client";
import { useRef, useState, useEffect } from 'react';
import { Model3DViewerProps, EditMode, ModelInstance } from './types';
import { useThreeScene } from './hooks/useThreeScene';
import { useMultiModelLoader } from './hooks/useMultiModelLoader';  // 변경
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
  instances = [],           // 추가
  selectedInstanceId,       // 추가 (selectedModelId 대신)
  onInstanceSelect,         // 추가
  onInstanceUpdate,         // 추가
  onInstanceDelete,         // 추가
  onModelSelect,
  onModelDelete,
  className = '',
  autoRotate = false,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState<EditMode>('camera');
  const [showBackground, setShowBackground] = useState(true);

  // Scene 초기화
  const { scene, camera, renderer, controls } = useThreeScene({
    containerRef,
    autoRotate,
    showBackground,
  });

  // 다중 모델 로딩 (변경된 부분)
  const { loadedModels, originalMaterials, isLoading } = useMultiModelLoader({
    scene,
    modelOptions,
    instances,
  });
  
  // 모델 로딩
  const currentModelUrl = selectedModelId
    ? modelOptions.find((m) => m.id === selectedModelId)?.url || null
    : modelOptions[0]?.url || null;

  const { model, originalMaterials, isLoading } = useModelLoader({
    scene: scene,
    modelUrl: currentModelUrl,
  });

  // 뷰 모드
  const { viewMode, setViewMode } = useViewMode({
    model,
    originalMaterials,
  });

  // 드래그 컨트롤
  useEffect(() => {
    if (controls) {
      controls.enabled = editMode === 'camera';
    }
  }, [editMode, controls]);

  useDragControls({
    scene,
    camera,
    renderer,
    orbitControls: controls,
    enabled: editMode === 'object',
  });

  return (
    <div className={`relative ${className}`}>
      <ViewModeToolbar
        viewMode={'normal'}
        onViewModeChange={() => {}}
        editMode={editMode}
        onEditModeChange={setEditMode}
        showBackground={showBackground}
        onShowBackgroundChange={setShowBackground}
      />
      <div className="relative">
        <div
          ref={containerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-border"
          style={{ minHeight: '600px' }}
        />
        <ModelSelector
          models={modelOptions}
          selectedModelId={selectedInstanceId}
          onSelect={onInstanceSelect}
          onDelete={onInstanceDelete}
        />
        {instances.length === 0 && !isLoading && <EmptyState />}
        {isLoading && <LoadingOverlay />}
      </div>
    </div>
  );
}