"use client";

import React, { useState, useEffect, Suspense, memo } from "react";
import { toast } from "sonner";
import LoadingSpinner from "../_components/LoadingSpinner";

// Import custom hooks
import { useFileHandling } from "./_components/hooks/useFileHandling";
import {
  useImageGeneration,
  GenerationParams,
} from "./_components/hooks/useImageGeneration";
import { useImageModal } from "./_components/hooks/useImageModal";

// Import components
import StyleCategorySelector from "./_components/StyleCategorySelector";
import ImageUploadArea from "./_components/ImageUploadArea";
import ControlPanel from "./_components/ControlPanel";
import ImageModal from "./_components/ImageModal";
import ComparisonModal from "./_components/ComparisonModal";

// Import utilities
import { downloadImage } from "./_components/utils/downloadUtils";

// Style categories data
const styleCategories = [
  {
    id: "scandinavian",
    label: "SCANDINAVIAN",
    image: "/images/styles/modern.jpg",
  },
  {
    id: "christmas",
    label: "CHRISTMAS",
    image: "/images/styles/vintage.jpg",
  },
  { id: "japandi", label: "JAPANDI", image: "/images/styles/modern.jpg" },
  { id: "eclectic", label: "ECLECTIC", image: "/images/styles/vintage.jpg" },
  {
    id: "minimalist",
    label: "MINIMALIST",
    image: "/images/styles/modern.jpg",
  },
  {
    id: "futuristic",
    label: "FUTURISTIC",
    image: "/images/styles/modern.jpg",
  },
  { id: "bohemian", label: "BOHEMIAN", image: "/images/styles/vintage.jpg" },
  { id: "parisian", label: "PARISIAN", image: "/images/styles/vintage.jpg" },
  { id: "random", label: "RANDOM", image: "/images/styles/modern.jpg" },
];

function CreateNew() {
  // Component state
  const [isComponentsLoaded, setIsComponentsLoaded] = useState(false);

  // Room and design settings
  const [roomType, setRoomType] = useState<string>("");
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<string[]>([]);
  const [additionalReq, setAdditionalReq] = useState<string>("");
  const [aiCreativity] = useState<number>(50);
  const [removeFurniture, setRemoveFurniture] = useState(false);

  // Custom hooks
  const fileHandling = useFileHandling();
  const imageGeneration = useImageGeneration();
  const modalHandling = useImageModal();

  // Load components after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Style toggle handler
  const toggleDesignStyle = (style: string) => {
    setSelectedDesignTypes((prev) => {
      if (prev.includes(style)) {
        return prev.filter((s) => s !== style);
      }
      if (prev.length < 4) {
        return [...prev, style];
      }
      toast.info("You can select up to 4 design styles");
      return prev;
    });
  };

  // Generate image handler
  const handleGenerate = () => {
    if (!fileHandling.selectedFile) {
      toast.error("Please upload an image first.");
      return;
    }

    const params: GenerationParams = {
      roomType,
      selectedDesignTypes,
      additionalReq,
      aiCreativity,
      removeFurniture,
    };

    imageGeneration.generateImage(fileHandling.selectedFile, params);
  };

  // Download handler
  const handleDownload = async (imageUrl: string, fileName?: string) => {
    try {
      const downloadFileName =
        fileName ||
        `room-${Date.now()}-${
          fileHandling.selectedFile?.name || "generated.jpg"
        }`;
      await downloadImage(imageUrl, downloadFileName);
      toast.success("Image downloaded successfully!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  // Check if generation is possible
  const canGenerate = !!(
    fileHandling.selectedFile &&
    roomType &&
    selectedDesignTypes.length > 0 &&
    !imageGeneration.isLoading
  );

  // Show loading spinner initially
  if (!isComponentsLoaded) {
    return <LoadingSpinner message="Loading design studio..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading interface..." />}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Left Sidebar - Style Categories */}
        <StyleCategorySelector
          categories={styleCategories}
          selectedStyles={selectedDesignTypes}
          onStyleToggle={toggleDesignStyle}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Central Image Display */}
          <ImageUploadArea
            preview={fileHandling.preview}
            onFileInputChange={fileHandling.handleFileInputChange}
            onDrop={fileHandling.handleDrop}
            onDragOver={fileHandling.handleDragOver}
            generatedResults={imageGeneration.generatedResults}
            onImageModalOpen={modalHandling.openImageModal}
          />

          {/* Bottom Navigation Bar */}
          <div className="bg-white border-t px-6 py-3">
            <div className="flex items-center justify-center">
              <p className="text-sm text-gray-600">
                Select styles from the left sidebar and configure options in the
                right panel
              </p>
            </div>
          </div>
        </div>

        {/* Right Control Panel */}
        <ControlPanel
          roomType={roomType}
          onRoomTypeChange={setRoomType}
          additionalReq={additionalReq}
          onAdditionalReqChange={setAdditionalReq}
          removeFurniture={removeFurniture}
          onRemoveFurnitureToggle={() => setRemoveFurniture(!removeFurniture)}
          generatedResults={imageGeneration.generatedResults}
          onImageModalOpen={modalHandling.openImageModal}
          onSliderModalOpen={modalHandling.openSliderModal}
          onDownloadImage={(url) => handleDownload(url)}
          onGenerate={handleGenerate}
          isGenerating={imageGeneration.isLoading}
          canGenerate={canGenerate}
        />

        {/* Image Modal */}
        <ImageModal
          result={modalHandling.modalImageResult}
          isOpen={!!modalHandling.modalImageResult}
          onClose={modalHandling.closeImageModal}
          onDownload={handleDownload}
          onOpenSlider={(result) => {
            modalHandling.closeImageModal();
            modalHandling.openSliderModal(result);
          }}
          onDelete={imageGeneration.deleteImage}
          originalFileName={fileHandling.selectedFile?.name}
        />

        {/* Comparison Modal */}
        <ComparisonModal
          result={modalHandling.activeSlider}
          isOpen={!!modalHandling.activeSlider}
          onClose={modalHandling.closeSliderModal}
        />
      </div>
    </Suspense>
  );
}

export default memo(CreateNew);
