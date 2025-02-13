"use client"

import React, { useState } from 'react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import { Button } from '@/components/ui/button';
import { Download, SplitSquareHorizontal } from 'lucide-react';
import { DialogContent } from '@/components/ui/dialog';
import { Title } from "@radix-ui/react-dialog";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterSliderComponent: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
  const [showComparison, setShowComparison] = useState(false);

  const FIRST_IMAGE = {
    imageUrl: beforeImage
  };
  const SECOND_IMAGE = {
    imageUrl: afterImage
  };

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <DialogContent className="bg-white">
      <Title className="sr-only">Room Comparison View</Title>
      <div className="flex flex-col gap-4">
        <div className="before-after-slider">
          {showComparison ? (
            <ReactBeforeSliderComponent
              firstImage={FIRST_IMAGE}
              secondImage={SECOND_IMAGE}
            />
          ) : (
            <img src={afterImage} alt="Redesigned Room" className="w-full h-full object-contain" />
          )}
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setShowComparison(!showComparison)}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-200"
          >
            <SplitSquareHorizontal className="w-4 h-4 mr-2" />
            {showComparison ? 'Hide Comparison' : 'Compare'}
          </Button>
          <Button
            onClick={() => downloadImage(afterImage, 'redesigned-room.jpg')}
            variant="outline"
            size="sm"
            className="bg-white text-gray-700 border-gray-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Redesigned
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default BeforeAfterSliderComponent;