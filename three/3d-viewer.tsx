/**
 * ============================================
 * 3D 모델 뷰어 컴포넌트
 * ============================================
 * 
 * Three.js를 사용하여 GLB 형식의 3D 모델을 표시하고 상호작용할 수 있게 하는 컴포넌트
 * 
 * 주요 기능:
 * 1. 3D 모델 로드 및 표시
 * 2. 마우스로 모델 회전, 확대/축소 (OrbitControls)
 * 3. 다양한 뷰 모드: Normal, Wireframe, Grayscale, Wire+Gray
 * 4. 자동 회전 옵션
 * 5. 섀도우 및 라이팅 설정
 * 6. 로컬 GLB 파일 업로드
 */
"use client"

import { useRef, useEffect, useState } from "react"
import { Sun, Lightbulb, Palette, Grid3x3, Box, Eye, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

/**
 * ============================================
 * 타입 정의 (Interfaces & Types)
 * ============================================
 */

/**
 * Model3DViewer 컴포넌트의 Props 인터페이스
 * @property modelUrl - 3D 모델의 URL (선택사항)
 * @property className - CSS 클래스명
 * @property showControls - 컨트롤 표시 여부
 * @property autoRotate - 자동 회전 여부
 */
interface Model3DViewerProps {
  modelUrl?: string;
  className?: string;
  showControls?: boolean;
  autoRotate?: boolean;
}

/**
 * 라이팅 설정 인터페이스
 * 3D 모델의 조명 및 렌더링 설정을 관리합니다
 */
interface LightingSettings {
  ambientIntensity: number;      // 주변 조명의 밝기 (0~1)
  directionalIntensity: number;  // 방향성 조명의 밝기 (0~1)
  directionalX: number;          // 방향성 조명의 X 위치
  directionalY: number;          // 방향성 조명의 Y 위치
  directionalZ: number;          // 방향성 조명의 Z 위치
  saturation: number;            // 채도
  exposure: number;              // 노출도
}

/**
 * 뷰 모드 타입 정의
 * - normal: 원본 텍스처와 색상으로 표시
 * - wireframe: 와이어프레임 모드 (폴리곤 구조 표시)
 * - grayscale: 흑백 모드
 * - wireframe-grayscale: 와이어프레임 + 흑백 모드 조합
 */
type ViewMode = 'normal' | 'wireframe' | 'grayscale' | 'wireframe-grayscale';

/**
 * ============================================
 * 셰이더 함수
 * ============================================
 */

/**
 * 그레이스케일 셰이더 생성 함수
 * GLSL 코드를 사용하여 그레이스케일 효과를 구현합니다
 * 
 * Vertex Shader: 정점 위치 및 노멀값을 계산하여 전달
 * Fragment Shader: 픽셀 색상을 조명 기반의 흑백 색상으로 계산
 * 
 * @returns {Object} vertexShader와 fragmentShader 문자열을 포함하는 객체
 */
const createGrayscaleShader = () => {
  return {
    // Vertex Shader: 정점 정보를 처리하는 셰이더
    vertexShader: `
      // varying 변수: Fragment Shader로 전달될 변수들
      varying vec2 vUv;           // UV 좌표 (텍스처 매핑용)
      varying vec3 vNormal;       // 정점의 노멀 벡터
      varying vec3 vPosition;     // 카메라 공간에서의 정점 위치
      
      void main() {
        vUv = uv;
        // normalMatrix를 사용하여 노멀 벡터를 올바르게 변환
        vNormal = normalize(normalMatrix * normal);
        // 모델 뷰 행렬을 적용하여 카메라 공간의 위치 계산
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        // 최종 정점 위치 계산
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    // Fragment Shader: 픽셀 색상을 계산하는 셰이더
    fragmentShader: `
      // Uniform 변수: 모든 픽셀에 동일한 값
      uniform float ambientIntensity;
      uniform float directionalIntensity;
      uniform vec3 lightDirection;
      
      // varying 변수: Vertex Shader에서 전달받은 값 (보간됨)
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // 노멀 벡터 정규화
        vec3 normal = normalize(vNormal);
        // 라이트 방향 정규화
        vec3 lightDir = normalize(lightDirection);
        
        // 주변 조명(Ambient Light) 계산
        // 모든 표면에 균일하게 적용되는 기본 밝기
        float ambient = ambientIntensity;
        
        // 확산 조명(Diffuse Light) 계산
        // 노멀 벡터와 라이트 방향의 내적으로 표면 밝기 결정
        float diff = max(dot(normal, lightDir), 0.0);
        float diffuse = diff * directionalIntensity;
        
        // 최종 밝기 = 주변조명 + 확산조명
        float brightness = ambient + diffuse;
        // 0.0 ~ 1.0 범위로 제한
        brightness = clamp(brightness, 0.0, 1.0);
        
        // 흑백 색상 생성 (RGB 모두 동일한 값 = 그레이)
        // 0.7 배수는 적절한 대비를 위한 조정값
        vec3 gray = vec3(brightness * 0.7);
        
        // 최종 픽셀 색상 설정 (알파값 1.0 = 완전 불투명)
        gl_FragColor = vec4(gray, 1.0);
      }
    `
  };
};

/**
 * ============================================
 * 메인 컴포넌트 함수
 * ============================================
 */

export function Model3DViewer({ 
  modelUrl, 
  className = "", 
  showControls = true,
  autoRotate = false 
}: Model3DViewerProps) {
  
  /**
   * ============================================
   * Ref 정의 (DOM 및 Three.js 객체 참조)
   * ============================================
   */

  // DOM 요소 참조
  const containerRef = useRef<HTMLDivElement>(null);  // 3D 캔버스를 포함할 컨테이너
  
  // Three.js 메인 객체들
  const sceneRef = useRef<THREE.Scene | null>(null);             // 3D 장면
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);  // WebGL 렌더러
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null); // 카메라
  const controlsRef = useRef<OrbitControls | null>(null);        // 마우스 컨트롤
  
  // 조명 객체들
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);           // 주변 조명
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);   // 방향성 조명
  
  // 모델 및 애니메이션
  const modelRef = useRef<THREE.Group | null>(null);           // 로드된 3D 모델
  const animationFrameRef = useRef<number | null>(null);       // 애니메이션 루프 ID
  
  // 원본 재질 저장 (나중에 뷰 모드 변경시 복구하기 위함)
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

  /**
   * ============================================
   * State 정의 (상태 관리)
   * ============================================
   */

  const [isLoading, setIsLoading] = useState(false);                    // 모델 로딩 중 여부
  const [viewMode, setViewMode] = useState<ViewMode>('normal');        // 현재 뷰 모드
  
  // 라이팅 설정 상태
  const [lightingSettings, setLightingSettings] = useState<LightingSettings>({
    ambientIntensity: 0.5,
    directionalIntensity: 0.8,
    directionalX: 5,
    directionalY: 10,
    directionalZ: 5,
    saturation: 1,
    exposure: 1,
  });
  
  // 현재 모델 URL (props로 받은 URL 또는 업로드된 파일)
  const [currentModelUrl, setCurrentModelUrl] = useState<string | null>(modelUrl || null);

  /**
   * ============================================
   * useEffect: Three.js 장면 초기화
   * ============================================
   * 
   * 컴포넌트 마운트시 실행되어 Three.js 장면을 설정합니다.
   * - Scene, Camera, Renderer 생성
   * - 조명 설정
   * - OrbitControls 설정
   * - 애니메이션 루프 시작
   * - 리사이즈 이벤트 처리
   */
  useEffect(() => {
    if (!containerRef.current) return;

    // ============================================
    // 1. 장면(Scene) 생성 및 설정
    // ============================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);  // 밝은 회색 배경
    scene.fog = new THREE.Fog(0xffffff, 100, 200); // 거리 안개 효과
    sceneRef.current = scene;

    // ============================================
    // 2. 카메라(Camera) 생성 및 설정
    // ============================================
    // 원근 카메라: 3D 원근감을 표현
    // 파라미터: FOV(시야각), 비율, near(가까운 거리), far(먼 거리)
    const camera = new THREE.PerspectiveCamera(
      75,  // 수직 시야각
      containerRef.current.clientWidth / containerRef.current.clientHeight,  // 종횡비
      0.1,   // 가까운 클리핑 평면
      1000   // 먼 클리핑 평면
    );
    // 카메라 위치 설정 (X, Y, Z)
    camera.position.set(0, 5, 8);
    camera.lookAt(0, 0, 0);  // 원점을 바라보도록 설정
    cameraRef.current = camera;

    // ============================================
    // 3. 렌더러(Renderer) 생성 및 설정
    // ============================================
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;        // 그림자 렌더링 활성화
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;  // PCF 그림자 품질
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ============================================
    // 4. 마우스 컨트롤(OrbitControls) 설정
    // ============================================
    // 마우스로 모델을 회전, 확대/축소, 팬할 수 있게 함
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;      // 부드러운 감속 효과
    controls.dampingFactor = 0.05;      // 감속 정도 (작을수록 느림)
    controls.autoRotate = autoRotate;   // 자동 회전 여부
    controls.autoRotateSpeed = 4;       // 자동 회전 속도
    controlsRef.current = controls;

    // ============================================
    // 5. 조명(Lighting) 설정
    // ============================================
    
    // 주변 조명: 모든 방향에서 균일하게 빛남
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // 방향성 조명: 특정 방향에서 나오는 빛 (태양 같은 효과)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);  // 조명 위치
    directionalLight.castShadow = true;       // 그림자 생성 가능하게 설정
    directionalLight.shadow.mapSize.width = 2048;   // 그림자 맵 해상도 (가로)
    directionalLight.shadow.mapSize.height = 2048;  // 그림자 맵 해상도 (세로)
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    // ============================================
    // 6. 헬퍼 객체 추가
    // ============================================
    
    // 격자 표시 (바닥 표현)
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.name = 'grid';
    scene.add(gridHelper);

    // 조명 방향 표시 (디버깅용, 기본적으로 숨김)
    const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
    lightHelper.name = 'lightHelper';
    lightHelper.visible = false;
    scene.add(lightHelper);

    // ============================================
    // 7. 애니메이션 루프 시작
    // ============================================
    // 매 프레임마다 실행되어 3D 렌더링을 계속함
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();              // 컨트롤 상태 업데이트
      renderer.render(scene, camera); // 현재 상태를 렌더링
    };
    animate();

    // ============================================
    // 8. 윈도우 리사이즈 처리
    // ============================================
    // 브라우저 창 크기 변경시 3D 뷰도 맞춰서 조정
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      // 카메라 비율 업데이트
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // 렌더러 크기 업데이트
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // ============================================
    // 9. 정리 함수 (Cleanup)
    // ============================================
    // 컴포넌트 언마운트시 리소스 정리
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer) {
        renderer.dispose();  // GPU 리소스 해제
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);  // autoRotate가 변경될 때만 재실행

  /**
   * ============================================
   * useEffect: 3D 모델 로드
   * ============================================
   * 
   * modelUrl이 변경되면 새 모델을 로드합니다.
   * - 이전 모델 제거
   * - GLTFLoader로 새 모델 로드
   * - 모델 재질 저장
   * - 모델 위치 및 스케일 조정 (중앙 정렬)
   * - 현재 뷰 모드 적용
   */
  useEffect(() => {
    if (!currentModelUrl || !sceneRef.current) return;

    setIsLoading(true);

    const scene = sceneRef.current;
    
    // ============================================
    // 1. 이전 모델 제거
    // ============================================
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current = null;
      originalMaterialsRef.current.clear();  // 저장된 재질 초기화
    }

    // ============================================
    // 2. 모델 로드
    // ============================================
    const loader = new GLTFLoader();
    loader.load(
      currentModelUrl,
      // 로드 성공 콜백
      (gltf) => {
        console.log('Model loaded successfully');
        const model = gltf.scene;
        model.name = 'loaded-model';

        // ============================================
        // 3. 모델의 모든 메시에 대해 설정
        // ============================================
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            // 원본 재질 저장 (나중에 뷰 모드 변경시 사용)
            originalMaterialsRef.current.set(mesh, mesh.material);
            // 그림자 설정
            mesh.castShadow = true;      // 다른 객체에 그림자 투영
            mesh.receiveShadow = true;   // 다른 객체의 그림자를 받음
          }
        });

        // ============================================
        // 4. 모델 위치 및 스케일 조정
        // ============================================
        // 모델을 화면 중앙에 배치하고 적절한 크기로 조정
        const box = new THREE.Box3().setFromObject(model);  // 모델의 경계 박스
        const center = box.getCenter(new THREE.Vector3());  // 중심점
        const size = box.getSize(new THREE.Vector3());      // 크기

        // 가장 긴 축을 기준으로 스케일 계산
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;  // 3 유닛 크기로 정규화
        model.scale.multiplyScalar(scale);

        // 중심이 원점에 오도록 위치 조정
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;

        scene.add(model);
        modelRef.current = model;
        setIsLoading(false);

        // ============================================
        // 5. 현재 뷰 모드 적용
        // ============================================
        applyViewMode(viewMode);
      },
      // 로딩 진행 콜백 (진행률 추적)
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
      },
      // 로드 실패 콜백
      (error) => {
        console.error('Error loading model:', error);
        setIsLoading(false);
      }
    );
  }, [currentModelUrl, viewMode]);

  /**
   * ============================================
   * 함수: 뷰 모드 적용
   * ============================================
   * 
   * 선택된 뷰 모드에 따라 모델의 재질을 변경합니다.
   * 모드에 따라 다른 렌더링 방식을 적용합니다.
   * 
   * @param mode - 적용할 뷰 모드 (normal, wireframe, grayscale, wireframe-grayscale)
   */
  const applyViewMode = (mode: ViewMode) => {
    if (!modelRef.current) return;

    const model = modelRef.current;

    // 모델의 모든 메시에 대해 뷰 모드 적용
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMaterial = originalMaterialsRef.current.get(mesh);
        
        if (!originalMaterial) return;

        switch (mode) {
          // ============================================
          // Normal 모드: 원본 텍스처와 색상 표시
          // ============================================
          case 'normal':
            mesh.material = originalMaterial;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.wireframe = false;
                }
              });
            } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = false;
            }
            break;

          // ============================================
          // Wireframe 모드: 폴리곤 구조 표시
          // ============================================
          case 'wireframe':
            mesh.material = originalMaterial;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.wireframe = true;  // 와이어프레임 모드 활성화
                }
              });
            } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = true;
            }
            break;

          // ============================================
          // Grayscale 모드: 흑백 표시
          // ============================================
          case 'grayscale':
            if (Array.isArray(mesh.material)) {
              // 다중 재질인 경우 각각 그레이스케일 셰이더 적용
              mesh.material = mesh.material.map(() => {
                const shaderMat = new THREE.ShaderMaterial({
                  ...createGrayscaleShader(),
                  uniforms: {
                    ambientIntensity: { value: lightingSettings.ambientIntensity },
                    directionalIntensity: { value: lightingSettings.directionalIntensity },
                    lightDirection: { value: new THREE.Vector3(lightingSettings.directionalX, lightingSettings.directionalY, lightingSettings.directionalZ).normalize() },
                  }
                });
                return shaderMat;
              });
            } else {
              // 단일 재질인 경우
              mesh.material = new THREE.ShaderMaterial({
                ...createGrayscaleShader(),
                uniforms: {
                  ambientIntensity: { value: lightingSettings.ambientIntensity },
                  directionalIntensity: { value: lightingSettings.directionalIntensity },
                  lightDirection: { value: new THREE.Vector3(lightingSettings.directionalX, lightingSettings.directionalY, lightingSettings.directionalZ).normalize() },
                }
              });
            }
            break;

          // ============================================
          // Wireframe + Grayscale 모드: 와이어프레임 + 흑백 조합
          // ============================================
          case 'wireframe-grayscale':
            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map(() => {
                const shaderMat = new THREE.ShaderMaterial({
                  ...createGrayscaleShader(),
                  wireframe: true,  // 와이어프레임 모드 활성화
                  uniforms: {
                    ambientIntensity: { value: lightingSettings.ambientIntensity },
                    directionalIntensity: { value: lightingSettings.directionalIntensity },
                    lightDirection: { value: new THREE.Vector3(lightingSettings.directionalX, lightingSettings.directionalY, lightingSettings.directionalZ).normalize() },
                  }
                });
                return shaderMat;
              });
            } else {
              mesh.material = new THREE.ShaderMaterial({
                ...createGrayscaleShader(),
                wireframe: true,
                uniforms: {
                  ambientIntensity: { value: lightingSettings.ambientIntensity },
                  directionalIntensity: { value: lightingSettings.directionalIntensity },
                  lightDirection: { value: new THREE.Vector3(lightingSettings.directionalX, lightingSettings.directionalY, lightingSettings.directionalZ).normalize() },
                }
              });
            }
            break;
        }
      }
    });
  };

  /**
   * ============================================
   * 함수: 로컬 파일 업로드 처리
   * ============================================
   * 
   * 사용자가 선택한 GLB 파일을 읽어서 Three.js에서 사용할 수 있는 URL로 변환합니다.
   * FileReader API를 사용하여 파일을 Blob URL로 변환합니다.
   * 
   * @param e - 파일 입력 이벤트
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // .glb 파일 확장자 체크
    if (file && file.name.endsWith('.glb')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // ArrayBuffer를 Blob으로 변환
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        // Blob을 URL로 변환 (데이터 URL 대신 Object URL 사용)
        const url = URL.createObjectURL(blob);
        // 모델 URL 업데이트 (이렇게 하면 useEffect가 트리거되어 모델 로드)
        setCurrentModelUrl(url);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Please select a .glb file');
    }
  };

  /**
   * ============================================
   * JSX 렌더링
   * ============================================
   */
  return (
    <div className={className}>
      <div className="mb-4 flex flex-col gap-4">
        {/* 뷰 모드 선택 버튼들 */}
        <div className="flex gap-2 flex-wrap">
          {/* Normal 모드 버튼 */}
          <Button
            variant={viewMode === 'normal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('normal');
              applyViewMode('normal');
            }}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Normal
          </Button>

          {/* Wireframe 모드 버튼 */}
          <Button
            variant={viewMode === 'wireframe' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('wireframe');
              applyViewMode('wireframe');
            }}
            className="gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            Wireframe
          </Button>

          {/* Grayscale 모드 버튼 */}
          <Button
            variant={viewMode === 'grayscale' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('grayscale');
              applyViewMode('grayscale');
            }}
            className="gap-2"
          >
            <Palette className="h-4 w-4" />
            Grayscale
          </Button>

          {/* Wireframe + Grayscale 모드 버튼 */}
          <Button
            variant={viewMode === 'wireframe-grayscale' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('wireframe-grayscale');
              applyViewMode('wireframe-grayscale');
            }}
            className="gap-2"
          >
            <Box className="h-4 w-4" />
            Wire+Gray
          </Button>
        </div>
      </div>

      {/* 3D 렌더링이 표시될 컨테이너 */}
      <div
        ref={containerRef}
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-border"
        style={{ minHeight: '600px' }}
      />

      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="text-white text-center">
            {/* 스피너 애니메이션 */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading model...</p>
          </div>
        </div>
      )}
    </div>
  );
}