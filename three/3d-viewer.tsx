"use client";

import { useRef, useEffect, useState } from "react"
import { Palette, Grid3x3, Box, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { showBoundingBox } from "./modular-system"
import { Mouse } from "./mouse"

export interface ModelOption {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  partType?: string;
}

interface Model3DViewerProps {
  modelOptions?: ModelOption[];
  selectedModelId?: string | null;
  onModelSelect?: (id: string) => void;
  onModelDelete?: (id: string) => void;
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
}

interface LightingSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalX: number;
  directionalY: number;
  directionalZ: number;
}

type ViewMode = 'normal' | 'wireframe' | 'grayscale' | 'wireframe-grayscale';
type EditMode = 'View' | 'Move';

const createGrayscaleShader = async () => {
  return {
    vertexShader: await fetch('/shaders/vertex_gray_scale.glsl').then(r => r.text()),
    fragmentShader: await fetch('/shaders/fragment_gray_scale.glsl').then(r => r.text()),
  };
};

// 파트 타입별 색상
const getPartTypeStyle = (partType?: string) => {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    exhaust: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      border: "border-blue-500",
    },
    seat: {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-500",
    },
    frame: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      border: "border-purple-500",
    },
    "full-bike": {
      bg: "bg-orange-100",
      text: "text-orange-700",
      border: "border-orange-500",
    },
  };
  return (
    styles[partType || ""] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-500",
    }
  );
};

export function Model3DViewer({
  modelOptions = [],
  selectedModelId,
  onModelSelect,
  onModelDelete,
  className = "",
  autoRotate = false,
}: Model3DViewerProps) {
  
  //const garageRef = useRef<THREE.Group | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // three really basic components
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  /* 
    raycaster and mouse vector 
    drag state management
  */
  const raycasterRef = useRef<THREE.Raycaster | null>(new THREE.Raycaster());
  const mouseRef = useRef<Mouse | null>(new Mouse());

  let selectedObjectRef = useRef<THREE.Object3D | null>(null);
  let isDraggingRef = useRef<boolean>(false);
  const planeRef = useRef<THREE.Plane | null>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionRef = useRef<THREE.Vector3 | null>(new THREE.Vector3());

  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const originalMaterialsRef = useRef<
    Map<THREE.Mesh, THREE.Material | THREE.Material[]>
  >(new Map());

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [lightingSettings] = useState<LightingSettings>({
    ambientIntensity: 0.5,
    directionalIntensity: 0.8,
    directionalX: 5,
    directionalY: 10,
    directionalZ: 5,
  });

  // 선택된 모델의 URL 계산 (부모에서 관리하는 selectedModelId 사용)
  const currentModelUrl = selectedModelId
    ? modelOptions.find((m) => m.id === selectedModelId)?.url
    : modelOptions[0]?.url || null;

  // Three.js initialization
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 기존 캔버스 제거
    const existingCanvas = container.querySelector("canvas");
    if (existingCanvas) {
      container.removeChild(existingCanvas);
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    /*
      Renderer and mouse event listeners for drag-drop
      Pile of bomb here...
    */
    renderer.domElement.addEventListener('mousedown', (e) => {
      mouseRef.current?.updatePosition(e);
      raycasterRef.current?.setFromCamera(mouseRef.current!.position, camera);

      const intersect = raycasterRef.current?.intersectObjects(scene.children);

      if(intersect && intersect.length > 0) {
        selectedObjectRef.current = intersect[0].object;
        isDraggingRef.current = true;

        planeRef.current?.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new THREE.Vector3()).negate(),
          selectedObjectRef.current.position
        );
      }
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
      if(!isDraggingRef.current || !selectedObjectRef.current) return;

      mouseRef.current?.updatePosition(e);
      raycasterRef.current?.setFromCamera(mouseRef.current!.position, camera);
      if(raycasterRef.current?.ray.intersectPlane(planeRef.current!, intersectionRef.current!)) {
        selectedObjectRef.current.position.copy(intersectionRef.current!);
      }
    });

    renderer.domElement.addEventListener('mouseup', () => {
      isDraggingRef.current = false;
      selectedObjectRef.current = null;
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 4;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 10, 0); // 바로 위에서
    spotLight.angle = Math.PI / 6; // 조명 각도 (좁을수록 집중)
    spotLight.penumbra = 0.5; // 가장자리 부드럽게
    spotLight.decay = 1.5;
    spotLight.distance = 30;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);

    // SpotLight 타겟 (바이크 위치)
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight.target);

    // 3. (선택) 보조 포인트 라이트 - 살짝 따뜻한 느낌
    const warmLight = new THREE.PointLight(0xffaa55, 0.3);
    warmLight.position.set(5, 3, 5);
    scene.add(warmLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

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
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  // 모델 로드
  useEffect(() => {
    if (!currentModelUrl || !sceneRef.current) return;

    setIsLoading(true);
    const scene = sceneRef.current;

    // 이전 모델 제거
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current = null;
      originalMaterialsRef.current.clear();
    }

    const loader = new GLTFLoader();
    loader.load(
      currentModelUrl,
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            originalMaterialsRef.current.set(mesh, mesh.material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        // 모델 중앙 정렬 및 스케일 조정 (석균-그리드와 박스 위치 조정 예정)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;

        model.scale.multiplyScalar(scale);
        model.position.x = -center.x * scale;
        model.position.y = -box.min.y * scale;
        model.position.z = -center.z * scale;

        showBoundingBox(model, scene);
        
        scene.add(model);
        modelRef.current = model;
        setIsLoading(false);
        applyViewMode(viewMode);
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        setIsLoading(false);
      }
    );
  }, [currentModelUrl]);
  

  // 뷰 모드 변경시 적용
  useEffect(() => {
    applyViewMode(viewMode);
  }, [viewMode]);

  const applyViewMode = (mode: ViewMode) => {
    if (!modelRef.current) return;

    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMaterial = originalMaterialsRef.current.get(mesh);
        if (!originalMaterial) return;

        switch (mode) {
          case "normal":
            mesh.material = originalMaterial;
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = false;
            }
            break;

          case "wireframe":
            mesh.material = originalMaterial;
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = true;
            }
            break;

          case "grayscale":
          case "wireframe-grayscale":
            mesh.material = new THREE.ShaderMaterial({
              ...createGrayscaleShader(),
              wireframe: mode === "wireframe-grayscale",
              uniforms: {
                ambientIntensity: { value: lightingSettings.ambientIntensity },
                directionalIntensity: {
                  value: lightingSettings.directionalIntensity,
                },
                lightDirection: {
                  value: new THREE.Vector3(
                    lightingSettings.directionalX,
                    lightingSettings.directionalY,
                    lightingSettings.directionalZ
                  ).normalize(),
                },
              },
            });
            break;
        }
      }
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* 뷰 모드 버튼들 */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <Button
          variant={viewMode === "normal" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("normal")}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Normal
        </Button>
        <Button
          variant={viewMode === "wireframe" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("wireframe")}
          className="gap-2"
        >
          <Grid3x3 className="h-4 w-4" />
          Wireframe
        </Button>
        <Button
          variant={viewMode === "grayscale" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grayscale")}
          className="gap-2"
        >
          <Palette className="h-4 w-4" />
          Grayscale
        </Button>
        <Button
          variant={viewMode === "wireframe-grayscale" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("wireframe-grayscale")}
          className="gap-2"
        >
          <Box className="h-4 w-4" />
          Wire+Gray
        </Button>
      </div>

      {/* 메인 컨테이너 */}
      <div className="relative">
        {/* 3D 뷰어 */}
        <div
          ref={containerRef}
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-border"
          style={{ minHeight: "600px" }}
        />

        {/* 오른쪽 상단 모델 선택 패널 */}
        {modelOptions.length > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-h-[450px] overflow-y-auto min-w-[180px]">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 border-b pb-2">
              Generated Models ({modelOptions.length})
            </h3>
            <div className="flex flex-col gap-2">
              {modelOptions.map((model) => {
                const style = getPartTypeStyle(model.partType);
                const isSelected = selectedModelId === model.id;

                return (
                  <div
                    key={model.id}
                    className={`
                      relative flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer
                      hover:shadow-md
                      ${
                        isSelected
                          ? `${style.bg} border-2 ${style.border}`
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }
                    `}
                    onClick={() => onModelSelect?.(model.id)}
                  >
                    {/* 썸네일 */}
                    {model.thumbnail ? (
                      <img
                        src={model.thumbnail}
                        alt={model.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-md flex items-center justify-center ${style.bg}`}
                      >
                        <Box className={`h-6 w-6 ${style.text}`} />
                      </div>
                    )}

                    {/* 모델 정보 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {model.name}
                      </p>
                      {model.partType && (
                        <span
                          className={`
                          inline-block text-xs px-2 py-0.5 rounded-full mt-1
                          ${style.bg} ${style.text}
                        `}
                        >
                          {model.partType}
                        </span>
                      )}
                    </div>

                    {/* delete button */}
                    {onModelDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onModelDelete(model.id);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* information when no models */}
        {modelOptions.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Box className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No models generated yet</p>
              <p className="text-sm">Upload an image and generate 3D models</p>
            </div>
          </div>
        )}

        {/* loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2" />
              <p>Loading model...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
