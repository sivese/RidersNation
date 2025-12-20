import { RefObject, useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function useThreeScene(containerRef: RefObject<HTMLDivElement>) {
  const sceneRef    = useRef<THREE.Scene>(null);
  const cameraRef   = useRef<THREE.PerspectiveCamera>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const controlsRef = useRef<OrbitControls>(null);

  useEffect(() => {
    return () => { /* cleanup */ };
  }, []);

  return { scene: sceneRef, camera: cameraRef, renderer: rendererRef, controls: controlsRef };
}