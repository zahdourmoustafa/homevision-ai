import React from "react";
import { FiUploadCloud, FiRotateCw, FiZoomIn } from "react-icons/fi";
import RobustImage from "./RobustImage";
import { GeneratedResult } from "./hooks/useImageGeneration";

interface ImageUploadAreaProps {
  preview: string | null;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  generatedResults: GeneratedResult[];
  onImageModalOpen: (result: GeneratedResult) => void;
}

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  preview,
  onFileInputChange,
  onDrop,
  onDragOver,
  generatedResults,
  onImageModalOpen,
}) => {
  return (
    <div className="flex-1 p-6">
      <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
        {preview ? (
          <div className="relative w-full h-full">
            <RobustImage
              src={preview}
              alt="Uploaded room"
              className="object-contain"
              fill
            />
            {/* Overlay Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => document.getElementById("file-upload")?.click()}
                className="bg-white/90 backdrop-blur rounded-full p-2 shadow-md hover:bg-white transition-colors"
              >
                <FiRotateCw className="w-5 h-5 text-gray-700" />
              </button>
              {generatedResults.length > 0 && (
                <button
                  onClick={() => onImageModalOpen(generatedResults[0])}
                  className="bg-white/90 backdrop-blur rounded-full p-2 shadow-md hover:bg-white transition-colors"
                >
                  <FiZoomIn className="w-5 h-5 text-gray-700" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 mb-4 mx-auto w-fit">
                <FiUploadCloud className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload your room image
              </h3>
              <p className="text-sm text-gray-500">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports JPG, PNG up to 10MB
              </p>
            </div>
          </div>
        )}
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileInputChange}
        />
      </div>
    </div>
  );
};

export default ImageUploadArea;
