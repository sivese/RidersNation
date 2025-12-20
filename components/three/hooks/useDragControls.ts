import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Mouse } from '../utils/mouse';

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
    const mouse     = useRef(new Mouse());
    const selectedObject = useRef<THREE.Object3D | null>(null);
    const isDragging = useRef(false);
    const plane = useRef(new THREE.Plane());
    const intersection = useRef(new THREE.Vector3());
  
    useEffect(() => {
        if (!renderer || !camera || !scene) return;

        const domElement = renderer.domElement;

        const onMouseDown = (e: MouseEvent) => {
            if (!enabled) return;

            mouse.current.updatePosition(e, domElement);
            raycaster.current.setFromCamera(mouse.current.position, camera);

            const intersects = raycaster.current.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                // GridHelper 등 제외
                const hit = intersects.find(
                    (i) => !(i.object instanceof THREE.GridHelper)
                );
                
                if (hit) {
                    selectedObject.current = hit.object;
                    isDragging.current = true;

                    // OrbitControls 비활성화
                    if (orbitControls) {
                        orbitControls.enabled = false;
                    }

                    // 드래그 평면 설정
                    plane.current.setFromNormalAndCoplanarPoint(
                        camera.getWorldDirection(new THREE.Vector3()).negate(),
                        hit.point
                    );
                }
            }
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!enabled || !isDragging.current || !selectedObject.current) return;

            mouse.current.updatePosition(e, domElement);
            raycaster.current.setFromCamera(mouse.current.position, camera);

            if (raycaster.current.ray.intersectPlane(plane.current, intersection.current)) {
                selectedObject.current.position.copy(intersection.current);
            }
        };

        const onMouseUp = () => {
            isDragging.current = false;
            selectedObject.current = null;

            // OrbitControls 복원 (camera 모드일 때만 활성화되도록 외부에서 관리)
            if (orbitControls && !enabled) {
                orbitControls.enabled = true;
            }
        };

        domElement.addEventListener('mousedown', onMouseDown);
        domElement.addEventListener('mousemove', onMouseMove);
        domElement.addEventListener('mouseup', onMouseUp);

        return () => {
            domElement.removeEventListener('mousedown', onMouseDown);
            domElement.removeEventListener('mousemove', onMouseMove);
            domElement.removeEventListener('mouseup', onMouseUp);
        };
    }, [scene, camera, renderer, orbitControls, enabled]);

    return {
        selectedObject: selectedObject.current,
        isDragging: isDragging.current,
        mouse,
    };
}