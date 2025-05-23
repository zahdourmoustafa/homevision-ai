import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Get URL parameters
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "download.jpg";

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the image
    const response = await fetch(url, {
      headers: {
        Accept: "image/jpeg, image/png, image/*",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get the image data as blob
    const imageBlob = await response.blob();

    // Create a response with the image data
    const imageResponse = new NextResponse(imageBlob);

    // Set the appropriate headers for download
    imageResponse.headers.set("Content-Type", imageBlob.type || "image/jpeg");
    imageResponse.headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    imageResponse.headers.set("Cache-Control", "no-cache");

    return imageResponse;
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download image" },
      { status: 500 }
    );
  }
}
