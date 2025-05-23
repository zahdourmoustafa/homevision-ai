"use client";

import React, { useState, useCallback, useMemo } from "react";
import ImageSelection from "../create-new/_components/ImageSelection";
import RoomType from "../create-new/_components/RoomType";
import DesignType from "../create-new/_components/DesignType";
import AdditionalReq from "../create-new/_components/AdditionalReq";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { TextLoader } from "../create-new/_components/CustomLoading";
import BeforeAfterSliderComponent from "../create-new/_components/BeforeAfterSlider";
import { MdPhotoLibrary } from "react-icons/md";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

interface GeneratedResult {
  generatedImage: string;
  rawImage: string;
  timestamp: number;
}

function SketchCreateNew() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    image: "",
    room: "",
    design: "",
    additionalRequirement: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>(
    []
  );
  const [activeSlider, setActiveSlider] = useState<GeneratedResult | null>(
    null
  );

  const onHandleInputChanged = useCallback(
    (value: string, fieldName: string) => {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    },
    []
  );

  const handleFileSelected = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

  const loadingMessages = useMemo(
    () => [
      "Analyzing your sketch...",
      "Converting to realistic design...",
      "Adding realistic textures...",
      "Enhancing details...",
      "Almost there...",
    ],
    []
  );

  const saveRawImageToSupabase = async (file: File) => {
    try {
      const fileName = `sketch-${Date.now()}-${file.name}`;
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

  const generateAiImage = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Please upload a sketch image first.");
      return;
    }

    if (!formData.room || !formData.design) {
      toast.error("Please select a room type and design style.");
      return;
    }

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast.error("User email not found. Please ensure you are logged in.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const rawImgUrl = await saveRawImageToSupabase(selectedFile);

      const result = await axios.post("/api/sketch-to-real", {
        imageUrl: rawImgUrl,
        roomType: formData.room,
        design: formData.design,
        additionalRequirement: formData.additionalRequirement,
        userEmail: user.emailAddresses[0].emailAddress,
      });

      const newResult = {
        generatedImage: result.data.result.generated,
        rawImage: result.data.result.original,
        timestamp: Date.now(),
      };

      setGeneratedResults((prev) => [...prev.slice(-3), newResult]);
      toast.success("Sketch converted successfully!");
    } catch (error) {
      console.error("Error converting sketch:", error);
      setError("Failed to convert sketch. Please try again.");
      toast.error("Failed to convert sketch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, formData, user]);

  const getGridPositionClasses = (index: number) => {
    const positions = [
      "col-start-1 row-start-1",
      "col-start-2 row-start-1",
      "col-start-1 row-start-2",
      "col-start-2 row-start-2",
    ];
    return positions[index] || positions[0];
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
      <div className="w-full md:w-[600px] border-b md:border-b-0 md:border-r bg-white p-3">
        <div className="space-y-4 pt-4">
          <div className="space-y-1 px-4">
            <h2 className="text-xl font-semibold">Sketch to Reality</h2>
            <p className="text-xs text-gray-500">
              Transform your room sketches into photorealistic interior designs
            </p>
          </div>

          <div className="space-y-1">
            <ImageSelection onFileSelected={handleFileSelected} />
          </div>

          <div className="space-y-1">
            <RoomType
              selectedRoomType={(value) => onHandleInputChanged(value, "room")}
            />
          </div>

          <div className="space-y-1">
            <DesignType
              selectedDesign={(value) => onHandleInputChanged(value, "design")}
            />
          </div>

          <div className="space-y-1">
            <AdditionalReq
              AdditionalReq={(value) =>
                onHandleInputChanged(value, "additionalRequirement")
              }
            />
          </div>

          <div className="px-8">
            <Button
              onClick={generateAiImage}
              disabled={
                isLoading || !selectedFile || !formData.room || !formData.design
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9"
            >
              {isLoading ? "Converting..." : "Convert Sketch"}
            </Button>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            <p className="text-xs text-gray-500 mt-2">
              NOTE: 1 credit will be used to convert your sketch
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 bg-gray-100">
        <div className="h-full flex items-center justify-center">
          {generatedResults.length > 0 ? (
            <>
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-2 gap-4">
                  {generatedResults.map((result, index) => (
                    <div
                      key={result.timestamp}
                      className={`${getGridPositionClasses(
                        index
                      )} relative cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => setActiveSlider(result)}
                    >
                      <div className="relative rounded-lg overflow-hidden aspect-video">
                        <Image
                          src={result.generatedImage}
                          alt={`Generated room ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                          unoptimized
                        />
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          Click to compare
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Dialog
                open={activeSlider !== null}
                onOpenChange={() => setActiveSlider(null)}
              >
                <DialogContent className="max-w-[1000px] w-full h-[700px] p-0">
                  <DialogTitle className="sr-only">
                    Image Comparison
                  </DialogTitle>
                  {activeSlider && (
                    <BeforeAfterSliderComponent
                      beforeImage={activeSlider.rawImage || ""}
                      afterImage={activeSlider.generatedImage || ""}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </>
          ) : isLoading ? (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6">
              <TextLoader
                messages={loadingMessages}
                interval={3000}
                dotCount={3}
                direction="vertical"
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6">
              <MdPhotoLibrary className="w-10 h-10 text-gray-500 justify-center items-center" />
              <div className="text-center">
                <h1 className="text-xl font-bold">
                  Upload your sketch to get started
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                  Transform your hand-drawn room sketches into photorealistic
                  interior designs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(SketchCreateNew);
