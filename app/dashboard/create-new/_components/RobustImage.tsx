import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MdPhotoLibrary } from "react-icons/md";

interface RobustImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}

const useImageWithRetry = (src: string, maxRetries = 3) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!src) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    setRetries(0);
    setImageSrc(src);
  }, [src]);

  const handleImageError = () => {
    if (retries < maxRetries) {
      console.log(`Retrying image load (${retries + 1}/${maxRetries}): ${src}`);
      const newSrc = `${src}?retry=${Date.now()}`;
      setImageSrc(newSrc);
      setRetries((prev) => prev + 1);
    } else {
      console.error(`Failed to load image after ${maxRetries} retries:`, src);
      setStatus("error");
    }
  };

  const handleImageLoad = () => {
    setStatus("success");
  };

  return { imageSrc, status, handleImageError, handleImageLoad };
};

export const RobustImage: React.FC<RobustImageProps> = ({
  src,
  alt,
  className = "",
  fill = false,
  width,
  height,
  sizes,
  priority = false,
}) => {
  const { imageSrc, status, handleImageError, handleImageLoad } =
    useImageWithRetry(src);

  if (status === "error") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
        <MdPhotoLibrary className="w-10 h-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center">
          Image could not be loaded
        </p>
        <button
          className="mt-2 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {fill ? (
        <Image
          src={imageSrc}
          alt={alt}
          className={`object-cover ${className}`}
          sizes={
            sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          }
          priority={priority}
          onLoad={handleImageLoad}
          onError={handleImageError}
          fill
        />
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          className={`object-cover ${className}`}
          sizes={
            sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          }
          priority={priority}
          onLoad={handleImageLoad}
          onError={handleImageError}
          width={width}
          height={height}
        />
      )}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default RobustImage;
