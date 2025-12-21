"use client";

import { useState } from "react";
import { Settings, X } from "lucide-react";

// 컴포넌트 import
import { SplashScreen } from "@/components/pages/splash-screen";
import { WalkthroughScreen } from "@/components/pages/walkthrough-screen";
import { CustomizerHero } from "@/components/customizer-hero";
import { WorkshopModal } from "@/components/workshop-modal"; // ✨ 새로 만든 모달 컴포넌트

export default function Home() {
  // 화면 상태: 'splash' -> 'walkthrough' -> 'home'
  const [screen, setScreen] = useState<"splash" | "walkthrough" | "home">(
    "splash"
  );

  // 데이터 전달: Hero -> Workshop
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // ✨ 팝업 모달 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 디버그 패널 토글 상태
  const [showDebug, setShowDebug] = useState(true);

  // Hero에서 이미지 생성 완료 시 호출됨
  const handleHeroComplete = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    // 기존 스크롤 로직 대신 모달을 엽니다.
    setIsModalOpen(true);
  };

  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white">
      {/* ============================================================
          🛠️ DEBUG ROUTER PANEL (기존 유지)
      ============================================================= */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
        {showDebug && (
          <div className="flex flex-col gap-2 rounded-xl border border-gray-700 bg-gray-900/90 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2">
            <div className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Debug Router
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setScreen("splash")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all text-left
                  ${
                    screen === "splash"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                1. Splash Screen
              </button>

              <button
                onClick={() => setScreen("walkthrough")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all text-left
                  ${
                    screen === "walkthrough"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                2. Walk-through
              </button>

              <button
                onClick={() => setScreen("home")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all text-left
                  ${
                    screen === "home"
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
              >
                3. Main (Home)
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
              Current: <span className="text-blue-400 font-mono">{screen}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowDebug(!showDebug)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 border border-gray-700 text-white shadow-lg hover:bg-gray-700 transition-colors"
          title="Toggle Debug Router"
        >
          {showDebug ? <X size={18} /> : <Settings size={18} />}
        </button>
      </div>
      {/* ============================================================ */}

      {/* 1. Splash Screen */}
      {screen === "splash" && (
        <SplashScreen onFinish={() => setScreen("walkthrough")} />
      )}

      {/* 2. Walkthrough Screen */}
      {screen === "walkthrough" && (
        <WalkthroughScreen onStart={() => setScreen("home")} />
      )}

      {/* 3. Main Home (Hero -> Modal Popup) */}
      {screen === "home" && (
        <div className="animate-in fade-in duration-1000">
          {/* Hero: 이미지 업로드 및 디버그 버튼 */}
          <CustomizerHero
            onDebugClick={() => setIsModalOpen(true)}
            onVisualizationComplete={handleHeroComplete}
          />

          {/* Workshop Modal: 팝업 형태로 뜨는 워크샵 */}
          {isModalOpen && (
            <WorkshopModal
              initialImage={uploadedImage}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </div>
      )}
    </main>
  );
}
