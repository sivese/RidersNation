"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

interface TaskStatus {
  id: string;
  status: string;
  progress?: number;
  model_url?: string;
}

export function CustomizerWorkshop() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [motorcycleImage, setMotorcycleImage] = useState<string | null>(null)
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [model3dUrl, setModel3dUrl] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvas3dRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "motorcycle" | "part") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (type === "motorcycle") {
          setMotorcycleImage(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleReset = () => {
    setMotorcycleImage(null)
    setPreviewImage(null)
    setTaskStatus(null)
    setModel3dUrl(null)
    
    // WebSocket 정리
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }

  const handleDownload = () => {
    if (model3dUrl) {
      const link = document.createElement("a")
      link.download = "custom-motorcycle.glb"
      link.href = model3dUrl
      link.click()
    }
  }

  // 3D 모델 생성 요청
  const requestCreate3D = async () => {
    try {
      setIsGenerating(true);

      if (!motorcycleImage) {
        console.error("No motorcycle image to upload");
        return;
      }

      // base64 데이터 URL을 Blob으로 변환
      const base64Response = await fetch(motorcycleImage);
      const blob = await base64Response.blob();
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image_motorcycle', blob, 'motorcycle.png');

      // 먼저 task 생성
      const res = await fetch('http://127.0.0.1:8080/api/3d/create', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }

      const data = await res.json();
      const taskId = data.task_id;
      
      console.log('Task created:', taskId);

      // WebSocket 연결 시작
      connectWebSocket(taskId);
      
    } catch(err) {
      console.error("Error during 3D creation request:", err);
      setIsGenerating(false);
    }
  };

  // WebSocket 연결 및 상태 업데이트
  const connectWebSocket = (taskId: string) => {
    const ws = new WebSocket(`ws://127.0.0.1:8080/api/3d/ws/${taskId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for task:', taskId);
    };

    ws.onmessage = (event) => {
      try {
        const status: TaskStatus = JSON.parse(event.data);
        console.log('Task status update:', status);
        setTaskStatus(status);

        // 작업 완료시
        if (status.status === 'SUCCEEDED' && status.model_url) {
          console.log('Task completed! Model URL:', status.model_url);
          setModel3dUrl(status.model_url);
          setIsGenerating(false);
          ws.close();
        } else if (status.status === 'FAILED') {
          console.error('Task failed');
          setIsGenerating(false);
          ws.close();
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsGenerating(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };
  };

  // Three.js 초기화
  useEffect(() => {
    if (!canvas3dRef.current) return;

    // Scene 설정
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera 설정
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas3dRef.current.clientWidth / canvas3dRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer 설정
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvas3dRef.current.clientWidth, canvas3dRef.current.clientHeight);
    canvas3dRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls 설정
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window resize 핸들러
    const handleResize = () => {
      if (!canvas3dRef.current || !camera || !renderer) return;
      
      const width = canvas3dRef.current.clientWidth;
      const height = canvas3dRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
      }
      if (canvas3dRef.current && renderer.domElement) {
        canvas3dRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 3D 모델 로드
  useEffect(() => {
    if (!model3dUrl || !sceneRef.current) return;

    setIsLoadingModel(true);

    // 기존 모델 제거
    const scene = sceneRef.current;
    const oldModel = scene.getObjectByName('motorcycle-model');
    if (oldModel) {
      scene.remove(oldModel);
    }

    // GLTFLoader로 모델 로드
    const loader = new GLTFLoader();
    loader.load(
      model3dUrl,
      (gltf) => {
        console.log('Model loaded successfully');
        const model = gltf.scene;
        model.name = 'motorcycle-model';

        // 모델 크기 조정 및 중앙 배치
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.multiplyScalar(scale);

        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale;
        model.position.z = -center.z * scale;

        scene.add(model);
        setIsLoadingModel(false);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        setIsLoadingModel(false);
      }
    );
  }, [model3dUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <section id="customizer" className="border-b border-border py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">
              Customization Workshop
            </h2>
            <p className="text-pretty text-muted-foreground">
              Let's build your own custom motorcycle! Upload images and generate 3D model previews in real-time.
            </p>
          </div>

          <div className="space-y-8">
            {/* Upload Section */}
            <div className="grid gap-6">
              <Card className="border-border bg-card p-10">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </span>
                  Upload Your Motorcycle
                </h3>
                <div className="space-y-4">
                  <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary/50 hover:bg-secondary">
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {motorcycleImage ? "Change motorcycle image" : "Click to upload motorcycle"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "motorcycle")}
                    />
                  </label>
                  {motorcycleImage && (
                    <div className="relative rounded-lg border border-border">
                      <img
                        src={motorcycleImage}
                        alt="Motorcycle"
                        className="h-64 w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Status Display */}
            {taskStatus && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-card-foreground">
                  🚀 3D Model Generation
                </h3>
                <div className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-semibold
                      ${taskStatus.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}
                      ${taskStatus.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                      ${taskStatus.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                      ${taskStatus.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
                    `}>
                      {taskStatus.status === 'PENDING' && '⏳ Pending'}
                      {taskStatus.status === 'IN_PROGRESS' && '⚙️ Processing'}
                      {taskStatus.status === 'SUCCEEDED' && '✅ Completed'}
                      {taskStatus.status === 'FAILED' && '❌ Failed'}
                      {!['PENDING', 'IN_PROGRESS', 'SUCCEEDED', 'FAILED'].includes(taskStatus.status) && taskStatus.status}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {taskStatus.progress !== undefined && taskStatus.status !== 'SUCCEEDED' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-bold text-lg text-primary">{taskStatus.progress}%</span>
                      </div>
                      
                      {/* Animated Progress Bar */}
                      <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out relative"
                          style={{ width: `${taskStatus.progress}%` }}
                        >
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                               style={{ 
                                 animation: 'shimmer 2s infinite',
                                 backgroundSize: '200% 100%'
                               }}
                          />
                        </div>
                      </div>

                      {/* Status Message */}
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        {taskStatus.progress < 30 && "🔄 Analyzing your image..."}
                        {taskStatus.progress >= 30 && taskStatus.progress < 60 && "🎨 Generating 3D geometry..."}
                        {taskStatus.progress >= 60 && taskStatus.progress < 90 && "✨ Creating textures..."}
                        {taskStatus.progress >= 90 && taskStatus.progress < 100 && "🎯 Finalizing your model..."}
                      </p>
                    </div>
                  )}

                  {/* Completion Message */}
                  {taskStatus.status === 'SUCCEEDED' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                      <p className="text-green-800 dark:text-green-200 font-semibold">
                        🎉 Your 3D model is ready!
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Scroll down to view and interact with your model
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {taskStatus.status === 'FAILED' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                      <p className="text-red-800 dark:text-red-200 font-semibold">
                        ⚠️ Generation failed
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Please try again with a different image
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 3D Model Preview */}
            <Card className="border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground">3D Model Preview</h3>
                <div className="flex gap-2">
                  {motorcycleImage && (
                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 bg-transparent">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                  {model3dUrl && (
                    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 bg-transparent">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </div>

              <div
                ref={canvas3dRef}
                className="relative aspect-video overflow-hidden rounded-lg border border-border bg-secondary/30"
                style={{ minHeight: '400px' }}
              >
                {!model3dUrl && !isLoadingModel && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">
                      {isGenerating 
                        ? "Generating 3D model... This may take a few minutes."
                        : "Upload a motorcycle image and click 'Generate 3D Model' to start"
                      }
                    </p>
                  </div>
                )}
                {isLoadingModel && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white">Loading 3D model...</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 mt-4">
                <button
                  onClick={requestCreate3D}
                  disabled={isGenerating || !motorcycleImage}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating 3D Model...' : 'Generate 3D Model'}
                </button>
                {model3dUrl && (
                  <p className="text-sm text-muted-foreground">
                    Use your mouse to rotate, zoom, and pan the 3D model
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}