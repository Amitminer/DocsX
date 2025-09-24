//! AmitxD DocsX - Document Models
//! Copyright 2025 AmitxD
//!
//! This module defines the data models related to documents, including the main `Doc` struct,
//! request and response structs, and query parameters. These models are the blueprint
//! for our document data, ensuring consistency and type safety.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Represents a document in the system.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Doc {
    /// The unique identifier for the document.
    pub id: Uuid,
    /// The title of the document.
    pub title: String,
    /// A short description of the document.
    pub description: String,
    /// The main content of the document, typically in Markdown.
    pub content: String,
    /// The unique identifier of the author.
    pub author_id: String,
    /// The name of the author.
    pub author_name: Option<String>,
    /// The timestamp when the document was created.
    pub created_at: DateTime<Utc>,
    /// The number of likes the document has received.
    pub likes: i32,
    /// The number of views the document has received.
    pub views: i32,
    /// A list of tags associated with the document.
    pub tags: Vec<String>,
    /// A boolean indicating if the current user has liked the document.
    pub liked_by_current_user: bool,
}

/// Represents the request payload for creating a new document.
#[derive(Debug, Deserialize, Validate, Clone)]
pub struct CreateDocRequest {
    /// The title of the new document.
    #[validate(length(
        min = 1,
        max = 200,
        message = "Title must be between 1 and 200 characters"
    ))]
    pub title: String,

    /// A short description of the new document.
    #[validate(length(
        min = 1,
        max = 500,
        message = "Description must be between 1 and 500 characters"
    ))]
    pub description: String,

    /// The main content of the new document.
    #[validate(length(min = 1, message = "Content cannot be empty"))]
    pub content: String,

    /// A list of tags to associate with the new document.
    pub tags: Option<Vec<String>>,
}

/// Represents the request payload for updating an existing document.
#[derive(Debug, Deserialize, Validate, Clone)]
pub struct UpdateDocRequest {
    /// The new title of the document.
    #[validate(length(
        min = 1,
        max = 200,
        message = "Title must be between 1 and 200 characters"
    ))]
    pub title: Option<String>,

    /// The new description of the document.
    #[validate(length(
        min = 1,
        max = 500,
        message = "Description must be between 1 and 500 characters"
    ))]
    pub description: Option<String>,

    /// The new content of the document.
    #[validate(length(min = 1, message = "Content cannot be empty"))]
    pub content: Option<String>,

    /// The new list of tags for the document.
    pub tags: Option<Vec<String>>,
}

/// Represents the query parameters for retrieving a list of documents.
#[derive(Debug, Deserialize)]
pub struct DocsQuery {
    /// The page number to retrieve.
    pub page: Option<u32>,
    /// The number of documents to retrieve per page.
    pub limit: Option<u32>,
    /// The field to sort the documents by (`date` or `likes`).
    pub sort_by: Option<String>,
    /// The ID of the author to filter by.
    pub author: Option<String>,
    /// The name of the author to filter by.
    pub author_name: Option<String>,
    /// A search term to filter by.
    pub search: Option<String>,
    /// A list of tags to filter by.
    pub tags: Option<Vec<String>>,
}

/// Represents the response for a like operation.
#[derive(Debug, Serialize)]
pub struct LikesResponse {
    /// The unique identifier of the document.
    pub doc_id: Uuid,
    /// The new number of likes for the document.
    pub likes: i32,
    /// A message describing the result of the operation.
    pub message: String,
    /// A boolean indicating if the current user has liked the document.
    pub liked_by_current_user: bool,
}

impl DocsQuery {
    /// Returns the page number, defaulting to 1 if not provided.
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    /// Returns the limit, defaulting to 10 if not provided.
    pub fn limit(&self) -> u32 {
        self.limit.unwrap_or(10).clamp(1, 100)
    }

    /// Returns the offset for pagination.
    pub fn offset(&self) -> u32 {
        (self.page() - 1) * self.limit()
    }
}

/// Represents the response for a request to retrieve a list of documents.
#[derive(Debug, Serialize)]
pub struct DocsResponse {
    /// The list of documents.
    pub docs: Vec<Doc>,
    /// The total number of documents.
    pub total: i64,
    /// The current page number.
    pub page: u32,
    /// The number of documents per page.
    pub limit: u32,
    /// The total number of pages.
    pub total_pages: u32,
}
