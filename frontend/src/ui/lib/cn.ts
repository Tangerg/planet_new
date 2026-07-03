import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind conflict resolution: `clsx` flattens
 * conditional/array inputs, `twMerge` dedupes conflicting Tailwind utilities
 * (later wins). The standard helper for authoring Tailwind + Base UI components.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
