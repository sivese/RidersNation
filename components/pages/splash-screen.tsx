"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // 3.5초 뒤 페이드아웃
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3500);

    // 4.0초 뒤 종료
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 4000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight flex items-center gap-1">
        <span
          className="text-foreground font-semibold animate-fade-in opacity-0"
          style={{ animationDelay: "0.2s" }}
        >
          Re:
        </span>
        <span
          className="font-bold animate-water-fill opacity-0"
          style={{ animationDelay: "1.2s" }}
        >
          VISION
        </span>
      </h1>
    </div>
  );
};
