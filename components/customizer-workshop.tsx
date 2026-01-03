"use client";


import { useState, useRef, useEffect } from "react";
import { Upload, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Model3DViewer } from "@/components/three";
import { ModelOption } from "@/components/three/types";
import { fileToBase64 } from "@/lib/base64";
import { Input } from "./ui/input";


// 기존 인터페이스 유지
interface PartGenerationStatus {
  partType: string;
  taskId: string | null;
  status: "idle" | "extracting" | "generating" | "completed" | "failed";
  progress: number;
}

// Props 정의
interface CustomizerWorkshopProps {
  initialImage?: string | null;
}

export function CustomizerWorkshop({ initialImage }: CustomizerWorkshopProps) {
  const [motorcycleImage, setMotorcycleImage] = useState<string | null>(
    initialImage || null
  );

  const [partStatuses, setPartStatuses] = useState<PartGenerationStatus[]>([
    { partType: "exhaust", taskId: null, status: "idle", progress: 0 },
    { partType: "seat", taskId: null, status: "idle", progress: 0 },
    { partType: "frame", taskId: null, status: "idle", progress: 0 },
    { partType: "full-bike", taskId: null, status: "idle", progress: 0 },
  ]);

  const [generatedModels, setGeneratedModels] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);


  // Debug mode: auto-detect (true when no initialImage provided)
  const isDebugMode = !initialImage;
  const [debugMode, setDebugMode] = useState(isDebugMode);

  // Error and auto-generation states
  const [hasGenerationError, setHasGenerationError] = useState(false);
  const [autoGenerationTriggered, setAutoGenerationTriggered] = useState(false);

  const wsRefs = useRef<Map<string, WebSocket>>(new Map());



  const loadSampleModel = () => {
    const sampleModels = [{ name: "Duck", url: "/models/1.glb" }];
    const sample =
      sampleModels[Math.floor(Math.random() * sampleModels.length)];
    const newModel: ModelOption = {
      id: `sample-${Date.now()}`,
      name: `${sample.name} (Sample)`,
      url: sample.url,
      partType: "sample",
    };
    setGeneratedModels((prev) => [...prev, newModel]);
    setSelectedModelId(newModel.id);
  };

  const loadLocalModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    const newModel: ModelOption = {
      id: `local-${Date.now()}`,
      name: `${file.name}`,
      url: localUrl,
      partType: "local",
    };
    setGeneratedModels((prev) => [...prev, newModel]);
    setSelectedModelId(newModel.id);
  };

  // ---------------------------------------------------------
  // Main Functions
  // ---------------------------------------------------------


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMotorcycleImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setMotorcycleImage(null);
    setGeneratedModels([]);
    setSelectedModelId(null);
    setPartStatuses([
      { partType: "exhaust", taskId: null, status: "idle", progress: 0 },
      { partType: "seat", taskId: null, status: "idle", progress: 0 },
      { partType: "frame", taskId: null, status: "idle", progress: 0 },
      { partType: "full-bike", taskId: null, status: "idle", progress: 0 },
    ]);
    setHasGenerationError(false);
    setAutoGenerationTriggered(false);

    wsRefs.current.forEach((ws) => ws.close());
    wsRefs.current.clear();
  };

  const handleDownload = () => {
    if (selectedModelId) {
      const link = document.createElement("a");
      link.download = `motorcycle-3d-${selectedModelId}.glb`;
      link.href = `http://127.0.0.1:8080/api/3d/model/${selectedModelId}`;
      link.click();
    }
  };

  const updatePartStatus = (
    partType: string,
    updates: Partial<PartGenerationStatus>
  ) => {
    setPartStatuses((prev) =>
      prev.map((p) => (p.partType === partType ? { ...p, ...updates } : p))
    );
  };

  const connectWebSocket = (
    taskId: string,
    partType: string,
    thumbImage: string
  ) => {
    const ws = new WebSocket(`ws://127.0.0.1:8080/api/3d/ws/${taskId}`);
    wsRefs.current.set(partType, ws);

    ws.onmessage = (event) => {
      try {
        const status = JSON.parse(event.data);

        updatePartStatus(partType, {
          progress: status.progress || 0,
          status:
            status.status === "SUCCEEDED"
              ? "completed"
              : status.status === "FAILED"
              ? "failed"
              : "generating",
        });

        if (status.status === "SUCCEEDED") {
          const proxyUrl = `http://127.0.0.1:8080/api/3d/model/${taskId}`;

          const newModel: ModelOption = {
            id: taskId,
            name: getPartDisplayName(partType),
            url: proxyUrl,
            thumbnail: thumbImage || undefined,
            partType: partType,
          };

          setGeneratedModels((prev) => [...prev, newModel]);
          setSelectedModelId((prev) => prev || taskId);
          ws.close();
        } else if (status.status === "FAILED") {
          ws.close();
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    ws.onerror = () => {
      updatePartStatus(partType, { status: "failed" });
    };
  };

  const extractPart = async (
    formData: FormData,
    partType: string
  ): Promise<FormData> => {
    const endpoints: Record<string, string> = {
      exhaust: "/extract_exhaust",
      seat: "/extract_seat",
      frame: "/extract_frame",
      "full-bike": "/extract_full",
    };

    if (partType === "full-bike") {
      return formData;
    }

    const res = await fetch(`http://127.0.0.1:8080${endpoints[partType]}`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Extract ${partType} failed`);
    }

    const imageBlob = await res.blob();
    const extractedFile = new File([imageBlob], `extracted_${partType}.png`, {
      type: "image/png",
    });

    const resData = new FormData();
    resData.append("image_motorcycle", extractedFile);
    return resData;
  };

  const generateSinglePart = async (
    partType: string,
    baseFormData: FormData
  ) => {
    try {
      updatePartStatus(partType, { status: "extracting", progress: 0 });

      const extractedData = await extractPart(baseFormData, partType);

      updatePartStatus(partType, { status: "generating", progress: 10 });

      const res = await fetch("http://127.0.0.1:8080/api/3d/create", {
        method: "POST",
        body: extractedData,
      });

      if (!res.ok) {
        throw new Error(`Create 3D failed for ${partType}`);
      }

      const data = await res.json();
      const taskId = data.task_id;

      updatePartStatus(partType, { taskId });

      const imgFile = extractedData.get("image_motorcycle") as File;
      const base64image = await fileToBase64(imgFile);

      connectWebSocket(taskId, partType, base64image);
    } catch (err) {
      console.error(`Error generating ${partType}:`, err);
      updatePartStatus(partType, { status: "failed" });
    }
  };

  const generateAllParts = async () => {
    if (!motorcycleImage) return;

    setGeneratedModels([]);
    setSelectedModelId(null);
    setHasGenerationError(false);

    const base64Response = await fetch(motorcycleImage);
    const blob = await base64Response.blob();

    const partTypes = ["exhaust", "seat", "frame", "full-bike"];

    await Promise.all(
      partTypes.map(async (partType) => {
        const formData = new FormData();
        formData.append("image_motorcycle", blob, "motorcycle.png");
        await generateSinglePart(partType, formData);
      })
    );
  };

  const getPartDisplayName = (partType: string): string => {
    const names: Record<string, string> = {
      exhaust: "Exhaust / Muffler",
      seat: "Seat",
      frame: "Frame",
      "full-bike": "Full Motorcycle",
    };
    return names[partType] || partType;
  };

  const isGenerating = partStatuses.some(
    (p) => p.status === "extracting" || p.status === "generating"
  );
  const completedCount = partStatuses.filter(
    (p) => p.status === "completed"
  ).length;
  const failedCount = partStatuses.filter((p) => p.status === "failed").length;

  // Auto-start generation when initialImage is provided
  useEffect(() => {
    if (initialImage && !autoGenerationTriggered && motorcycleImage) {
      setAutoGenerationTriggered(true);
      setTimeout(() => {
        generateAllParts();
      }, 500);
    }
  }, [initialImage, autoGenerationTriggered, motorcycleImage]);

  // Check for complete failure (all parts failed)
  useEffect(() => {
    const allStarted = partStatuses.some((p) => p.status !== "idle");
    if (allStarted && failedCount === partStatuses.length && failedCount > 0) {
      setHasGenerationError(true);
    }
  }, [failedCount, partStatuses]);

  useEffect(() => {
    if (initialImage) {
      setMotorcycleImage(initialImage);
    }
  }, [initialImage]);

  useEffect(() => {
    return () => {
      wsRefs.current.forEach((ws) => ws.close());
    };
  }, []);

  // ---------------------------------------------------------
  // UI 렌더링
  // ---------------------------------------------------------

  return (
    <section
      id="customizer-workshop"
      className="h-full  flex items-center py-4 md:py-16 bg-black/50 text-foreground"
    >

      <div className="container  mx-auto px-4">
        <div className=" mx-auto max-w-6xl">
          <div className="flex flex-col items-stretch space-y-8">
            {/* Compact Debug Panel */}
            {debugMode && (
              <Card className="p-3 border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                    Debug Tools
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDebugMode(false)}
                    className="h-6 px-2 text-xs"
                  >
                    Hide
                  </Button>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <label className="cursor-pointer">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      asChild
                    >
                      <span>
                        Load .glb
                        <Input
                          onChange={loadLocalModel}
                          type="file"
                          accept=".glb"
                          className="hidden"
                        />
                      </span>
                    </Button>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setMotorcycleImage(
                        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"
                      )
                    }
                    className="h-7 px-2 text-xs"
                  >
                    Sample Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSampleModel}
                    className="h-7 px-2 text-xs"
                  >
                    Sample Model
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const taskId = prompt("Enter task ID:");
                      if (taskId) {
                        const newModel: ModelOption = {
                          id: taskId,
                          name: `Task: ${taskId.slice(0, 8)}...`,
                          url: `http://127.0.0.1:8080/api/3d/model/${taskId}`,
                          partType: "debug",
                        };
                        setGeneratedModels((prev) => [...prev, newModel]);
                        setSelectedModelId(newModel.id);
                      }
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    By Task ID
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setGeneratedModels([]);
                      setSelectedModelId(null);
                      setMotorcycleImage(null);
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    Clear
                  </Button>
                  {generatedModels.length > 0 && (
                    <span className="text-xs text-muted-foreground self-center ml-1">
                      ({generatedModels.length} loaded)
                    </span>
                  )}
                </div>
              </Card>
            )}

            {/* 3D Viewer */}
            {(debugMode || generatedModels.length > 0) && (
              <Card className="p-6 bg-[#111] border-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">
                    3D Model Viewer
                    {generatedModels.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({generatedModels.length} models)
                      </span>
                    )}
                  </h3>
                  <div className="flex gap-2">
                    {!debugMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDebugMode(true)}
                      >
                        Debug
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      disabled={!selectedModelId}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                {generatedModels.length > 0 ? (
                  <Model3DViewer
                    modelOptions={generatedModels}
                    selectedModelId={selectedModelId}
                    onModelSelect={setSelectedModelId}
                    showControls={true}
                    autoRotate={false}
                    className="h-auto border border-gray-700 rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px] border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
                    <p>Load a model using the debug panel above </p>
                  </div>
                )}
              </Card>
            )}

            {/* Upload Section - Only show if no initialImage was provided */}
            {/* 
            <>
            {!initialImage && (
              <Card className="p-10 bg-[#111] border-gray-800">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </span>
                  Upload Your Motorcycle Image

                </h3>

                <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-700 bg-gray-900/50 hover:border-blue-500/50 transition-colors">
                  <Upload className="mb-2 h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    {motorcycleImage ? "Change image" : "Click to upload"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>

                {motorcycleImage && (
                  <div className="mt-4 rounded-lg border border-gray-700 overflow-hidden">
                    <img
                      src={motorcycleImage}
                      alt="Motorcycle"
                      className="h-64 w-full object-contain bg-black"
                    />
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  <button
                    onClick={generateAllParts}
                    disabled={isGenerating || !motorcycleImage}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-all"
                  >
                    {isGenerating
                      ? `Generating... (${completedCount}/4 complete)`
                      : "Generate All 3D Models"}
                  </button>
                </div>
              </Card>
            )}
            </>
             */}

            {/* Error Message - Show when generation completely fails */}
            {hasGenerationError && !isGenerating && (
              <Card className="p-8 bg-red-900/10 border-red-500/50">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-red-500/20 p-4">
                      <svg
                        className="h-12 w-12 text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-red-400">
                    Generation Failed
                  </h3>
                  <p className="text-gray-300 max-w-md mx-auto">
                    Unable to process this image. Please ensure the image
                    contains a motorcycle and try again.
                  </p>
                  <div className="flex gap-3 justify-center pt-2">
                    <Button
                      onClick={() => {
                        setHasGenerationError(false);
                        setAutoGenerationTriggered(false);
                        setPartStatuses([
                          {
                            partType: "exhaust",
                            taskId: null,
                            status: "idle",
                            progress: 0,
                          },
                          {
                            partType: "seat",
                            taskId: null,
                            status: "idle",
                            progress: 0,
                          },
                          {
                            partType: "frame",
                            taskId: null,
                            status: "idle",
                            progress: 0,
                          },
                          {
                            partType: "full-bike",
                            taskId: null,
                            status: "idle",
                            progress: 0,
                          },
                        ]);
                        if (motorcycleImage) {
                          generateAllParts();
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Try Again
                    </Button>
                    <Button onClick={handleReset} variant="outline">
                      Upload New Image
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Part-level progress display - REMOVED per requirement #5 */}
          </div>
        </div>
      </div>
    </section>
  );
}
