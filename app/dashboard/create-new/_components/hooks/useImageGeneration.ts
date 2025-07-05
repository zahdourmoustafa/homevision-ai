import { useState, useCallback } from "react";
import { toast } from "sonner";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";

export interface GeneratedResult {
  generatedImage: string;
  rawImage: string;
  timestamp: number;
}

export interface GenerationParams {
  roomType: string;
  selectedDesignTypes: string[];
  additionalReq: string;
  aiCreativity: number;
  removeFurniture: boolean;
}

export const useImageGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>(
    []
  );
  const { user } = useUser();

  const saveRawImageToSupabase = useCallback(
    async (file: File): Promise<string> => {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("interior-images")
          .upload(fileName, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from("interior-images")
          .getPublicUrl(data.path);

        return publicUrlData.publicUrl;
      } catch (error) {
        console.error("Error uploading image to Supabase:", error);
        throw error;
      }
    },
    []
  );

  const generateImage = useCallback(
    async (file: File, params: GenerationParams): Promise<void> => {
      if (!file) {
        toast.error("Please upload an image first.");
        return;
      }

      if (!user?.emailAddresses?.[0]?.emailAddress) {
        toast.error("User email not found. Please ensure you are logged in.");
        return;
      }

      if (!params.roomType || params.selectedDesignTypes.length === 0) {
        toast.error(
          "Please select both room type and at least one design style."
        );
        return;
      }

      try {
        setIsLoading(true);
        const rawImageUrl = await saveRawImageToSupabase(file);

        const payload = {
          imageUrl: rawImageUrl,
          userEmail: user.emailAddresses[0].emailAddress,
          roomType: params.roomType,
          design: params.selectedDesignTypes.join(", "),
          designStyles: params.selectedDesignTypes,
          additionalRequirement: params.additionalReq,
          creativityLevel: params.aiCreativity,
        };

        const maxRetries = 2;
        let retryCount = 0;

        while (retryCount <= maxRetries) {
          try {
            const timestamp = Date.now();
            const result = await axios.post(
              `/api/redesign-room?t=${timestamp}`,
              payload
            );

            if (result.data?.prediction?.output?.[1]) {
              const newResult: GeneratedResult = {
                generatedImage: result.data.prediction.output[1],
                rawImage: rawImageUrl,
                timestamp: Date.now(),
              };

              setGeneratedResults((prev) => [newResult, ...prev]);
              toast.success("Image generated successfully!");
              break;
            } else {
              throw new Error("Invalid response format from API");
            }
          } catch (error: any) {
            retryCount++;
            if (retryCount > maxRetries) {
              throw error;
            }
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
          }
        }
      } catch (error: any) {
        console.error("Error generating image:", error);
        toast.error(
          error.response?.data?.error ||
            "Failed to generate image. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [user, saveRawImageToSupabase]
  );

  const deleteImage = useCallback((timestampToDelete: number) => {
    setGeneratedResults((prev) =>
      prev.filter((result) => result.timestamp !== timestampToDelete)
    );
    toast.success("Image removed from this session.");
  }, []);

  return {
    isLoading,
    generatedResults,
    generateImage,
    deleteImage,
  };
};
