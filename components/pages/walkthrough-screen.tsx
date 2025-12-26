"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronRight, Play, Pause } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    title: "2D becomes 3D.",
    description: "Transform a static photo into a spatial model. Instantly.",
    duration: 3000,
    video: "/videos/video1.mp4",
    poster: "/videos/poster1.jpg",
  },
  {
    id: 2,
    title: "360° Inspection.",
    description: "Explore every angle. Zoom in to see the finest details.",
    duration: 8000,
    video: "/videos/video2.mp4",
    poster: "/videos/poster2.jpg",
  },
  {
    id: 3,
    title: "Real-time Estimate.",
    description: "Get instant pricing updates as you modify your build.",
    duration: 5000,
    video: "/videos/video3.mp4",
    poster: "/videos/poster3.jpg",
  },
];

interface WalkthroughScreenProps {
  onStart: () => void;
}

export const WalkthroughScreen = ({ onStart }: WalkthroughScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasWatchedFirstVideo, setHasWatchedFirstVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Video refs for controlling playback
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // 드래그 로직을 위한 Refs
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // 1. 스크롤 위치 감지 (현재 슬라이드 계산)
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const currentScrollLeft = container.scrollLeft;
    const containerWidth = container.offsetWidth;
    const center = currentScrollLeft + containerWidth / 2;

    const cards = Array.from(container.children) as HTMLElement[];
    let newIndex = currentSlide;
    let minDistance = Infinity;

    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);

      if (distance < minDistance) {
        minDistance = distance;
        newIndex = index;
      }
    });

    if (newIndex !== currentSlide) {
      setCurrentSlide(newIndex);
      setProgress(0);
    }
  };

  // 2. 마우스 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    setIsPaused(true);

    // 드래그 시작점 기록
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;

    // ✨ 중요: 드래그 중에는 스냅을 꺼야 부드럽게 움직임
    scrollContainerRef.current.style.scrollSnapType = "none";
    scrollContainerRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeave = () => {
    if (!isDragging.current) return;
    stopDragging();
  };

  const handleMouseUp = () => {
    stopDragging();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault(); // 텍스트 선택 방지

    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // 1.5는 스크롤 속도 배수
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const stopDragging = () => {
    isDragging.current = false;
    setIsPaused(false);

    //  드래그 끝나면 다시 스냅 활성화 -> 가장 가까운 카드로 "착" 붙음
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollSnapType = "x mandatory";
      scrollContainerRef.current.style.cursor = "grab";
    }
  };

  // 3. 특정 슬라이드로 이동 (버튼 클릭 시)
  const scrollToSlide = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const cards = Array.from(container.children) as HTMLElement[];
    const targetCard = cards[index];

    if (targetCard) {
      const targetScrollLeft =
        targetCard.offsetLeft -
        (container.offsetWidth - targetCard.offsetWidth) / 2;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // 3.5. Toggle video play/pause
  const toggleVideoPlayback = () => {
    const currentVideo = videoRefs.current[currentSlide];
    if (currentVideo) {
      if (isVideoPlaying) {
        currentVideo.pause();
        setIsVideoPlaying(false);
      } else {
        // Only play if first video was watched or current is first video
        if (currentSlide === 0 || hasWatchedFirstVideo) {
          currentVideo.play().catch(() => {});
          setIsVideoPlaying(true);
        }
      }
    }
  };

  // 4. Track when user has watched the first video
  useEffect(() => {
    // If user moves away from the first slide, mark it as watched
    if (currentSlide > 0 && !hasWatchedFirstVideo) {
      setHasWatchedFirstVideo(true);
    }
  }, [currentSlide, hasWatchedFirstVideo]);

  // 5. Video playback control - first video must be watched to unlock others
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentSlide) {
          // Play current video only if:
          // - It's the first video (always allowed), OR
          // - User has already watched the first video
          // AND isVideoPlaying is true
          if ((index === 0 || hasWatchedFirstVideo) && isVideoPlaying) {
            video.play().catch(() => {
              // Handle autoplay restrictions
            });
          } else {
            // Don't play videos 2 and 3 if first video hasn't been watched
            // or if video is paused by user
            video.pause();
          }
        } else {
          // Pause all non-active videos
          video.pause();
        }
      }
    });
  }, [currentSlide, hasWatchedFirstVideo, isVideoPlaying]);

  // 5.5. Reset video playing state when slide changes
  useEffect(() => {
    setIsVideoPlaying(true);
  }, [currentSlide]);

  // 6. 자동 재생 타이머
  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const duration = SLIDES[currentSlide].duration;
    const increment = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentSlide < SLIDES.length - 1) {
            scrollToSlide(currentSlide + 1);
            return 0;
          } else {
            clearInterval(timer);
            // onStart(); // 자동 종료 원하면 주석 해제
            return 100;
          }
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentSlide, isPaused]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#111] text-white overflow-hidden select-none">
      {/* Header */}
      <div className="pt-12 text-center px-4 animate-in fade-in slide-in-from-top-8 duration-1000">
        <h1 className="text-foreground text-4xl md:text-5xl font-bold tracking-tight">
          The Workflow.
        </h1>
      </div>

      {/* Scroll Container 
        - cursor-grab: 마우스 커서 손바닥 모양
      */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="
          flex-1 flex items-center 
          overflow-x-auto snap-x snap-mandatory 
          px-[10%] md:px-[25%]
          py-8
          scrollbar-hide cursor-grab active:cursor-grabbing
        "
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={slide.id}
              className="text-foreground w-[85vw] md:w-[60vw] flex-shrink-0 snap-center px-3 transition-all duration-500"
              // 클릭 시 스크롤 이동은 유지 (드래그가 아닐 때만 작동하게 하려면 로직 추가 필요하지만 보통 둬도 무방)
              onClick={() => {
                if (!isDragging.current) scrollToSlide(index);
              }}
            >
              <div
                className={`
                  relative w-full aspect-[4/3] md:aspect-[16/9] 
                  rounded-[2rem] overflow-hidden 
                  flex flex-col justify-between p-8 md:p-12
                  transition-all duration-500 ease-out
                  ${
                    isActive
                      ? "bg-[#1a1a1a] scale-100 opacity-100 shadow-2xl shadow-black/50"
                      : "bg-[#111] scale-95 opacity-40 blur-[1px]"
                  }
                `}
              >
                {/* Text Top */}
                <div
                  className="z-20 transition-opacity duration-500"
                  style={{ opacity: isActive ? 1 : 0 }}
                >
                  <h2 className="text-3xl md:text-5xl font-bold mb-3 pointer-events-none">
                    {slide.title}
                  </h2>
                </div>

                {/* Video Area */}
                <div className="absolute inset-0 flex pointer-events-none">
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el;
                    }}
                    src={slide.video}
                    poster={slide.poster}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Text Bottom */}
                <div
                  className="z-20 flex justify-between mt-auto transition-opacity duration-500"
                  style={{ opacity: isActive ? 1 : 0 }}
                >
                  <p className=" text-gray-300 font-medium text-lg md:text-xl leading-snug max-w-lg pointer-events-none">
                    {slide.description}
                  </p>
                  {/* Play/Pause Button - Bottom Right */}
                  <button
                    onClick={toggleVideoPlayback}
                    className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1a] border border-white/10 shadow-lg backdrop-blur-md transition-all hover:bg-[#252525] hover:border-blue-500/30 hover:shadow-blue-500/20 active:scale-95"
                    aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                  >
                    {isVideoPlaying ? (
                      <Pause className="h-6 w-6 text-white" />
                    ) : (
                      <Play className="h-6 w-6 text-white ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="pb-12 pt-4 flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          {/* Dots */}
          <div className="flex h-12 items-center gap-3 rounded-full bg-[#1a1a1a] px-5 border border-white/5 shadow-lg backdrop-blur-md">
            {SLIDES.map((_, index) => {
              const isActive = index === currentSlide;
              return (
                <button
                  key={index}
                  onClick={() => {
                    scrollToSlide(index);
                    setProgress(0);
                  }}
                  className="relative flex items-center justify-center py-2"
                >
                  <div
                    className={`
                        transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-full
                        ${
                          isActive
                            ? "w-8 h-2 bg-white"
                            : "w-2 h-2 bg-gray-600 hover:bg-gray-400"
                        }
                        `}
                  />
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => {
              if (currentSlide < SLIDES.length - 1) {
                scrollToSlide(currentSlide + 1);
              } else {
                onStart();
              }
            }}
            className="group flex h-12 items-center gap-2 rounded-full bg-[#1a1a1a] pl-5 pr-4 text-sm font-medium text-white border border-white/5 shadow-lg transition-all hover:bg-[#252525] active:scale-95"
          >
            <span>{currentSlide === SLIDES.length - 1 ? "Start" : "Next"}</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 transition-colors group-hover:bg-gray-600">
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Play/Pause Button - Bottom Right */}
      <button
        onClick={toggleVideoPlayback}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1a] border border-white/10 shadow-lg backdrop-blur-md transition-all hover:bg-[#252525] hover:border-blue-500/30 hover:shadow-blue-500/20 active:scale-95"
        aria-label={isVideoPlaying ? "Pause video" : "Play video"}
      >
        {isVideoPlaying ? (
          <Pause className="h-6 w-6 text-white" />
        ) : (
          <Play className="h-6 w-6 text-white ml-0.5" />
        )}
      </button>
    </div>
  );
};
