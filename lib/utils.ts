import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const roomTypes = [
  {
    value: "Bedroom",
    label: "Bedroom",
    icon: "🛏️", // Changed from Bed component to emoji
  },
  {
    value: "Kitchen",
    label: "Kitchen",
    icon: "🍳", // Changed from CookingPot component to emoji
  },
  {
    value: "Bathroom",
    label: "Bath Room",
    icon: "🛁", // Changed from Bath component to emoji
  },

  {
    value: "Kids Room",
    label: "Kids Room",
    icon: "🧸", // Changed from Baby component to emoji
  },
  {
    value: "Living Room",
    label: "Living Room",
    icon: "🛋️", // Changed from Sofa component to emoji
  },
  {
    value: "Dining Room",
    label: "Dining Room",
    icon: "🍽️", // Changed from CupSoda component to emoji
  },
  {
    value: "Home Office",
    label: "Home Office",
    icon: "💼", // Changed from Briefcase component to emoji
  },
  {
    value: "Game Room",
    label: "Game Room",
    icon: "🎮", // Changed from Gamepad2 component to emoji
  },

  // Add other room types if needed
];
