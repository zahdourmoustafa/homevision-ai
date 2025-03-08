"use client";

import React, { useState } from "react";
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
import { FiUpload } from "react-icons/fi";
import { roomTypes } from "@/lib/utils";

// Interface for the generated result
interface GeneratedResult {
  generatedImage: string;
  rawImage: string;
  timestamp: number;
}

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
  const [designType, setDesignType] = useState<string>("");
  const [additionalReq, setAdditionalReq] = useState<string>("");
  const [aiCreativity, setAiCreativity] = useState<number>(50); // Default to middle value
  const { user } = useUser();

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
    console.log("Design Type:", designType);
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

    if (!roomType || !designType) {
      toast.error("Please select both room type and design style.");
      return;
    }

    try {
      setIsLoading(true);
      const rawImageUrl = await saveRawImageToSupabase(selectedFile);
      const result = await axios.post("/api/redesign-room", {
        imageUrl: rawImageUrl,
        userEmail: user.emailAddresses[0].emailAddress,
        roomType,
        design: designType,
        additionalRequirement: additionalReq,
        creativityLevel: aiCreativity,
      });

      // Log the API response to debug
      console.log("API Response:", result.data);

      // Fix the data structure access
      const generatedImageUrl =
        result.data.result?.generated || result.data.result;

      const newResult = {
        generatedImage: generatedImageUrl,
        rawImage: rawImageUrl,
        timestamp: Date.now(),
      };

      setGeneratedResults((prev) => [...prev.slice(-3), newResult]);
      toast.success("Room redesigned successfully!");
    } catch (error) {
      console.error("Error generating AI image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left panel - Controls */}
        <div className="w-full md:w-[400px] p-4 md:border-r">
          <div className="space-y-4">
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
                    {/* Only render Image when preview is available */}
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
                {/* Input Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Input Type</label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Select a Type --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                {/* Design Style Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Design Style</label>
                  <Select onValueChange={setDesignType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="-- Select Design Style --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Modern">Modern</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Bohemian">Bohemian</SelectItem>
                      <SelectItem value="Traditional">Traditional</SelectItem>
                      <SelectItem value="Rustic">Rustic</SelectItem>
                      <SelectItem value="Minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
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
              disabled={isLoading || !selectedFile || !roomType || !designType}
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

        {/* Right panel - Results */}
        <div className="flex-1 p-2 flex items-center justify-center bg-gray-50">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <TextLoader
                messages={loadingMessages}
                interval={3000}
                dotCount={3}
                direction="vertical"
              />
            </div>
          ) : (
            <div className="w-full h-full">
              {/* 2x2 Grid for generated images - Fills entire right side */}
              <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full">
                {/* Top Left Cell (First generated image) */}
                <div className="relative bg-white rounded-sm overflow-hidden shadow-sm">
                  {generatedResults.length > 0 && generatedResults[0] ? (
                    <React.Fragment>
                      {(() => {
                        console.log(
                          "Image 1 URL:",
                          generatedResults[0]?.generatedImage
                        );
                        return null;
                      })()}

                      {generatedResults[0]?.generatedImage &&
                      typeof generatedResults[0].generatedImage === "string" &&
                      generatedResults[0].generatedImage.trim() !== "" ? (
                        <Image
                          src={generatedResults[0].generatedImage}
                          alt="Generated design 1"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              generatedResults[0].generatedImage
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : preview && generatedResults.length === 0 ? (
                        // Show preview in first cell if no generations yet
                        <Image
                          src={preview}
                          alt="Room preview"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                          <p className="text-xs text-gray-400 text-center mt-2">
                            Image 1
                          </p>
                        </div>
                      )}
                    </React.Fragment>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Design 1
                      </p>
                    </div>
                  )}
                </div>

                {/* Top Right Cell (Second generated image) */}
                <div className="relative bg-white rounded-sm overflow-hidden shadow-sm">
                  {generatedResults.length > 1 && generatedResults[1] ? (
                    <React.Fragment>
                      {(() => {
                        console.log(
                          "Image 2 URL:",
                          generatedResults[1]?.generatedImage
                        );
                        return null;
                      })()}

                      {generatedResults[1]?.generatedImage &&
                      typeof generatedResults[1].generatedImage === "string" &&
                      generatedResults[1].generatedImage.trim() !== "" ? (
                        <Image
                          src={generatedResults[1].generatedImage}
                          alt="Generated design 2"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              generatedResults[1].generatedImage
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                          <p className="text-xs text-gray-400 text-center mt-2">
                            Design 2
                          </p>
                        </div>
                      )}
                    </React.Fragment>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Design 2
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Left Cell (Third generated image) */}
                <div className="relative bg-white rounded-sm overflow-hidden shadow-sm">
                  {generatedResults.length > 2 && generatedResults[2] ? (
                    <React.Fragment>
                      {(() => {
                        console.log(
                          "Image 3 URL:",
                          generatedResults[2]?.generatedImage
                        );
                        return null;
                      })()}

                      {generatedResults[2]?.generatedImage &&
                      typeof generatedResults[2].generatedImage === "string" &&
                      generatedResults[2].generatedImage.trim() !== "" ? (
                        <Image
                          src={generatedResults[2].generatedImage}
                          alt="Generated design 3"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              generatedResults[2].generatedImage
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                          <p className="text-xs text-gray-400 text-center mt-2">
                            Design 3
                          </p>
                        </div>
                      )}
                    </React.Fragment>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Design 3
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Right Cell (Fourth generated image) */}
                <div className="relative bg-white rounded-sm overflow-hidden shadow-sm">
                  {generatedResults.length > 3 && generatedResults[3] ? (
                    <React.Fragment>
                      {(() => {
                        console.log(
                          "Image 4 URL:",
                          generatedResults[3]?.generatedImage
                        );
                        return null;
                      })()}

                      {generatedResults[3]?.generatedImage &&
                      typeof generatedResults[3].generatedImage === "string" &&
                      generatedResults[3].generatedImage.trim() !== "" ? (
                        <Image
                          src={generatedResults[3].generatedImage}
                          alt="Generated design 4"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          onError={(e) => {
                            console.error(
                              "Image failed to load:",
                              generatedResults[3].generatedImage
                            );
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                          <p className="text-xs text-gray-400 text-center mt-2">
                            Design 4
                          </p>
                        </div>
                      )}
                    </React.Fragment>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                      <MdPhotoLibrary className="w-8 h-8 text-gray-200" />
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Design 4
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateNew;
