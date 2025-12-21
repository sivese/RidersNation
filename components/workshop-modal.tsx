// 로딩 및 팝업 화면

"use client";

import { useState, useEffect } from "react";
import { Loader2, X, RotateCcw } from "lucide-react";
import { CustomizerWorkshop } from "@/components/customizer-workshop";

interface WorkshopModalProps {
  onClose: () => void;
  initialImage?: string | null; // 업로드된 이미지 전달용
}

export function WorkshopModal({ onClose, initialImage }: WorkshopModalProps) {
  const [isLoading, setIsLoading] = useState(true);

  // 팝업이 뜨면 2초간 로딩 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300"
      onClick={onClose} // 배경 클릭 시 닫기
    >
      <div
        className={`
          relative w-full max-w-7xl overflow-hidden rounded-2xl border border-blue-500/30 bg-[#0a0a0a] 
          shadow-[0_0_100px_-20px_rgba(59,130,246,0.5)] transition-all duration-500
          ${isLoading ? "h-64 max-w-md border-blue-500/10" : "h-[90vh]"}
        `}
        onClick={(e) => e.stopPropagation()} // 내부 클릭 닫기 방지
      >
        {isLoading ? (
          // A. 로딩 UI
          <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                Generating 3D Environment...
              </h3>
              <p className="text-sm text-gray-500">
                Initializing workshop assets
              </p>
            </div>
          </div>
        ) : (
          // B. 워크샵 UI
          <div className="flex h-full flex-col animate-in zoom-in-95 duration-500">
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <h2 className="text-sm font-bold text-white tracking-widest uppercase text-blue-100/80">
                  Re:Vision Workshop{" "}
                  <span className="text-xs text-blue-500 ml-1">
                    [DEBUG MODE]
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* 실제 워크샵 (이미지 전달) */}
            <div className="flex-1 overflow-hidden bg-black/40">
              <CustomizerWorkshop initialImage={initialImage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
