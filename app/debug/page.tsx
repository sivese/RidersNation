// debug/page.tsx
"use client";
import { useState } from "react";
import { Model3DViewer } from "@/components/three";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "@/domains/motorcycle";

export default function DebugPage() {
  // 파츠 옵션 (로드된 모델들)
  const [partOptions, setPartOptions] = useState<PartOption[]>([]);
  
  // 파일 업로드 시 선택할 카테고리
  const [selectedCategory, setSelectedCategory] = useState<PartCategory>("frame");
  
  // 오토바이 구성 관리
  const {
    configuration,
    addPart,
    removePart,
    updatePart,
    getPartsByCategory,
    getInstalledOption,
  } = useMotorcycleConfig({ partOptions });

  // 3D 뷰어용 데이터 변환
  const { modelOptions, instances } = usePartInstances(
    partOptions,
    configuration.parts
  );

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  // 모델 파일 로드 → 파츠 옵션으로 등록
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
    
    // 파일 input 초기화
    event.target.value = '';
  };

  // 파츠 옵션을 씬에 설치
  const installPart = (optionId: string) => {
    const option = partOptions.find(o => o.id === optionId);
    if (!option) return;

    const newPartId = addPart(option.category, optionId);
    if (newPartId) {
      setSelectedPartId(newPartId);
    }
  };

  // 인스턴스 위치 업데이트 (드래그 후)
  const handleInstanceUpdate = (updated: { id: string; position: { x: number; y: number; z: number } }) => {
    updatePart(updated.id, { position: updated.position });
  };

  const totalPrice = calculateTotalPrice(configuration.parts, partOptions);

  // 카테고리별 파츠 옵션 그룹화
  const optionsByCategory = partOptions.reduce((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {} as Record<PartCategory, PartOption[]>);

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* 좌측 사이드바 - 파츠 라이브러리 */}
      <aside className="w-80 p-4 border-r border-gray-800 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">파츠 라이브러리</h1>

        {/* 파츠 업로드 */}
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

        {/* 카테고리별 파츠 목록 */}
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

      {/* 우측 사이드바 - 구성 요약 */}
      <aside className="w-72 p-4 border-l border-gray-800 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">구성 요약</h2>

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
                  {option?.price ? (
                    <div className="text-sm text-green-400 mt-1">
                      ₩{option.price.toLocaleString()}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* 가격 합계 */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">총 가격</span>
            <span className="text-xl font-bold text-green-400">
              ₩{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 액션 버튼들 */}
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