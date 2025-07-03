/**
 * @file docs.ts
 * @description This module defines the core interfaces for document data and API responses.
 * It provides a clear structure for how document information is represented and exchanged within the application.
 * @author AmitxD
 * @Copyright 2025
 */

/**
 * Represents a simplified document structure, typically used in lists or overviews.
 */
export interface Doc {
    /** The unique identifier of the document. */
    id: string;
    /** The title of the document. */
    title: string;
    /** A brief description of the document. */
    description: string;
    /** The unique identifier of the author. */
    author_id: string;
    /** The name of the author (optional). */
    author_name?: string;
    /** The creation timestamp of the document. */
    created_at: string;
    /** The number of likes the document has received. */
    likes: number;
  }
  
  /**
   * Represents the structure of a paginated response containing a list of documents.
   */
  export interface DocsResponse {
    /** An array of document objects. */
    docs: Doc[];
    /** The total number of documents available. */
    total: number;
    /** The current page number. */
    page: number;
    /** The maximum number of documents per page. */
    limit: number;
    /** The total number of pages available. */
    total_pages: number;
  }