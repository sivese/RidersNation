"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Model3DViewer } from "@/three/3d-viewer"

interface TaskStatus {
  id: string;
  status: string;
  progress?: number;
  model_url?: string;
}

export function CustomizerWorkshop() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [motorcycleImage, setMotorcycleImage] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [model3dUrl, setModel3dUrl] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setMotorcycleImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleReset = () => {
    setMotorcycleImage(null)
    setTaskStatus(null)
    setModel3dUrl(null)
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }

  const handleDownload = () => {
    if (taskStatus?.id) {
      const link = document.createElement("a")
      link.download = `motorcycle-3d-${taskStatus.id}.glb`
      link.href = `http://127.0.0.1:8080/api/3d/model/${taskStatus.id}`
      link.click()
    }
  }

  const requestCreate3D = async () => {
    try {
      setIsGenerating(true);

      if (!motorcycleImage) {
        console.error("No motorcycle image to upload");
        return;
      }

      const base64Response = await fetch(motorcycleImage);
      const blob = await base64Response.blob();
      
      const formData = new FormData();
      formData.append('image_motorcycle', blob, 'motorcycle.png');

      const res = await fetch('http://127.0.0.1:8080/api/3d/create', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const taskId = data.task_id;
      
      console.log('Task created:', taskId);
      connectWebSocket(taskId);
      
    } catch(err) {
      console.error("Error during 3D creation request:", err);
      setIsGenerating(false);
    }
  };

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

        if (status.status === 'SUCCEEDED') {
          console.log('Task completed!');
          const proxyUrl = `http://127.0.0.1:8080/api/3d/model/${taskId}`;
          setModel3dUrl(proxyUrl);
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
              3D Motorcycle Customization Workshop
            </h2>
            <p className="text-pretty text-muted-foreground">
              Upload your motorcycle image and generate a professional 3D model with advanced visualization controls
            </p>
          </div>

          <div className="space-y-8">
            {/* Upload Section */}
            <Card className="border-border bg-card p-10">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  1
                </span>
                Upload Your Motorcycle Image
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
                    onChange={handleImageUpload}
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

              <div className="flex flex-col items-center gap-4 mt-6">
                <button
                  onClick={requestCreate3D}
                  disabled={isGenerating || !motorcycleImage}
                  className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {isGenerating ? '🔄 Generating 3D Model...' : '🚀 Generate 3D Model'}
                </button>
              </div>
            </Card>

            {/* Status Display */}
            {taskStatus && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-card-foreground">
                  🚀 Generation Status
                </h3>
                <div className="space-y-4">
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
                    </span>
                  </div>

                  {taskStatus.progress !== undefined && taskStatus.status !== 'SUCCEEDED' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Progress:</span>
                        <span className="font-bold text-lg text-primary">{taskStatus.progress}%</span>
                      </div>
                      
                      <div className="relative w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${taskStatus.progress}%` }}
                        />
                      </div>

                      <p className="text-xs text-center text-muted-foreground mt-2">
                        {taskStatus.progress < 30 && "🔄 Analyzing your image..."}
                        {taskStatus.progress >= 30 && taskStatus.progress < 60 && "🎨 Generating 3D geometry..."}
                        {taskStatus.progress >= 60 && taskStatus.progress < 90 && "✨ Creating textures..."}
                        {taskStatus.progress >= 90 && taskStatus.progress < 100 && "🎯 Finalizing your model..."}
                      </p>
                    </div>
                  )}

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
                </div>
              </Card>
            )}

            {/* 3D Model Viewer */}
            {model3dUrl && (
              <Card className="border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    🎨 Interactive 3D Model Viewer
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                      <Download className="h-4 w-4" />
                      Download GLB
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 3D Viewer Component */}
                  <Model3DViewer 
                    modelUrl={model3dUrl} 
                    showControls={true}
                    autoRotate={false}
                    className="h-[600px]"
                  />

                  {/* Usage Tips */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      💡 Viewer Tips
                    </h4>
                    <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                      <li>• <strong>Normal Mode:</strong> View the full textured 3D model</li>
                      <li>• <strong>Wireframe Mode:</strong> See the polygon structure and vertex connections</li>
                      <li>• <strong>Grayscale Mode:</strong> View the model's shape without color distractions</li>
                      <li>• <strong>Wire+Gray Mode:</strong> Combine wireframe and grayscale for technical analysis</li>
                      <li>• <strong>Advanced Controls:</strong> Adjust lighting, exposure, and more for perfect visualization</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}