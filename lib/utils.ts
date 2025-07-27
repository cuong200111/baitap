import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Minimal utils for UI components
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
