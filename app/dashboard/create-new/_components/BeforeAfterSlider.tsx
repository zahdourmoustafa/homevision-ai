"use client"

import React, { useState, useEffect } from 'react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';
import { Button } from '@/components/ui/button';
import { Download, SplitSquareHorizontal, Heart } from 'lucide-react';
import { DialogContent } from '@/components/ui/dialog';
import { toast } from "sonner";
import Image from 'next/image';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  onFavoriteChange?: () => void;
}

interface FavoriteImage {
  id: string;
  imageUrl: string;
  originalImage: string;
  timestamp: number;
}

const BeforeAfterSliderComponent: React.FC<BeforeAfterSliderProps> = ({ 
  beforeImage, 
  afterImage,
  onFavoriteChange 
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Check if the current image is favorited on component mount
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorited(favorites.some((fav: FavoriteImage) => fav.imageUrl === afterImage));
  }, [afterImage]);

  const FIRST_IMAGE = {
    imageUrl: beforeImage
  };
  const SECOND_IMAGE = {
    imageUrl: afterImage
  };

  const toggleFavorite = () => {
    const favorites: FavoriteImage[] = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorited) {
      // Remove from favorites
      const updatedFavorites = favorites.filter(fav => fav.imageUrl !== afterImage);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(false);
      toast.success('Removed from favorites');
      onFavoriteChange?.();
    } else {
      // Add to favorites
      const newFavorite: FavoriteImage = {
        id: Date.now().toString(),
        imageUrl: afterImage,
        originalImage: beforeImage,
        timestamp: Date.now()
      };
      const updatedFavorites = [...favorites, newFavorite];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      setIsFavorited(true);
      toast.success('Added to favorites');
      onFavoriteChange?.();
    }
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
    <DialogContent className="bg-white h-full max-w-[95vw] w-[1200px]">
      <div className="flex flex-col gap-4 h-full">
        <div className="before-after-slider relative flex-1 min-h-[70vh]">
          {showComparison ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-full h-full max-h-[70vh]">
                <ReactBeforeSliderComponent
                  firstImage={FIRST_IMAGE}
                  secondImage={SECOND_IMAGE}
                />
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={afterImage}
                alt="Redesigned Room"
                fill
                className="object-contain"
                sizes="95vw"
                priority
              />
            </div>
          )}
          <Button
            onClick={toggleFavorite}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-700 hover:text-red-500"
          >
            <Heart className={`w-6 h-6 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
        <div className="flex gap-3 justify-center p-6">
          <Button
            onClick={() => setShowComparison(!showComparison)}
            variant="outline"
            size="lg"
            className="bg-white text-gray-700 border-gray-200"
          >
            <SplitSquareHorizontal className="w-5 h-5 mr-2" />
            {showComparison ? 'Hide Comparison' : 'Compare'}
          </Button>
          <Button
            onClick={() => downloadImage(afterImage, 'redesigned-room.jpg')}
            variant="outline"
            size="lg"
            className="bg-white text-gray-700 border-gray-200"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Redesigned
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

export default BeforeAfterSliderComponent;