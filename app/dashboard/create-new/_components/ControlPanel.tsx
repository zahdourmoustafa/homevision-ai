import React, { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { roomTypes } from "@/lib/utils";
import GeneratedResultsGrid from "./GeneratedResultsGrid";
import { GeneratedResult } from "./hooks/useImageGeneration";
import LoadingSpinner from "../../_components/LoadingSpinner";

// Import accordion components normally (they're small)
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Lazy load heavy components
const Textarea = lazy(() =>
  import("@/components/ui/textarea").then((module) => ({
    default: module.Textarea,
  }))
);

interface ControlPanelProps {
  // Room settings
  roomType: string;
  onRoomTypeChange: (type: string) => void;

  // Additional requirements
  additionalReq: string;
  onAdditionalReqChange: (req: string) => void;

  // Furniture removal
  removeFurniture: boolean;
  onRemoveFurnitureToggle: () => void;

  // Generated results
  generatedResults: GeneratedResult[];
  onImageModalOpen: (result: GeneratedResult) => void;
  onSliderModalOpen: (result: GeneratedResult) => void;
  onDownloadImage: (imageUrl: string) => void;

  // Generation
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  roomType,
  onRoomTypeChange,
  additionalReq,
  onAdditionalReqChange,
  removeFurniture,
  onRemoveFurnitureToggle,
  generatedResults,
  onImageModalOpen,
  onSliderModalOpen,
  onDownloadImage,
  onGenerate,
  isGenerating,
  canGenerate,
}) => {
  return (
    <div className="w-[350px] bg-white border-l flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Remove Furniture Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Remove furniture?</span>
          <button
            onClick={onRemoveFurnitureToggle}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              removeFurniture
                ? "bg-orange-500 text-white"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {removeFurniture ? "Erase ✓" : "Erase"}
          </button>
        </div>

        {/* Room Type Selection */}
        <Accordion type="single" collapsible defaultValue="room-type">
          <AccordionItem value="room-type" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium">
              Select Room Type
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-4 gap-3 py-3">
                {roomTypes.map((room) => (
                  <button
                    key={room.value}
                    onClick={() => onRoomTypeChange(room.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                      roomType === room.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                    <span className="text-xs">{room.label}</span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Additional Requirements */}
        <Accordion type="single" collapsible>
          <AccordionItem
            value="additional-requirements"
            className="border rounded-lg px-4"
          >
            <AccordionTrigger className="text-sm font-medium">
              Additional Requirements (Optional)
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-3 space-y-2">
                <Suspense fallback={<LoadingSpinner />}>
                  <Textarea
                    placeholder="E.g., add a cozy reading nook, use gold accents."
                    className="resize-none h-20 text-sm"
                    value={additionalReq}
                    onChange={(e) => onAdditionalReqChange(e.target.value)}
                  />
                </Suspense>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Generated Results */}
        <GeneratedResultsGrid
          results={generatedResults}
          onImageModalOpen={onImageModalOpen}
          onSliderModalOpen={onSliderModalOpen}
          onDownloadImage={onDownloadImage}
        />
      </div>

      {/* Generate Button - Fixed at bottom */}
      <div className="p-6 pt-4 border-t bg-white">
        <Button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-medium rounded-lg"
        >
          {isGenerating ? "Generating..." : "Generate"}
        </Button>
      </div>
    </div>
  );
};

export default ControlPanel;
