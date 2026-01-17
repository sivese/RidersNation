"use client";
import { useState } from "react";
import { Model3DViewer } from "@/components/three";
import { DockingSpotMarkers } from "@/components/three/components/DockingSpotMarkers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  useDockingSpots,
  PART_CATEGORIES,
  CATEGORY_ORDER,
  PartOption,
  PartCategory,
} from "@/domains/motorcycle";

export default function DebugPage() {
  const [partOptions, setPartOptions] = useState<PartOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PartCategory>("frame");
  const [showDockingSpots, setShowDockingSpots] = useState(true);
  const [autoSnap, setAutoSnap] = useState(true);

  // 도킹 스팟 관리
  const {
    dockingSpots,
    findAvailableSpot,
    occupySpot,
    releaseSpot,
    getSpotByPartId,
  } = useDockingSpots();

  const {
    configuration,
    addPart,
    removePart,
    updatePart,
    getPartsByCategory,
  } = useMotorcycleConfig({ partOptions });

  const { modelOptions, instances } = usePartInstances(
    partOptions,
    configuration.parts
  );

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const selectedInstance = instances.find(inst => inst.id === selectedPartId);
  const selectedPart = configuration.parts.find(p => p.id === selectedPartId);

  // GLB 파일 로드 핸들러
  const loadPartModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      
      console.log('part category:', selectedCategory);
      var partPosition = PART_CATEGORIES[selectedCategory].defaultPosition;
      console.log('part default position:', partPosition);

      const newOption: PartOption = {
        id: `part-${Date.now()}`,
        name: fileName,
        category: selectedCategory,
        modelUrl: url,
        price: 0,
        defaultTransform: {
          position: partPosition,
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
        },
      };

      setPartOptions(prev => [...prev, newOption]);
      e.target.value = '';
      
      console.log('파츠 모델 추가됨:', newOption);
    } catch (error) {
      console.error('파츠 모델 로드 실패:', error);
      alert('파츠 모델을 로드하는데 실패했습니다.');
    }
  };

  // 파츠 설치 (도킹 스팟 자동 할당)
  const installPart = (optionId: string) => {
    const option = partOptions.find(o => o.id === optionId);
    if (!option) return;

    const newPartId = addPart(option.category, optionId);
    if (newPartId) {
      // 자동 스냅이 활성화된 경우 도킹 스팟에 스냅
      if (autoSnap) {
        const defaultSpot = PART_CATEGORIES[option.category].defaultPosition;

        updatePart(newPartId, {
          position: defaultSpot,
          rotation: { x: 0, y: 0, z: 0 },
        });
        
        occupySpot("none", newPartId);
      }
      setSelectedPartId(newPartId);
    }
  };

  // 파츠 제거 (도킹 스팟 해제)
  const handleRemovePart = (partId: string) => {
    releaseSpot(partId);
    removePart(partId);
    if (selectedPartId === partId) {
      setSelectedPartId(null);
    }
  };

  // 선택된 파츠를 가장 가까운 도킹 스팟에 스냅
  const snapToNearestSpot = () => {
    if (!selectedPart || !selectedInstance) return;

    const categorySpots = dockingSpots.filter(
      s => s.category === selectedPart.category && !s.occupied
    );

    if (categorySpots.length === 0) {
      alert('사용 가능한 도킹 스팟이 없습니다.');
      return;
    }

    // 가장 가까운 스팟 찾기
    const currentPos = selectedInstance.position;
    let nearestSpot = categorySpots[0];
    let minDistance = Infinity;

    categorySpots.forEach(spot => {
      const distance = Math.sqrt(
        Math.pow(spot.position.x - currentPos.x, 2) +
        Math.pow(spot.position.y - currentPos.y, 2) +
        Math.pow(spot.position.z - currentPos.z, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestSpot = spot;
      }
    });

    // 스냅
    updatePart(selectedPart.id, {
      position: nearestSpot.position,
      rotation: nearestSpot.rotation,
    });
    occupySpot(nearestSpot.id, selectedPart.id);
  };

  // 인스턴스 업데이트 (드래그 또는 슬라이더)
  const handleInstanceUpdate = (updated: { 
    id: string; 
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: number;
  }) => {
    updatePart(updated.id, updated);
  };

  // 스케일 업데이트
  const handleScaleChange = (value: number[]) => {
    if (selectedPartId) {
      handleInstanceUpdate({ id: selectedPartId, scale: value[0] });
    }
  };

  // 회전 업데이트
  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number[]) => {
    if (selectedPartId && selectedInstance) {
      const currentRotation = selectedInstance.rotation;
      handleInstanceUpdate({ 
        id: selectedPartId,
        rotation: {
          ...currentRotation,
          [axis]: value[0] * (Math.PI / 180), // 각도를 라디안으로 변환
        },
      });
    }
  };

  // 기본값으로 리셋
  const handleResetTransform = () => {
    if (!selectedPartId || !selectedPart) return;
    
    // part의 partOptionId로 원본 PartOption 찾기
    const partOption = partOptions.find(opt => opt.id === selectedPart.partOptionId);
    
    if (partOption?.defaultTransform) {
      handleInstanceUpdate({
        id: selectedPartId,
        scale: partOption.defaultTransform.scale,
        rotation: partOption.defaultTransform.rotation,
        position: partOption.defaultTransform.position,
      });
    }
  };

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
                        flex items-center justify-between p-2 rounded cursor-pointer transition-colors
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

      {/* 도킹 스팟 설정 패널 */}
      <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-gray-700">
        <h3 className="font-semibold text-sm">도킹 시스템</h3>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="show-spots"
            checked={showDockingSpots}
            onCheckedChange={setShowDockingSpots}
          />
          <Label htmlFor="show-spots" className="text-sm cursor-pointer">
            도킹 스팟 표시
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="auto-snap"
            checked={autoSnap}
            onCheckedChange={setAutoSnap}
          />
          <Label htmlFor="auto-snap" className="text-sm cursor-pointer">
            자동 스냅
          </Label>
        </div>

        {selectedPart && (
          <Button
            size="sm"
            className="w-full"
            onClick={snapToNearestSpot}
            variant="secondary"
          >
            가까운 스팟에 스냅
          </Button>
        )}
      </div>
    </main>

    {/* 우측 사이드바 - 구성 요약 및 변형 컨트롤 */}
    <aside className="w-80 p-4 border-l border-gray-800 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">구성 요약</h2>

      {/* 선택된 파츠의 도킹 정보 */}
      {selectedPart && selectedPartId && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold mb-2">도킹 정보</h3>
          {(() => {
            const spot = getSpotByPartId(selectedPartId);
            return spot ? (
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>스팟:</span>
                  <span className="text-white">{spot.name}</span>
                </div>
                <div className="text-green-400 flex items-center gap-1">
                  <span>✓</span>
                  <span>도킹됨</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-yellow-400 flex items-center gap-1">
                <span>⚠</span>
                <span>도킹되지 않음</span>
              </div>
            );
          })()}
        </div>
      )}

      {/* 선택된 파츠 변형 컨트롤 */}
      {selectedInstance && selectedPart && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border-2 border-blue-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-400">
              선택된 파츠 조정
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePart(selectedPartId!);
              }}
            >
              ✕
            </Button>
          </div>
          
          <div className="text-sm text-gray-400 mb-4">
            {partOptions.find(opt => opt.id === selectedPart.partOptionId)?.name}
          </div>

          {/* Scale 슬라이더 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">크기 (Scale)</label>
              <span className="text-sm text-blue-400 font-mono">
                {selectedInstance.scale.toFixed(2)}x
              </span>
            </div>
            <Slider
              value={[selectedInstance.scale]}
              onValueChange={handleScaleChange}
              min={0.1}
              max={3}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.1x</span>
              <span>3.0x</span>
            </div>
          </div>

          {/* Rotation 슬라이더들 */}
          <div className="space-y-4 mb-4">
            {/* X축 회전 (Pitch) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">X축 회전 (Pitch)</label>
                <span className="text-sm text-blue-400 font-mono">
                  {Math.round((selectedInstance.rotation.x * 180) / Math.PI)}°
                </span>
              </div>
              <Slider
                value={[(selectedInstance.rotation.x * 180) / Math.PI]}
                onValueChange={(value) => handleRotationChange('x', value)}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>

            {/* Y축 회전 (Yaw) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Y축 회전 (Yaw)</label>
                <span className="text-sm text-blue-400 font-mono">
                  {Math.round((selectedInstance.rotation.y * 180) / Math.PI)}°
                </span>
              </div>
              <Slider
                value={[(selectedInstance.rotation.y * 180) / Math.PI]}
                onValueChange={(value) => handleRotationChange('y', value)}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>

            {/* Z축 회전 (Roll) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Z축 회전 (Roll)</label>
                <span className="text-sm text-blue-400 font-mono">
                  {Math.round((selectedInstance.rotation.z * 180) / Math.PI)}°
                </span>
              </div>
              <Slider
                value={[(selectedInstance.rotation.z * 180) / Math.PI]}
                onValueChange={(value) => handleRotationChange('z', value)}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* 리셋 버튼 */}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleResetTransform}
          >
            기본값으로 리셋
          </Button>
        </div>
      )}

      {/* 장착된 파츠 목록 */}
      <div className="space-y-2 mb-6">
        <h3 className="font-semibold mb-2">장착된 파츠</h3>
        {configuration.parts.length === 0 ? (
          <p className="text-gray-500 text-sm">장착된 파츠가 없습니다</p>
        ) : (
          configuration.parts.map(part => {
            const option = partOptions.find(opt => opt.id === part.partOptionId);
            const categoryInfo = PART_CATEGORIES[part.category];
            const instance = instances.find(inst => inst.id === part.id);

            if (!instance) return null;

            return (
              <div
                key={part.id}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all
                  ${selectedPartId === part.id 
                    ? 'bg-blue-600/30 border-2 border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'bg-gray-900 hover:bg-gray-800 border-2 border-transparent'}
                `}
                onClick={() => setSelectedPartId(part.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-xs text-gray-400">{categoryInfo.nameKo}</div>
                    <div className="font-medium">{option?.name}</div>
                    <div className="text-xs text-gray-500 mt-1.5 space-y-0.5 font-mono">
                      <div>크기: {instance.scale.toFixed(2)}x</div>
                      <div className="flex gap-2">
                        <span>X: {Math.round((instance.rotation.x * 180) / Math.PI)}°</span>
                        <span>Y: {Math.round((instance.rotation.y * 180) / Math.PI)}°</span>
                        <span>Z: {Math.round((instance.rotation.z * 180) / Math.PI)}°</span>
                      </div>
                    </div>
                  </div>
                </div>
                {option?.price ? (
                  <div className="text-sm text-green-400 mt-2">
                    ₩{option.price.toLocaleString()}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* 액션 버튼들 */}
      <div className="space-y-2">
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