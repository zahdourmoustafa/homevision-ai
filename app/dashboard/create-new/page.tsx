"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { MdPhotoLibrary } from "react-icons/md";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FiUpload,
  FiCheck,
  FiX,
  FiMaximize2,
  FiTrash2,
  FiDownload,
  FiChevronDown,
} from "react-icons/fi";
import { roomTypes } from "@/lib/utils";
import BeforeAfterSlider from "@/app/components/BeforeAfterSlider";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent } from "@/components/ui/tabs";

// Interface for the generated result
interface GeneratedResult {
  generatedImage: string;
  rawImage: string;
  timestamp: number;
}

// Add custom hook for image loading with retries
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

    // Reset status when source changes
    setStatus("loading");
    setRetries(0);
    setImageSrc(src);
  }, [src]);

  const handleImageError = () => {
    if (retries < maxRetries) {
      console.log(`Retrying image load (${retries + 1}/${maxRetries}): ${src}`);
      // Add cache-busting parameter
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

// Create a robust image component with error handling
const RobustImage = ({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const { imageSrc, status, handleImageError, handleImageLoad } =
    useImageWithRetry(src);

  if (status === "error") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-themeGray p-4">
        <MdPhotoLibrary className="w-10 h-10 text-themeTextGray mb-2" />
        <p className="text-sm text-themeTextGray text-center">
          Image could not be loaded
        </p>
        <button
          className="mt-2 px-3 py-1 text-xs bg-black hover:bg-themeGray rounded-md transition-colors text-themeTextWhite"
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-themeGray bg-opacity-50">
          <div className="w-8 h-8 border-2 border-themeGray border-t-themeTextWhite rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

function CreateNew() {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>(
    []
  );
  const [roomType, setRoomType] = useState<string>("");
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<string[]>([]);
  const [designType, setDesignType] = useState<string>("");
  const [additionalReq, setAdditionalReq] = useState<string>("");
  const [aiCreativity] = useState<number>(50);
  const { user } = useUser();
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState<"after" | "before" | "side-by-side">(
    "after"
  );
  const [currentResultIndex, setCurrentResultIndex] = useState<number | null>(
    null
  );
  const [isRoomTypeSectionOpen, setIsRoomTypeSectionOpen] = useState(true);
  const [isThemeSectionOpen, setIsThemeSectionOpen] = useState(true);

  // Key for localStorage
  const localStorageKey = "generatedInteriorResults";

  // Load results from localStorage on component mount
  useEffect(() => {
    const savedResults = localStorage.getItem(localStorageKey);
    if (savedResults) {
      try {
        const parsedResults = JSON.parse(savedResults);
        // Basic validation to ensure it's an array
        if (Array.isArray(parsedResults)) {
          setGeneratedResults(parsedResults);
        } else {
          console.warn("Invalid data found in localStorage, clearing.");
          localStorage.removeItem(localStorageKey);
        }
      } catch (error) {
        console.error("Error parsing results from localStorage:", error);
        localStorage.removeItem(localStorageKey); // Clear invalid data
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save results to localStorage whenever they change
  useEffect(() => {
    // Only save if there are results to prevent saving an empty array initially
    if (generatedResults.length > 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(generatedResults));
    }
    // Optionally, clear localStorage if the results become empty (e.g., user deletes all)
    // else {
    //   localStorage.removeItem(localStorageKey);
    // }
  }, [generatedResults]); // Dependency array ensures this runs when generatedResults changes

  // Design styles data - REVERTED TO IMAGES
  const designStyles = [
    { value: "Modern", label: "Modern", image: "/images/styles/modern.jpg" },
    { value: "Minimal", label: "Minimal", image: "/images/styles/summer.jpg" },
    {
      value: "Traditional",
      label: "Traditional",
      image: "/images/styles/professional.jpg",
    },
    {
      value: "Tropical",
      label: "Tropical",
      image: "/images/styles/tropical.jpg",
    }, // Corrected path if needed
    { value: "Coastal", label: "Coastal", image: "/images/styles/coastal.jpg" },
    { value: "Vintage", label: "Vintage", image: "/images/styles/vintage.jpg" },
    {
      value: "Industrial",
      label: "Industrial",
      image: "/images/styles/industrial.jpg",
    },
    {
      value: "Neoclassic",
      label: "Neoclassic",
      image: "/images/styles/neoclassic.jpg",
    },
    { value: "Tribal", label: "Tribal", image: "/images/styles/tribal.jpg" },
    { value: "Japandi", label: "Japandi", image: "/images/styles/tribal.jpg" },
    {
      value: "Parisian",
      label: "Parisian",
      image: "/images/styles/tribal.jpg",
    },
    {
      value: "Boheimian",
      label: "Boheimian",
      image: "/images/styles/tribal.jpg",
    },
  ];

  // Toggle design style selection
  const toggleDesignStyle = (styleValue: string) => {
    setSelectedDesignTypes((prev) => {
      if (prev.includes(styleValue)) {
        return prev.filter((s) => s !== styleValue);
      }
      if (prev.length < 4) {
        return [...prev, styleValue];
      }
      toast.info("You can select up to 4 design styles");
      return prev;
    });
  };

  // Transform selected design types to a single string for the API
  useEffect(() => {
    // Update the design type for backward compatibility with the API
    if (selectedDesignTypes.length > 0) {
      setDesignType(selectedDesignTypes.join(", "));
    } else {
      setDesignType("");
    }
  }, [selectedDesignTypes]);

  // Handle file selection
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);

    // Create preview
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file upload via input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size before processing
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File size should be less than 10MB");
        return;
      }
      handleFileSelected(file);
    }
  };

  // Handle file drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file size before processing
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File size should be less than 10MB");
        return;
      }
      handleFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Save raw image to Supabase
  const saveRawImageToSupabase = async (file: File) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("interior-images")
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("interior-images")
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image to Supabase:", error);
      throw error;
    }
  };

  // Generate AI image
  const generateAiImage = async () => {
    // Log the values to debug
    console.log("Room Type:", roomType);
    console.log("Design Types:", selectedDesignTypes);
    console.log("Design Type String:", designType);
    console.log("Additional Requirements:", additionalReq);
    console.log("AI Creativity Level:", aiCreativity);

    if (!selectedFile) {
      toast.error("Please upload an image first.");
      return;
    }

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast.error("User email not found. Please ensure you are logged in.");
      return;
    }

    if (!roomType || selectedDesignTypes.length === 0) {
      toast.error(
        "Please select both room type and at least one design style."
      );
      return;
    }

    try {
      setIsLoading(true);
      const rawImageUrl = await saveRawImageToSupabase(selectedFile);

      // Prepare the request payload
      const payload = {
        imageUrl: rawImageUrl,
        userEmail: user.emailAddresses[0].emailAddress,
        roomType,
        design: designType,
        designStyles: selectedDesignTypes,
        additionalRequirement: additionalReq,
        creativityLevel: aiCreativity,
      };

      console.log("Sending request to API with payload:", payload);

      // Try the API call with retries
      let result;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          // Add a cache-busting parameter to prevent caching issues
          const timestamp = Date.now();
          result = await axios.post(
            `/api/redesign-room?t=${timestamp}`,
            payload
          );
          console.log("API Response:", result.data);
          break; // Success, exit the retry loop
        } catch (apiError: unknown) {
          // Changed any to unknown
          console.error(`API call attempt ${retryCount + 1} failed:`, apiError);

          if (retryCount === maxRetries) {
            throw apiError; // Rethrow if we've exhausted retries
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          retryCount++;
        }
      }

      // Fix the data structure access with additional null checks
      let generatedImageUrl = null;
      if (result && result.data) {
        if (
          result.data.result &&
          typeof result.data.result === "object" &&
          result.data.result.generated
        ) {
          generatedImageUrl = result.data.result.generated;
        } else if (result.data.result) {
          generatedImageUrl = result.data.result;
        }
      }

      if (!generatedImageUrl) {
        throw new Error("No valid image URL found in the API response");
      }

      const newResult = {
        generatedImage: generatedImageUrl,
        rawImage: rawImageUrl,
        timestamp: Date.now(),
      };

      // Add the new image to the BEGINNING of the array instead of the end
      setGeneratedResults((prev) => [newResult, ...prev].slice(0, 4));

      toast.success("Room redesigned successfully!");
    } catch (error) {
      console.error("Error generating AI image:", error);

      // Provide a more helpful error message to the user
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          toast.error(
            "The design service is temporarily unavailable. Please try again in a few moments."
          );
        } else if (error.response.status === 429) {
          toast.error(
            "Too many requests. Please wait a moment before trying again."
          );
        } else {
          let errorBody = "Something went wrong";
          try {
            const errorJson = error.response.data; // error.response.data might be an object
            errorBody = errorJson.error || JSON.stringify(errorJson);
          } catch (e) {
            // If response.data is not an object or cannot be stringified
            errorBody = error.message || "Something went wrong";
          }
          toast.error(`Error: ${errorBody}`);
        }
      } else {
        toast.error("Failed to generate design. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open modal with specific image and track its index
  const openImageModal = (imageUrl: string, index: number) => {
    setModalImage(imageUrl);
    setCurrentResultIndex(index);
    setIsCompareMode(false);
    setViewMode("after");
  };

  // Function to close modal
  const closeImageModal = () => {
    setModalImage(null);
    setCurrentResultIndex(null);
    setIsCompareMode(false);
    setViewMode("after");
  };

  // Function to set the view mode
  const setComparisonView = (mode: "after" | "before" | "side-by-side") => {
    console.log("Setting view mode to:", mode);
    setViewMode(mode);

    // Force this to true for "side-by-side" mode to ensure slider works
    if (mode === "side-by-side") {
      setIsCompareMode(true);
    } else {
      setIsCompareMode(mode !== "after");
    }
  };

  // Function to delete an image from results
  const deleteImage = (imageToDelete: string) => {
    setGeneratedResults((prev) =>
      prev.filter((result) => result.generatedImage !== imageToDelete)
    );
    closeImageModal();
  };

  // Function to download the image
  const downloadImage = async (imageUrl: string, index: number | null) => {
    // Get the actual image URL to download (always the generated one from modal)
    const imageToDownload =
      index !== null && generatedResults[index]
        ? generatedResults[index].generatedImage
        : imageUrl; // Fallback, though index should ideally always be available

    if (!imageToDownload) {
      toast.error("Could not determine the image to download.");
      return;
    }

    toast.info("Preparing download...");

    try {
      // Use index + 1 for a user-friendly 1-based count, or timestamp if index is null
      const filename = `generated_image_${
        index !== null ? index + 1 : new Date().getTime()
      }.jpg`;

      // Use the API route for robust downloading
      const proxiedUrlString = `/api/download?url=${encodeURIComponent(
        imageToDownload
      )}&filename=${filename}`;

      // Fetching via the API route which will handle the download headers
      const response = await fetch(proxiedUrlString);

      if (!response.ok) {
        let errorBody = "Unknown error";
        try {
          const errorJson = await response.json();
          errorBody = errorJson.error || JSON.stringify(errorJson);
        } catch (e) {
          errorBody = response.statusText;
        }
        throw new Error(
          `Failed to initiate download: ${response.status} ${errorBody}`
        );
      }

      // Convert the response to a blob
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename; // The filename is set here
      link.style.display = "none"; // Hide the link
      document.body.appendChild(link);

      // Programmatically click the link
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Download started!");
    } catch (error: any) {
      console.error("Error downloading image:", error);
      toast.error(
        `Failed to download image: ${error.message || "Please try again."}`
      );
    }
  };

  // Render image comparison based on view mode
  const renderComparisonView = () => {
    console.log("Rendering comparison view. Current mode:", viewMode);
    console.log("Current index:", currentResultIndex);

    // Add detailed logging before the check
    console.log("Render Check - Current Index:", currentResultIndex);
    console.log(
      "Render Check - Generated Results Array:",
      JSON.stringify(generatedResults)
    ); // Log the whole array as a string
    try {
      console.log(
        "Render Check - Accessing Index:",
        currentResultIndex !== null
          ? JSON.stringify(generatedResults[currentResultIndex])
          : "Index is null"
      ); // Log the specific element as a string
    } catch (e) {
      console.error("Render Check - Error accessing index:", e);
    }

    if (
      currentResultIndex === null || // Use null check first for clarity
      !generatedResults[currentResultIndex]
    ) {
      console.log("Condition Check Failed - No valid index or result found");
      // Log the parts of the condition
      console.log(
        "Condition Check Part 1 (currentResultIndex === null):",
        currentResultIndex === null
      );
      console.log(
        "Condition Check Part 2 (!generatedResults[currentResultIndex]):",
        currentResultIndex !== null
          ? !generatedResults[currentResultIndex]
          : "Index is null, check skipped"
      );

      // If we have a modalImage but no valid index/result, just show the image
      if (modalImage) {
        return (
          <RobustImage
            src={modalImage}
            alt="Enlarged view"
            className="max-h-[75vh] max-w-full object-contain"
          />
        );
      }
      return null;
    }

    // Get the specific result object from our array
    const resultObj = generatedResults[currentResultIndex];
    console.log("Result object:", resultObj);

    // Ensure we have both images required for comparison
    const beforeImg = resultObj.rawImage;
    const afterImg = resultObj.generatedImage;

    console.log("Before image URL:", beforeImg);
    console.log("After image URL:", afterImg);

    switch (viewMode) {
      case "before":
        console.log("Rendering BEFORE view");
        // Log the specific URL being used for the \'before\' image
        console.log("Attempting to load Before image URL:", beforeImg);
        if (beforeImg) {
          return (
            <RobustImage
              src={beforeImg}
              alt="Original view"
              className="max-h-[75vh] max-w-full object-contain"
            />
          );
        } else {
          return (
            <div className="text-center p-6 text-gray-600">
              <p>Original image is not available for comparison.</p>
            </div>
          );
        }
      case "side-by-side":
        console.log("Rendering SIDE BY SIDE view");
        // Check if we have both images
        if (!beforeImg || !afterImg) {
          console.error("Missing before or after image for slider", {
            beforeImg,
            afterImg,
          });
          return (
            <div className="text-center p-6">
              <p>Unable to load comparison. Missing image data.</p>
            </div>
          );
        }

        // Return the slider with fixed height and key to force re-render
        return (
          <div className="w-full" style={{ height: "75vh" }}>
            <BeforeAfterSlider
              key={`slider-${currentResultIndex}-${viewMode}`}
              beforeImage={beforeImg}
              afterImage={afterImg}
              beforeLabel="Original"
              afterLabel="Generated"
            />
          </div>
        );
      case "after":
      default:
        console.log("Rendering AFTER view");
        return (
          <RobustImage
            src={afterImg}
            alt="Generated view"
            className="max-h-[75vh] max-w-full object-contain"
          />
        );
    }
  };

  if (!modalImage || currentResultIndex === null) return null;

  const currentImage = generatedResults[currentResultIndex];
  let beforeSrc = currentImage.rawImage;
  let afterSrc = currentImage.generatedImage;

  // Ensure that beforeSrc and afterSrc are valid strings
  if (typeof beforeSrc !== "string") {
    console.error("Invalid beforeSrc:", beforeSrc);
    beforeSrc = ""; // Fallback to an empty string or some default placeholder
  }
  if (typeof afterSrc !== "string") {
    console.error("Invalid afterSrc:", afterSrc);
    afterSrc = ""; // Fallback to an empty string
  }

  // Conditional rendering for different view modes
  let modalContent;
  if (viewMode === "side-by-side" && beforeSrc && afterSrc) {
    modalContent = (
      <BeforeAfterSlider beforeImage={beforeSrc} afterImage={afterSrc} />
    );
  } else if (viewMode === "before" && beforeSrc) {
    modalContent = (
      <Image
        src={beforeSrc}
        alt="Original room"
        fill
        className="object-contain rounded-lg"
        unoptimized
      />
    );
  } else if (afterSrc) {
    // Default to "after"
    modalContent = (
      <Image
        src={afterSrc}
        alt="Generated room"
        fill
        className="object-contain rounded-lg"
        unoptimized
      />
    );
  } else {
    modalContent = <p>Image not available</p>; // Fallback if no valid image
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl h-[80vh] bg-themeDarkGray rounded-xl shadow-2xl flex flex-col overflow-hidden p-6">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setComparisonView(
                  viewMode === "side-by-side" ? "after" : "side-by-side"
                )
              }
            >
              <FiMaximize2 className="w-5 h-5" />
            </Button>
            {viewMode === "side-by-side" && (
              <>
                <Button
                  variant={"outline"}
                  onClick={() => setComparisonView("before")}
                >
                  Show Original
                </Button>
                <Button
                  variant={"outline"}
                  onClick={() => setComparisonView("after")}
                >
                  Show Generated
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                downloadImage(currentImage.generatedImage, currentResultIndex)
              }
            >
              <FiDownload className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => deleteImage(currentImage.generatedImage)}
              className="hover:bg-red-500/20 hover:text-red-500 text-red-500 border-red-500"
            >
              <FiTrash2 className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={closeImageModal}>
              <FiX className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image display area */}
        <div className="flex-1 relative rounded-lg overflow-hidden bg-black">
          {modalContent}
        </div>
      </div>
    </div>
  );
}

export default CreateNew;
