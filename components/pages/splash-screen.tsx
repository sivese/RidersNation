"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const MIN_DISPLAY_TIME = 2800; // Minimum 2.5 seconds for branding
    const MAX_WAIT_TIME = 12000; // Maximum 12 seconds timeout

    let hasFinished = false;

    // Function to check if all resources are loaded
    const checkResourcesLoaded = async () => {
      try {
        // Wait for DOM to be fully loaded
        if (document.readyState !== "complete") {
          return false;
        }

        // Wait for fonts to be loaded
        await document.fonts.ready;

        // Wait for all images to load
        const images = Array.from(document.images);
        const imagePromises = images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve; // Resolve even on error to prevent hanging
          });
        });
        await Promise.all(imagePromises);

        return true;
      } catch (error) {
        console.warn("Resource loading check failed:", error);
        return true; // Continue anyway on error
      }
    };

    // Main loading logic
    const handleLoading = async () => {
      // Wait for window load event
      if (document.readyState !== "complete") {
        await new Promise((resolve) => {
          window.addEventListener("load", resolve, { once: true });
        });
      }

      // Check all resources
      await checkResourcesLoaded();

      // Calculate elapsed time
      const elapsedTime = Date.now() - startTime;
      const remainingMinTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime);

      // Wait for minimum display time if needed
      if (remainingMinTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMinTime));
      }

      // Mark as ready
      if (!hasFinished) {
        setIsReady(true);
      }
    };

    // Maximum timeout fallback
    const maxTimeout = setTimeout(() => {
      if (!hasFinished) {
        console.warn("Loading timeout reached, proceeding anyway");
        setIsReady(true);
      }
    }, MAX_WAIT_TIME);

    // Start loading check
    handleLoading();

    return () => {
      hasFinished = true;
      clearTimeout(maxTimeout);
    };
  }, []);

  // Handle fade out and finish when ready
  useEffect(() => {
    if (!isReady) return;

    // Start fade out
    setIsFadingOut(true);

    // Finish after fade animation (500ms)
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 1000);

    return () => {
      clearTimeout(finishTimer);
    };
  }, [isReady, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight flex items-center gap-1">
        <span
          className="text-foreground font-semibold animate-fade-in opacity-0"
          style={{ animationDelay: "0.1s" }}
        >
          Re:
        </span>
        <span
          className="font-bold animate-water-fill opacity-0"
          style={{ animationDelay: "0.5s" }}
        >
          VISION
        </span>
      </h1>
    </div>
  );
};
