import { NextResponse } from "next/server";
import axios from "axios"; // Use Axios for fetching the image
import { supabase } from "@/lib/supabase"; // Import your Supabase client
// import sharp from "sharp"; // Remove sharp as preprocessImage will be removed

// Define the Luma API response type
type LumaResponse = {
  id: string;
  type: string;
  state: string;
  failure_reason: string | null;
  created_at: string;
  assets: {
    video: string | null;
    image: string | null; // This is what we expect for the generated image URL
  };
  model: string;
  request: {
    type: string;
    model: string;
    prompt: string;
    aspect_ratio: string;
    callback_url: string | null;
    // Using more specific types for ref objects based on Luma docs
    image_ref: { url: string; weight?: number }[] | null;
    style_ref: { url: string; weight?: number }[] | null;
    character_ref: { [key: string]: { images: string[] } } | null;
    modify_image_ref: { url: string; weight?: number } | null;
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
// This function is still needed for the *output* from Luma before uploading to Supabase
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _data, error } = await supabase.storage
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
  imageUrl: string, // This should be a publicly accessible URL
  prompt: string
): Promise<string> => {
  try {
    console.log(
      "Initiating Luma AI generation with input image URL:",
      imageUrl
    );
    // Call Luma API to initiate the generation
    const response = await axios.post<{ id: string }>( // Luma returns an object with an ID for the generation task
      "https://api.lumalabs.ai/dream-machine/v1/generations/image",
      {
        prompt: prompt,
        aspect_ratio: "16:9", // Or make configurable
        model: "photon-1", // Default or make configurable
        // Using modify_image_ref as per the new code structure
        modify_image_ref: {
          url: imageUrl, // Luma will fetch this URL
          weight: 0.75, // Adjust as needed, 0.7 to 0.85 is often good for preserving structure
        },
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
    console.log(`Luma AI Generation initiated with ID: ${generationId}`);

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // Max 5 minutes (60 attempts * 5 seconds)
    const pollInterval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await axios.get<LumaResponse>(
        `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
            Accept: "application/json",
          },
        }
      );

      const generation = statusResponse.data;

      if (generation.state === "completed") {
        if (generation.assets && generation.assets.image) {
          console.log("Luma AI Generation completed successfully.");
          return generation.assets.image;
        } else {
          throw new Error(
            "Luma AI Generation completed but no image URL found in assets."
          );
        }
      } else if (generation.state === "failed") {
        console.error("Luma AI Generation failed. Full response:", generation);
        throw new Error(
          `Luma AI Generation failed: ${
            generation.failure_reason || "Unknown reason"
          }`
        );
      }

      attempts++;
      console.log(
        `Luma AI - Waiting for generation... (Attempt ${attempts}/${maxAttempts}, State: ${generation.state})`
      );
    }

    throw new Error(
      "Luma AI Generation timed out after " +
        (maxAttempts * pollInterval) / 1000 +
        " seconds."
    );
  } catch (error) {
    console.error("Error in generateImageWithLuma:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Luma API Error Response Data:", error.response.data);
      throw new Error(
        `Luma API request failed with status ${
          error.response.status
        }: ${JSON.stringify(error.response.data)}`
      );
    }
    throw error; // Re-throw other errors
  }
};

export async function POST(req: Request) {
  try {
    const {
      imageUrl, // This MUST be a publicly accessible URL
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

    // DO NOT preprocess the input imageUrl. Luma needs to fetch it directly.
    // console.log("Preprocessing image...");
    // const processedImageBase64 = await preprocessImage(imageUrl); // REMOVED

    // Prepare the prompt for Luma AI (this prompt structure is from the user)
    const prompt = `Transform this ${roomType} into a stunning, photorealistic interior in ${design} style. Render the space in ultra-high detail (4K), preserving its architectural layout and key furniture positions.

    🛑 **STRICT CONSTRAINTS**:
    - Do NOT change the room\'s geometry — maintain all walls, angles, alcoves, and proportions exactly as in the original.
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
    
    The final output should reflect expert interior design, preserving the room\'s spatial logic while expressing the chosen style with precision and elegance.`;

    console.log("Constructed prompt for Luma AI:", prompt);

    // Generate the image using Luma AI
    console.log("Generating image with Luma AI using input URL:", imageUrl);
    const generatedImageUrlFromLuma = await generateImageWithLuma(
      imageUrl,
      prompt
    );
    console.log("Generated image URL from Luma:", generatedImageUrlFromLuma);

    // Convert the Luma-generated image URL to Base64 for Supabase upload
    const base64GeneratedImage = await convertImageUrlToBase64(
      generatedImageUrlFromLuma
    );
    console.log("Converted Luma image to Base64 for Supabase upload.");

    // Upload the Base64 image to Supabase
    const uniqueFileName = `generated_room_${Date.now()}`; // More descriptive
    const supabaseUrl = await uploadBase64ImageToSupabase(
      base64GeneratedImage,
      uniqueFileName
    );
    console.log("Uploaded Luma-generated image to Supabase, URL:", supabaseUrl);

    // Save the room data to the database using EXISTING column names
    const { error: dbError } = await supabase.from("rooms").insert([
      {
        image_url: imageUrl, // Original image URL
        transformed_image_url: supabaseUrl, // Luma-generated image URL from Supabase
        room_type: roomType,
        design_type: design, // Using 'design_type' as per existing schema
        additional_requirements: additionalRequirement,
        user_email: userEmail,
        // created_at: new Date().toISOString(), // Optional: if you have this column
      },
    ]);

    if (dbError) {
      console.error("Supabase database insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to save room data", details: dbError.message },
        { status: 500 }
      );
    }
    console.log("Room data saved to Supabase successfully.");

    // Return success response with both URLs (using new response structure)
    return NextResponse.json({
      message: "Room redesigned and saved successfully",
      originalImageUrl: imageUrl,
      generatedImageUrl: supabaseUrl,
    });
  } catch (error) {
    console.error("Error in /api/redesign-room:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
