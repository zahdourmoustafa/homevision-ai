"use client";

import React, { useState, useCallback, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "../_components/LoadingSpinner";

// Lazy load heavy components
const DropzoneComponent = lazy(() =>
  import("react-dropzone").then((module) => ({ default: module.useDropzone }))
);
const Progress = lazy(() =>
  import("@/components/ui/progress").then((module) => ({
    default: module.Progress,
  }))
);
const Alert = lazy(() =>
  import("@/components/ui/alert").then((module) => ({
    default: module.Alert,
    AlertDescription: module.AlertDescription,
    AlertTitle: module.AlertTitle,
  }))
);
const Icons = lazy(() =>
  import("lucide-react").then((module) => ({
    default: {
      UploadCloud: module.UploadCloud,
      CheckCircle: module.CheckCircle,
      XCircle: module.XCircle,
      Loader2: module.Loader2,
    },
  }))
);

const AnimePhotoPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComponentsLoaded, setIsComponentsLoaded] = useState(false);

  // Load heavy components after initial render
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsComponentsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Invalid file type. Please upload an image.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setGeneratedVideoUrl(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      // Progress simulation
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress <= 100) {
          setProgress(currentProgress);
        } else {
          clearInterval(progressInterval);
        }
      }, 200);

      const response = await fetch("/api/animephoto", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate video.");
      }

      const result = await response.json();
      setGeneratedVideoUrl(result.videoUrl);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      console.error("Error generating video:", err);
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  if (!isComponentsLoaded) {
    return <LoadingSpinner message="Loading photo animation tools..." />;
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Loading interface..." />}>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-4xl font-bold text-purple-700">
              Animate Your Photo
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Upload an image to create a 5-second clockwise rotation video.
            </p>
          </header>

          <div className="p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer">
              {previewUrl ? (
                <div className="relative group">
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="max-h-80 rounded-md object-contain mx-auto"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <p className="text-white text-lg">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="py-16">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                  <p className="text-lg text-gray-500">
                    Click to select an image
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    (PNG, JPG, JPEG, WEBP)
                  </p>
                </div>
              )}
            </label>
          </div>

          {selectedFile && !generatedVideoUrl && (
            <div className="mt-6 text-center">
              <p className="text-md mb-2">
                Selected:{" "}
                <span className="font-semibold">{selectedFile.name}</span>
              </p>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? "Generating Video..." : "Generate Video"}
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {generatedVideoUrl && (
            <div className="mt-10 p-6 border rounded-lg shadow-lg bg-gray-50">
              <h2 className="text-2xl font-semibold mb-4 text-center text-purple-600">
                Your Animated Photo
              </h2>
              <video
                src={generatedVideoUrl}
                controls
                className="w-full rounded-lg"
                autoPlay
                loop
              />
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
};

export default React.memo(AnimePhotoPage);
