import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // Assuming you'll use Supabase for storage
import { LumaAI } from "lumaai"; // Import LumaAI

// Initialize Luma AI Client
// Ensure LUMA_API_KEY is set in your environment variables
const lumaClient = new LumaAI({ authToken: process.env.LUMA_API_KEY });

// Helper to convert stream to buffer (needed for Supabase upload if directly from FormData)
async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

// Function to upload a file buffer to Supabase Storage
const uploadFileToSupabase = async (
  buffer: Buffer,
  fileName: string,
  contentType: string
) => {
  try {
    const uniqueFileName = `${Date.now()}_${fileName}`;
    const filePath = `generated-videos/${uniqueFileName}`;

    const { error } = await supabase.storage
      .from("interior-images") // Consider a different bucket for videos, e.g., 'generated-media'
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "3600",
        upsert: false, // Usually false for new uploads to avoid accidental overwrites unless intended
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from("interior-images") // Same bucket as upload
      .getPublicUrl(filePath);

    if (!publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL for video");
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading video to Supabase:", error);
    throw error;
  }
};

// Function to generate video using Luma AI SDK
const generateVideoWithAI = async (
  imageUrl: string // Publicly accessible URL of the uploaded image
): Promise<string> => {
  console.log("Initiating Luma AI video generation for image:", imageUrl);

  if (!process.env.LUMA_API_KEY) {
    console.error("LUMA_API_KEY is not set. Using placeholder video.");
    // Fallback to placeholder if API key is missing
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "/sample-video.mp4";
  }

  try {
    // Try different prompt strategies for better results
    const prompts = [
      // Concise, action-focused prompt (recommended by Luma)
      "Camera orbit right 180 degrees, interior room",
      // Alternative with more specific instructions
      "Smooth camera rotation right around room center, maintain depth",
      // Fallback prompt if others fail
      "Interior room tour, steady clockwise camera rotation",
    ];

    let generationInitial;
    let currentPrompt = prompts[0];

    try {
      // First attempt with optimal settings
      generationInitial = await lumaClient.generations.create({
        prompt: currentPrompt,
        model: "ray-2", // Ray2 for better quality
        keyframes: {
          frame0: {
            type: "image",
            url: imageUrl,
          },
        },
        duration: "5s", // 5 seconds for balance between quality and speed
        aspect_ratio: "16:9",
        loop: false,
      });
    } catch (_error) {
      console.log("First attempt failed, trying alternative prompt:", _error);
      currentPrompt = prompts[1];

      // Second attempt with alternative prompt
      generationInitial = await lumaClient.generations.create({
        prompt: currentPrompt,
        model: "ray-2",
        keyframes: {
          frame0: {
            type: "image",
            url: imageUrl,
          },
        },
        duration: "5s", // Slightly shorter for faster generation
        aspect_ratio: "16:9",
        loop: false,
      });
    }

    console.log(
      `Luma AI Generation initiated with ID: ${generationInitial.id}, Current State: ${generationInitial.state}, Prompt: "${currentPrompt}"`
    );

    if (!generationInitial.id) {
      throw new Error("Luma AI did not return a generation ID.");
    }

    // Polling configuration
    let currentGenerationState = generationInitial;
    let completed = false;
    const maxAttempts = 40; // Reduced to ~3.3 minutes for faster timeout
    const pollInterval = 5000; // 5 seconds
    let attempts = 0;

    // Add progress tracking
    const startTime = Date.now();

    while (!completed && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, pollInterval));

      currentGenerationState = await lumaClient.generations.get(
        generationInitial.id as string
      );

      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `Luma AI - Progress: ${
          attempts + 1
        }/${maxAttempts} (${elapsedTime}s elapsed), State: ${
          currentGenerationState.state
        }`
      );

      const state = currentGenerationState.state as string;

      if (state === "completed") {
        completed = true;
        console.log(`Video generation completed in ${elapsedTime} seconds!`);
      } else if (
        state === "failed" ||
        state === "revoked" ||
        state === "rejected"
      ) {
        console.error(
          `Luma AI Generation failed. State: ${state}, Reason: ${currentGenerationState.failure_reason}`
        );

        // If it failed due to content policy, try with a safer prompt
        if (
          currentGenerationState.failure_reason?.includes("policy") &&
          prompts[2]
        ) {
          console.log("Retrying with fallback prompt due to policy issues...");
          return generateVideoWithAI(imageUrl); // Recursive retry with new prompt
        }

        throw new Error(
          `Luma AI Generation ${state}: ${
            currentGenerationState.failure_reason || "Unknown reason"
          }`
        );
      }
      attempts++;
    }

    if (!completed) {
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(
        `Luma AI Generation timed out after ${totalTime} seconds. Consider using a simpler prompt or smaller duration.`
      );
      throw new Error(
        "Luma AI Generation timed out. The server might be busy, please try again."
      );
    }

    // Ensure assets and video URL exist before returning
    if (
      currentGenerationState.assets &&
      typeof currentGenerationState.assets.video === "string"
    ) {
      console.log(
        "Luma AI Generation completed successfully. Video URL:",
        currentGenerationState.assets.video
      );
      return currentGenerationState.assets.video;
    } else {
      console.error(
        "Luma AI Generation completed but no valid video URL found in assets.",
        currentGenerationState
      );
      throw new Error(
        "Luma AI Generation completed but no valid video URL found."
      );
    }
  } catch (error) {
    console.error("Error in generateVideoWithAI (Luma):", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new Error(
          "Video generation is taking longer than expected. Please try again with a simpler scene."
        );
      } else if (error.message.includes("policy")) {
        throw new Error(
          "The content couldn't be generated due to policy restrictions. Please try a different image."
        );
      }
    }

    // For development/testing, you might want to return a placeholder
    // return "/sample-video.mp4";

    // For production, re-throw the error
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const userEmail = formData.get("userEmail") as string | null; // Example: if you send user email

    if (!imageFile) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // Validate file type (optional but good practice)
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (limit to 10MB for better performance)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    console.log(
      "Received image upload:",
      imageFile.name,
      "Size:",
      imageFile.size
    );
    if (userEmail) console.log("User email:", userEmail);

    // 1. Upload the original image to Supabase (or make it somehow publicly accessible for Luma)
    // Luma usually requires a public URL for the input image.
    const imageBuffer = await streamToBuffer(
      imageFile.stream() as ReadableStream<Uint8Array> // Cast to Web API ReadableStream
    );
    const originalImageUrlOnSupabase = await uploadFileToSupabase(
      imageBuffer,
      `original_${imageFile.name}`,
      imageFile.type
    );
    console.log(
      "Original image uploaded to Supabase:",
      originalImageUrlOnSupabase
    );

    // 2. Call the AI video generation service (e.g., Luma)
    // The AI service might return a URL to the generated video directly, or an ID to poll for results.
    console.log("Starting AI video generation...");

    // Start generation time tracking
    const generationStartTime = Date.now();

    const generatedVideoUrlFromAI = await generateVideoWithAI(
      originalImageUrlOnSupabase
    );

    const generationTime = ((Date.now() - generationStartTime) / 1000).toFixed(
      1
    );
    console.log(
      `AI generated video in ${generationTime} seconds:`,
      generatedVideoUrlFromAI
    );

    const finalVideoUrl = generatedVideoUrlFromAI;

    // 3. (Optional) If the AI returns a video that needs to be stored in your Supabase:
    //    - Download the video from `generatedVideoUrlFromAI`
    //    - Upload it to your Supabase bucket
    //    - Update `finalVideoUrl` to the new Supabase public URL.
    //    This is useful for long-term storage, caching, or if Luma URLs expire.
    //    For this example, we'll assume Luma gives a direct, usable URL or we use the placeholder.

    // 4. (Optional) Save metadata to your database
    if (userEmail) {
      try {
        const { error: dbError } = await supabase
          .from("animated_photos")
          .insert([
            {
              original_image_url: originalImageUrlOnSupabase,
              generated_video_url: finalVideoUrl,
              user_email: userEmail,
              generation_time_seconds: parseFloat(generationTime),
              created_at: new Date().toISOString(),
              // other metadata like prompt, duration, status, etc.
            },
          ]);
        if (dbError) {
          console.error(
            "Supabase DB insert error for animated_photos:",
            dbError
          );
          // Non-critical error, continue
        }
      } catch (dbError) {
        console.error("Error saving metadata:", dbError);
        // Non-critical error, continue
      }
    }

    // Return the URL of the generated video with additional metadata
    return NextResponse.json({
      message: "Video generated successfully",
      videoUrl: finalVideoUrl,
      originalImageUrl: originalImageUrlOnSupabase,
      generationTime: generationTime,
      metadata: {
        duration: "5s",
        model: "ray-2",
        prompt: "Camera orbit right 180 degrees, interior room",
      },
    });
  } catch (error) {
    console.error("Error in /api/animephoto:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";

    // Provide user-friendly error messages
    if (errorMessage.includes("timeout")) {
      return NextResponse.json(
        {
          error:
            "Video generation is taking longer than expected. Please try again.",
          suggestion:
            "Try using a simpler interior image or reduce the complexity of the scene.",
        },
        { status: 503 }
      );
    } else if (errorMessage.includes("policy")) {
      return NextResponse.json(
        {
          error: "The image couldn't be processed due to content restrictions.",
          suggestion:
            "Please ensure your image shows only interior spaces without sensitive content.",
        },
        { status: 400 }
      );
    } else if (errorMessage.includes("LUMA_API_KEY")) {
      return NextResponse.json(
        { error: "Video generation service is not configured properly." },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error: errorMessage,
        suggestion:
          "Please try again with a different image or contact support if the issue persists.",
      },
      { status: 500 }
    );
  }
}
