"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { FiUploadCloud } from 'react-icons/fi';
import { Card } from '@/components/ui/card';

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
    <Card className="w-full p-3 bg-white">
      <div className="space-y-2">
        {preview && (
          <div className="relative w-full h-[200px] rounded-lg overflow-hidden">
            <Image 
              src={preview} 
              alt="Room preview" 
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        
        <label
          htmlFor="upload-image"
          className={`relative flex flex-col items-center justify-center w-full ${
            preview ? 'h-16' : 'h-[200px]'
          } border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-300 ease-in-out`}
        >
          <div className="flex flex-col items-center justify-center p-2">
            <FiUploadCloud className="w-6 h-6 text-gray-400 mb-1" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">
                {preview ? 'Change image' : 'Upload an image'}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
          <input
            id="upload-image"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      </div>
    </Card>
  );
}

export default ImageSelection;