import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface FileState {
  selectedFile: File | null;
  preview: string | null;
}

export const useFileHandling = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB");
      return false;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return false;
    }

    return true;
  }, []);

  const handleFileSelection = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [validateFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelection(file);
      }
    },
    [handleFileSelection]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelection(file);
      }
    },
    [handleFileSelection]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
  }, []);

  return {
    selectedFile,
    preview,
    handleFileInputChange,
    handleDrop,
    handleDragOver,
    clearFile,
    handleFileSelection,
  };
};
