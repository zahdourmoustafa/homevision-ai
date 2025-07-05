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

// Define the structure of the request body
interface SketchToRealityRequestBody {
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
      .upload(`sketch-to-reality/${finalFileName}`, buffer, {
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
      .getPublicUrl(`sketch-to-reality/${finalFileName}`);

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

    console.log("Received sketch to reality request with data:", {
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

    const { data: uploadData, error: uploadError } = await supabase.storage
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

    // Prepare the prompt for Luma AI specifically for sketch to reality conversion
    const prompt = `CRITICAL: ELIMINATE ALL SKETCH/DRAWING/RENDERING APPEARANCE - CREATE PURE PHOTOGRAPHIC REALISM

    🚫 **ABSOLUTELY FORBIDDEN - MUST AVOID**:
    - NO sketch lines, drawing marks, or artistic rendering appearance
    - NO cartoon-like, illustrated, or stylized elements
    - NO clean/perfect CGI rendering look
    - NO architectural visualization or 3D render appearance
    - NO watercolor, pencil, or any artistic medium effects
    - NO overly perfect or sterile appearance

    📸 **MANDATORY: REAL PHOTOGRAPH APPEARANCE ONLY**:
    Transform this ${roomType} sketch into a genuine REAL-LIFE PHOTOGRAPH that looks like it was taken with an iPhone or professional camera in an actual home. The result MUST be indistinguishable from a real photograph of a real interior space.

    🎯 **PHOTOGRAPHIC REALISM REQUIREMENTS**:
    - REAL CAMERA SHOT: Must look like a photograph taken with an actual camera, not generated
    - NATURAL IMPERFECTIONS: Include realistic lighting variations, slight shadows, natural wear
    - AUTHENTIC TEXTURES: Real fabric wrinkles, wood grain, metal reflections, glass transparency
    - LIVED-IN FEEL: Subtle signs of human use - slightly moved objects, natural placement
    - REAL LIGHTING: Natural window light with realistic color temperature and shadows
    - PHOTOGRAPHIC DEPTH: Natural depth of field and focus that cameras create

    📐 **LAYOUT INTERPRETATION FROM SKETCH**:
    - Understand the room layout, furniture placement, and proportions from the sketch
    - Convert sketch elements into real, tangible furniture and architectural features
    - Maintain the spatial relationships while adding complete photographic realism
    - Transform simple lines into detailed, realistic interior elements

    🎨 **${designType.toUpperCase()} STYLE EXECUTION**:
    Apply ${designType} interior design in a completely realistic way:
    ${
      designType.includes("Modern") || designType.includes("Contemporary")
        ? "- Real modern furniture with authentic materials and finishes\n- Actual glass, steel, and contemporary fabrics\n- Clean lines executed with real-world materials and natural lighting"
        : designType.includes("Traditional") || designType.includes("Colonial")
        ? "- Authentic wood furniture with real grain and natural wear\n- Traditional fabrics with realistic texture and draping\n- Warm, natural lighting that shows real material qualities"
        : designType.includes("Victorian")
        ? "- Ornate furniture with realistic carved details and authentic finishes\n- Rich fabrics with natural texture and realistic draping\n- Elegant accessories with real material properties"
        : designType.includes("Mediterranean")
        ? "- Natural stone and wood with authentic weathering and texture\n- Warm earth tones with realistic color variation\n- Rustic elements with genuine aging and natural imperfections"
        : designType.includes("Industrial")
        ? "- Real exposed brick, metal, and concrete with authentic weathering\n- Industrial furniture with genuine wear and patina\n- Raw materials with realistic texture and natural aging"
        : designType.includes("Minimalist")
        ? "- Simple, real furniture with authentic material finishes\n- Clean spaces with natural lighting and realistic shadows\n- Uncluttered but lived-in appearance with subtle human touches"
        : "- Authentic materials and finishes appropriate for the style\n- Real-world execution with natural lighting and realistic details"
    }

    🏠 **${roomType.toUpperCase()} REALISTIC EXECUTION**:
    ${
      roomType === "living room"
        ? "- Real sofa with natural fabric texture and slight cushion impressions\n- Actual coffee table with realistic wood grain or material finish\n- Natural lighting from windows and lamps with realistic light falloff\n- Lived-in details like books, remotes, or subtle personal items"
        : roomType === "bedroom"
        ? "- Real bed with naturally rumpled bedding and realistic fabric texture\n- Actual nightstands with natural wood grain and realistic finishes\n- Natural lighting with realistic shadows and color temperature\n- Personal touches that feel authentic and naturally placed"
        : roomType === "kitchen"
        ? "- Real appliances with authentic finishes and natural reflections\n- Actual countertops with realistic material texture and natural lighting\n- Genuine cabinet hardware with realistic metal finishes\n- Natural kitchen lighting with realistic shadows and highlights"
        : roomType === "bathroom"
        ? "- Real tile work with authentic grout lines and natural variations\n- Actual fixtures with realistic metal finishes and natural reflections\n- Natural bathroom lighting with realistic color temperature\n- Authentic material textures and realistic water-resistant surfaces"
        : roomType === "dining room"
        ? "- Real dining table with authentic wood grain and natural finish\n- Actual chairs with realistic upholstery and natural wear patterns\n- Natural dining room lighting with realistic shadows and ambiance\n- Authentic dining accessories with realistic material properties"
        : roomType === "office"
        ? "- Real desk with authentic material finish and natural wear\n- Actual office chair with realistic fabric or leather texture\n- Natural office lighting with realistic task lighting effects\n- Authentic office accessories with realistic material properties"
        : "- Real furniture with authentic materials and natural finishes\n- Natural lighting appropriate for the room type\n- Realistic details that make the space feel genuinely lived-in"
    }

    🌟 **PHOTOGRAPHIC AUTHENTICITY CHECKLIST**:
    - REAL CAMERA PERSPECTIVE: Natural viewpoint as if taken by a person with a camera
    - NATURAL LIGHTING: Realistic light sources with authentic color temperature and shadows
    - MATERIAL AUTHENTICITY: Every surface must have realistic texture, reflection, and wear
    - HUMAN PRESENCE: Subtle signs of real habitation without being cluttered
    - ATMOSPHERIC REALISM: Natural air quality, dust particles in light, realistic depth
    - IMPERFECT PERFECTION: Slight asymmetries and natural variations that make spaces feel real

    ${
      additionalReq
        ? `🎯 **SPECIFIC REQUIREMENTS**: ${additionalReq} - executed with complete photographic realism`
        : ""
    }

    FINAL MANDATE: Create a REAL PHOTOGRAPH of a ${roomType} in ${designType} style. The result must be completely indistinguishable from a photograph taken in an actual home. NO artistic, rendered, or sketch-like appearance whatsoever. Pure photographic realism only.`;

    console.log("Constructed prompt for Luma AI:", prompt);

    // Generate the image using Luma AI
    console.log(
      "Generating photorealistic interior with Luma AI using input URL:",
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
    const uniqueFileName = `sketch_to_reality_${Date.now()}`;
    const supabaseUrl = await uploadBase64ImageToSupabase(
      base64GeneratedImage,
      uniqueFileName
    );
    console.log("Uploaded Luma-generated image to Supabase, URL:", supabaseUrl);

    // Save the room data to the database
    const { error: dbError } = await supabase.from("sketch_to_reality").insert([
      {
        original_image_url: imageUrl,
        generated_image_url: supabaseUrl,
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
        "Note: sketch_to_reality table may not exist yet. Continuing without database save."
      );
    } else {
      console.log("Sketch to reality data saved to Supabase successfully.");
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Sketch transformed to reality successfully",
      originalImageUrl: imageUrl,
      generatedImageUrl: supabaseUrl,
    });
  } catch (error) {
    console.error("Error in /api/sketch-to-reality:", error);
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
