import { RefObject, useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface UseThreeSceneParams {
  containerRef: RefObject<HTMLDivElement>;
  autoRotate?: boolean;
}

interface UseThreeSceneReturn {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControls | null;
}

export function useThreeScene({
  containerRef,
  autoRotate = false,
}: UseThreeSceneParams): UseThreeSceneReturn {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 기존 캔버스 제거
    const existingCanvas = container.querySelector('canvas');
    if (existingCanvas) {
      container.removeChild(existingCanvas);
    }

    // Scene
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0xf5f5f5);

    // Camera
    const newCamera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    newCamera.position.set(0, 5, 8);
    newCamera.lookAt(0, 0, 0);

    // Renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    newRenderer.setSize(container.clientWidth, container.clientHeight);
    newRenderer.shadowMap.enabled = true;
    container.appendChild(newRenderer.domElement);

    // Controls
    const newControls = new OrbitControls(newCamera, newRenderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.autoRotate = autoRotate;
    newControls.autoRotateSpeed = 4;

    // Lights
    setupLights(newScene);

    // Grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    newScene.add(gridHelper);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);
    setControls(newControls);

    // Animation loop
    let animationFrameId : number;
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      newControls.update();
      newRenderer.render(newScene, newCamera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      newCamera.aspect = width / height;
      newCamera.updateProjectionMatrix();
      newRenderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      newRenderer.dispose();
      newControls.dispose();

      if (container.contains(newRenderer.domElement)) {
        container.removeChild(newRenderer.domElement);
      }

      setScene(null);
      setCamera(null);
      setRenderer(null);
      setControls(null);
    };
  }, [containerRef, autoRotate]);

  return { scene, camera, renderer, controls };
}

// 조명 설정 헬퍼
function setupLights(scene: THREE.Scene) {
  // Ambient
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  // Spot light
  const spotLight = new THREE.SpotLight(0xffffff, 2);
  spotLight.position.set(0, 10, 0);
  spotLight.angle = Math.PI / 6;
  spotLight.penumbra = 0.5;
  spotLight.decay = 1.5;
  spotLight.distance = 30;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  scene.add(spotLight);

  spotLight.target.position.set(0, 0, 0);
  scene.add(spotLight.target);

  // Warm point light
  const warmLight = new THREE.PointLight(0xffaa55, 0.3);
  warmLight.position.set(5, 3, 5);
  scene.add(warmLight);

  // Directional
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}