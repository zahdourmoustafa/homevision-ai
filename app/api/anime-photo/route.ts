import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/lib/supabase";

// Define the Luma Video API response type based on documentation
type LumaVideoResponse = {
  id: string;
  state: "pending" | "dreaming" | "completed" | "failed";
  failure_reason: string | null;
  created_at: string;
  assets: {
    video: string | null;
  };
  model: string;
  request: {
    prompt: string;
    keyframes?: {
      frame0?: {
        type: "image";
        url: string;
      };
    };
    loop?: boolean;
    aspect_ratio?: string;
    duration?: string;
  };
};

// Define the structure of the request body
interface AnimePhotoRequestBody {
  imageUrl: string;
  userEmail: string;
  title?: string;
}

// Function to upload video buffer to Supabase Storage
const uploadVideoToSupabase = async (
  videoUrl: string,
  fileName: string
): Promise<string> => {
  try {
    console.log("Downloading video from Luma:", videoUrl);

    // Download the video from Luma
    const response = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      timeout: 30000, // 30 second timeout for video download
      maxRedirects: 5,
      headers: {
        Accept: "video/mp4,video/*",
      },
    });

    // Convert to buffer
    const buffer = Buffer.from(response.data);
    const finalFileName = fileName.endsWith(".mp4")
      ? fileName
      : `${fileName}.mp4`;

    console.log("Uploading video to Supabase storage...");

    // Upload the buffer to Supabase Storage
    const { error } = await supabase.storage
      .from("anime-videos")
      .upload(`generated/${finalFileName}`, buffer, {
        contentType: "video/mp4",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw error;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("anime-videos")
      .getPublicUrl(`generated/${finalFileName}`);

    if (!publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    console.log("Video uploaded successfully to:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading video to Supabase:", error);
    throw error;
  }
};

// Function to generate video with Luma AI using the perfect system prompt
const generateVideoWithLuma = async (
  imageUrl: string,
  userEmail: string
): Promise<{ videoUrl: string; lumaTaskId: string }> => {
  try {
    console.log("Initiating Luma AI video generation with image:", imageUrl);

    // Perfect system prompt for 180-degree clockwise rotation
    const systemPrompt = `Create a smooth, cinematic 180-degree clockwise camera rotation around the central subject of this image. 

🎬 **CAMERA MOVEMENT SPECIFICATIONS**:
- Execute a precise 180-degree clockwise orbital rotation around the image's main focal point
- Maintain consistent distance from the subject throughout the rotation
- Keep the subject perfectly centered in frame during the entire movement
- Smooth, steady camera motion with no jerky movements or speed variations
- Professional cinematic quality with fluid motion blur where appropriate

🎯 **TECHNICAL REQUIREMENTS**:
- Duration: Exactly 5 seconds for complete 180-degree rotation
- Frame rate: Smooth 24fps or higher for cinematic quality
- Resolution: High definition with crisp detail preservation
- Lighting: Maintain consistent lighting and shadows throughout rotation
- Depth: Preserve natural depth of field and spatial relationships

🎨 **VISUAL PRESERVATION**:
- Keep all original colors, textures, and details intact
- Maintain the original lighting conditions and atmosphere
- Preserve the natural depth and dimensionality of the scene
- No style changes, filters, or artistic modifications
- Ensure seamless loop potential for continuous playback

🚫 **STRICT CONSTRAINTS**:
- NO zoom in/out - maintain constant distance
- NO vertical camera movement - pure horizontal rotation only
- NO object movement - only camera should move
- NO scene modifications - preserve original composition exactly
- NO speed changes - consistent rotation speed throughout

The result should be a mesmerizing, professional-quality rotation that showcases the subject from multiple angles while maintaining the original image's integrity and visual appeal.`;

    // Call Luma Video API to initiate the generation
    const response = await axios.post<{ id: string }>(
      "https://api.lumalabs.ai/dream-machine/v1/generations",
      {
        prompt: systemPrompt,
        model: "ray-2", // Using Ray 2 for best quality
        keyframes: {
          frame0: {
            type: "image",
            url: imageUrl,
          },
        },
        loop: true, // Enable looping for seamless rotation
        aspect_ratio: "16:9",
        duration: "5s",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const generationId = response.data.id;
    console.log(`Luma AI Video Generation initiated with ID: ${generationId}`);

    // Update database with processing status
    await supabase
      .from("photo_animations")
      .update({
        luma_task_id: generationId,
        status: "processing",
        processing_started_at: new Date().toISOString(),
      })
      .eq("user_id", userEmail); // Assuming we're using email as user identifier for now

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 120; // Max 10 minutes (120 attempts * 5 seconds)
    const pollInterval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await axios.get<LumaVideoResponse>(
        `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
            Accept: "application/json",
          },
        }
      );

      const generation = statusResponse.data;
      console.log(
        `Generation status: ${generation.state} (Attempt ${
          attempts + 1
        }/${maxAttempts})`
      );

      if (generation.state === "completed") {
        if (generation.assets && generation.assets.video) {
          console.log("Luma AI Video Generation completed successfully.");
          return {
            videoUrl: generation.assets.video,
            lumaTaskId: generationId,
          };
        } else {
          throw new Error(
            "Luma AI Video Generation completed but no video URL found in assets."
          );
        }
      } else if (generation.state === "failed") {
        console.error(
          "Luma AI Video Generation failed. Full response:",
          generation
        );

        // Update database with failed status
        await supabase
          .from("photo_animations")
          .update({
            status: "failed",
            error_message: generation.failure_reason || "Unknown error",
            processing_completed_at: new Date().toISOString(),
          })
          .eq("luma_task_id", generationId);

        throw new Error(
          `Luma AI Video Generation failed: ${
            generation.failure_reason || "Unknown reason"
          }`
        );
      }

      attempts++;
    }

    // Timeout - update database
    await supabase
      .from("photo_animations")
      .update({
        status: "failed",
        error_message: "Generation timed out",
        processing_completed_at: new Date().toISOString(),
      })
      .eq("luma_task_id", generationId);

    throw new Error(
      "Luma AI Video Generation timed out after " +
        (maxAttempts * pollInterval) / 1000 +
        " seconds."
    );
  } catch (error) {
    console.error("Error in generateVideoWithLuma:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Luma API Error Response Data:", error.response.data);
      throw new Error(
        `Luma API request failed with status ${
          error.response.status
        }: ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const {
      imageUrl,
      userEmail,
      title = `Animation ${Date.now()}`,
    }: AnimePhotoRequestBody = await req.json();

    console.log("Received anime photo request:", {
      imageUrl,
      userEmail,
      title,
    });

    // Validate the input
    if (!imageUrl || !userEmail) {
      const missingFields = [];
      if (!imageUrl) missingFields.push("imageUrl");
      if (!userEmail) missingFields.push("userEmail");

      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Create initial database record
    const { data: animationData, error: insertError } = await supabase
      .from("photo_animations")
      .insert([
        {
          title,
          original_image_url: imageUrl,
          status: "pending",
          metadata: {
            rotation_type: "clockwise_180",
            duration: "5s",
            model: "ray-2",
          },
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create animation record",
          details: insertError.message,
        },
        { status: 500 }
      );
    }

    const animationId = animationData.id;
    console.log("Created animation record with ID:", animationId);

    try {
      // Generate video with Luma AI
      console.log("Starting video generation with Luma AI...");
      const { videoUrl: lumaVideoUrl, lumaTaskId } =
        await generateVideoWithLuma(imageUrl, userEmail);

      console.log("Video generated successfully, uploading to Supabase...");

      // Upload video to Supabase storage
      const uniqueFileName = `anime_video_${animationId}_${Date.now()}`;
      const supabaseVideoUrl = await uploadVideoToSupabase(
        lumaVideoUrl,
        uniqueFileName
      );

      // Update database with completed status
      const { error: updateError } = await supabase
        .from("photo_animations")
        .update({
          generated_video_url: supabaseVideoUrl,
          luma_task_id: lumaTaskId,
          status: "completed",
          processing_completed_at: new Date().toISOString(),
        })
        .eq("id", animationId);

      if (updateError) {
        console.error("Database update error:", updateError);
        return NextResponse.json(
          {
            error: "Failed to update animation record",
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      // Log success
      await supabase.from("animation_logs").insert([
        {
          animation_id: animationId,
          log_level: "info",
          message: "Animation completed successfully",
          details: {
            luma_task_id: lumaTaskId,
            original_video_url: lumaVideoUrl,
            final_video_url: supabaseVideoUrl,
          },
        },
      ]);

      console.log("Animation process completed successfully!");

      // Return success response
      return NextResponse.json({
        success: true,
        message: "Animation created successfully",
        data: {
          animationId,
          title,
          originalImageUrl: imageUrl,
          videoUrl: supabaseVideoUrl,
          lumaTaskId,
          status: "completed",
        },
      });
    } catch (processingError) {
      // Update database with error status
      await supabase
        .from("photo_animations")
        .update({
          status: "failed",
          error_message:
            processingError instanceof Error
              ? processingError.message
              : "Unknown error",
          processing_completed_at: new Date().toISOString(),
        })
        .eq("id", animationId);

      // Log error
      await supabase.from("animation_logs").insert([
        {
          animation_id: animationId,
          log_level: "error",
          message: "Animation processing failed",
          details: {
            error:
              processingError instanceof Error
                ? processingError.message
                : "Unknown error",
          },
        },
      ]);

      throw processingError;
    }
  } catch (error) {
    console.error("Error in /api/anime-photo:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check animation status
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const animationId = searchParams.get("id");
    const userEmail = searchParams.get("userEmail");

    if (!animationId && !userEmail) {
      return NextResponse.json(
        { error: "Either animationId or userEmail is required" },
        { status: 400 }
      );
    }

    let query = supabase.from("photo_animations").select("*");

    if (animationId) {
      query = query.eq("id", animationId);
    } else if (userEmail) {
      query = query
        .eq("user_id", userEmail)
        .order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch animation data", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: animationId ? data[0] : data,
    });
  } catch (error) {
    console.error("Error in GET /api/anime-photo:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
