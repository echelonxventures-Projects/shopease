"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlayInterval?: number;
}

export function BannerCarousel({
  banners,
  autoPlayInterval = 5000,
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      if (banners.length === 0) return;
      setCurrent((index + banners.length) % banners.length);
    },
    [banners.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (isPaused || banners.length <= 1) return;
    const timer = setInterval(next, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, next, autoPlayInterval, banners.length]);

  // Touch/swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    touchStartTimeRef.current = Date.now();
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent vertical scroll while swiping horizontally
    const diff = touchStartRef.current - e.touches[0].clientX;
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    const elapsed = Date.now() - touchStartTimeRef.current;
    const velocity = Math.abs(diff) / elapsed;

    // Swipe threshold: 50px or fast velocity
    if (Math.abs(diff) > 50 || velocity > 0.5) {
      if (diff > 0) next();
      else prev();
    }
    setIsPaused(false);
  };

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  if (!banners.length) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
      tabIndex={0}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => {
          const content = (
            <div className="relative w-full shrink-0 aspect-[21/8] md:aspect-[21/6]">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <h2 className="text-white text-xl md:text-3xl font-bold mb-1">
                  {banner.title}
                </h2>
                {banner.description && (
                  <p className="text-white/80 text-sm md:text-base max-w-lg">
                    {banner.description}
                  </p>
                )}
              </div>
            </div>
          );

          return banner.link ? (
            <Link
              key={banner.id}
              href={banner.link}
              className="w-full shrink-0"
              aria-roledescription="slide"
            >
              {content}
            </Link>
          ) : (
            <div
              key={banner.id}
              className="w-full shrink-0"
              aria-roledescription="slide"
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to banner ${i + 1}`}
              aria-current={i === current ? "true" : "false"}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Pause indicator */}
      {isPaused && banners.length > 1 && (
        <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Paused
        </div>
      )}
    </div>
  );
}
