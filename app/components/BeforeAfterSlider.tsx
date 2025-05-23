"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Save container dimensions on load and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        containerRef.current.getBoundingClientRect();
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Preload both images to get their natural dimensions
  useEffect(() => {
    const localBeforeImg = new window.Image();
    const localAfterImg = new window.Image();
    let loadedCount = 0;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Use the larger of the two images for consistent sizing
        // Math.max(localBeforeImg.naturalWidth, localAfterImg.naturalWidth);
        // Math.max(localBeforeImg.naturalHeight, localAfterImg.naturalHeight);
        setIsLoaded(true);
      }
    };

    localBeforeImg.onload = checkAllLoaded;
    localAfterImg.onload = checkAllLoaded;

    localBeforeImg.src = beforeImage;
    localAfterImg.src = afterImage;

    return () => {
      localBeforeImg.onload = null;
      localAfterImg.onload = null;
    };
  }, [beforeImage, afterImage]);

  // Handle mouse down to start dragging
  const handleMouseDown = () => {
    isDragging.current = true;
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Handle mouse move to update slider position
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement> | MouseEvent
  ) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(x, 0), 100));
  };

  // Handle touch events for mobile
  const handleTouchMove = (
    e: React.TouchEvent<HTMLDivElement> | TouchEvent
  ) => {
    if (!containerRef.current) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(x, 0), 100));
  };

  // Add global event listeners for mouse up and move
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        handleMouseMove(e);
      }
    };

    const handleGlobalTouchEnd = () => {
      isDragging.current = false;
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging.current) {
        handleTouchMove(e);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("touchend", handleGlobalTouchEnd);
    window.addEventListener("touchmove", handleGlobalTouchMove);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black/5"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main content */}
      {isLoaded && (
        <>
          {/* Image container with fixed aspect ratio */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* After Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={afterImage}
                alt={afterLabel}
                layout="fill"
                objectFit="cover"
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>

            {/* Before Image with clip mask */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            >
              <Image
                src={beforeImage}
                alt={beforeLabel}
                layout="fill"
                objectFit="cover"
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>

            {/* Slider Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-lg z-10"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white shadow-lg border-2 border-gray-300 flex items-center justify-center">
                <div className="text-gray-800 text-xs">⇄</div>
              </div>
            </div>
          </div>

          {/* Labels */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded-md z-10">
            {beforeLabel}
          </div>
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-sm px-2 py-1 rounded-md z-10">
            {afterLabel}
          </div>
        </>
      )}
    </div>
  );
};

export default BeforeAfterSlider;
