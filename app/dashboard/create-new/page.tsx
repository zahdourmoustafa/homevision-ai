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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FiUpload, FiCheck, FiZoomIn, FiX } from "react-icons/fi";
import { roomTypes } from "@/lib/utils";

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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
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

  // Design styles data with images
  const designStyles = [
    { value: "Modern", label: "Modern", image: "/images/styles/modern.jpg" },
    { value: "Summer", label: "Summer", image: "/images/styles/summer.jpg" },
    {
      value: "Professional",
      label: "Professional",
      image: "/images/styles/professional.jpg",
    },
    {
      value: "Tropical",
      label: "Tropical",
      image: "/images/styles/tropical.jpg",
    },
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
  ];

  // Toggle design style selection
  const toggleDesignStyle = (style: string) => {
    setSelectedDesignTypes((prev) => {
      // If already selected, remove it
      if (prev.includes(style)) {
        return prev.filter((s) => s !== style);
      }
      // If not selected and we have less than 4 selected, add it
      if (prev.length < 4) {
        return [...prev, style];
      }
      // If we already have 4 selected, show a toast and don't add
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

  // Function to open modal with specific image
  const openImageModal = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  // Function to close modal
  const closeImageModal = () => {
    setModalImage(null);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left panel - Controls - Make scrollable */}
        <div className="w-full md:w-[400px] overflow-y-auto h-[calc(100vh-60px)] md:h-screen p-4 md:border-r">
          <div className="space-y-4 pb-8">
            {/* Upload Image Section */}
            <div className="mb-6">
              <div className="text-lg font-medium flex items-center gap-2">
                Upload image
                <span className="bg-orange-100 text-orange-600 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  1
                </span>
              </div>

              {/* Image upload area */}
              <div
                className="mt-2 border border-dashed rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
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
                    <div className="bg-orange-100 rounded-full p-2 mb-2">
                      <FiUpload className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-sm text-center">
                      Click to upload or drag and drop your image here
                    </p>
                    <p className="text-xs text-gray-500 mt-1">or</p>
                    <p className="text-xs text-blue-500 mt-1">
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

            {/* Tabs Section */}
            <Tabs defaultValue="custom" className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-4">
                <TabsTrigger value="custom" className="text-xs">
                  Custom
                </TabsTrigger>
                <TabsTrigger value="style-fusion" className="text-xs">
                  Style Fusion
                </TabsTrigger>
                <TabsTrigger value="auto-style" className="text-xs">
                  Auto Style
                </TabsTrigger>
                <TabsTrigger value="enhance" className="text-xs">
                  Enhance
                </TabsTrigger>
              </TabsList>

              <TabsContent value="custom" className="space-y-4">
                {/* Room Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Type</label>
                  <Select onValueChange={setRoomType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Select Room Type --" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((room) => (
                        <SelectItem key={room.value} value={room.value}>
                          {room.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Design Style Selection - REPLACED WITH GRID */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Select Room Themes (up to 4)
                  </label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {designStyles.map((style) => (
                      <div
                        key={style.value}
                        onClick={() => toggleDesignStyle(style.value)}
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className="relative w-full aspect-square rounded-lg overflow-hidden border hover:border-gray-400 transition-all">
                          {selectedDesignTypes.includes(style.value) && (
                            <div className="absolute top-2 right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm z-10">
                              <FiCheck className="w-3 h-3 text-black" />
                            </div>
                          )}
                          <div
                            className={`absolute inset-0 ${
                              selectedDesignTypes.includes(style.value)
                                ? "ring-2 ring-blue-500"
                                : ""
                            }`}
                          >
                            <Image
                              src={style.image}
                              alt={style.label}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100px, 120px"
                            />
                          </div>
                        </div>
                        <span className="text-xs text-center mt-1.5 text-gray-700">
                          {style.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {selectedDesignTypes.length === 0
                        ? "Select at least one theme"
                        : `${selectedDesignTypes.length} theme${
                            selectedDesignTypes.length > 1 ? "s" : ""
                          } selected`}
                    </p>
                    {selectedDesignTypes.length > 0 && (
                      <button
                        onClick={() => setSelectedDesignTypes([])}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Design Request (Additional Requirements) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Custom Design Request
                  </label>
                  <Textarea
                    placeholder="A modern kitchen with navy blue cabinets, marble countertops, oak vinyl plank flooring, gold accents, pendant lights..."
                    className="resize-none min-h-[100px]"
                    onChange={(e) => setAdditionalReq(e.target.value)}
                  />
                </div>

                {/* AI Creativity Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">AI Creativity</label>
                    <span className="bg-orange-100 text-orange-600 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Slider
                      defaultValue={[50]}
                      max={100}
                      step={1}
                      onValueChange={(value) => setAiCreativity(value[0])}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Other tabs content would go here */}
              <TabsContent value="style-fusion">
                <div className="text-sm text-gray-500 p-4 text-center">
                  Style Fusion functionality coming soon!
                </div>
              </TabsContent>
              <TabsContent value="auto-style">
                <div className="text-sm text-gray-500 p-4 text-center">
                  Auto Style functionality coming soon!
                </div>
              </TabsContent>
              <TabsContent value="enhance">
                <div className="text-sm text-gray-500 p-4 text-center">
                  Enhance functionality coming soon!
                </div>
              </TabsContent>
            </Tabs>

            {/* Visualize Button */}
            <Button
              onClick={generateAiImage}
              disabled={
                isLoading ||
                !selectedFile ||
                !roomType ||
                selectedDesignTypes.length === 0
              }
              className="w-full bg-black hover:bg-gray-800 text-white mt-4 h-12"
            >
              {isLoading ? "Visualizing..." : "Visualize"}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-2">
              Welcome to HomeVisualizer.AI! Enjoy{" "}
              <span className="font-medium">2 complimentary renders</span> 🎁 on
              the house. Want more? Explore our{" "}
              <span className="text-orange-500">plans →</span>
            </p>
          </div>
        </div>

        {/* Right panel - Results - Keep fixed */}
        <div className="flex-1 p-4 flex items-center justify-center bg-gray-50 h-[calc(100vh-60px)] md:h-screen">
          {generatedResults.length > 0 || isLoading ? (
            // Always show the grid when we have generated images or are loading
            <div className="w-full h-full flex items-center justify-center">
              {/* Always use a 2x2 grid layout that fills the viewport */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full max-h-[95vh] max-w-[95%]">
                {/* Top Left - Loading State or Newest Image - always visible if loading or if image exists */}
                {(isLoading || generatedResults[0]) && (
                  <div className="relative bg-white rounded-xl overflow-hidden shadow-sm w-full h-full">
                    {isLoading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <MdPhotoLibrary className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          Crafting Your Visualization
                        </h3>
                        <div className="w-full max-w-xs bg-gray-200 h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full animate-pulse"
                            style={{ width: "65%" }}
                          ></div>
                        </div>
                      </div>
                    ) : generatedResults[0] ? (
                      <div className="w-full h-full rounded-xl overflow-hidden group">
                        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() =>
                              openImageModal(generatedResults[0].generatedImage)
                            }
                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Zoom image"
                          >
                            <FiZoomIn className="w-5 h-5 text-gray-700" />
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
                              openImageModal(generatedResults[0].generatedImage)
                            }
                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Zoom image"
                          >
                            <FiZoomIn className="w-5 h-5 text-gray-700" />
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
                              openImageModal(generatedResults[1].generatedImage)
                            }
                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Zoom image"
                          >
                            <FiZoomIn className="w-5 h-5 text-gray-700" />
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
                              openImageModal(generatedResults[1].generatedImage)
                            }
                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Zoom image"
                          >
                            <FiZoomIn className="w-5 h-5 text-gray-700" />
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
                              openImageModal(generatedResults[2].generatedImage)
                            }
                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Zoom image"
                          >
                            <FiZoomIn className="w-5 h-5 text-gray-700" />
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
                              openImageModal(generatedResults[2].generatedImage)
                            }
                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Zoom image"
                          >
                            <FiZoomIn className="w-5 h-5 text-gray-700" />
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
                              openImageModal(generatedResults[3].generatedImage)
                            }
                            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            aria-label="Zoom image"
                          >
                            <FiZoomIn className="w-5 h-5 text-gray-700" />
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
            <div className="w-full h-full max-h-[95vh] max-w-[95%] flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MdPhotoLibrary className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-medium text-gray-700 mb-2">
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
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4 transition-opacity"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-[95vw] max-h-[95vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors z-10"
              aria-label="Close"
            >
              <FiX className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-full h-full bg-white">
              <Image
                src={modalImage}
                alt="Full size render"
                width={1200}
                height={800}
                className="object-contain w-full h-full"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateNew;
