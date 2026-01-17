// debug/page.tsx
"use client";
import { useState } from "react";
import { Model3DViewer } from "@/components/three";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useMotorcycleConfig,
  usePartInstances,
  calculateTotalPrice,
  PART_CATEGORIES,
  CATEGORY_ORDER,
  PartOption,
  PartCategory,
  InstalledPart,
} from "@/domains/motorcycle";

// 트랜스폼 에디터 컴포넌트
function TransformEditor({
  part,
  onUpdate,
}: {
  part: InstalledPart;
  onUpdate: (updates: Partial<InstalledPart>) => void;
}) {
  return (
    <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
      <h3 className="font-semibold text-sm text-gray-300">트랜스폼</h3>

      {/* Position */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">위치 (Position)</label>
        <div className="grid grid-cols-3 gap-2">
          {(['x', 'y', 'z'] as const).map(axis => (
            <div key={axis}>
              <label className="text-xs text-gray-500 uppercase">{axis}</label>
              <Input
                type="number"
                step={0.1}
                value={part.position[axis]}
                onChange={(e) => onUpdate({
                  position: {
                    ...part.position,
                    [axis]: parseFloat(e.target.value) || 0,
                  },
                })}
                className="h-8 bg-gray-800 border-gray-700 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">회전 (Rotation °)</label>
        <div className="grid grid-cols-3 gap-2">
          {(['x', 'y', 'z'] as const).map(axis => (
            <div key={axis}>
              <label className="text-xs text-gray-500 uppercase">{axis}</label>
              <Input
                type="number"
                step={15}
                value={Math.round((part.rotation[axis] * 180) / Math.PI)}
                onChange={(e) => {
                  const degrees = parseFloat(e.target.value) || 0;
                  const radians = (degrees * Math.PI) / 180;
                  onUpdate({
                    rotation: {
                      ...part.rotation,
                      [axis]: radians,
                    },
                  });
                }}
                className="h-8 bg-gray-800 border-gray-700 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-xs text-gray-400">스케일 (Scale)</label>
          <span className="text-xs text-gray-500">{part.scale.toFixed(2)}</span>
        </div>
        <Slider
          value={[part.scale]}
          min={0.1}
          max={5}
          step={0.05}
          onValueChange={([value]) => onUpdate({ scale: value })}
          className="w-full"
        />
        <div className="flex gap-1">
          {[0.5, 1, 2, 3].map(preset => (
            <Button
              key={preset}
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={() => onUpdate({ scale: preset })}
            >
              {preset}x
            </Button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <Button
        size="sm"
        variant="ghost"
        className="w-full text-xs text-gray-400"
        onClick={() => onUpdate({
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
        })}
      >
        기본값으로 초기화
      </Button>
    </div>
  );
}

export default function DebugPage() {
  const [partOptions, setPartOptions] = useState<PartOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PartCategory>("frame");

  const {
    configuration,
    addPart,
    removePart,
    updatePart,
    getPartsByCategory,
    getInstalledOption,
  } = useMotorcycleConfig({ partOptions });

  const { modelOptions, instances } = usePartInstances(
    partOptions,
    configuration.parts
  );

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // 선택된 파츠 찾기
  const selectedPart = selectedPartId
    ? configuration.parts.find(p => p.id === selectedPartId)
    : null;

  const loadPartModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const categoryInfo = PART_CATEGORIES[selectedCategory];

    const newPartOption: PartOption = {
      id: `part-opt-${Date.now()}`,
      category: selectedCategory,
      name: file.name.replace('.glb', ''),
      brand: 'Custom',
      price: 0,
      modelUrl: localUrl,
      defaultTransform: {
        position: categoryInfo.defaultPosition,
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1,
      },
    };

    setPartOptions(prev => [...prev, newPartOption]);
    event.target.value = '';
  };

  const installPart = (optionId: string) => {
    const option = partOptions.find(o => o.id === optionId);
    if (!option) return;

    const newPartId = addPart(option.category, optionId);
    if (newPartId) {
      setSelectedPartId(newPartId);
    }
  };

  const handleInstanceUpdate = (updated: { id: string; position: { x: number; y: number; z: number } }) => {
    updatePart(updated.id, { position: updated.position });
  };

  // 선택된 파츠 트랜스폼 업데이트
  const handleTransformUpdate = (updates: Partial<InstalledPart>) => {
    if (selectedPartId) {
      updatePart(selectedPartId, updates);
    }
  };

  const totalPrice = calculateTotalPrice(configuration.parts, partOptions);

  const optionsByCategory = partOptions.reduce((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {} as Record<PartCategory, PartOption[]>);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* 좌측 - 파츠 라이브러리 */}
      <aside className="w-80 p-4 border-r border-gray-800 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">파츠 라이브러리</h1>

        <div className="mb-6 p-4 bg-gray-900 rounded-lg">
          <h2 className="font-semibold mb-3">파츠 모델 추가</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">카테고리</label>
              <Select
                value={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v as PartCategory)}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ORDER.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {PART_CATEGORIES[cat].nameKo}
                      {PART_CATEGORIES[cat].required && ' *'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">GLB 파일</label>
              <Input
                type="file"
                accept=".glb"
                onChange={loadPartModel}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {CATEGORY_ORDER.map(category => {
            const categoryInfo = PART_CATEGORIES[category];
            const options = optionsByCategory[category] || [];
            const installed = getPartsByCategory(category);

            if (options.length === 0) return null;

            return (
              <div key={category} className="p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {categoryInfo.nameKo}
                    {categoryInfo.required && <span className="text-red-400 ml-1">*</span>}
                  </span>
                  <span className="text-xs text-gray-500">
                    {installed.length}/{categoryInfo.maxCount}
                  </span>
                </div>
                <div className="space-y-1">
                  {options.map(opt => {
                    const isInstalled = installed.some(p => p.partOptionId === opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`
                          flex items-center justify-between p-2 rounded cursor-pointer
                          ${isInstalled
                            ? 'bg-blue-600/30 border border-blue-500'
                            : 'bg-gray-800 hover:bg-gray-700'}
                        `}
                        onClick={() => installPart(opt.id)}
                      >
                        <span className="text-sm truncate">{opt.name}</span>
                        {isInstalled && (
                          <span className="text-xs text-blue-400">장착됨</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* 중앙 - 3D 뷰어 */}
      <main className="flex-1 relative">
        <Model3DViewer
          modelOptions={modelOptions}
          instances={instances}
          selectedInstanceId={selectedPartId}
          onInstanceSelect={setSelectedPartId}
          onInstanceUpdate={handleInstanceUpdate}
          className="h-full"
        />
      </main>

      {/* 우측 - 구성 요약 + 트랜스폼 에디터 */}
      <aside className="w-80 p-4 border-l border-gray-800 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">구성 요약</h2>

        {/* 선택된 파츠 트랜스폼 에디터 */}
        {selectedPart && (
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">
              선택됨: {getInstalledOption(selectedPart.id)?.name}
            </div>
            <TransformEditor
              part={selectedPart}
              onUpdate={handleTransformUpdate}
            />
          </div>
        )}

        {/* 장착된 파츠 목록 */}
        <div className="space-y-2 mb-6">
          {configuration.parts.length === 0 ? (
            <p className="text-gray-500 text-sm">장착된 파츠가 없습니다</p>
          ) : (
            configuration.parts.map(part => {
              const option = getInstalledOption(part.id);
              const categoryInfo = PART_CATEGORIES[part.category];

              return (
                <div
                  key={part.id}
                  className={`
                    p-3 rounded-lg cursor-pointer
                    ${selectedPartId === part.id
                      ? 'bg-blue-600/30 border border-blue-500'
                      : 'bg-gray-900 hover:bg-gray-800'}
                  `}
                  onClick={() => setSelectedPartId(part.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-gray-400">{categoryInfo.nameKo}</div>
                      <div className="font-medium">{option?.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Scale: {part.scale.toFixed(2)}x
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        removePart(part.id);
                        if (selectedPartId === part.id) {
                          setSelectedPartId(null);
                        }
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 가격 */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">총 가격</span>
            <span className="text-xl font-bold text-green-400">
              ₩{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button className="w-full" variant="default">
            구성 저장
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              setPartOptions([]);
              setSelectedPartId(null);
            }}
          >
            초기화
          </Button>
        </div>
      </aside>
    </div>
  );
}