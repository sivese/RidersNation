"use client";

import { useState, useRef, useEffect } from "react"
import { Upload, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Model3DViewer } from "@/components/three"
import { ModelOption } from "@/components/three/types"
import { fileToBase64 } from "@/lib/base64"
import { set } from "date-fns"
import { Input } from "./ui/input"

// 기존 인터페이스 유지
interface PartGenerationStatus {
  partType: string;
  taskId: string | null;
  status: "idle" | "extracting" | "generating" | "completed" | "failed";
  progress: number;
}

// ✨ [추가됨] 외부(Hero 섹션)에서 이미지를 받기 위한 Props 정의
interface CustomizerWorkshopProps {
  initialImage?: string | null;
}

// 함수 파라미터에 props 추가
export function CustomizerWorkshop({ initialImage }: CustomizerWorkshopProps) {
  // 초기값을 props로 설정 (없으면 null)
  const [motorcycleImage, setMotorcycleImage] = useState<string | null>(
    initialImage || null
  );

  // ✨ [추가됨] Hero 섹션에서 이미지가 넘어오면 자동으로 상태 업데이트
  useEffect(() => {
    if (initialImage) {
      setMotorcycleImage(initialImage);
    }
  }, [initialImage]);

  const [partStatuses, setPartStatuses] = useState<PartGenerationStatus[]>([
    { partType: "exhaust", taskId: null, status: "idle", progress: 0 },
    { partType: "seat", taskId: null, status: "idle", progress: 0 },
    { partType: "frame", taskId: null, status: "idle", progress: 0 },
    { partType: "full-bike", taskId: null, status: "idle", progress: 0 },
  ]);

  const [generatedModels, setGeneratedModels] = useState<ModelOption[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // debugging states
  const [debugMode, setDebugMode] = useState(true);
  const [debugModelUrl, setDebugModelUrl] = useState("");

  // ---------------------------------------------------------
  // 👇 기존 로직들 (백엔드 연동) - 그대로 유지됨
  // ---------------------------------------------------------

  const addDebugModel = () => {
    if (!debugModelUrl.trim()) return;
    const newModel: ModelOption = {
      id: `debug-${Date.now()}`,
      name: `🔧 Debug Model`,
      url: debugModelUrl,
      partType: "debug",
    };
    setGeneratedModels((prev) => [...prev, newModel]);
    setSelectedModelId(newModel.id);
    setDebugModelUrl("");
  };

  const loadSampleModel = () => {
    const sampleModels = [
      { name: "Duck", url: "/models/1.glb" }, // public 폴더에 파일이 있어야 함
    ];
    const sample =
      sampleModels[Math.floor(Math.random() * sampleModels.length)];
    const newModel: ModelOption = {
      id: `sample-${Date.now()}`,
      name: `🎯 ${sample.name} (Sample)`,
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
      name: `📁 ${file.name}`,
      url: localUrl,
      partType: "local",
    };
    setGeneratedModels((prev) => [...prev, newModel]);
    setSelectedModelId(newModel.id);
  };

  const wsRefs = useRef<Map<string, WebSocket>>(new Map());

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

    // 모든 WebSocket 연결 종료
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

  // 파트 상태 업데이트 헬퍼
  const updatePartStatus = (
    partType: string,
    updates: Partial<PartGenerationStatus>
  ) => {
    setPartStatuses((prev) =>
      prev.map((p) => (p.partType === partType ? { ...p, ...updates } : p))
    );
  };

  // WebSocket 연결
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

          // 첫 번째 완료된 모델 자동 선택
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

  // 파트별 추출 함수들
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

    // full-bike는 추출 없이 원본 이미지 사용
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

  // 단일 파트 3D 생성
  const generateSinglePart = async (
    partType: string,
    baseFormData: FormData
  ) => {
    try {
      updatePartStatus(partType, { status: "extracting", progress: 0 });

      // 1. 파트 추출
      const extractedData = await extractPart(baseFormData, partType);

      updatePartStatus(partType, { status: "generating", progress: 10 });

      // 2. 3D 생성 요청
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

  // 올인원 생성 - 모든 파트 병렬 실행
  const generateAllParts = async () => {
    if (!motorcycleImage) return;

    // 상태 초기화
    setGeneratedModels([]);
    setSelectedModelId(null);

    const base64Response = await fetch(motorcycleImage);
    const blob = await base64Response.blob();

    // 모든 파트 병렬 생성
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
      exhaust: "🔧 Exhaust / Muffler",
      seat: "🪑 Seat",
      frame: "🏗️ Frame",
      "full-bike": "🏍️ Full Motorcycle",
    };
    return names[partType] || partType;
  };

  const isGenerating = partStatuses.some(
    (p) => p.status === "extracting" || p.status === "generating"
  );
  const completedCount = partStatuses.filter(
    (p) => p.status === "completed"
  ).length;

  useEffect(() => {
    return () => {
      wsRefs.current.forEach((ws) => ws.close());
    };
  }, []);

  // ---------------------------------------------------------
  // 👇 UI 렌더링
  // ---------------------------------------------------------

  return (
    <section
      id="customizer-workshop"
      className="border-b border-border py-16 md:py-24 bg-black/50 text-white"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              3D Motorcycle Customization Workshop
            </h2>
            <p className="text-muted-foreground">
              Upload your motorcycle image and generate 3D models for all parts
              automatically
            </p>
          </div>

          <div className="space-y-8">
            {/* Debug Panel */}
            {debugMode && (
              <Card className="p-6 border-yellow-500 bg-yellow-500/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-yellow-500">
                    🛠️ Debug Mode
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDebugMode(false)}
                  >
                    Hide
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* URL 입력 */}
                  <div className="flex gap-2">
                    <label
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#4a90d9",
                        color: "white",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      📁 Load Model File
                      <Input
                        onChange={loadLocalModel}
                        type="file"
                        accept=".glb"
                        className="hidden"
                        id="local-model-input"
                      />
                    </label>
                  </div>

                  {/* ✨ [추가됨] 샘플 이미지 로드 버튼 */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMotorcycleImage(
                          "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=600&auto=format&fit=crop"
                        )
                      }
                    >
                      🖼️ Load Sample Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSampleModel}
                    >
                      🦆 Load Sample Model
                    </Button>
                    {/* ... 기존 버튼들 유지 ... */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const taskId = prompt("Enter task ID:");
                        if (taskId) {
                          const newModel: ModelOption = {
                            id: taskId,
                            name: `📦 Task: ${taskId.slice(0, 8)}...`,
                            url: `http://127.0.0.1:8080/api/3d/model/${taskId}`,
                            partType: "debug",
                          };
                          setGeneratedModels((prev) => [...prev, newModel]);
                          setSelectedModelId(newModel.id);
                        }
                      }}
                    >
                      🔗 Load by Task ID
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setGeneratedModels([]);
                        setSelectedModelId(null);
                        setMotorcycleImage(null); // 이미지도 같이 초기화
                      }}
                    >
                      🗑️ Clear All
                    </Button>
                  </div>

                  {generatedModels.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="font-semibold mb-1">Loaded Models:</p>
                      <ul className="space-y-1">
                        {generatedModels.map((m) => (
                          <li key={m.id} className="truncate">
                            • {m.name}: {m.url.slice(0, 50)}...
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* 3D Viewer - 디버그 모드면 항상 표시 */}
            {(debugMode || generatedModels.length > 0) && (
              <Card className="p-6 bg-[#111] border-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    🎨 3D Model Viewer
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
                        🛠️ Debug
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
                    className="h-[600px] border border-gray-700 rounded-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[600px] border-2 border-dashed border-gray-700 rounded-lg text-gray-500">
                    <p>Load a model using the debug panel above ☝️</p>
                  </div>
                )}
              </Card>
            )}

            {/* Upload Section */}
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

              {/* 올인원 생성 버튼 */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={generateAllParts}
                  disabled={isGenerating || !motorcycleImage}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg transition-all"
                >
                  {isGenerating
                    ? `🔄 Generating... (${completedCount}/4 complete)`
                    : "🚀 Generate All 3D Models"}
                </button>
              </div>
            </Card>

            {/* 파트별 상태 표시 */}
            {isGenerating || completedCount > 0 ? (
              <Card className="p-6 bg-[#111] border-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-white">
                  🚀 Generation Progress
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {partStatuses.map((part) => (
                    <div
                      key={part.partType}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${
                          part.status === "completed"
                            ? "border-green-500 bg-green-900/20"
                            : ""
                        }
                        ${
                          part.status === "failed"
                            ? "border-red-500 bg-red-900/20"
                            : ""
                        }
                        ${
                          part.status === "generating" ||
                          part.status === "extracting"
                            ? "border-blue-500 bg-blue-900/20"
                            : ""
                        }
                        ${
                          part.status === "idle"
                            ? "border-gray-800 bg-gray-900"
                            : ""
                        }
                      `}
                    >
                      <div className="text-center">
                        <p className="font-semibold text-sm mb-2 text-gray-200">
                          {getPartDisplayName(part.partType)}
                        </p>

                        {part.status === "idle" && (
                          <span className="text-gray-500 text-xs">
                            Waiting...
                          </span>
                        )}
                        {part.status === "extracting" && (
                          <span className="text-blue-400 text-xs">
                            Extracting...
                          </span>
                        )}
                        {part.status === "generating" && (
                          <div>
                            <span className="text-blue-400 text-xs">
                              {part.progress}%
                            </span>
                            <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${part.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {part.status === "completed" && (
                          <span className="text-green-400 text-xs">
                            ✅ Complete
                          </span>
                        )}
                        {part.status === "failed" && (
                          <span className="text-red-400 text-xs">
                            ❌ Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
