"use client";

import { useState, useEffect, Suspense, memo } from "react";
import { toast } from "sonner";
import LoadingSpinner from "../_components/LoadingSpinner";

// Import custom hooks from create-new (they're reusable)
import { useFileHandling } from "../create-new/_components/hooks/useFileHandling";
import {
  useImageGeneration,
  GenerationParams,
} from "../create-new/_components/hooks/useImageGeneration";
import { useImageModal } from "../create-new/_components/hooks/useImageModal";

// Import components from create-new (they're reusable)
import StyleCategorySelector from "../create-new/_components/StyleCategorySelector";
import ImageUploadArea from "../create-new/_components/ImageUploadArea";
import ControlPanel from "../create-new/_components/ControlPanel";
import ImageModal from "../create-new/_components/ImageModal";
import ComparisonModal from "../create-new/_components/ComparisonModal";

// Import utilities
import { downloadImage } from "../create-new/_components/utils/downloadUtils";

// Style categories specific to architectural rendering
const architecturalStyles = [
  { id: "modern", label: "MODERN", image: "/images/styles/modern.jpg" },
  {
    id: "contemporary",
    label: "CONTEMPORARY",
    image: "/images/styles/modern.jpg",
  },
  {
    id: "traditional",
    label: "TRADITIONAL",
    image: "/images/styles/vintage.jpg",
  },
  {
    id: "industrial",
    label: "INDUSTRIAL",
    image: "/images/styles/industrial.jpg",
  },
  {
    id: "minimalist",
    label: "MINIMALIST",
    image: "/images/styles/modern.jpg",
  },
  {
    id: "neoclassic",
    label: "NEOCLASSIC",
    image: "/images/styles/neoclassic.jpg",
  },
  {
    id: "futuristic",
    label: "FUTURISTIC",
    image: "/images/styles/modern.jpg",
  },
  {
    id: "sustainable",
    label: "SUSTAINABLE",
    image: "/images/styles/modern.jpg",
  },
];

function SketchToReality() {
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
      toast.info("You can select up to 4 architectural styles");
      return prev;
    });
  };

  // Generate image handler
  const handleGenerate = () => {
    if (!fileHandling.selectedFile) {
      toast.error("Please upload a sketch or blueprint first.");
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
        `sketch-render-${Date.now()}-${
          fileHandling.selectedFile?.name || "generated.jpg"
        }`;
      await downloadImage(imageUrl, downloadFileName);
      toast.success("Rendered image downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
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
    return <LoadingSpinner message="Loading sketch renderer..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading interface..." />}>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Left Sidebar - Style Categories */}
        <StyleCategorySelector
          categories={architecturalStyles}
          selectedStyles={selectedDesignTypes}
          onStyleToggle={toggleDesignStyle}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4">
            <h1 className="text-2xl font-bold text-purple-700">
              Sketch to Reality
            </h1>
            <p className="text-gray-600">
              Transform your hand-drawn sketches into photorealistic renders
            </p>
          </div>

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
                Upload a sketch or blueprint and select architectural styles to
                create realistic renders
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

export default memo(SketchToReality);
