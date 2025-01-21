import { NextResponse } from "next/server";
import Replicate from "replicate";
import axios from "axios"; // Use Axios for fetching the image
import { supabase } from "@/lib/supabase"; // Import your Supabase client

// Define the Replicate API response type
interface ReplicateResponse {
  output?: string; // The generated image URL (optional)
}

const replicate = new Replicate({
  auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

// Separate function to convert an image URL to Base64
const convertImageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    // Fetch the image using Axios
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer", // Fetch the image as a binary buffer
    });

    // Convert the binary buffer to a Base64 string
    const base64Image = Buffer.from(response.data, "binary").toString("base64");

    // Determine the MIME type of the image (e.g., image/png, image/jpeg)
    const contentType = response.headers["content-type"];

    // Return the Base64 data URL
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    throw new Error("Failed to convert image to Base64");
  }
};

// Function to upload a Base64 image to Supabase Storage
const uploadBase64ImageToSupabase = async (base64Image: string, fileName: string) => {
  try {
    // Convert Base64 to a Blob
    const blob = await fetch(base64Image).then((res) => res.blob());

    // Upload the Blob to Supabase Storage
    const { data, error } = await supabase.storage
      .from("interior-images") // Your bucket name
      .upload(fileName, blob, {
        contentType: blob.type, // Set the content type (e.g., image/png)
      });

    if (error) {
      throw error;
    }

    // Get the public URL of the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("interior-images")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image to Supabase:", error);
    throw new Error("Failed to upload image to Supabase");
  }
};

export async function POST(req: Request) {
  try {
    // Parse the request body
    const { imageUrl, roomType, design, additionalRequirement } = await req.json();

    console.log("Received request with data:", {
      imageUrl,
      roomType,
      design,
      additionalRequirement,
    });

    // Validate the input
    if (!imageUrl || !roomType || !design) {
      return NextResponse.json(
        { error: "Missing required fields: imageUrl, roomType, or design" },
        { status: 400 }
      );
    }

    // Prepare the input for the Replicate API
    const input = {
      image: imageUrl,
      prompt: `A ${roomType} with a ${design} style interior design. ${additionalRequirement || ""}`,
    };

    console.log("Calling Replicate API with input:", input);

    // Call the Replicate API and cast the response to the defined type
    const output = (await replicate.run(
      "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
      { input }
    )) as ReplicateResponse;

    // const output =("https://kdpyeejozxawkdgemsjp.supabase.co/storage/v1/object/public/interior-images/generated-1737225634359.png") as ReplicateResponse;

    console.log("Replicate API response:", output); // Log the entire response


    // Extract the image URL from the Replicate API response
    let generatedImageUrl: string;

    if (typeof output === "string") {
      // If the response is a direct URL string
      generatedImageUrl = output;
    } else if (typeof output === "object" && output.output) {
      // If the response is an object with an "output" property
      generatedImageUrl = output.output;
    } else {
      throw new Error("Invalid response from Replicate API: Image URL not found");
    }

    console.log("Generated image URL from Replicate:", generatedImageUrl);

    // Convert the generated image URL to Base64
    const base64Image = await convertImageUrlToBase64(generatedImageUrl);
    console.log("Image converted to Base64 successfully");

    // Step 4: Upload the Base64 image to Supabase Storage
    const fileName = `generated-${Date.now()}.png`; // Generate a unique file name
    const publicUrl = await uploadBase64ImageToSupabase(base64Image, fileName);

    console.log("Image uploaded to Supabase. Public URL:", publicUrl);

    // Step 5: Save the room data to the Supabase database
    const { data: dbData, error: dbError } = await supabase
      .from("rooms")
      .insert([
        {
          image_url: publicUrl, // Match the column name in your schema
          room_type: roomType, // Match the column name in your schema
          design_type: design, // Match the column name in your schema
          additional_requirements: additionalRequirement, // Match the column name in your schema
        },
      ]);

    if (dbError) {
      console.error("Error saving room data to Supabase:", dbError);
      throw new Error("Failed to save room data to Supabase");
    }

    console.log("Room data saved to Supabase:", dbData);

    // Return the public URL of the uploaded image
    return NextResponse.json({ result: publicUrl });
  } catch (e) {
    console.error("Error in /api/redesign-room:", e);

    // Return a detailed error response
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}