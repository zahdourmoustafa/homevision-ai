import React from "react";
import Image from "next/image";
import { FiX, FiDownload, FiColumns, FiTrash2 } from "react-icons/fi";
import { GeneratedResult } from "./hooks/useImageGeneration";

interface ImageModalProps {
  result: GeneratedResult | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (imageUrl: string, fileName: string) => void;
  onOpenSlider: (result: GeneratedResult) => void;
  onDelete: (timestamp: number) => void;
  originalFileName?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  result,
  isOpen,
  onClose,
  onDownload,
  onOpenSlider,
  onDelete,
  originalFileName,
}) => {
  if (!isOpen || !result) return null;

  const handleDownload = () => {
    const fileName = originalFileName
      ? `room-${result.timestamp}-${originalFileName}`
      : `room-${result.timestamp}.jpg`;
    onDownload(result.generatedImage, fileName);
  };

  const handleDelete = () => {
    onDelete(result.timestamp);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative max-w-[95vw] max-h-[95vh] rounded-xl overflow-hidden bg-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action buttons */}
        <div className="absolute top-3 left-3 z-20 flex gap-2">
          <button
            onClick={handleDownload}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Download image"
          >
            <FiDownload className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => onOpenSlider(result)}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
            aria-label="Compare images"
          >
            <FiColumns className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleDelete}
            className="bg-white rounded-full p-2 shadow-md hover:bg-red-100 transition-colors"
            aria-label="Delete image"
          >
            <FiTrash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-20"
          aria-label="Close"
        >
          <FiX className="w-5 h-5 text-gray-700" />
        </button>

        {/* Image */}
        <div className="w-full h-full flex-grow flex items-center justify-center overflow-hidden">
          <Image
            src={result.generatedImage}
            alt={`Full size render ${result.timestamp}`}
            width={1200}
            height={800}
            className="object-contain max-w-full max-h-full block"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
