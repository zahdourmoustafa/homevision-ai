"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  memo,
} from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { FiHeart, FiDownload, FiTrash2 } from "react-icons/fi";
import LoadingSpinner from "../_components/LoadingSpinner";
import { toast } from "sonner";

// Import dialog components normally (they're small)
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Lazy load heavy components
const BeforeAfterSliderComponent = lazy(
  () => import("../create-new/_components/BeforeAfterSlider")
);

interface FavoriteImage {
  id: string;
  imageUrl: string;
  originalImage: string;
  timestamp: number;
}

// Memoized favorite card component
const FavoriteCard = memo(
  ({
    favorite,
    onRemove,
    onView,
  }: {
    favorite: FavoriteImage;
    onRemove: (id: string) => void;
    onView: (favorite: FavoriteImage) => void;
  }) => {
    const handleDownload = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          const response = await fetch(favorite.imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = `favorite-${favorite.timestamp}.jpg`;
          document.body.appendChild(link);
          link.click();

          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
          toast.success("Image downloaded successfully!");
        } catch {
          toast.error("Failed to download image");
        }
      },
      [favorite]
    );

    const handleRemove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(favorite.id);
      },
      [favorite.id, onRemove]
    );

    const handleView = useCallback(() => {
      onView(favorite);
    }, [favorite, onView]);

    return (
      <Card className="relative group hover:shadow-lg transition-shadow duration-200">
        <div
          className="relative aspect-square cursor-pointer"
          onClick={handleView}
        >
          <Image
            src={favorite.imageUrl}
            alt="Favorited room design"
            fill
            className="object-cover rounded-t-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />

          {/* Action buttons */}
          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-blue-600 shadow-sm"
              title="Download image"
            >
              <FiDownload className="w-4 h-4" />
            </button>
            <button
              onClick={handleRemove}
              className="p-2 rounded-full bg-white/90 hover:bg-white text-red-600 shadow-sm"
              title="Remove from favorites"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-t-lg" />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {new Date(favorite.timestamp).toLocaleDateString()}
            </span>
            <FiHeart className="w-4 h-4 text-red-500 fill-current" />
          </div>
        </div>
      </Card>
    );
  }
);

FavoriteCard.displayName = "FavoriteCard";

// Empty state component
const EmptyFavorites = memo(() => (
  <div className="text-center py-16">
    <div className="text-6xl mb-4">💝</div>
    <h2 className="text-2xl font-semibold text-gray-700 mb-2">
      No favorites yet
    </h2>
    <p className="text-gray-500 max-w-md mx-auto">
      Start adding some designs to your favorites! You can favorite any
      generated design by clicking the heart icon in the results.
    </p>
  </div>
));

EmptyFavorites.displayName = "EmptyFavorites";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<{
    before: string;
    after: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage
  const loadFavorites = useCallback(() => {
    try {
      const savedFavorites = localStorage.getItem("favorites");
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Remove favorite handler
  const removeFavorite = useCallback(
    (id: string) => {
      const updatedFavorites = favorites.filter((fav) => fav.id !== id);
      setFavorites(updatedFavorites);
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      toast.success("Removed from favorites");
    },
    [favorites]
  );

  // View favorite handler
  const viewFavorite = useCallback((favorite: FavoriteImage) => {
    setSelectedImages({
      before: favorite.originalImage,
      after: favorite.imageUrl,
    });
  }, []);

  // Close modal handler
  const closeModal = useCallback(() => {
    setSelectedImages(null);
  }, []);

  // Memoize the favorites grid
  const favoritesGrid = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((favorite) => (
          <FavoriteCard
            key={favorite.id}
            favorite={favorite}
            onRemove={removeFavorite}
            onView={viewFavorite}
          />
        ))}
      </div>
    ),
    [favorites, removeFavorite, viewFavorite]
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading your favorites..." />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600">
          {favorites.length > 0
            ? `${favorites.length} favorite design${
                favorites.length !== 1 ? "s" : ""
              }`
            : "Collect your favorite designs here"}
        </p>
      </div>

      {/* Content */}
      {favorites.length === 0 ? <EmptyFavorites /> : favoritesGrid}

      {/* Comparison Modal */}
      <Dialog open={!!selectedImages} onOpenChange={closeModal}>
        <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] w-full h-[70vh] md:h-[80vh] p-0">
          <DialogTitle className="sr-only">Room Comparison</DialogTitle>
          {selectedImages && (
            <Suspense fallback={<LoadingSpinner />}>
              <BeforeAfterSliderComponent
                beforeImage={selectedImages.before}
                afterImage={selectedImages.after}
                onFavoriteChange={loadFavorites}
              />
            </Suspense>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
