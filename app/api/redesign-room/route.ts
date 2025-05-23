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
) => {
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
    const response = await axios.post(
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
    const { imageUrl, roomType, design, additionalRequirement, userEmail } =
      await req.json();

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

    // Call the Luma AI API
    const generatedImageUrl = await generateImageWithLuma(imageUrl, prompt);

    console.log("Generated image URL from Luma:", generatedImageUrl);

    // Convert the generated image URL to Base64
    let base64Image;
    try {
      base64Image = await convertImageUrlToBase64(generatedImageUrl);
      console.log("Image converted to Base64 successfully");
    } catch (error) {
      console.error("Error converting image to Base64:", error);
      return NextResponse.json(
        { error: "Failed to process generated image" },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage with proper error handling
    let publicUrl;
    try {
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.png`;
      publicUrl = await uploadBase64ImageToSupabase(base64Image, fileName);
      console.log("Image uploaded to Supabase. Public URL:", publicUrl);
    } catch (error) {
      console.error("Error uploading to Supabase:", error);
      return NextResponse.json(
        { error: "Failed to upload generated image" },
        { status: 500 }
      );
    }

    // Save to database with additional error handling
    try {
      const { error: dbError } = await supabase.from("rooms").insert([
        {
          image_url: imageUrl,
          transformed_image_url: publicUrl, // Using the correct field name
          room_type: roomType,
          design_type: design,
          additional_requirements: additionalRequirement,
          user_email: userEmail,
        },
      ]);

      if (dbError) throw dbError;
    } catch (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save room data" },
        { status: 500 }
      );
    }

    // Return success response with both URLs
    return NextResponse.json({
      result: {
        original: imageUrl,
        generated: publicUrl,
      },
    });
  } catch (e) {
    console.error("Error in /api/redesign-room:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
