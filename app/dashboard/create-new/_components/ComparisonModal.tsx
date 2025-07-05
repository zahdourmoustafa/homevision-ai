import React, { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { GeneratedResult } from "./hooks/useImageGeneration";
import LoadingSpinner from "../../_components/LoadingSpinner";

// Import dialog components normally (they're small)
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Lazy load the heavy component
const BeforeAfterSliderComponent = lazy(() => import("./BeforeAfterSlider"));

interface ComparisonModalProps {
  result: GeneratedResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  result,
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] w-full h-[70vh] md:h-[80vh] p-0 flex flex-col">
        <DialogTitle className="sr-only">Image Comparison</DialogTitle>
        {result && (
          <div className="flex-grow relative">
            <Suspense fallback={<LoadingSpinner />}>
              <BeforeAfterSliderComponent
                beforeImage={result.rawImage}
                afterImage={result.generatedImage}
              />
            </Suspense>
          </div>
        )}
        <Button onClick={onClose} className="m-4 mt-0">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ComparisonModal;
