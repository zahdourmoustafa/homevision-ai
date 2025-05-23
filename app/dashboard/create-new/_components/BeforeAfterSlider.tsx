"use client";

import React, { useState, useEffect } from "react";
import ReactBeforeSliderComponent from "react-before-after-slider-component";
import "react-before-after-slider-component/dist/build.css";
import { Button } from "@/components/ui/button";
import { Download, SplitSquareHorizontal, Heart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  onFavoriteChange?: () => void;
}

interface FavoriteImage {
  id: string;
  imageUrl: string;
  originalImage: string;
  timestamp: number;
}

const BeforeAfterSliderComponent: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  onFavoriteChange,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setIsFavorited(
      favorites.some((fav: FavoriteImage) => fav.imageUrl === afterImage)
    );
  }, [afterImage]);

  const FIRST_IMAGE = {
    imageUrl: beforeImage,
    alt: "Original Room",
  };
  const SECOND_IMAGE = {
    imageUrl: afterImage,
    alt: "Generated Room",
  };

  const toggleFavorite = () => {
    const favorites: FavoriteImage[] = JSON.parse(
      localStorage.getItem("favorites") || "[]"
    );

    if (isFavorited) {
      const updatedFavorites = favorites.filter(
        (fav) => fav.imageUrl !== afterImage
      );
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      setIsFavorited(false);
      toast.success("Removed from favorites");
    } else {
      const newFavorite: FavoriteImage = {
        id: Date.now().toString(),
        imageUrl: afterImage,
        originalImage: beforeImage,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        "favorites",
        JSON.stringify([...favorites, newFavorite])
      );
      setIsFavorited(true);
      toast.success("Added to favorites");
    }
    onFavoriteChange?.();
  };

  const downloadImage = async (
    imageUrl: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    toast.info("Starting download...");

    try {
      const fileName = "redesigned-room.jpg";
      const proxiedUrlString = `/api/download?url=${encodeURIComponent(
        imageUrl
      )}&filename=${fileName}`;

      // Fetch the image data from our API route
      const response = await fetch(proxiedUrlString);

      if (!response.ok) {
        // Try to get error message from response body
        let errorBody = "Unknown error";
        try {
          const errorJson = await response.json();
          errorBody = errorJson.error || JSON.stringify(errorJson);
        } catch (e) {
          // If response is not JSON, use status text
          errorBody = response.statusText;
        }
        throw new Error(
          `Failed to fetch download: ${response.status} ${errorBody}`
        );
      }

      // Get the blob data
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.style.display = "none"; // Hide the link
      document.body.appendChild(link); // Append to body to make it clickable

      // Programmatically click the link
      link.click();

      // Clean up: remove the link and revoke the blob URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download started!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error(
        `Failed to download image: ${
          (error as Error).message || "Please try again."
        }`
      );
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="relative flex-1 bg-themeGray rounded-2xl overflow-hidden">
        {showComparison ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full">
              <ReactBeforeSliderComponent
                firstImage={FIRST_IMAGE}
                secondImage={SECOND_IMAGE}
                delimiterColor="#fff"
                currentPercentPosition={50}
              />
            </div>
          </div>
        ) : (
          <div className="relative h-full rounded-2xl overflow-hidden flex items-center justify-center">
            <Image
              src={afterImage}
              alt="Redesigned Room"
              fill
              className="object-contain"
              priority
              sizes="800px"
            />
          </div>
        )}

        {/* Favorite button stays at top right */}
        <div className="absolute top-3 right-10">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleFavorite}
                  size="icon"
                  variant="secondary"
                  className="bg-black hover:bg-themeGray backdrop-blur-sm rounded-full"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorited
                        ? "fill-red-500 text-red-500"
                        : "text-themeTextWhite"
                    }`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isFavorited ? "Remove from favorites" : "Add to favorites"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Compare and Download buttons at bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  size="icon"
                  variant="secondary"
                  className="bg-black hover:bg-themeGray backdrop-blur-sm rounded-full"
                >
                  <SplitSquareHorizontal className="w-4 h-4 text-themeTextWhite" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {showComparison ? "Hide comparison" : "Compare with original"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => downloadImage(afterImage, e)}
                  size="icon"
                  variant="secondary"
                  className="bg-black hover:bg-themeGray backdrop-blur-sm rounded-full"
                >
                  <Download className="w-4 h-4 text-themeTextWhite" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Download image</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSliderComponent;
