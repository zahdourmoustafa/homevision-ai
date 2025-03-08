import { NextResponse } from "next/server";
import Replicate from "replicate";
import axios from "axios"; // Use Axios for fetching the image
import { supabase } from "@/lib/supabase"; // Import your Supabase client
import sharp from 'sharp';

// Define the Replicate API response type
type ReplicateResponse = string[] | string | { output?: string };

const replicate = new Replicate({
  auth: process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN,
});

// Separate function to convert an image URL to Base64
const convertImageUrlToBase64 = async (imageUrl: string): Promise<string> => {
  try {
    // Add timeout and retry logic for reliability
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000, // 15 second timeout
      maxRedirects: 5,
      headers: {
        'Accept': 'image/webp,image/png,image/jpeg,image/*',
      }
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
      throw new Error(`Failed to fetch image: ${error.response.status} ${error.response.statusText}`);
    }
    throw new Error("Failed to convert image to Base64");
  }
};

// Add new function to validate and preprocess image
const preprocessImage = async (imageUrl: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    // Process image with sharp
    const processedBuffer = await sharp(response.data)
      .resize(1024, 1024, { // Resize to model's expected dimensions
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat('jpeg', { quality: 90 }) // Convert to JPEG
      .toBuffer();

    // Convert processed image to Base64
    const base64Image = processedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
  } catch (error) {
    console.error('Error preprocessing image:', error);
    throw new Error('Failed to preprocess image');
  }
};

// Function to upload a Base64 image to Supabase Storage
const uploadBase64ImageToSupabase = async (base64Image: string, fileName: string) => {
  try {
    // Remove the data URL prefix and get content type
    const [header, base64Data] = base64Image.split('base64,');
    const contentType = header.split(':')[1].split(';')[0];

    // Convert Base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Ensure the filename has the correct extension based on content type
    const getExtension = (contentType: string) => {
      switch (contentType) {
        case 'image/webp': return '.webp';
        case 'image/png': return '.png';
        case 'image/jpeg': return '.jpg';
        default: return '.png';
      }
    };

    const extension = getExtension(contentType);
    const finalFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;

    // Upload the buffer to Supabase Storage
    const { data, error } = await supabase.storage
      .from('interior-images')
      .upload(`generated/${finalFileName}`, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      throw error;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('interior-images')
      .getPublicUrl(`generated/${finalFileName}`);

    if (!publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const { imageUrl, roomType, design, additionalRequirement, userEmail } = await req.json();

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
      if (!imageUrl) missingFields.push('imageUrl');
      if (!roomType) missingFields.push('roomType');
      if (!design) missingFields.push('design');
      
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Preprocess the image
    console.log("Preprocessing image...");
    const processedImageBase64 = await preprocessImage(imageUrl);

    // Prepare the input for the Replicate API
    const input = {
      image: processedImageBase64,
      prompt: `Transform this ${roomType} into a stunning ${design} style interior. Create a photorealistic, high-quality interior design with professional lighting, proper scale and proportions. Include ${design}-specific design elements, materials, and furniture that are cohesive with the style. Ensure natural-looking textures, shadows, and reflections. ${additionalRequirement ? `Additionally, incorporate the following requirements: ${additionalRequirement}.` : ''} Maintain architectural integrity and create an inviting, livable space.`,
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

    if (Array.isArray(output) && output.length > 0) {
      // If the response is an array of URLs, take the first one
      generatedImageUrl = output[0];
    } else if (typeof output === "string") {
      // If the response is a direct URL string
      generatedImageUrl = output;
    } else if (typeof output === "object" && output && 'output' in output && output.output) {
      // If the response is an object with an "output" property
      generatedImageUrl = output.output;
    } else {
      throw new Error("Invalid response from Replicate API: Image URL not found");
    }

    console.log("Generated image URL from Replicate:", generatedImageUrl);

    // Convert the generated image URL to Base64
    let base64Image;
    try {
      base64Image = await convertImageUrlToBase64(generatedImageUrl);
      console.log('Image converted to Base64 successfully');
    } catch (error) {
      console.error('Error converting image to Base64:', error);
      return NextResponse.json({ error: 'Failed to process generated image' }, { status: 500 });
    }

    // Upload to Supabase Storage with proper error handling
    let publicUrl;
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      publicUrl = await uploadBase64ImageToSupabase(base64Image, fileName);
      console.log('Image uploaded to Supabase. Public URL:', publicUrl);
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      return NextResponse.json({ error: 'Failed to upload generated image' }, { status: 500 });
    }

    // Save to database with additional error handling
    try {
      const { error: dbError } = await supabase
        .from('rooms')
        .insert([
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
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save room data' }, { status: 500 });
    }

    // Return success response with both URLs
    return NextResponse.json({ 
      result: {
        original: imageUrl,
        generated: publicUrl
      }
    });

  } catch (e) {
    console.error('Error in /api/redesign-room:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
