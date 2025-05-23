import { NextResponse } from "next/server";
import axios from "axios"; // Use Axios for fetching the image
import { supabase } from "@/lib/supabase"; // Import your Supabase client

// Define the Luma API response type
type LumaResponse = {
  id: string;
  type: string;
  state: string;
  failure_reason: string | null;
  created_at: string;
  assets: {
    video: string | null;
    image: string | null;
  };
  model: string;
  request: {
    type: string;
    model: string;
    prompt: string;
    aspect_ratio: string;
    callback_url: string | null;
    image_ref: string | { url: string; weight?: number } | null;
    style_ref: string | { url: string; weight?: number } | null;
    character_ref: string | { url: string; weight?: number } | null;
    modify_image_ref: string | { url: string; weight?: number } | null;
  };
};

// Define the structure of the request body
interface RedesignRequestBody {
  imageUrl: string;
  roomType: string;
  design: string;
  additionalRequirement?: string;
  userEmail: string;
}

// Separate function to convert an image URL to Base64
const convertImageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    // Add timeout and retry logic for reliability
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000, // 15 second timeout
      maxRedirects: 5,
      headers: {
        Accept: "image/webp,image/png,image/jpeg,image/*",
      },
    });

    // Convert the binary buffer to a Base64 string
    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    // Get the content type from headers, default to image/png if not present
    const contentType = response.headers["content-type"] || "image/png";

    // Return the Base64 data URL
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        `Failed to fetch image: ${error.response.status} ${error.response.statusText}`
      );
    }
    throw new Error("Failed to convert image to Base64");
  }
};

// Function to upload a Base64 image to Supabase Storage
const uploadBase64ImageToSupabase = async (
  base64Image: string,
  fileName: string
): Promise<string> => {
  try {
    // Remove the data URL prefix and get content type
    const [header, base64Data] = base64Image.split("base64,");
    const contentType = header.split(":")[1].split(";")[0];

    // Convert Base64 to Buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Ensure the filename has the correct extension based on content type
    const getExtension = (contentType: string) => {
      switch (contentType) {
        case "image/webp":
          return ".webp";
        case "image/png":
          return ".png";
        case "image/jpeg":
          return ".jpg";
        default:
          return ".png";
      }
    };

    const extension = getExtension(contentType);
    const finalFileName = fileName.endsWith(extension)
      ? fileName
      : `${fileName}${extension}`;

    // Upload the buffer to Supabase Storage
    const { error } = await supabase.storage
      .from("interior-images")
      .upload(`generated/${finalFileName}`, buffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw error;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from("interior-images")
      .getPublicUrl(`generated/${finalFileName}`);

    if (!publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    throw error;
  }
};

// Function to call Luma AI API and wait for completion
const generateImageWithLuma = async (
  imageUrl: string,
  prompt: string
): Promise<string> => {
  try {
    // First, we need to upload the input image to get a URL Luma can access
    // For this implementation, we'll assume the imageUrl is already accessible to Luma

    // Call Luma API to initiate the generation
    const response = await axios.post<{ id: string }>(
      "https://api.lumalabs.ai/dream-machine/v1/generations/image",
      {
        prompt: prompt,
        aspect_ratio: "16:9", // You can make this configurable
        model: "photon-1", // Default model
        modify_image_ref: {
          url: imageUrl,
          weight: 0.8, // Control how much to preserve from original
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const generationId = response.data.id;
    console.log(`Generation initiated with ID: ${generationId}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max with 5-second intervals

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds between polls

      const statusResponse = await axios.get(
        `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
            Accept: "application/json",
          },
        }
      );

      const generation = statusResponse.data as LumaResponse;

      if (generation.state === "completed" && generation.assets.image) {
        console.log("Generation completed successfully");
        return generation.assets.image;
      } else if (generation.state === "failed") {
        throw new Error(
          `Generation failed: ${generation.failure_reason || "Unknown reason"}`
        );
      }

      attempts++;
      console.log(
        `Waiting for generation to complete... (${attempts}/${maxAttempts})`
      );
    }

    throw new Error("Generation timed out");
  } catch (error) {
    console.error("Error generating image with Luma:", error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const {
      imageUrl,
      roomType,
      design,
      additionalRequirement,
      userEmail,
    }: RedesignRequestBody = await req.json();

    // Validate user email
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    console.log("Received request with data:", {
      imageUrl,
      roomType,
      design,
      additionalRequirement,
      userEmail,
    });

    // Validate the input
    if (!imageUrl || !roomType || !design) {
      const missingFields = [];
      if (!imageUrl) missingFields.push("imageUrl");
      if (!roomType) missingFields.push("roomType");
      if (!design) missingFields.push("design");

      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Preprocess the image to make it suitable for the AI
    console.log("Preprocessing image...");

    // Prepare the prompt for Luma AI
    const prompt = `Transform this ${roomType} into a stunning, photorealistic interior in ${design} style. Render the space in ultra-high detail (4K), preserving its architectural layout and key furniture positions.

    🛑 **STRICT CONSTRAINTS**:
    - Do NOT change the room's geometry — maintain all walls, angles, alcoves, and proportions exactly as in the original.
    - Do NOT add or remove windows or doors. Use curtains or blinds ONLY on existing windows.
    - DO NOT move or rotate major furniture: beds, sofas, wardrobes, desks, kitchen counters, etc. Keep them in their original positions and orientations.
    - You MAY restyle these furniture pieces to match the new design.
    - You MAY rearrange or replace small accents like side tables, rugs, lamps, plants, and decor.
    
    🎨 **Design Goals**:
    - Apply the ${design} style with authentic materials, textures, and a cohesive color palette.
    - Ensure the design feels elevated, livable, and magazine-worthy.
    - Add style-appropriate decor: ${
      roomType === "bedroom"
        ? "plants, soft bedding, artistic wall decor"
        : roomType === "living room"
        ? "lighting, textiles, coffee table books, cushions"
        : "functional yet elegant accents"
    }.
    
    📸 **Rendering Specifications**:
    - 4K photorealism with balanced natural and artificial light
    - Realistic shadows, reflections, and material textures
    - Wide-angle perspective that mirrors the original camera angle
    - Professional visual style — suitable for use in architectural magazines
    
    ${
      additionalRequirement
        ? `📌 Additional User Requirement: ${additionalRequirement}`
        : ""
    }
    
    The final output should reflect expert interior design, preserving the room's spatial logic while expressing the chosen style with precision and elegance.`;

    console.log("Calling Luma AI API with prompt:", prompt);

    // Generate the image using Luma AI
    console.log("Generating image with Luma AI...");
    const generatedImageUrl = await generateImageWithLuma(imageUrl, prompt);
    console.log("Generated image URL from Luma:", generatedImageUrl);

    // Convert the generated image URL to Base64
    const base64GeneratedImage = await convertImageUrlToBase64(
      generatedImageUrl
    );

    // Upload the Base64 image to Supabase
    const uniqueFileName = `generated_room_${Date.now()}`;
    const supabaseUrl = await uploadBase64ImageToSupabase(
      base64GeneratedImage,
      uniqueFileName
    );
    console.log("Uploaded to Supabase, URL:", supabaseUrl);

    // Save the room data to the database
    const { error: dbError } = await supabase.from("rooms").insert({
      user_email: userEmail,
      original_image_url: imageUrl,
      redesigned_image_url: supabaseUrl, // Use the Supabase URL
      room_type: roomType,
      design_style: design,
      additional_requirements: additionalRequirement,
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Database insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to save room data", details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Room redesigned and saved successfully",
      originalImageUrl: imageUrl,
      generatedImageUrl: supabaseUrl, // Return the Supabase URL
    });
  } catch (error) {
    console.error("Full error object:", error);
    let errorMessage = "An unexpected error occurred.";
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      statusCode = error.response?.status || 500;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error("Error processing request:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
