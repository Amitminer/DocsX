/**
 * @file utils.ts
 * @description This module provides a collection of utility functions for common tasks,
 * including CSS class concatenation, date formatting, and local storage management for bookmarked documents.
 * It also defines a custom error class for API-related errors.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Concatenates and merges CSS class names.
 * This function combines `clsx` for conditional class joining and `tailwind-merge` for resolving Tailwind CSS conflicts.
 *
 * @param {ClassValue[]} inputs - An array of class values (strings, objects, arrays).
 * @returns {string} The merged and concatenated CSS class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string into a localized, human-readable format.
 *
 * @param {string} dateString - The date string to format (e.g., ISO 8601).
 * @param {string} [locale="en-US"] - The locale to use for formatting.
 * @param {Intl.DateTimeFormatOptions} [options={ year: "numeric", month: "short", day: "numeric" }] - Options for date formatting.
 * @returns {string} The formatted date string.
 */
export function formatDate(dateString: string, locale = "en-US", options = { year: "numeric", month: "short", day: "numeric" } as const) {
  return new Date(dateString).toLocaleDateString(locale, options)
}

/**
 * Retrieves an array of bookmarked document IDs from local storage.
 * Handles potential parsing errors and returns an empty array if no bookmarks are found or an error occurs.
 *
 * @returns {string[]} An array of bookmarked document IDs.
 */
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

/**
 * Custom error class for API-related errors.
 * Extends the native `Error` class to include `status` and `body` properties.
 */
export class ApiError extends Error {
  /** The HTTP status code of the API response. */
  status: number;
  /** The response body from the API. */
  body: unknown;

  /**
   * Creates an instance of `ApiError`.
   * @param {string} message - The error message.
   * @param {number} status - The HTTP status code.
   * @param {unknown} body - The response body.
   */
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}