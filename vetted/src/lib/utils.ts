import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds (60, 120, or 180)
 * @returns Formatted string like "1 min", "2 min", "3 min"
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min`;
}
