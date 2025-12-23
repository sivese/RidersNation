"use client";

import { X, RotateCcw } from "lucide-react";
import { CustomizerWorkshop } from "@/components/customizer-workshop";

interface WorkshopModalProps {
  onClose: () => void;
  initialImage?: string | null;
}

export function WorkshopModal({ onClose, initialImage }: WorkshopModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full h-[90vh] max-w-7xl overflow-hidden rounded-2xl border border-blue-500/30 bg-[#0a0a0a] shadow-[0_0_100px_-20px_rgba(59,130,246,0.5)] transition-all duration-700 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col animate-in zoom-in-95 duration-700">
          {/* 팝업 헤더 */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase text-blue-100/80">
                Re:Vision Workshop{" "}
                <span className="text-xs text-blue-500 ml-1">[BETA]</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Close Project
              </button>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 실제 워크샵 */}
          <div className="flex-1 overflow-y-auto bg-black/40 scrollbar-custom">
            <CustomizerWorkshop initialImage={initialImage} />
          </div>
        </div>
      </div>
    </div>
  );
}
