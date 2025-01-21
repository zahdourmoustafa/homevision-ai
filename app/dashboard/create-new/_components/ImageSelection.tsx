"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { FiUploadCloud } from 'react-icons/fi';

interface ImageSelectionProps {
  onFileSelected?: (file: File) => void; // Callback to return the selected file
}

function ImageSelection({ onFileSelected }: ImageSelectionProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      onFileSelected?.(file); // Pass the selected file to the parent component
    }
  };

  return (
    <div className="w-full cursor-pointer transition-all">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Image of your room
      </label>
      <div className="mt-2">
        <label
          htmlFor="upload-image"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors`}
        >
          {preview ? (
            <div className="relative w-full h-full">
              <Image src={preview} alt="Image preview" layout="fill" objectFit="cover" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FiUploadCloud className="w-12 h-12 text-gray-400" />
              <p className="mt-1 text-sm text-gray-600">Click to upload</p>
            </div>
          )}
          <input
            id="upload-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      </div>
    </div>
  );
}

export default ImageSelection;