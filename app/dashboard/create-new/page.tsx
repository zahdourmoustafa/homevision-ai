"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { TextLoader } from "./_components/CustomLoading";
import { MdPhotoLibrary } from "react-icons/md";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
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
  FiZoomIn,
  FiX,
  FiMaximize2,
  FiTrash2,
  FiDownload,
  FiSliders,
  FiChevronDown,
} from "react-icons/fi";
import { roomTypes } from "@/lib/utils";
import BeforeAfterSlider from "@/app/components/BeforeAfterSlider";
import { cn } from "@/lib/utils";
import {
  Zap,
  Sun,
  Palmtree,
  Waves,
  Clock,
  Factory,
  Building,
  Feather,
} from "lucide-react";

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
  const [activeSlider, setActiveSlider] = useState<GeneratedResult | null>(
    null
  );
  const [roomType, setRoomType] = useState<string>("");
  const [selectedDesignTypes, setSelectedDesignTypes] = useState<string[]>([]);
  const [designType, setDesignType] = useState<string>("");
  const [additionalReq, setAdditionalReq] = useState<string>("");
  const [aiCreativity, setAiCreativity] = useState<number>(50); // Default to middle value
  const { user } = useUser();
  // Add new state for the image modal
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState<"after" | "before" | "side-by-side">(
    "after"
  );
  const [currentResultIndex, setCurrentResultIndex] = useState<number | null>(
    null
  );
  const [isRoomTypeSectionOpen, setIsRoomTypeSectionOpen] = useState(true); // State for collapsible section
  const [isThemeSectionOpen, setIsThemeSectionOpen] = useState(true); // State for theme section collapse

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

  // Loading messages for the animation
  const loadingMessages = [
    "Analyzing your room...",
    "Applying design style...",
    "Generating new interior...",
    "Adding finishing touches...",
    "Almost there...",
  ];

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
        } catch (apiError) {
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
          toast.error(
            `Error: ${
              error.response.data?.error ||
              error.message ||
              "Something went wrong"
            }`
          );
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

  // Function to toggle compare mode
  const toggleCompareMode = () => {
    setIsCompareMode(!isCompareMode);
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
        } catch (jsonError) {
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
          <img
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
        // Log the specific URL being used for the 'before' image
        console.log("Attempting to load Before image URL:", beforeImg);
        if (beforeImg) {
          return (
            <img
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
          <img
            src={afterImg}
            alt="Generated view"
            className="max-h-[75vh] max-w-full object-contain"
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full bg-gray-100">
        {/* Left panel - Controls - Ensure it has white background */}
        <div className="w-full md:w-[500px] overflow-y-auto h-[calc(100vh-60px)] md:h-screen p-4 md:border-r border-gray-200 bg-white">
          <div className="space-y-6 pb-8">
            {/* Upload Image Section - Wrapped in a box */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="text-lg font-medium flex items-center gap-2 text-gray-800 mb-3">
                Upload image
              </div>
              {/* Image upload area */}
              <div
                className="mt-2 border border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors border-gray-300"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                {preview ? (
                  <div className="relative w-full h-[200px]">
                    {typeof preview === "string" && preview.trim() !== "" && (
                      <Image
                        src={preview}
                        alt="Room preview"
                        fill
                        className="object-contain rounded-lg"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="bg-blue-100 rounded-full p-2 mb-2">
                      <FiUpload className="w-5 h-5 text-blue-900" />
                    </div>
                    <p className="text-sm text-center text-gray-600">
                      Click to upload or drag and drop your image here
                    </p>
                    <p className="text-xs text-gray-500 mt-1">or</p>
                    <p className="text-xs text-blue-900 mt-1">
                      Use one of our sample images
                    </p>
                  </div>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />
            </div>

            {/* Tabs Section - Wrapped in a box (Assuming tabs belong together) */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <Tabs defaultValue="custom" className="w-full">
                <TabsContent value="custom" className="space-y-6">
                  {/* Room Type Section - Wrapped in its own div for structure, header styled */}
                  <div className="space-y-2">
                    <button
                      onClick={() =>
                        setIsRoomTypeSectionOpen(!isRoomTypeSectionOpen)
                      }
                      className="w-full flex items-center justify-between text-sm font-bold text-black py-2 px-3 rounded-md hover:bg-gray-50 border border-gray-200"
                    >
                      Select Room Type
                      <FiChevronDown
                        className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                          isRoomTypeSectionOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isRoomTypeSectionOpen && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-3">
                        {roomTypes.map((rt) => {
                          const isSelected = roomType === rt.value;
                          return (
                            <div
                              key={rt.value}
                              onClick={() => setRoomType(rt.value)}
                              className={cn(
                                "cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-150 ease-in-out",
                                isSelected
                                  ? "border-orange-500 ring-2 ring-orange-500 bg-orange-50 shadow-md"
                                  : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm",
                                "aspect-[4/3]" // Maintain aspect ratio for items
                              )}
                            >
                              <span className="text-3xl mb-1.5">{rt.icon}</span>
                              <span
                                className={cn(
                                  "text-xs text-center font-medium",
                                  isSelected
                                    ? "text-orange-700"
                                    : "text-gray-700"
                                )}
                              >
                                {rt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Design Style Section - Wrapped, header styled */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsThemeSectionOpen(!isThemeSectionOpen)}
                      className="w-full flex items-center justify-between text-sm font-bold text-black py-2 px-3 rounded-md hover:bg-gray-50 border border-gray-200"
                    >
                      Select Room Design (up to 4)
                      <FiChevronDown
                        className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                          isThemeSectionOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isThemeSectionOpen && (
                      <>
                        <div className="grid grid-cols-3 gap-3 pt-3">
                          {designStyles.map((style) => {
                            const isSelected = selectedDesignTypes.includes(
                              style.value
                            );
                            return (
                              <div
                                key={style.value}
                                onClick={() => toggleDesignStyle(style.value)}
                                className="cursor-pointer flex flex-col items-center group relative"
                              >
                                <div
                                  className={cn(
                                    "relative w-full aspect-square rounded-lg overflow-hidden border transition-all",
                                    isSelected
                                      ? "ring-2 ring-blue-500 border-blue-500"
                                      : "border-gray-300 group-hover:border-gray-400"
                                  )}
                                >
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 z-10 bg-blue-600 rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                                      <FiCheck className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <Image
                                    src={style.image}
                                    alt={style.label}
                                    fill
                                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                                    sizes="(max-width: 768px) 30vw, 150px"
                                  />
                                </div>
                                <span
                                  className={cn(
                                    "text-xs text-center mt-1.5 font-medium",
                                    isSelected
                                      ? "text-blue-700"
                                      : "text-gray-700 group-hover:text-gray-900"
                                  )}
                                >
                                  {style.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {selectedDesignTypes.length === 0
                              ? "Select up to 4 themes"
                              : `${selectedDesignTypes.length} theme${
                                  selectedDesignTypes.length > 1 ? "s" : ""
                                } selected`}
                          </p>
                          {selectedDesignTypes.length > 0 && (
                            <button
                              onClick={() => setSelectedDesignTypes([])}
                              className="text-xs text-gray-500 hover:text-blue-600 hover:underline"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Custom Design Request - Wrapped, header styled */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-black block px-3">
                      Custom Design Request
                    </label>
                    <Textarea
                      placeholder="A modern kitchen with navy blue cabinets, marble countertops, oak vinyl plank flooring, gold accents, pendant lights..."
                      className="resize-none min-h-[100px] bg-gray-50 text-gray-700 border-gray-300 placeholder-gray-400 rounded-md"
                      onChange={(e) => setAdditionalReq(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Visualize Button (remains outside the boxes, but within the left panel) */}
            <InteractiveHoverButton
              text={isLoading ? "Visualizing..." : "Visualize"}
              onClick={generateAiImage}
              disabled={
                isLoading ||
                !selectedFile ||
                !roomType ||
                selectedDesignTypes.length === 0
              }
              className="w-full mt-4 h-12 rounded-md text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <p className="text-ml text-gray-500 text-center mt-2">
              Welcome to InteriorAI! Enjoy{" "}
              <span className="font-bold text-black ">
                2 complimentary renders
              </span>{" "}
              🎁 on the house. Want more? Explore our{" "}
              <span className="text-orange-500">plans →</span>
            </p>
          </div>
        </div>

        {/* Right panel - Results - Keep fixed */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 h-[calc(100vh-60px)] md:h-screen p-0 m-0">
          {generatedResults.length > 0 || isLoading ? (
            // Always show the grid when we have generated images or are loading
            <div className="w-full h-full flex items-center justify-center">
              {/* Always use a 2x2 grid layout that fills the viewport */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
                {/* Top Left - Loading State or Newest Image */}
                {(isLoading || generatedResults[0]) && (
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-sm w-full h-full">
                    {isLoading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50">
                        <div className="relative w-80 h-80 mb-4">
                          <Image
                            src="/animated.gif"
                            alt="Loading"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          Crafting Your Visualization...
                        </h3>
                        <div className="w-full max-w-xs bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full animate-pulse"
                            style={{ width: "65%" }}
                          ></div>
                        </div>
                      </div>
                    ) : generatedResults[0] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(
                                generatedResults[0].generatedImage,
                                0
                              )
                            }
                            className="bg-black bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <FiMaximize2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                        <RobustImage
                          src={generatedResults[0].generatedImage}
                          alt="Latest design"
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Top Right - First Image when loading or Second Newest Image - only visible if has content */}
                {((isLoading && generatedResults[0]) ||
                  (!isLoading && generatedResults[1])) && (
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-sm w-full h-full">
                    {isLoading && generatedResults[0] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(
                                generatedResults[0].generatedImage,
                                0
                              )
                            }
                            className="bg-black bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <FiMaximize2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                        <RobustImage
                          src={generatedResults[0].generatedImage}
                          alt="Previous design"
                        />
                      </div>
                    ) : generatedResults[1] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(
                                generatedResults[1].generatedImage,
                                1
                              )
                            }
                            className="bg-black bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <FiMaximize2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                        <RobustImage
                          src={generatedResults[1].generatedImage}
                          alt="Previous design"
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Bottom Left - Second image when loading or Third Newest Image - only visible if has content */}
                {((isLoading && generatedResults[1]) ||
                  (!isLoading && generatedResults[2])) && (
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-sm w-full h-full">
                    {isLoading && generatedResults[1] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(
                                generatedResults[1].generatedImage,
                                1
                              )
                            }
                            className="bg-black bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <FiMaximize2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                        <RobustImage
                          src={generatedResults[1].generatedImage}
                          alt="Older design"
                        />
                      </div>
                    ) : generatedResults[2] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(
                                generatedResults[2].generatedImage,
                                2
                              )
                            }
                            className="bg-black bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <FiMaximize2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                        <RobustImage
                          src={generatedResults[2].generatedImage}
                          alt="Older design"
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Bottom Right - Third image when loading or Fourth Newest Image - only visible if has content */}
                {((isLoading && generatedResults[2]) ||
                  (!isLoading && generatedResults[3])) && (
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-sm w-full h-full">
                    {isLoading && generatedResults[2] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(
                                generatedResults[2].generatedImage,
                                2
                              )
                            }
                            className="bg-black bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <FiMaximize2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                        <RobustImage
                          src={generatedResults[2].generatedImage}
                          alt="Oldest design"
                        />
                      </div>
                    ) : generatedResults[3] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(
                                generatedResults[3].generatedImage,
                                3
                              )
                            }
                            className="bg-black bg-opacity-50 rounded-full p-2 shadow-md hover:bg-opacity-75 transition-colors"
                            aria-label="View fullscreen"
                          >
                            <FiMaximize2 className="w-5 h-5 text-white" />
                          </button>
                        </div>
                        <RobustImage
                          src={generatedResults[3].generatedImage}
                          alt="Oldest design"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Clean, minimal placeholder when no images are generated
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gray-100 rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow">
                <MdPhotoLibrary className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">
                Generated renders will appear here
              </h2>
              <p className="text-gray-500 text-sm max-w-md">
                Ready to bring your vision to life? Get started on the left to
                create your own custom renders.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          {/* Container with centered content */}
          <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center p-4">
            {/* White box sized to fit content */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full overflow-hidden flex flex-col">
              {/* Close button absolutely positioned in the corner */}
              <button
                onClick={closeImageModal}
                className="absolute top-2 right-2 z-30 bg-gray-700 hover:bg-gray-600 rounded-full p-1.5 text-white transition-all shadow-lg"
                aria-label="Close image"
              >
                <FiX className="w-4 h-4" />
              </button>

              {/* Comparison controls at top */}
              {currentResultIndex !== null && (
                <div className="absolute top-4 left-0 right-0 z-20 flex justify-center">
                  <div className="inline-flex rounded-lg bg-gray-700 p-1">
                    <button
                      onClick={() => setComparisonView("before")}
                      className={`px-4 py-2 text-sm rounded-l-lg transition-all ${
                        viewMode === "before"
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Before
                    </button>
                    <button
                      onClick={() => setComparisonView("side-by-side")}
                      className={`px-4 py-2 text-sm transition-all ${
                        viewMode === "side-by-side"
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      Side By Side
                    </button>
                    <button
                      onClick={() => setComparisonView("after")}
                      className={`px-4 py-2 text-sm rounded-r-lg transition-all ${
                        viewMode === "after"
                          ? "bg-gray-900 text-white"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      After
                    </button>
                  </div>
                </div>
              )}

              {/* Image container with appropriate padding */}
              <div
                className="flex items-center justify-center p-6 pt-16"
                style={{
                  height: viewMode === "side-by-side" ? "auto" : "auto",
                }}
              >
                {renderComparisonView()}
              </div>

              {/* Action buttons at bottom */}
              <div className="pb-6 pt-0 flex justify-center gap-4">
                {/* Delete button */}
                <button
                  onClick={() => deleteImage(modalImage)}
                  className="bg-gray-700 rounded-full px-4 py-2 text-white hover:bg-gray-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  aria-label="Delete image"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>

                {/* Download button */}
                <button
                  onClick={() => {
                    // Pass the current image URL and its index to the download function
                    if (modalImage && currentResultIndex !== null) {
                      downloadImage(modalImage, currentResultIndex);
                    } else {
                      // Fallback or error if modal isn't open correctly
                      console.error(
                        "Modal image or index not available for download."
                      );
                      toast.error("Cannot download image: Invalid state.");
                    }
                  }}
                  className="bg-gray-700 rounded-full px-4 py-2 text-white hover:bg-gray-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  aria-label="Download image"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateNew;
