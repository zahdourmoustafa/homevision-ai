import { NextResponse } from "next/server";
import Replicate from "replicate";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import sharp from "sharp";

type ReplicateResponse = string[] | string | { output?: string };

const replicate = new Replicate({
  auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

const convertImageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      maxRedirects: 5,
      headers: { 'Accept': 'image/webp,image/png,image/jpeg,image/*' }
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

const uploadBase64ImageToSupabase = async (base64Image: string, fileName: string): Promise<string> => {
  try {
    const [header, base64Data] = base64Image.split("base64,");
    const contentType = header.split(":")[1].split(";")[0];
    const buffer = Buffer.from(base64Data, "base64");
    const extension = contentType === "image/jpeg" ? ".jpg" : contentType === "image/png" ? ".png" : ".webp";
    const finalFileName = `${fileName}${extension}`;
    
    const { data, error } = await supabase.storage
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
    
    return publicUrlData?.publicUrl || "";
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    throw new Error("Failed to upload image to Supabase");
  }
};

export async function POST(req: Request) {
  try {
    const { imageUrl, roomType, design, additionalRequirement, userEmail } = await req.json();
    if (!userEmail || !imageUrl || !roomType || !design) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Processing image...");
    const processedImageBase64 = await convertImageUrlToBase64(imageUrl);

    console.log("Calling Replicate API...");
    const output = await replicate.run(
      "rossjillian/controlnet:795433b19458d0f4fa172a7ccf93178d2adb1cb8ab2ad6c8fdc33fdbcd49f477",
      { input: {
          structure: "depth",
          image: processedImageBase64,
          prompt: `Transform this sketch into a photorealistic ${design}-style ${roomType}, maintaining the layout and furniture positions. ${additionalRequirement || ""}`
        }
      }
    ) as any;
    
    let generatedImageUrl = typeof output === "string" ? output : Array.isArray(output) ? output[0] : output?.output;
    if (!generatedImageUrl) throw new Error("Invalid Replicate API response");

    console.log("Uploading to Supabase...");
    const publicUrl = await uploadBase64ImageToSupabase(await convertImageUrlToBase64(generatedImageUrl), `sketch-converted-${Date.now()}`);
    if (!publicUrl) throw new Error("Failed to get public URL");
    
    await supabase.from("rooms").insert([{ image_url: imageUrl, transformed_image_url: publicUrl, room_type: roomType, design_type: design, additional_requirements: additionalRequirement, user_email: userEmail }]);
    
    return NextResponse.json({ result: { original: imageUrl, generated: publicUrl } });
  } catch (e) {
    console.error("Error in /api/sketch-to-real:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "An unknown error occurred" }, { status: 500 });
  }
}
