import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DockingSpot } from '@/domains/motorcycle';

interface DockingSpotMarkersProps {
  scene: THREE.Scene | null;
  dockingSpots: DockingSpot[];
  visible?: boolean;
}

export function DockingSpotMarkers({
  scene,
  dockingSpots,
  visible = true,
}: DockingSpotMarkersProps) {
  const markersRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    if (!scene || !visible) {
      // 마커 제거
      markersRef.current.forEach(marker => scene?.remove(marker));
      markersRef.current.clear();
      return;
    }

    // 기존 마커 업데이트 또는 생성
    dockingSpots.forEach(spot => {
      let marker = markersRef.current.get(spot.id);

      if (!marker) {
        // 새 마커 생성
        marker = createDockingMarker(spot);
        scene.add(marker);
        markersRef.current.set(spot.id, marker);
      }

      // 위치 및 회전 업데이트
      marker.position.set(spot.position.x, spot.position.y, spot.position.z);
      marker.rotation.set(spot.rotation.x, spot.rotation.y, spot.rotation.z);

      // 점유 상태에 따라 색상 변경
      const mesh = marker.children[0] as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(spot.occupied ? 0xff0000 : 0x00ff00);
      material.opacity = spot.occupied ? 0.3 : 0.6;
    });

    // 삭제된 스팟의 마커 제거
    const currentSpotIds = new Set(dockingSpots.map(s => s.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentSpotIds.has(id)) {
        scene.remove(marker);
        markersRef.current.delete(id);
      }
    });
  }, [scene, dockingSpots, visible]);

  // 클린업
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => scene?.remove(marker));
      markersRef.current.clear();
    };
  }, [scene]);

  return null;
}

// 도킹 마커 생성 헬퍼
function createDockingMarker(spot: DockingSpot): THREE.Group {
  const group = new THREE.Group();

  // 구형 마커
  const geometry = new THREE.SphereGeometry(0.1, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: spot.occupied ? 0xff0000 : 0x00ff00,
    transparent: true,
    opacity: spot.occupied ? 0.3 : 0.6,
  });
  const sphere = new THREE.Mesh(geometry, material);
  group.add(sphere);

  // 링 (방향 표시)
  const ringGeometry = new THREE.RingGeometry(0.12, 0.15, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // 화살표 (위쪽 방향)
  const arrowHelper = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    0.3,
    0xffff00,
    0.1,
    0.05
  );
  group.add(arrowHelper);

  group.userData.spotId = spot.id;
  group.userData.category = spot.category;

  return group;
}