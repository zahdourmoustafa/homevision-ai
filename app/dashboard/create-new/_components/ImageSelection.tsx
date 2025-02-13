"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import { MdPhotoLibrary } from 'react-icons/md';

interface ImageSelectionProps {
  onFileSelected: (file: File | null) => void;
}

function ImageSelection({ onFileSelected }: ImageSelectionProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelected(file);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileSelected(null);
  };

  return (
    <div className="space-y-2 px-8 py-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Image</h2>
      <div className="relative">
        {preview ? (
          <div className="relative w-full h-[200px] border rounded-lg overflow-hidden">
            <button
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-700" />
            </button>
            <Image 
              src={preview} 
              alt="Room preview" 
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <label
            htmlFor="upload-image"
            className="relative flex flex-col items-center justify-center w-full h-[200px] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-300 ease-in-out"
          >
            <div className="flex flex-col items-center justify-center p-2">
              <MdPhotoLibrary className="w-8 h-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-600 mt-2">Upload a photo of your room</p>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
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
}

export default ImageSelection;