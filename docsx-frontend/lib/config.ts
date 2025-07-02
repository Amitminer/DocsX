/**
 * @file config.ts
 * @description This module defines the global configuration settings for the DocsX frontend application.
 * It includes API base URLs and pagination settings.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

/**
 * Global configuration object for the DocsX frontend application.
 * This object contains various settings that are used throughout the application,
 * such as API endpoints and pagination parameters.
 */
export const config = {
  /**
   * The base URL for the backend API.
   * Defaults to `http://localhost:8080/api` if `NEXT_PUBLIC_API_BASE_URL` environment variable is not set.
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api",

  /**
   * Pagination settings for document lists.
   */
  pagination: {
    /** The default number of items to display per page. */
    defaultLimit: 12,
    /** The maximum number of items that can be displayed per page. */
    maxLimit: 50,
  },
} as const