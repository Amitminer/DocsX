import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string, locale = "en-US", options = { year: "numeric", month: "short", day: "numeric" } as const) {
  return new Date(dateString).toLocaleDateString(locale, options)
}

export function getBookmarkedDocIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const bookmarked = localStorage.getItem("bookmarkedDocs");
    return bookmarked ? JSON.parse(bookmarked) : [];
  } catch (e) {
    console.error("Failed to parse bookmarked docs from localStorage", e);
    return [];
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

