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
      .upload(`furnished/${finalFileName}`, buffer, {
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
      .getPublicUrl(`furnished/${finalFileName}`);

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
    const formData = await req.formData();

    // Extract data from FormData
    const image = formData.get("image") as File;
    const roomType = formData.get("roomType") as string;
    const designType = formData.get("designType") as string;
    const additionalReq = formData.get("additionalReq") as string;
    const aiCreativity = formData.get("aiCreativity") as string;
    const userEmail = formData.get("userEmail") as string;

    // Validate user email
    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is required" },
        { status: 400 }
      );
    }

    console.log("Received furnish empty space request with data:", {
      roomType,
      designType,
      additionalReq,
      aiCreativity,
      userEmail,
      hasImage: !!image,
    });

    // Validate the input
    if (!image || !roomType || !designType) {
      const missingFields = [];
      if (!image) missingFields.push("image");
      if (!roomType) missingFields.push("roomType");
      if (!designType) missingFields.push("designType");

      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Upload the original image to Supabase first to get a public URL
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const fileName = `${Date.now()}-${image.name}`;

    const { error: uploadError } = await supabase.storage
      .from("interior-images")
      .upload(`originals/${fileName}`, imageBuffer, {
        contentType: image.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Error uploading original image:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from("interior-images")
      .getPublicUrl(`originals/${fileName}`);

    const imageUrl = publicUrlData.publicUrl;

    // Prepare the prompt for Luma AI specifically for furnishing empty spaces
    const prompt = `FURNISH THIS EMPTY ${roomType.toUpperCase()} SPACE: Add complete furniture and decor to this vacant room in ${designType} style. This is an EMPTY SPACE that needs to be FULLY FURNISHED from scratch.

    🏠 **EMPTY SPACE CONTEXT**:
    - This is a VACANT, UNFURNISHED ${roomType} with bare walls and empty floors
    - NO existing furniture should be preserved - this space is completely empty
    - ADD ALL necessary furniture, lighting, and decor to make it livable and stylish
    - Transform from empty/vacant to fully furnished and decorated
    
    🛑 **ARCHITECTURAL PRESERVATION**:
    - PRESERVE the exact room structure: walls, windows, doors, ceiling, flooring
    - MAINTAIN the original room dimensions and architectural features
    - DO NOT modify structural elements, wall positions, or room layout
    - KEEP the same camera angle and perspective as the original empty space
    
    🪑 **COMPLETE FURNISHING REQUIREMENTS**:
    - ESSENTIAL FURNITURE for ${roomType}: ${
      roomType === "bedroom"
        ? "bed with headboard, nightstands, dresser/wardrobe, chair or bench, full bedding set"
        : roomType === "living room"
        ? "sofa/sectional, coffee table, side tables, TV stand/entertainment center, armchairs, bookshelf"
        : roomType === "kitchen"
        ? "dining table, dining chairs, bar stools (if island/counter), kitchen accessories, decorative elements"
        : roomType === "office"
        ? "desk, ergonomic office chair, bookshelf/storage, filing cabinet, desk lamp"
        : roomType === "dining room"
        ? "dining table, dining chairs, sideboard/buffet, chandelier/pendant lighting"
        : "complete furniture set appropriate for the space type"
    }
    - LIGHTING: ceiling fixtures, table lamps, floor lamps, accent lighting
    - WINDOW TREATMENTS: curtains, blinds, or shades appropriate to ${designType} style
    - FLOORING ADDITIONS: area rugs, runners, or decorative floor elements
    
    🎨 **${designType.toUpperCase()} STYLE IMPLEMENTATION**:
    - Apply authentic ${designType} design principles throughout
    - Use ${designType}-appropriate color palette, materials, and textures
    - Select furniture pieces that exemplify ${designType} aesthetic
    - Add style-specific decorative elements: artwork, plants, accessories, textiles
    - Ensure cohesive design language across all furnishing choices
    
    🏡 **DECOR & ACCESSORIES**:
    - Wall art, paintings, or decorative wall elements
    - Plants and greenery appropriate to the space
    - Decorative objects, vases, books, or collectibles
    - Throw pillows, blankets, and textile accessories
    - Personal touches that make the space feel lived-in and welcoming
    
    📸 **PHOTOREALISTIC RENDERING**:
    - 4K ultra-high definition with professional interior photography quality
    - Natural lighting enhanced with artificial lighting from added fixtures
    - Realistic shadows, reflections, and material textures
    - Depth of field and composition matching high-end interior design magazines
    - Rich detail in furniture finishes, fabric textures, and decorative elements
    
    ${
      additionalReq ? `🎯 **SPECIFIC USER REQUIREMENTS**: ${additionalReq}` : ""
    }
    
    FINAL RESULT: Transform this empty shell into a stunning, fully-furnished ${roomType} that showcases professional ${designType} interior design. Every corner should feel intentionally designed and ready for immediate occupancy.`;

    console.log("Constructed prompt for Luma AI:", prompt);

    // Generate the image using Luma AI
    console.log(
      "Generating furnished space with Luma AI using input URL:",
      imageUrl
    );
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
    const uniqueFileName = `furnished_space_${Date.now()}`;
    const supabaseUrl = await uploadBase64ImageToSupabase(
      base64GeneratedImage,
      uniqueFileName
    );
    console.log("Uploaded Luma-generated image to Supabase, URL:", supabaseUrl);

    // Save the room data to the database
    const { error: dbError } = await supabase.from("furnished_spaces").insert([
      {
        original_image_url: imageUrl,
        furnished_image_url: supabaseUrl,
        room_type: roomType,
        design_type: designType,
        additional_requirements: additionalReq,
        ai_creativity: parseInt(aiCreativity) || 50,
        user_email: userEmail,
        created_at: new Date().toISOString(),
      },
    ]);

    if (dbError) {
      console.error("Supabase database insert error:", dbError);
      // If the table doesn't exist, we'll still return success but log the error
      console.log(
        "Note: furnished_spaces table may not exist yet. Continuing without database save."
      );
    } else {
      console.log("Furnished space data saved to Supabase successfully.");
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Empty space furnished successfully",
      originalImageUrl: imageUrl,
      generatedImageUrl: supabaseUrl,
    });
  } catch (error) {
    console.error("Error in /api/furnish-empty-space:", error);
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
