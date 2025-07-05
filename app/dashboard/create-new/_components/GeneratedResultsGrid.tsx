import React from "react";
import { FiDownload, FiColumns } from "react-icons/fi";
import RobustImage from "./RobustImage";
import { GeneratedResult } from "./hooks/useImageGeneration";

interface GeneratedResultsGridProps {
  results: GeneratedResult[];
  onImageModalOpen: (result: GeneratedResult) => void;
  onSliderModalOpen: (result: GeneratedResult) => void;
  onDownloadImage: (imageUrl: string) => void;
}

export const GeneratedResultsGrid: React.FC<GeneratedResultsGridProps> = ({
  results,
  onImageModalOpen,
  onSliderModalOpen,
  onDownloadImage,
}) => {
  if (results.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Generated Results</h3>
      <div className="grid grid-cols-2 gap-2">
        {results.slice(0, 4).map((result) => (
          <div
            key={result.timestamp}
            className="relative group aspect-square rounded-lg overflow-hidden border cursor-pointer"
            onClick={() => onImageModalOpen(result)}
          >
            <RobustImage
              src={result.generatedImage}
              alt="Generated design"
              fill
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadImage(result.generatedImage);
                }}
                className="bg-white/90 rounded p-1.5"
              >
                <FiDownload className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSliderModalOpen(result);
                }}
                className="bg-white/90 rounded p-1.5"
              >
                <FiColumns className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeneratedResultsGrid;
