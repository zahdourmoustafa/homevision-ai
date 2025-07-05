export const downloadImage = async (
  imageUrl: string,
  originalFileName: string = "generated-image.jpg"
): Promise<void> => {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = originalFileName;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
};
