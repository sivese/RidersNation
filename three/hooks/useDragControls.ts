import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Mouse } from "../mouse";

interface UseDragControlsProps {
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  sceneRef: React.RefObject<THREE.Scene | null>;
}

export const useDragControls = ({
  rendererRef,
  cameraRef,
  sceneRef,
}: UseDragControlsProps) => {
  const raycasterRef = useRef<THREE.Raycaster | null>(new THREE.Raycaster());
  const mouseRef = useRef<Mouse | null>(new Mouse());
  const selectedObjectRef = useRef<THREE.Object3D | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const planeRef = useRef<THREE.Plane | null>(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  );
  const intersectionRef = useRef<THREE.Vector3 | null>(new THREE.Vector3());

  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current?.updatePosition(e);
      raycasterRef.current?.setFromCamera(mouseRef.current!.position, camera);

      const intersect = raycasterRef.current?.intersectObjects(scene.children);

      if (intersect && intersect.length > 0) {
        selectedObjectRef.current = intersect[0].object;
        isDraggingRef.current = true;

        planeRef.current?.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new THREE.Vector3()).negate(),
          selectedObjectRef.current.position
        );
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !selectedObjectRef.current) return;

      mouseRef.current?.updatePosition(e);
      raycasterRef.current?.setFromCamera(mouseRef.current!.position, camera);
      if (
        raycasterRef.current?.ray.intersectPlane(
          planeRef.current!,
          intersectionRef.current!
        )
      ) {
        selectedObjectRef.current.position.copy(intersectionRef.current!);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      selectedObjectRef.current = null;
    };

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    renderer.domElement.addEventListener("mousemove", handleMouseMove);
    renderer.domElement.addEventListener("mouseup", handleMouseUp);

    return () => {
      renderer.domElement.removeEventListener("mousedown", handleMouseDown);
      renderer.domElement.removeEventListener("mousemove", handleMouseMove);
      renderer.domElement.removeEventListener("mouseup", handleMouseUp);
    };
  }, [rendererRef, cameraRef, sceneRef]);

  return {
    raycasterRef,
    mouseRef,
    selectedObjectRef,
    isDraggingRef,
  };
};
