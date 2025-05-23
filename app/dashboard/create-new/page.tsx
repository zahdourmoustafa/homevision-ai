"use client";

import React, { useState, useEffect } from "react";
// import { supabase } from "@/lib/supabase"; // Removed
// import { MdPhotoLibrary } from "react-icons/md"; // Removed
import Image from "next/image";
import { Button } from "@/components/ui/button";
// Removed FiMaximize2, FiTrash2, FiDownload from this import, kept FiX
import { FiX } from "react-icons/fi";
import BeforeAfterSlider from "@/app/components/BeforeAfterSlider";

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
          <div className="flex gap-2">
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
