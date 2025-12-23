"use client";

import { useState } from "react";
import { Settings, X } from "lucide-react";

// 컴포넌트 import (경로가 정확한지 확인해주세요)
import { SplashScreen } from "@/components/pages/splash-screen";
import { WalkthroughScreen } from "@/components/pages/walkthrough-screen";
import { CustomizerHero } from "@/components/customizer-hero";
import { WorkshopModal } from "@/components/workshop-modal";

export default function Home() {
  // 1. 앱 전체 단계 상태
  const [screen, setScreen] = useState<"splash" | "walkthrough" | "home">(
    "splash"
  );

  // 2. 화면 표시 상태 관리
  const [showWorkshop, setShowWorkshop] = useState(false); // 3D 뷰어 노출 여부
  const [isLoading, setIsLoading] = useState(false); // 로딩창 노출 여부
  const [progress, setProgress] = useState(0); // 로딩 진행률
  const [loadingText, setLoadingText] = useState("Generating Exhaust now"); // 로딩 텍스트

  // 3. 데이터 관리
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(true);

  // 로딩 단계별 메시지 (실제 프로젝트에서 수정 가능)
  const LOADING_STAGES = [
    { limit: 25, text: "Generating Exhaust now" },
    { limit: 50, text: "Generating Seat now" },
    { limit: 75, text: "Generating Frame now" },
    { limit: 100, text: "Generating Full-bike now" },
  ];

  // =================================================================
  // A. 디버그 버튼 클릭 -> 로딩 화면 표시 -> 3D 뷰어(Workshop) 오픈
  // =================================================================
  const handleDebugClick = () => {
    // 디버그 모드에서도 로딩을 표시합니다.
    setIsLoading(true);
    setProgress(0);
    setLoadingText(LOADING_STAGES[0].text);

    // 로딩 시뮬레이션
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;

        // 단계별 텍스트 업데이트
        const stage = LOADING_STAGES.find((s) => next <= s.limit);
        if (stage) setLoadingText(stage.text);

        if (next >= 100) {
          clearInterval(interval);

          // 로딩 끝: 로딩창 끄고 -> 뷰어 켜기
          setIsLoading(false);
          setShowWorkshop(true);
          return 100;
        }
        return next;
      });
    }, 30);
  };

  // =================================================================
  // B. 업로드(Visualize) 완료 -> 로딩 화면(3초) -> 3D 뷰어 오픈
  // =================================================================
  const handleVisualizationStart = (imageUrl: string) => {
    setUploadedImage(imageUrl);

    // 로딩 시작
    setIsLoading(true);
    setProgress(0);
    setLoadingText(LOADING_STAGES[0].text);

    // 로딩 시뮬레이션
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;

        // 단계별 텍스트 업데이트
        const stage = LOADING_STAGES.find((s) => next <= s.limit);
        if (stage) setLoadingText(stage.text);

        if (next >= 100) {
          clearInterval(interval);

          // 로딩 끝: 로딩창 끄고 -> 뷰어 켜기
          setIsLoading(false);
          setShowWorkshop(true);
          return 100;
        }
        return next; // 속도 조절
      });
    }, 30);
  };

  // 로딩 취소 버튼
  const handleCancelLoading = () => {
    setIsLoading(false);
    setProgress(0);
  };

  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white overflow-hidden">
      {/* -----------------------------------------------------------------
          DEBUG ROUTER PANEL (좌측 하단)
      ------------------------------------------------------------------ */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
        {showDebug && (
          <div className="flex flex-col gap-2 rounded-xl border border-gray-700 bg-gray-900/90 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
            <div className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Debug Router
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setScreen("splash")}
                className={`px-4 py-2 text-sm rounded text-left transition-all ${
                  screen === "splash"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                1. Splash
              </button>
              <button
                onClick={() => setScreen("walkthrough")}
                className={`px-4 py-2 text-sm rounded text-left transition-all ${
                  screen === "walkthrough"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                2. Walkthrough
              </button>
              <button
                onClick={() => setScreen("home")}
                className={`px-4 py-2 text-sm rounded text-left transition-all ${
                  screen === "home"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                3. Main (Home)
              </button>
            </div>
            {/* 상태 강제 조작 (테스트용) */}
            {screen === "home" && (
              <div className="mt-2 pt-2 border-t border-gray-700 flex gap-2">
                <button
                  onClick={() => {
                    setIsLoading(false);
                    setShowWorkshop(false);
                  }}
                  className="text-[10px] bg-red-900/50 px-2 py-1 rounded"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-white hover:bg-gray-700"
        >
          {showDebug ? <X size={18} /> : <Settings size={18} />}
        </button>
      </div>

      {/* -----------------------------------------------------------------
          MAIN CONTENT RENDER
      ------------------------------------------------------------------ */}

      {/* 1. Splash */}
      {screen === "splash" && (
        <SplashScreen onFinish={() => setScreen("walkthrough")} />
      )}

      {/* 2. Walkthrough */}
      {screen === "walkthrough" && (
        <WalkthroughScreen onStart={() => setScreen("home")} />
      )}

      {/* 3. Main Home */}
      {screen === "home" && (
        <div className="relative w-full h-full">
          {/* [Hero Section]
            - 로딩 중이거나 워크샵이 열려있으면 배경으로만 존재하고 클릭 안되게 처리
            - opacity를 0으로 하면 완전히 사라지고, 100이면 보임
          */}
          <div
            className={`transition-all duration-500 ${
              isLoading || showWorkshop
                ? "opacity-0 pointer-events-none absolute inset-0"
                : "opacity-100"
            }`}
          >
            <CustomizerHero
              onDebugClick={handleDebugClick} // 디버그 -> 즉시 뷰어
              onVisualizationComplete={handleVisualizationStart} // 업로드 -> 로딩 후 뷰어
            />
          </div>

          {/* [Loading Popup] 
            - isLoading이 true일 때만 표시 
            - 검은색 네온 팝업 디자인
          */}
          {isLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="relative w-[500px] max-w-[90%] bg-black border border-cyan-500/30 rounded-3xl p-12 text-center shadow-[0_0_50px_rgba(0,195,255,0.15)]">
                {/* Title */}
                <h3 className="text-gray-300 text-lg font-medium mb-8 animate-pulse">
                  {loadingText}
                </h3>

                {/* Progress Bar and Percentage */}
                <div className="flex flex-col items-center justify-center mb-8">
                  <div className="w-3/4 h-2 bg-gray-800 rounded-full overflow-hidden mb-4 ring-1 ring-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_#00c3ff]"
                      style={{
                        width: `${progress}%`,
                        transition: "width 0.1s linear",
                      }}
                    />
                  </div>
                  <span className="text-3xl font-bold text-white tracking-widest drop-shadow-md">
                    {progress}%
                  </span>
                </div>

                {/* Cancel Button */}
                <button
                  onClick={handleCancelLoading}
                  className="px-6 py-2 rounded-full bg-[#111] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* [3D Workshop Viewer]
            - showWorkshop이 true일 때 표시
            - 에러 해결 포인트: WorkshopModal에 className을 직접 넣지 않고,
              바깥을 div로 감싸서 전체 화면(fixed inset-0)으로 만듦.
          */}
          {showWorkshop && (
            <div className="fixed inset-0 z-[100] w-full h-full bg-black animate-in zoom-in-95 duration-500">
              <WorkshopModal
                initialImage={uploadedImage}
                onClose={() => setShowWorkshop(false)}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
