import { useState, useCallback } from "react";
import { GeneratedResult } from "./useImageGeneration";

export const useImageModal = () => {
  const [modalImageResult, setModalImageResult] =
    useState<GeneratedResult | null>(null);
  const [activeSlider, setActiveSlider] = useState<GeneratedResult | null>(
    null
  );

  const openImageModal = useCallback((result: GeneratedResult) => {
    setModalImageResult(result);
  }, []);

  const closeImageModal = useCallback(() => {
    setModalImageResult(null);
  }, []);

  const openSliderModal = useCallback((result: GeneratedResult) => {
    setActiveSlider(result);
  }, []);

  const closeSliderModal = useCallback(() => {
    setActiveSlider(null);
  }, []);

  return {
    modalImageResult,
    activeSlider,
    openImageModal,
    closeImageModal,
    openSliderModal,
    closeSliderModal,
  };
};
