"use client";

import { useState, useRef } from "react";
import { Upload, X, RotateCcw, Box } from "lucide-react"; // 아이콘

const LOADING_STAGES = [
  { limit: 25, text: "Scanning Image Structure..." },
  { limit: 50, text: "Extracting Components..." },
  { limit: 75, text: "Generating 3D Geometry..." },
  { limit: 100, text: "Finalizing Textures..." },
];

interface CustomizerHeroProps {
  onVisualizationComplete?: (imageUrl: string) => void;
}

export function CustomizerHero({
  onVisualizationComplete,
}: CustomizerHeroProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(LOADING_STAGES[0].text);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedImage(URL.createObjectURL(file));
  };

  const startVisualization = () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    setProgress(0);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        const stage = LOADING_STAGES.find((s) => next <= s.limit);
        if (stage) setLoadingText(stage.text);

        if (next >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            setIsGenerating(false);
            if (onVisualizationComplete) onVisualizationComplete(selectedImage);
          }, 500);
          return 100;
        }
        return next;
      });
    }, 30); // 시뮬레이션 속도
  };

  const handleReset = () => {
    setSelectedImage(null);
    setIsGenerating(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center bg-black px-4 py-20 text-center text-white overflow-hidden">
      {/* Background Text */}
      <div
        className={`transition-all duration-500 ${
          isGenerating ? "opacity-20 blur-sm" : "opacity-100"
        }`}
      >
        <div className="mb-8">
          <h2 className="text-xl font-bold tracking-widest text-white">
            RE:<span className="text-vision-gradient">VISION</span>
          </h2>
        </div>
        <div className="mb-12">
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            Re-visualize
            <br />
            Your Dream Ride.
          </h1>
        </div>
      </div>

      <div className="relative w-full max-w-3xl">
        {/* Loading Overlay */}
        {isGenerating && selectedImage && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[2rem] bg-black/80 backdrop-blur-md border border-gray-800">
            <h3 className="mb-6 text-lg font-medium text-white animate-pulse">
              {loadingText}
            </h3>
            <div className="relative mb-8 h-48 w-full max-w-sm overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
              <img
                src={selectedImage}
                alt="Processing"
                className="h-full w-full object-contain opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {progress}%
                </span>
              </div>
            </div>
            <div className="relative h-2 w-3/4 max-w-md bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upload Box */}
        <div
          onClick={
            !selectedImage ? () => fileInputRef.current?.click() : undefined
          }
          className={`group relative mx-auto aspect-video w-full overflow-hidden rounded-[2rem] border-2 bg-black transition-all duration-500 
            ${
              selectedImage
                ? "border-blue-500/50 shadow-[0_0_100px_-20px_rgba(59,130,246,0.5)]"
                : "cursor-pointer border-blue-900/30 hover:border-blue-500/50 hover:shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)]"
            }`}
        >
          {!selectedImage && (
            <div className="flex h-full w-full flex-col items-center justify-center text-gray-500 group-hover:text-blue-400">
              <Upload className="mb-4 h-12 w-12" />
              <span className="text-sm font-semibold tracking-wider">
                CLICK TO UPLOAD
              </span>
            </div>
          )}

          {selectedImage && (
            <img
              src={selectedImage}
              alt="Uploaded"
              className={`h-full w-full object-contain p-4 ${
                isGenerating ? "opacity-0" : "opacity-100"
              }`}
            />
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Buttons */}
        {selectedImage && !isGenerating && (
          <div className="mt-8 flex items-center justify-center gap-4 animate-fade-in-up">
            <button
              onClick={startVisualization}
              className="flex items-center gap-3 rounded-full bg-[#2A2A2A] px-8 py-3 font-bold text-white hover:bg-[#333] hover:scale-105 active:scale-95 transition-all"
            >
              <Box className="text-blue-500 h-5 w-5" /> VISUALIZE
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#333]"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              onClick={handleReset}
              className="p-3 rounded-full bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#333]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
