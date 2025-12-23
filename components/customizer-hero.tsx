"use client";

import { useState, useRef } from "react";
import { Upload, X, Wrench } from "lucide-react";
import { RevisionLogo } from "@/components/ui/logo";

interface CustomizerHeroProps {
  onDebugClick?: () => void;
  onVisualizationComplete?: (imageUrl: string) => void;
}

export function CustomizerHero({
  onVisualizationComplete,
  onDebugClick,
}: CustomizerHeroProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedImage(URL.createObjectURL(file));
  };

  const startVisualization = () => {
    if (!selectedImage) return;
    // Directly call the callback without internal loading
    if (onVisualizationComplete) onVisualizationComplete(selectedImage);
  };

  const handleReset = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    // bg-black 대신 테마 변수 bg-background 사용 (Pure Black)
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-20 text-center overflow-hidden">
      {/* Background Text Group */}
      <div className="transition-all duration-500">
        {/* Logo Section */}
        <RevisionLogo />

        {/* Main Title */}
        <div className="mb-12">
          {/* globals.css에서 h1은 기본적으로 font-semibold가 적용됨 */}
          <h1 className="text-5xl leading-tight md:text-6xl text-white">
            Re-visualize
            <br />
            {/* 강조하고 싶은 부분에 Water Fill 애니메이션 적용 */}
            <span className="animate-water-fill">Your Dream Ride.</span>
          </h1>
        </div>
      </div>

      <div className="relative w-full max-w-3xl">
        {/* Upload Box */}
        <div
          onClick={
            !selectedImage ? () => fileInputRef.current?.click() : undefined
          }
          className={`group relative mx-auto aspect-video w-full overflow-hidden rounded-[2rem] border-2 bg-background transition-all duration-500 
            ${
              selectedImage
                ? "border-primary/50 shadow-[0_0_100px_-20px_rgba(59,130,246,0.5)]"
                : "cursor-pointer border-border hover:border-primary/50 hover:shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)]"
            }`}
        >
          {!selectedImage && (
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground group-hover:text-primary">
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
              className="h-full w-full object-contain p-4"
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
        {selectedImage && (
          <div className="mt-8 flex items-center justify-center gap-4 animate-fade-in">
            <button
              onClick={startVisualization}
              className="flex items-center gap-3 rounded-full bg-card border border-border px-8 py-3 font-bold text-white hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all"
            >
              <img
                src="/cube.png"
                alt="Visualize Icon"
                className="h-6 w-6 object-contain"
              />
              VISUALIZE
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full bg-card border border-border text-muted-foreground hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <Upload className="h-5 w-5" />
            </button>
            <button
              onClick={handleReset}
              className="p-3 rounded-full bg-card border border-border text-muted-foreground hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Debug Button */}
        <div className="absolute -bottom-16 left-0 right-0 z-20 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <button
            onClick={onDebugClick}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary underline decoration-dotted underline-offset-4"
          >
            <Wrench className="h-3 w-3" />
            Developer Debug Mode
          </button>
        </div>
      </div>
    </section>
  );
}
