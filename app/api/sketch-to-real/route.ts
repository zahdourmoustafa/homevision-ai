import { NextResponse } from "next/server";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import sharp from "sharp";

// Define Luma API response type (assuming similar structure)
type LumaApiResponse = {
  success: boolean;
  asset_id?: string;
  image_url?: string;
  error?: string;
};

const convertImageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxRedirects: 5,
      headers: { Accept: "image/webp,image/png,image/jpeg,image/*" },
    });

    const processedBuffer = await sharp(response.data)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .toFormat("jpeg", { quality: 90 })
      .toBuffer();

    const base64Image = processedBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    throw new Error("Failed to convert image to Base64");
  }
};

const uploadBase64ImageToSupabase = async (
  base64Image: string,
  fileName: string
): Promise<string> => {
  try {
    const [header, base64Data] = base64Image.split("base64,");
    const contentType = header.split(":")[1].split(";")[0];
    const buffer = Buffer.from(base64Data, "base64");
    const extension =
      contentType === "image/jpeg"
        ? ".jpg"
        : contentType === "image/png"
        ? ".png"
        : ".webp";
    const finalFileName = `${fileName}${extension}`;

    const { error } = await supabase.storage
      .from("interior-images")
      .upload(`generated/${finalFileName}`, buffer, {
        contentType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("interior-images")
      .getPublicUrl(`generated/${finalFileName}`);

    if (!publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    throw new Error("Failed to upload image to Supabase");
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
    }: {
      imageUrl: string;
      roomType: string;
      design: string;
      additionalRequirement?: string;
      userEmail: string;
    } = await req.json();
    if (!userEmail || !imageUrl || !roomType || !design) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("Processing image...");
    const processedImageBase64 = await convertImageUrlToBase64(imageUrl);

    // Prepare the prompt for Luma AI
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

    console.log("Calling Luma AI API with prompt:", prompt);

    // Call the Luma AI API
    const lumaApiUrl =
      "https://api.lumalabs.ai/dream-machine/v1/generations/image"; // Corrected Luma API endpoint
    const lumaApiKey = process.env.LUMA_API_KEY;

    if (!lumaApiKey) {
      throw new Error("LUMA_API_KEY is not set in environment variables.");
    }

    const lumaRequestBody = {
      prompt: prompt,
      aspect_ratio: "16:9", // Or other appropriate aspect ratio
      // Using image_ref as per Luma API docs for guiding generation with an image
      // Assuming processedImageBase64 (data URL) works. If not, it needs to be a CDN URL.
      image_ref: [
        {
          url: processedImageBase64,
          weight: 0.75, // Default weight, can be adjusted. For sketch-to-real, this might need to be higher or use "modify_image_ref"
        },
      ],
      // model_version: "photon-1", // Or "photon-flash-1"
    };

    console.log("Calling Luma AI API with request body:", lumaRequestBody);

    const lumaResponse = await axios.post<LumaApiResponse[]>( // Assuming Luma API returns an array initially, but Luma docs suggest single object for image gen
      lumaApiUrl,
      lumaRequestBody,
      {
        headers: {
          Authorization: `Bearer ${lumaApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Luma AI API response:", lumaResponse.data);

    // Extract the image URL from the Luma AI API response
    let generatedImageUrlFromOutput: string | undefined;
    if (
      lumaResponse.data &&
      Array.isArray(lumaResponse.data) && // Luma API might return a single object for image generation
      lumaResponse.data.length > 0
    ) {
      const resultData = lumaResponse.data[0]; // Assuming the first element if it's an array

      if (resultData.success !== undefined) {
        // Old assumed structure
        if (resultData.success && resultData.image_url) {
          generatedImageUrlFromOutput = resultData.image_url;
        } else if (resultData.error) {
          throw new Error(`Luma AI API error: ${resultData.error}`);
        }
      } else if (
        (resultData as any).assets &&
        (resultData as any).assets.image
      ) {
        // New structure based on docs
        generatedImageUrlFromOutput = (resultData as any).assets.image;
      } else if (resultData.error) {
        throw new Error(`Luma AI API error: ${resultData.error}`);
      }
    } else if (
      lumaResponse.data &&
      (lumaResponse.data as any).assets &&
      (lumaResponse.data as any).assets.image
    ) {
      // Handling if the response is a single object directly
      generatedImageUrlFromOutput = (lumaResponse.data as any).assets.image;
    } else if (lumaResponse.data && (lumaResponse.data as any).error) {
      throw new Error(`Luma AI API error: ${(lumaResponse.data as any).error}`);
    }

    if (!generatedImageUrlFromOutput) {
      throw new Error(
        "Invalid response from Luma AI API: Image URL not found or error occurred"
      );
    }

    console.log("Uploading to Supabase...");
    const publicUrl = await uploadBase64ImageToSupabase(
      await convertImageUrlToBase64(generatedImageUrlFromOutput),
      `sketch-converted-${Date.now()}`
    );
    if (!publicUrl) throw new Error("Failed to get public URL");

    const { error: dbError } = await supabase.from("rooms").insert([
      {
        image_url: imageUrl,
        transformed_image_url: publicUrl,
        room_type: roomType,
        design_type: design,
        additional_requirements: additionalRequirement,
        user_email: userEmail,
      },
    ]);
    if (dbError) {
      console.error("Database insert error:", dbError);
      throw new Error("Failed to save room data to database");
    }

    return NextResponse.json({
      result: { original: imageUrl, generated: publicUrl },
    });
  } catch (e) {
    console.error("Error in /api/sketch-to-real:", e);
    let message = "An unknown error occurred";
    if (e instanceof Error) {
      message = e.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
