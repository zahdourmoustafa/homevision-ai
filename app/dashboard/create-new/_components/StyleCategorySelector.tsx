import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface StyleCategory {
  id: string;
  label: string;
  image: string;
}

interface StyleCategorySelectorProps {
  categories: StyleCategory[];
  selectedStyles: string[];
  onStyleToggle: (styleId: string) => void;
}

export const StyleCategorySelector: React.FC<StyleCategorySelectorProps> = ({
  categories,
  selectedStyles,
  onStyleToggle,
}) => {
  return (
    <div className="w-[120px] h-full bg-gray-900 overflow-y-auto">
      <div className="py-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onStyleToggle(category.id)}
            className={cn(
              "w-full relative group overflow-hidden transition-all duration-200",
              selectedStyles.includes(category.id)
                ? "ring-2 ring-orange-500"
                : ""
            )}
          >
            <div className="relative h-[100px] w-full">
              <Image
                src={category.image}
                alt={category.label}
                fill
                className="object-cover"
                sizes="120px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2 left-0 right-0 text-white text-[10px] font-medium text-center px-1">
                {category.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleCategorySelector;
