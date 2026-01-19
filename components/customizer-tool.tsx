"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/*
  Legacy
*/
export function CustomizerTool() {
  const [dummyState, setDummyState] = useState(false); // Forcing re-render if needed
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [motorcycleImage, setMotorcycleImage] = useState<string | null>(null)
  const [partImage, setPartImage] = useState<string | null>(null)
  const [partPosition, setPartPosition] = useState({ x: 50, y: 50 })
  const [partScale, setPartScale] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "motorcycle" | "part") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        if (type === "motorcycle") {
          setMotorcycleImage(result)
        } else {
          setPartImage(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleReset = () => {
    setMotorcycleImage(null)
    setPartImage(null)
    setPartPosition({ x: 50, y: 50 })
    setPartScale(1)
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "custom-motorcycle.png"
    link.href = canvas.toDataURL()
    link.click()
  }

  const requestPreviewRender = async () => {
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
      
      // 파트 이미지도 있으면 추가
      if (partImage) {
        const partBlob = await fetch(partImage).then(r => r.blob());
        formData.append('image_part', partBlob, 'part.png');
      }

      const res = await fetch('http://127.0.0.1:8080/gen_image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server error:', errorText);
        throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
      }

      // Blob을 받아서 Object URL로 변환
      const imageBlob = await res.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      
      // previewImage 상태 업데이트
      setPreviewImage(imageUrl);
      
      console.log('Success! Image generated');
    } 
    catch(err) {
      console.error("Error during preview render request:", err);
    }
    finally {
      setIsGenerating(false);
    }
};

  // Draw composite image on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !motorcycleImage) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const bikeImg = new Image()
    bikeImg.crossOrigin = "anonymous"
    bikeImg.src = motorcycleImage

    bikeImg.onload = () => {
      canvas.width = bikeImg.width
      canvas.height = bikeImg.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bikeImg, 0, 0)

      if (partImage) {
        const partImg = new Image()
        partImg.crossOrigin = "anonymous"
        partImg.src = partImage

        partImg.onload = () => {
          const partWidth = partImg.width * partScale
          const partHeight = partImg.height * partScale
          const x = (partPosition.x / 100) * canvas.width - partWidth / 2
          const y = (partPosition.y / 100) * canvas.height - partHeight / 2

          ctx.drawImage(partImg, x, y, partWidth, partHeight)
        }
      }
    }
  }, [motorcycleImage, partImage, partPosition, partScale])

  return (
    <section id="customizer" className="border-b border-border py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">Customization Studio</h2>
            <p className="text-pretty text-muted-foreground">
              Upload your motorcycle and parts to create your perfect build
            </p>
          </div>

          <div className="space-y-8">
            {/* Upload Section - Now on top */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Motorcycle Upload */}
              <Card className="border-border bg-card p-6">
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
                        src={motorcycleImage || "/placeholder.svg"}
                        alt="Motorcycle"
                        className="h-64 w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Part Upload */}
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    2
                  </span>
                  Upload Custom Part
                </h3>
                <div className="space-y-4">
                  <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:border-primary/50 hover:bg-secondary">
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {partImage ? "Change part image" : "Click to upload part"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "part")}
                    />
                  </label>
                  {partImage && (
                    <div className="relative rounded-lg border border-border bg-secondary/50">
                      <img
                        src={partImage || "/placeholder.svg"}
                        alt="Part"
                        className="h-64 w-full object-contain p-4"
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Controls - Between uploads and preview */}
            {motorcycleImage && partImage && dummyState && (
              <Card className="border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-card-foreground">Adjust Part</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-muted-foreground">
                      Size: {Math.round(partScale * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.2"
                      max="2"
                      step="0.1"
                      value={partScale}
                      onChange={(e) => setPartScale(Number.parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Drag the part on the preview to position it</p>
                </div>
              </Card>
            )}

            {/* Preview Section - Now below uploads */}
            <Card className="border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground">Preview</h3>
                {motorcycleImage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 bg-transparent">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                    {partImage && (
                      <Button variant="default" size="sm" onClick={handleDownload} className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div
                ref={previewRef}
                className="relative aspect-video overflow-hidden rounded-lg border border-border bg-secondary/30"
              >
                {previewImage ? (
                  <>
                    <img
                      src={previewImage}
                      alt="Motorcycle preview"
                      className="h-full w-full object-contain"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Upload a motorcycle to start</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={requestPreviewRender}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Run Preview'}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
