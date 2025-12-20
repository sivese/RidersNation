import { RefObject, useEffect, useRef } from "react";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface UseThreeSceneParams {
  containerRef: RefObject<HTMLDivElement>;
  autoRotate?: boolean;
}

interface UseThreeSceneReturn {
  scene: RefObject<THREE.Scene | null>;
  camera: RefObject<THREE.PerspectiveCamera | null>;
  renderer: RefObject<THREE.WebGLRenderer | null>;
  controls: RefObject<OrbitControls | null>;
}

export function useThreeScene({
  containerRef,
  autoRotate = false,
}: UseThreeSceneParams): UseThreeSceneReturn {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
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
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 4;
    controlsRef.current = controls;

    // Lights
    setupLights(scene);

    // Grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerRef, autoRotate]);

  return {
    scene: sceneRef,
    camera: cameraRef,
    renderer: rendererRef,
    controls: controlsRef,
  };
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