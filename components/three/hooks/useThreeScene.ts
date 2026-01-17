import { RefObject, useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface UseThreeSceneParams {
  containerRef: RefObject<HTMLDivElement>;
  autoRotate?: boolean;
  showBackground?: boolean;
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
  showBackground = true,
}: UseThreeSceneParams): UseThreeSceneReturn {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const backgroundRef = useRef<THREE.Group | null>(null);
  const bottomLightRef = useRef<THREE.DirectionalLight | null>(null);

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
    newScene.background = new THREE.Color(0x1f1f1f);

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
    newRenderer.toneMapping = THREE.ACESFilmicToneMapping; 
    newRenderer.toneMappingExposure = 1.4; 
    newRenderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(newRenderer.domElement);

    // Controls
    const newControls = new OrbitControls(newCamera, newRenderer.domElement);
    newControls.enableDamping = true;
    newControls.dampingFactor = 0.05;
    newControls.autoRotate = autoRotate;
    newControls.autoRotateSpeed = 4;

    // Lights
    setupLights(newScene);

    // Bottom light for viewing from below
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0);
    bottomLight.position.set(0, -5, 0);
    bottomLight.target.position.set(0, 0, 0);
    newScene.add(bottomLight);
    newScene.add(bottomLight.target);
    bottomLightRef.current = bottomLight;

    // // Grid
    // const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    // newScene.add(gridHelper);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);
    setControls(newControls);

    const loader = new GLTFLoader();

    // public 폴더 기준 경로 (예: /models/studio.glb)
    loader.load('/models/showcase.glb', (gltf) => {
    const model = gltf.scene;

    // 2. 그림자 설정 (모델의 모든 파츠를 순회하며 그림자 켜기)
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;    // 그림자를 만듦
        child.receiveShadow = true; // 그림자를 받음 (바닥 등)
        
        // 재질이 너무 어두우면 강제로 밝게 조정 (옵션)
        // const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        // mat.envMapIntensity = 1.0; 
      }
    });

      // 모델 위치/크기 조정
      model.scale.set(3, 3, 3); 
      model.position.set(0, 0, 0);

      // Store background reference for visibility control
      backgroundRef.current = model;

      newScene.add(model);
    }, undefined, (error) => {
      console.error('모델 로드 에러:', error);
    });

    // Animation loop
    let animationFrameId : number;
    
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      newControls.update();

      // Background visibility control and dynamic bottom light
      if (backgroundRef.current && bottomLightRef.current) {
        if (!showBackground || newCamera.position.y < 0.5) {
          // If showBackground is false OR camera is below floor
          backgroundRef.current.visible = false;
          bottomLightRef.current.intensity = 1.0; // Turn ON bottom light
        } else {
          // Otherwise, show the background and turn off bottom light
          backgroundRef.current.visible = true;
          bottomLightRef.current.intensity = 0; // Turn OFF bottom light
        }
      }

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
  }, [containerRef, autoRotate, showBackground]);

  return { scene, camera, renderer, controls };
}

// 조명 설정 헬퍼
function setupLights(scene: THREE.Scene) {

  scene.fog = new THREE.FogExp2(0x0a0a0a,0.05);
  // Ambient
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
  scene.add(ambientLight);

  // Spot light
  const spotLight = new THREE.SpotLight(0xffffff, 500);
  spotLight.position.set(0, 10, 0);
  spotLight.angle = Math.PI / 8;
  spotLight.penumbra = 1;
  spotLight.decay = 2;
  spotLight.distance = 50;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.bias = -0.0001;
  scene.add(spotLight);

  spotLight.target.position.set(0, 0, 0);
  scene.add(spotLight.target);

  // // Warm point light
  // const warmLight = new THREE.PointLight(0xffaa55, 0.3);
  // warmLight.position.set(5, 3, 5);
  // scene.add(warmLight);

  // // Directional
  // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
  // directionalLight.position.set(5, 10, 5);
  // directionalLight.castShadow = true;
  // scene.add(directionalLight);

  
}