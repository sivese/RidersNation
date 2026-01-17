import { useState, useEffect } from 'react';
import { DockingSpot, PartCategory } from '../types';

// 기본 도킹 스팟 템플릿 (프레임 기준)
const DEFAULT_DOCKING_SPOTS: Omit<DockingSpot, 'id' | 'occupied' | 'occupiedByPartId'>[] = [
  // 엔진 위치
  {
    name: '엔진 장착부',
    category: 'engine',
    position: { x: 0, y: -0.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // 시트 위치
  {
    name: '시트 장착부',
    category: 'seat',
    position: { x: 0, y: 0.8, z: -0.5 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // 머플러 위치
  {
    name: '머플러 장착부 (좌)',
    category: 'exhaust',
    position: { x: -0.3, y: -0.2, z: -1 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  {
    name: '머플러 장착부 (우)',
    category: 'exhaust',
    position: { x: 0.3, y: -0.2, z: -1 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // 핸들 위치
  {
    name: '핸들 장착부',
    category: 'handle',
    position: { x: 0, y: 1.2, z: 0.8 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // 앞바퀴 위치
  {
    name: '앞바퀴 장착부',
    category: 'wheel_front',
    position: { x: 0, y: -0.5, z: 1.2 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // 뒷바퀴 위치
  {
    name: '뒷바퀴 장착부',
    category: 'wheel_rear',
    position: { x: 0, y: -0.5, z: -1.2 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // 헤드라이트 위치
  {
    name: '헤드라이트 장착부',
    category: 'headlight',
    position: { x: 0, y: 1, z: 1.5 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // 테일라이트 위치
  {
    name: '테일라이트 장착부',
    category: 'taillight',
    position: { x: 0, y: 0.8, z: -1.5 },
    rotation: { x: 0, y: Math.PI, z: 0 },
  },
];

export function useDockingSpots() {
  const [dockingSpots, setDockingSpots] = useState<DockingSpot[]>([]);

  // 초기화
  useEffect(() => {
    const initialSpots: DockingSpot[] = DEFAULT_DOCKING_SPOTS.map((spot, index) => ({
      ...spot,
      id: `dock-${spot.category}-${index}`,
      occupied: false,
    }));
    setDockingSpots(initialSpots);
  }, []);

  // 도킹 스팟 업데이트
  const updateDockingSpot = (spotId: string, updates: Partial<DockingSpot>) => {
    setDockingSpots(prev =>
      prev.map(spot => (spot.id === spotId ? { ...spot, ...updates } : spot))
    );
  };

  // 특정 카테고리의 빈 도킹 스팟 찾기
  const findAvailableSpot = (category: PartCategory): DockingSpot | null => {
    return dockingSpots.find(spot => spot.category === category && !spot.occupied) || null;
  };

  // 도킹 스팟 점유
  const occupySpot = (spotId: string, partId: string) => {
    updateDockingSpot(spotId, { occupied: true, occupiedByPartId: partId });
  };

  // 도킹 스팟 해제
  const releaseSpot = (partId: string) => {
    const spot = dockingSpots.find(s => s.occupiedByPartId === partId);
    if (spot) {
      updateDockingSpot(spot.id, { occupied: false, occupiedByPartId: undefined });
    }
  };

  // 파츠 ID로 도킹 스팟 찾기
  const getSpotByPartId = (partId: string): DockingSpot | null => {
    return dockingSpots.find(s => s.occupiedByPartId === partId) || null;
  };

  // 카테고리별 모든 스팟 가져오기
  const getSpotsByCategory = (category: PartCategory): DockingSpot[] => {
    return dockingSpots.filter(spot => spot.category === category);
  };

  return {
    dockingSpots,
    updateDockingSpot,
    findAvailableSpot,
    occupySpot,
    releaseSpot,
    getSpotByPartId,
    getSpotsByCategory,
  };
}