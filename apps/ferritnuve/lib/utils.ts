import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a URL-friendly slug from a product name and ID
 * Handles Turkish characters and ensures uniqueness with ID suffix
 */
export function generateProductSlug(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  
  // Append a short version of the ID to ensure uniqueness
  const shortId = id.slice(-6);
  return `${slug}-${shortId}`;
}

/**
 * Extract the short ID from a product slug
 */
export function extractIdFromSlug(slug: string): string {
  const parts = slug.split("-");
  return parts[parts.length - 1];
}
