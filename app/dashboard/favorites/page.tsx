"use client";

import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { FiHeart } from 'react-icons/fi';
import BeforeAfterSliderComponent from '../create-new/_components/BeforeAfterSlider';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface FavoriteImage {
  id: string;
  imageUrl: string;
  originalImage: string;
  timestamp: number;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<{before: string, after: string} | null>(null);

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = (id: string) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
      {favorites.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          <p>No favorites yet. Start adding some designs to your favorites!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="relative group">
                <div 
                  className="relative aspect-square cursor-pointer"
                  onClick={() => setSelectedImages({
                    before: favorite.originalImage,
                    after: favorite.imageUrl
                  })}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={favorite.imageUrl}
                      alt="Favorited room design"
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(favorite.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiHeart className="w-5 h-5 fill-current" />
                  </button>
                </div>
                <div className="p-4">
                  <span className="text-sm text-gray-500">
                    {new Date(favorite.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <Dialog open={!!selectedImages} onOpenChange={() => setSelectedImages(null)}>
            <DialogContent className="max-w-[800px] w-full h-[600px] p-0">
              <DialogTitle className="sr-only">Room Comparison</DialogTitle>
              {selectedImages && (
                <BeforeAfterSliderComponent
                  beforeImage={selectedImages.before}
                  afterImage={selectedImages.after}
                  onFavoriteChange={loadFavorites}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}