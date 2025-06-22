import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { config } from '@/lib/config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const toCamelCase = (str: string) =>
  str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

export const convertObjectKeys = (
  obj: any,
  converter: (key: string) => string
): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertObjectKeys(item, converter));
  }

  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const convertedKey = converter(key);
    converted[convertedKey] = convertObjectKeys(value, converter);
  }
  return converted;
};

/**
 * Build full URL for media files (videos, thumbnails, etc.)
 * @param path - The relative path from the API base URL
 * @returns Full URL for the media file
 */
export function buildMediaUrl(path: string): string {
  if (!path) return '';
  
  // If it's already a full URL, return as-is
  if (isValidMediaUrl(path)) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Get base URL from environment or use default
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  // Build full URL
  return `${baseUrl}/${cleanPath}`;
}

export function buildMediaUrlWithCacheBuster(path: string, timestamp?: number): string {
  const baseUrl = buildMediaUrl(path);
  if (!baseUrl) return '';
  
  const cacheBuster = timestamp || Date.now();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${cacheBuster}`;
}

/**
 * Check if a URL is a valid media URL
 * @param url - The URL to check
 * @returns True if the URL is valid
 */
export function isValidMediaUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Extract filename from a URL or path
 * @param url - The URL or path
 * @returns The filename
 */
export function getFilenameFromUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const filename = pathname.split('/').pop();
    return filename || '';
  } catch {
    // If URL parsing fails, try to extract filename from path
    const parts = url.split('/');
    return parts[parts.length - 1] || '';
  }
}
