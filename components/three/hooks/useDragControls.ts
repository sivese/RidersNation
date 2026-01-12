import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface UseDragControlsParams {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  orbitControls: OrbitControls | null;
  enabled: boolean;
}

export function useDragControls({
  scene,
  camera,
  renderer,
  orbitControls,
  enabled,
}: UseDragControlsParams) {
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const selectedObject = useRef<THREE.Object3D | null>(null);
  const isDragging = useRef(false);
  
  // 드래그 평면 (카메라를 향하는 평면)
  const dragPlane = useRef(new THREE.Plane());
  const offset = useRef(new THREE.Vector3());
  const intersection = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!renderer || !camera || !scene) return;
    
    const domElement = renderer.domElement;

    // 마우스 좌표를 정규화된 디바이스 좌표로 변환
    const updateMouse = (e: MouseEvent) => {
      const rect = domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Scene에서 드래그 가능한 메시들 찾기
    const getDraggableObjects = (): THREE.Object3D[] => {
      const objects: THREE.Object3D[] = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.draggable !== false) {
          objects.push(child);
        }
      });
      return objects;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (!enabled) return;
      
      updateMouse(e);
      raycaster.current.setFromCamera(mouse.current, camera);
      
      const draggableObjects = getDraggableObjects();
      const intersects = raycaster.current.intersectObjects(draggableObjects, true);
      
      if (intersects.length > 0) {
        // OrbitControls 비활성화
        if (orbitControls) {
          orbitControls.enabled = false;
        }
        
        isDragging.current = true;
        
        // 최상위 부모 또는 자기 자신 선택 (모델 전체를 움직이기 위해)
        let target = intersects[0].object;
        while (target.parent && target.parent !== scene) {
          target = target.parent;
        }
        selectedObject.current = target;
        
        // 카메라를 향하는 평면 설정
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        dragPlane.current.setFromNormalAndCoplanarPoint(
          cameraDirection.negate(),
          intersects[0].point
        );
        
        // 오프셋 계산 (클릭 지점과 객체 위치의 차이)
        if (raycaster.current.ray.intersectPlane(dragPlane.current, intersection.current)) {
          offset.current.copy(intersection.current).sub(selectedObject.current.position);
        }
        
        // 선택 시각적 피드백 (선택사항)
        domElement.style.cursor = 'grabbing';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      updateMouse(e);
      
      if (!enabled) return;
      
      // 드래그 중이면 객체 이동
      if (isDragging.current && selectedObject.current) {
        e.preventDefault();
        
        raycaster.current.setFromCamera(mouse.current, camera);
        
        if (raycaster.current.ray.intersectPlane(dragPlane.current, intersection.current)) {
          selectedObject.current.position.copy(intersection.current.sub(offset.current));
        }
        return;
      }
      
      // 호버 효과 (드래그 중이 아닐 때)
      raycaster.current.setFromCamera(mouse.current, camera);
      const draggableObjects = getDraggableObjects();
      const intersects = raycaster.current.intersectObjects(draggableObjects, true);
      
      domElement.style.cursor = intersects.length > 0 ? 'grab' : 'default';
    };

    const onMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        selectedObject.current = null;
        domElement.style.cursor = 'default';
        
        // OrbitControls 복원
        if (orbitControls && enabled) {
          // object 모드에서는 OrbitControls 비활성 유지
          orbitControls.enabled = false;
        }
      }
    };

    // 마우스가 캔버스를 벗어났을 때
    const onMouseLeave = () => {
      if (isDragging.current) {
        isDragging.current = false;
        selectedObject.current = null;
        domElement.style.cursor = 'default';
      }
    };

    domElement.addEventListener('mousedown', onMouseDown);
    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('mouseleave', onMouseLeave);

    return () => {
      domElement.removeEventListener('mousedown', onMouseDown);
      domElement.removeEventListener('mousemove', onMouseMove);
      domElement.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [scene, camera, renderer, orbitControls, enabled]);

  return {
    selectedObject,
    isDragging,
  };
}