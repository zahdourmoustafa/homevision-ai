"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
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
import ImageModal from "../create-new/_components/ImageModal";
import ComparisonModal from "../create-new/_components/ComparisonModal";

// Import utilities
import { downloadImage } from "../create-new/_components/utils/downloadUtils";

function SketchCreateNew() {
  // Component state
  const [isComponentsLoaded, setIsComponentsLoaded] = useState(false);

  // Room and design settings
  const [roomType, setRoomType] = useState<string>("");
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<string[]>([]);
  const [additionalReq, setAdditionalReq] = useState<string>("");
  const [aiCreativity] = useState<number>(50);
  const [removeFurniture] = useState(false);

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

  // Generate image handler
  const handleGenerate = () => {
    if (!fileHandling.selectedFile) {
      toast.error("Please upload a sketch image first.");
      return;
    }

    if (!roomType || selectedDesignTypes.length === 0) {
      toast.error("Please select a room type and design style.");
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
        `sketch-${Date.now()}-${
          fileHandling.selectedFile?.name || "converted.jpg"
        }`;
      await downloadImage(imageUrl, downloadFileName);
      toast.success("Converted image downloaded successfully!");
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
    return <LoadingSpinner message="Loading sketch converter..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading interface..." />}>
      <div className="flex flex-col md:flex-row min-h-screen bg-white">
        {/* Left Sidebar - Controls */}
        <div className="w-full md:w-[400px] border-b md:border-b-0 md:border-r bg-white">
          <div className="p-6">
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-semibold text-purple-700">
                Sketch to Reality
              </h2>
              <p className="text-sm text-gray-600">
                Transform your room sketches into photorealistic interior
                designs
              </p>
            </div>

            {/* Simplified upload area */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Upload Sketch
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="sketch-upload"
                  onChange={fileHandling.handleFileInputChange}
                />
                <label htmlFor="sketch-upload" className="cursor-pointer">
                  {fileHandling.preview ? (
                    <div className="space-y-2">
                      <Image
                        src={fileHandling.preview}
                        alt="Uploaded sketch"
                        width={200}
                        height={128}
                        className="max-h-32 mx-auto rounded object-contain"
                      />
                      <p className="text-sm text-gray-600">
                        Click to change sketch
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">🎨</div>
                      <p className="text-sm text-gray-600">
                        Click to upload your sketch
                      </p>
                      <p className="text-xs text-gray-400">(PNG, JPG, JPEG)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Simple room type selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select room type</option>
                <option value="living-room">Living Room</option>
                <option value="bedroom">Bedroom</option>
                <option value="kitchen">Kitchen</option>
                <option value="bathroom">Bathroom</option>
                <option value="office">Office</option>
                <option value="dining-room">Dining Room</option>
              </select>
            </div>

            {/* Simple design style selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Design Style
              </label>
              <select
                value={selectedDesignTypes[0] || ""}
                onChange={(e) =>
                  setSelectedDesignTypes(e.target.value ? [e.target.value] : [])
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select design style</option>
                <option value="modern">Modern</option>
                <option value="traditional">Traditional</option>
                <option value="minimalist">Minimalist</option>
                <option value="industrial">Industrial</option>
                <option value="scandinavian">Scandinavian</option>
                <option value="contemporary">Contemporary</option>
              </select>
            </div>

            {/* Additional requirements */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={additionalReq}
                onChange={(e) => setAdditionalReq(e.target.value)}
                placeholder="E.g., add specific furniture, color preferences..."
                className="w-full p-2 border rounded-md h-20 resize-none text-sm"
              />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 rounded-md font-medium transition-colors"
            >
              {imageGeneration.isLoading
                ? "Converting Sketch..."
                : "Convert to Reality"}
            </button>

            <p className="text-xs text-gray-500 mt-2 text-center">
              NOTE: 1 credit will be used to convert your sketch
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-gray-50">
          {imageGeneration.generatedResults.length > 0 ? (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Generated Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {imageGeneration.generatedResults.map((result) => (
                  <div
                    key={result.timestamp}
                    className="relative cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => modalHandling.openImageModal(result)}
                  >
                    <div className="relative rounded-lg overflow-hidden aspect-video bg-white shadow-md">
                      <Image
                        src={result.generatedImage}
                        alt="Generated room"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        Click to view full size
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Your generated designs will appear here
              </h2>
              <p className="text-gray-500 max-w-md">
                Upload a sketch, select your preferences, and click
                &quot;Convert to Reality&quot; to see the magic happen.
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
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

        <ComparisonModal
          isOpen={!!modalHandling.activeSlider}
          onClose={modalHandling.closeSliderModal}
          result={modalHandling.activeSlider}
        />
      </div>
    </Suspense>
  );
}

export default SketchCreateNew;
