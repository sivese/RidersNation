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
    <main className="relative min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* -----------------------------------------------------------------
          DEBUG ROUTER PANEL (좌측 하단)
      ------------------------------------------------------------------ */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-end gap-2">
        {showDebug && (
          <div className="flex flex-col gap-1.5 md:gap-2 rounded-lg md:rounded-xl border border-gray-700 bg-gray-900/90 p-2.5 md:p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
            <div className="mb-1 md:mb-2 text-[9px] md:text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider">
              Debug Router
            </div>
            <div className="flex flex-col gap-1.5 md:gap-2">
              <button
                onClick={() => setScreen("splash")}
                className={`px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm rounded text-left transition-all ${
                  screen === "splash"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                1. Splash
              </button>
              <button
                onClick={() => setScreen("walkthrough")}
                className={`px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm rounded text-left transition-all ${
                  screen === "walkthrough"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                2. Walkthrough
              </button>
              <button
                onClick={() => setScreen("home")}
                className={`px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs lg:text-sm rounded text-left transition-all ${
                  screen === "home"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
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
            {/* 상태 강제 조작 (테스트용) */}
            {screen === "home" && (
              <div className="mt-1 md:mt-2 pt-1 md:pt-2 border-t border-gray-700 flex gap-2">
                <button
                  onClick={() => {
                    setIsLoading(false);
                    setShowWorkshop(false);
                  }}
                  className="text-[9px] md:text-[10px] bg-red-900/50 px-1.5 md:px-2 py-1 rounded"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
        >
          {showDebug ? <X size={16} className="md:w-[18px] md:h-[18px]" /> : <Settings size={16} className="md:w-[18px] md:h-[18px]" />}
        </button>
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

          {/* [Loading Popup] 
            - isLoading이 true일 때만 표시 
            - 검은색 네온 팝업 디자인
          */}
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300 p-4">
              <div className="relative w-full max-w-[90%] md:max-w-[500px] bg-black border border-cyan-500/30 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 text-center shadow-[0_0_50px_rgba(0,195,255,0.15)]">
                {/* Title */}
                <h3 className="text-gray-300 text-sm md:text-base lg:text-lg font-medium mb-4 md:mb-6 lg:mb-8 animate-pulse">
                  {loadingText}
                </h3>

                {/* Progress Bar and Percentage */}
                <div className="flex flex-col items-center justify-center mb-4 md:mb-6 lg:mb-8">
                  <div className="w-3/4 h-1.5 md:h-2 bg-gray-800 rounded-full overflow-hidden mb-3 md:mb-4 ring-1 ring-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_#00c3ff]"
                      style={{
                        width: `${progress}%`,
                        transition: "width 0.1s linear",
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                  <span className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-widest drop-shadow-md">
                    {progress}%
                  </span>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={handleCancelLoading}
                  className="px-3 py-1.5 md:px-4 md:py-1.5 lg:px-6 lg:py-2 rounded-full bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all text-[10px] md:text-xs lg:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
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