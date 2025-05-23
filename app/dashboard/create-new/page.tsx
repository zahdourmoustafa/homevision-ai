"use client";

import React, { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabase"; // Removed
// import { MdPhotoLibrary } from "react-icons/md"; // Removed
import Image from "next/image";
import { Button } from "@/components/ui/button"; // Button is used
// Removed FiMaximize2, FiTrash2, FiDownload from this import, kept FiX
import { FiX } from "react-icons/fi";
import BeforeAfterSlider from "@/app/components/BeforeAfterSlider";
// import TextLoader from "@/components/TextLoader"; // TextLoader is unused
// import { toast } from "sonner"; // toast is unused

// import {
//   Tabs,
//   TabsContent,
//   TabsList, // TabsList is unused
//   TabsTrigger, // TabsTrigger is unused
// } from "@/components/ui/tabs";
// import { Slider } from "@/components/ui/slider"; // Slider is unused
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select, // Select is unused
//   SelectContent, // SelectContent is unused
//   SelectItem, // SelectItem is unused
//   SelectTrigger, // SelectTrigger is unused
//   SelectValue, // SelectValue is unused
// } from "@/components/ui/select";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { FiZoomIn } from "react-icons/fi"; // FiZoomIn is unused
// import { Info, Grid, Rows, ChevronLeft, ChevronRight } from "lucide-react";
// import { RiSparklingLine } from "react-icons/ri";
// import { FiSliders } from "react-icons/fi"; // FiSliders is unused
// import ImageSelection from "./_components/ImageSelection";
// import BeforeAfterSliderComponent from "./_components/BeforeAfterSlider";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Zap, // Zap is unused
//   Sun, // Sun is unused
//   Palmtree, // Palmtree is unused
//   Waves, // Waves is unused
//   Clock, // Clock is unused
//   Factory, // Factory is unused
//   Building, // Building is unused
//   Feather, // Feather is unused
// } from "lucide-react";

// Interface for the generated result
interface GeneratedResult {
  generatedImage: string;
  rawImage: string;
  timestamp: number;
}

function CreateNew() {
  // State management
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>(
    []
  );
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"after" | "before" | "side-by-side">(
    "after"
  );
  const [currentResultIndex, setCurrentResultIndex] = useState<number | null>(
    null
  );

  // Key for localStorage
  const localStorageKey = "generatedInteriorResults";

  // Load results from localStorage on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem(localStorageKey);
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        // Basic validation to ensure it's an array
        if (Array.isArray(parsedResults)) {
          setGeneratedResults(parsedResults);
        } else {
          console.warn("Invalid data found in localStorage, clearing.");
          localStorage.removeItem(localStorageKey);
        }
      } catch (error) {
        console.error("Error parsing results from localStorage:", error);
        localStorage.removeItem(localStorageKey); // Clear invalid data
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save results to localStorage whenever they change
  useEffect(() => {
    // Only save if there are results to prevent saving an empty array initially
    if (generatedResults.length > 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(generatedResults));
    }
    // Optionally, clear localStorage if the results become empty (e.g., user deletes all)
    // else {
    //   localStorage.removeItem(localStorageKey);
    // }
  }, [generatedResults]); // Dependency array ensures this runs when generatedResults changes

  // Function to close modal
  const closeImageModal = () => {
    setModalImage(null);
    setCurrentResultIndex(null);
    setViewMode("after");
  };

  // Function to download image
  // const downloadImage = async ( // downloadImage is unused
  //   imageUrl: string,
  //   index: number | null // Assuming index might be used for naming or tracking
  // ) => {
  //   if (index === null) return;
  //   toast.info("Starting download...");

  //   try {
  //     const fileName = `generated_image_${index + 1}.jpg`;
  //     const proxiedUrlString = `/api/download?url=${encodeURIComponent(
  //       imageUrl
  //     )}&filename=${fileName}`;

  //     const response = await fetch(proxiedUrlString);

  //     if (!response.ok) {
  //       // Try to get error message from response body
  //       let errorBody = "Unknown error";
  //       try {
  //         const errorJson: { error?: string } = await response.json();
  //         errorBody = errorJson.error || JSON.stringify(errorJson);
  //       } catch /* istanbul ignore next */ {
  //         // If response is not JSON, use status text
  //         errorBody = response.statusText;
  //       }
  //       throw new Error(
  //         `Failed to fetch download: ${response.status} ${errorBody}`
  //       );
  //     }

  //     const blob = await response.blob();
  //     const blobUrl = window.URL.createObjectURL(blob);
  //     const link = document.createElement("a");
  //     link.href = blobUrl;
  //     link.download = fileName;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(blobUrl);
  //     toast.success("Download started!");
  //   } catch (error) { // Changed type to unknown
  //     // Added type for error
  //     console.error("Error downloading image:", error);
  //     if (error instanceof Error) {
  //       toast.error(`Failed to download image: ${error.message}`);
  //     } else {
  //       toast.error("Failed to download image: An unknown error occurred");
  //     }
  //   }
  // };

  if (!modalImage || currentResultIndex === null) return null;

  const currentImage = generatedResults[currentResultIndex];
  let beforeSrc = currentImage.rawImage;
  let afterSrc = currentImage.generatedImage;

  // Ensure that beforeSrc and afterSrc are valid strings
  if (typeof beforeSrc !== "string") {
    console.error("Invalid beforeSrc:", beforeSrc);
    beforeSrc = ""; // Fallback to an empty string or some default placeholder
  }
  if (typeof afterSrc !== "string") {
    console.error("Invalid afterSrc:", afterSrc);
    afterSrc = ""; // Fallback to an empty string
  }

  // Conditional rendering for different view modes
  let modalContent;
  if (viewMode === "side-by-side" && beforeSrc && afterSrc) {
    modalContent = (
      <BeforeAfterSlider beforeImage={beforeSrc} afterImage={afterSrc} />
    );
  } else if (viewMode === "before" && beforeSrc) {
    modalContent = (
      <Image
        src={beforeSrc}
        alt="Original room"
        fill
        className="object-contain rounded-lg"
        unoptimized
      />
    );
  } else if (afterSrc) {
    // Default to "after"
    modalContent = (
      <Image
        src={afterSrc}
        alt="Generated room"
        fill
        className="object-contain rounded-lg"
        unoptimized
      />
    );
  } else {
    modalContent = <p>Image not available</p>; // Fallback if no valid image
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl h-[80vh] bg-themeDarkGray rounded-xl shadow-2xl flex flex-col overflow-hidden p-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          {/* <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setComparisonView(
                viewMode === "side-by-side" ? "after" : "side-by-side"
              )
            }
          >
            <FiMaximize2 className="w-5 h-5" />
          </Button> */}
          {/* {viewMode === "side-by-side" && (
            <>
              <Button
                variant={"outline"}
                onClick={() => setComparisonView("before")}
              >
                Show Original
              </Button>
              <Button
                variant={"outline"}
                onClick={() => setComparisonView("after")}
              >
                Show Generated
              </Button>
            </>
          )} */}
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant="outline"
            size="icon"
            onClick={() =>
              downloadImage(currentImage.generatedImage, currentResultIndex)
            }
          >
            <FiDownload className="w-5 h-5" />
          </Button> */}
          {/* <Button
            variant="outline"
            size="icon"
            onClick={() => deleteImage(currentImage.generatedImage)}
            className="hover:bg-red-500/20 hover:text-red-500 text-red-500 border-red-500"
          >
            <FiTrash2 className="w-5 h-5" />
          </Button> */}
          <Button variant="outline" size="icon" onClick={closeImageModal}>
            <FiX className="w-5 h-5" />
          </Button>
        </div>

        {/* Image display area */}
        <div className="flex-1 relative rounded-lg overflow-hidden bg-black">
          {modalContent}
        </div>
      </div>
    </div>
  );
}

export default CreateNew;
