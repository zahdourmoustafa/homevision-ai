import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const roomTypes = [
  { value: 'Bedroom', label: 'Bedroom', image: '/room.png' },
  { value: 'Living Room', label: 'Living Room', image: '/room.png' },
  { value: 'Kitchen', label: 'Kitchen', image: '/room.png' },
  { value: 'Bathroom', label: 'Bathroom', image: '/room.png' },
  { value: 'Office', label: 'Office', image: '/room.png' },
  { value: 'Dining Room', label: 'Dining Room', image: '/room.png' },
];
