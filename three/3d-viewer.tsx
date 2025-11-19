"use client"

import { useRef, useEffect, useState } from "react"
import { Sun, Lightbulb, Palette, Grid3x3, Box, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

interface Model3DViewerProps {
  modelUrl: string;
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
  saturation: number;
  exposure: number;
}

type ViewMode = 'normal' | 'wireframe' | 'grayscale' | 'wireframe-grayscale';

// Grayscale Shader
const createGrayscaleShader = () => {
  return {
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float ambientIntensity;
      uniform float directionalIntensity;
      uniform vec3 lightDirection;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        // Simple lighting calculation
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(lightDirection);
        
        // Ambient
        float ambient = ambientIntensity;
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        float diffuse = diff * directionalIntensity;
        
        // Combine lighting
        float brightness = ambient + diffuse;
        brightness = clamp(brightness, 0.0, 1.0);
        
        // Gray color
        vec3 gray = vec3(brightness * 0.7);
        
        gl_FragColor = vec4(gray, 1.0);
      }
    `
  };
};

export function Model3DViewer({ 
  modelUrl, 
  className = "", 
  showControls = true,
  autoRotate = false 
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material | THREE.Material[]>>(new Map());

  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [showGrid, setShowGrid] = useState(true);
  const [showLightHelper, setShowLightHelper] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  
  const [lightingSettings, setLightingSettings] = useState<LightingSettings>({
    ambientIntensity: 0.5,
    directionalIntensity: 0.8,
    directionalX: 5,
    directionalY: 5,
    directionalZ: 5,
    saturation: 1.0,
    exposure: 1.0,
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 3, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = lightingSettings.exposure;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, lightingSettings.ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, lightingSettings.directionalIntensity);
    directionalLight.position.set(
      lightingSettings.directionalX,
      lightingSettings.directionalY,
      lightingSettings.directionalZ
    );
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    // Grid
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    gridHelper.name = 'grid';
    scene.add(gridHelper);

    // Light Helper
    const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
    lightHelper.name = 'lightHelper';
    lightHelper.visible = false;
    scene.add(lightHelper);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
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
      if (renderer) {
        renderer.dispose();
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  // Load 3D model
  useEffect(() => {
    if (!modelUrl || !sceneRef.current) return;

    setIsLoading(true);

    const scene = sceneRef.current;
    
    // Remove old model
    if (modelRef.current) {
      scene.remove(modelRef.current);
      modelRef.current = null;
      originalMaterialsRef.current.clear();
    }

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        console.log('Model loaded successfully');
        const model = gltf.scene;
        model.name = 'loaded-model';

        // Store original materials and setup
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            originalMaterialsRef.current.set(mesh, mesh.material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        // Center and scale model
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
        modelRef.current = model;
        setIsLoading(false);

        // Apply current view mode
        applyViewMode(viewMode);
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total) * 100, '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        setIsLoading(false);
      }
    );
  }, [modelUrl]);

  // Apply view mode
  const applyViewMode = (mode: ViewMode) => {
    if (!modelRef.current) return;

    const model = modelRef.current;

    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const originalMaterial = originalMaterialsRef.current.get(mesh);
        
        if (!originalMaterial) return;

        switch (mode) {
          case 'normal':
            // Restore original materials
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

          case 'wireframe':
            // Show only wireframe
            mesh.material = originalMaterial;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.wireframe = true;
                }
              });
            } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = true;
            }
            break;

          case 'grayscale':
            // Apply grayscale shader
            const shader = createGrayscaleShader();
            const grayscaleMaterial = new THREE.ShaderMaterial({
              uniforms: {
                ambientIntensity: { value: lightingSettings.ambientIntensity },
                directionalIntensity: { value: lightingSettings.directionalIntensity },
                lightDirection: { 
                  value: new THREE.Vector3(
                    lightingSettings.directionalX,
                    lightingSettings.directionalY,
                    lightingSettings.directionalZ
                  ).normalize()
                },
              },
              vertexShader: shader.vertexShader,
              fragmentShader: shader.fragmentShader,
            });
            mesh.material = grayscaleMaterial;
            break;

          case 'wireframe-grayscale':
            // Grayscale + wireframe
            const shader2 = createGrayscaleShader();
            const wireframeGrayscaleMaterial = new THREE.ShaderMaterial({
              uniforms: {
                ambientIntensity: { value: lightingSettings.ambientIntensity },
                directionalIntensity: { value: lightingSettings.directionalIntensity },
                lightDirection: { 
                  value: new THREE.Vector3(
                    lightingSettings.directionalX,
                    lightingSettings.directionalY,
                    lightingSettings.directionalZ
                  ).normalize()
                },
              },
              vertexShader: shader2.vertexShader,
              fragmentShader: shader2.fragmentShader,
              wireframe: true,
            });
            mesh.material = wireframeGrayscaleMaterial;
            break;
        }
      }
    });
  };

  // Update view mode
  useEffect(() => {
    applyViewMode(viewMode);
  }, [viewMode]);

  // Update lighting
  useEffect(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = lightingSettings.ambientIntensity;
    }
    if (directionalLightRef.current) {
      directionalLightRef.current.intensity = lightingSettings.directionalIntensity;
      directionalLightRef.current.position.set(
        lightingSettings.directionalX,
        lightingSettings.directionalY,
        lightingSettings.directionalZ
      );
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = lightingSettings.exposure;
    }

    // Update grayscale shader uniforms if in grayscale mode
    if ((viewMode === 'grayscale' || viewMode === 'wireframe-grayscale') && modelRef.current) {
      modelRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material instanceof THREE.ShaderMaterial) {
            mesh.material.uniforms.ambientIntensity.value = lightingSettings.ambientIntensity;
            mesh.material.uniforms.directionalIntensity.value = lightingSettings.directionalIntensity;
            mesh.material.uniforms.lightDirection.value = new THREE.Vector3(
              lightingSettings.directionalX,
              lightingSettings.directionalY,
              lightingSettings.directionalZ
            ).normalize();
          }
        }
      });
    }
  }, [lightingSettings, viewMode]);

  // Toggle grid
  useEffect(() => {
    if (!sceneRef.current) return;
    const grid = sceneRef.current.getObjectByName('grid');
    if (grid) {
      grid.visible = showGrid;
    }
  }, [showGrid]);

  // Toggle light helper
  useEffect(() => {
    if (!sceneRef.current) return;
    const helper = sceneRef.current.getObjectByName('lightHelper');
    if (helper) {
      helper.visible = showLightHelper;
    }
  }, [showLightHelper]);

  // Update auto-rotate
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <div className={`relative ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[500px] rounded-lg overflow-hidden bg-secondary/30 border border-border"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading 3D model...</p>
            </div>
          </div>
        )}
      </div>

      {/* View Mode Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant={viewMode === 'normal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('normal')}
            className="w-32"
          >
            <Eye className="h-4 w-4 mr-2" />
            Normal
          </Button>
          <Button
            variant={viewMode === 'wireframe' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('wireframe')}
            className="w-32"
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            Wireframe
          </Button>
          <Button
            variant={viewMode === 'grayscale' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grayscale')}
            className="w-32"
          >
            <Box className="h-4 w-4 mr-2" />
            Grayscale
          </Button>
          <Button
            variant={viewMode === 'wireframe-grayscale' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('wireframe-grayscale')}
            className="w-32 text-xs"
          >
            <Grid3x3 className="h-4 w-4 mr-1" />
            Wire+Gray
          </Button>
        </div>
      )}

      {/* Advanced Controls Toggle */}
      {showControls && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowControlPanel(!showControlPanel)}
          >
            <Palette className="h-4 w-4 mr-2" />
            {showControlPanel ? 'Hide' : 'Show'} Controls
          </Button>
        </div>
      )}

      {/* Advanced Control Panel */}
      {showControls && showControlPanel && (
        <Card className="absolute bottom-16 right-4 w-80 max-h-[60vh] overflow-y-auto p-4 bg-card/95 backdrop-blur">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Advanced Controls
          </h3>

          <div className="space-y-4 text-sm">
            {/* View Options */}
            <div className="space-y-2">
              <label className="font-medium">View Options</label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Grid</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLightHelper}
                    onChange={(e) => setShowLightHelper(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs">Light Helper</span>
                </label>
              </div>
            </div>

            {/* Ambient Light */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium flex items-center gap-1">
                  <Sun className="h-3 w-3" />
                  Ambient
                </label>
                <span className="text-xs text-muted-foreground">
                  {lightingSettings.ambientIntensity.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[lightingSettings.ambientIntensity]}
                onValueChange={(value) => 
                  setLightingSettings(prev => ({ ...prev, ambientIntensity: value[0] }))
                }
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Directional Light */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Directional
                </label>
                <span className="text-xs text-muted-foreground">
                  {lightingSettings.directionalIntensity.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[lightingSettings.directionalIntensity]}
                onValueChange={(value) => 
                  setLightingSettings(prev => ({ ...prev, directionalIntensity: value[0] }))
                }
                min={0}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Light Position */}
            <div className="space-y-2">
              <label className="font-medium">Light Position</label>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>X: {lightingSettings.directionalX.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lightingSettings.directionalX]}
                  onValueChange={(value) => 
                    setLightingSettings(prev => ({ ...prev, directionalX: value[0] }))
                  }
                  min={-10}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Y: {lightingSettings.directionalY.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lightingSettings.directionalY]}
                  onValueChange={(value) => 
                    setLightingSettings(prev => ({ ...prev, directionalY: value[0] }))
                  }
                  min={-10}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Z: {lightingSettings.directionalZ.toFixed(1)}</span>
                </div>
                <Slider
                  value={[lightingSettings.directionalZ]}
                  onValueChange={(value) => 
                    setLightingSettings(prev => ({ ...prev, directionalZ: value[0] }))
                  }
                  min={-10}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>

            {/* Exposure */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-medium">Exposure</label>
                <span className="text-xs text-muted-foreground">
                  {lightingSettings.exposure.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[lightingSettings.exposure]}
                onValueChange={(value) => 
                  setLightingSettings(prev => ({ ...prev, exposure: value[0] }))
                }
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setLightingSettings({
                ambientIntensity: 0.5,
                directionalIntensity: 0.8,
                directionalX: 5,
                directionalY: 5,
                directionalZ: 5,
                saturation: 1.0,
                exposure: 1.0,
              })}
            >
              Reset to Defaults
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-black/50 px-3 py-2 rounded backdrop-blur">
          🖱️ Click and drag to rotate • Scroll to zoom • Right-click to pan
        </div>
      )}
    </div>
  );
}