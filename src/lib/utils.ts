/**
 * @file Shared utility functions used across components.
 *
 * @description
 * Contains the `cn()` helper for conditional Tailwind CSS class merging.
 * This is the standard utility pattern from shadcn/ui: `clsx` handles
 * conditional class concatenation, and `tailwind-merge` intelligently
 * resolves conflicting Tailwind classes (e.g. `p-2 p-4` → `p-4`).
 *
 * @consumers Every UI component in `components/ui/` and most route pages.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges CSS class names with Tailwind conflict resolution.
 *
 * Accepts any combination of strings, arrays, objects, and falsy values
 * (the full `clsx` API). Later classes override earlier conflicting ones
 * per Tailwind's utility structure.
 *
 * @example cn("px-4 py-2", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
