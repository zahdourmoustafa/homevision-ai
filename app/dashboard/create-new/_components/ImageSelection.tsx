"use client";

import React, { useState, useRef, ChangeEvent, useCallback, memo } from "react";
import Image from "next/image";
import { FiX } from "react-icons/fi";
// import { FiUploadCloud } from 'react-icons/fi'; // FiUploadCloud is unused
import { MdPhotoLibrary } from "react-icons/md";

interface ImageSelectionProps {
  onFileSelected: (file: File | null) => void;
}

const ImageSelection = memo(({ onFileSelected }: ImageSelectionProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Validate file size before processing
        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          alert("File size should be less than 10MB");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
          onFileSelected(file);
        };
        reader.readAsDataURL(file);
      }
    },
    [onFileSelected]
  );

  const handleRemoveImage = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onFileSelected(null);
  }, [onFileSelected]);

  return (
    <div className="space-y-2 px-8 py-4">
      <h2 className="text-xl font-semibold text-themeTextWhite mb-4">
        Upload Image
      </h2>
      <div className="relative">
        {preview ? (
          <div className="relative w-full h-[200px] border rounded-lg overflow-hidden border-themeGray">
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black hover:bg-themeGray transition-colors"
              type="button"
            >
              <FiX className="w-5 h-5 text-themeTextWhite" />
            </button>
            <Image
              src={preview}
              alt="Room preview"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={true}
              loading="eager"
            />
          </div>
        ) : (
          <label
            htmlFor="upload-image"
            className="relative flex flex-col items-center justify-center w-full h-[200px] border-2 border-dashed border-themeGray rounded-lg cursor-pointer bg-themeGray hover:bg-black transition-all duration-300 ease-in-out"
          >
            <div className="flex flex-col items-center justify-center p-2">
              <MdPhotoLibrary className="w-8 h-8 text-themeTextGray" />
              <p className="text-sm font-medium text-themeTextWhite mt-2">
                Upload a photo of your room
              </p>
              <p className="text-xs text-themeTextGray">PNG, JPG up to 10MB</p>
            </div>
          </label>
        )}
        <input
          id="upload-image"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
          ref={fileInputRef}
        />
      </div>
    </div>
  );
});

ImageSelection.displayName = "ImageSelection";

export default ImageSelection;
