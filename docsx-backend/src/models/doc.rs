use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Doc {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub content: String,
    pub author_id: String,
    pub author_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub likes: i32,
    pub views: i32,
    pub tags: Vec<String>,
    pub liked_by_current_user: bool,
}

#[derive(Debug, Deserialize, Validate, Clone)]
pub struct CreateDocRequest {
    #[validate(length(
        min = 1,
        max = 200,
        message = "Title must be between 1 and 200 characters"
    ))]
    pub title: String,

    #[validate(length(
        min = 1,
        max = 500,
        message = "Description must be between 1 and 500 characters"
    ))]
    pub description: String,

    #[validate(length(min = 1, message = "Content cannot be empty"))]
    pub content: String,

    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Validate, Clone)]
pub struct UpdateDocRequest {
    #[validate(length(
        min = 1,
        max = 200,
        message = "Title must be between 1 and 200 characters"
    ))]
    pub title: Option<String>,

    #[validate(length(
        min = 1,
        max = 500,
        message = "Description must be between 1 and 500 characters"
    ))]
    pub description: Option<String>,

    #[validate(length(min = 1, message = "Content cannot be empty"))]
    pub content: Option<String>,

    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct DocsQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
    pub sort_by: Option<String>, // "date" or "likes"
    pub author: Option<String>,
    pub author_name: Option<String>,
    pub search: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct LikesResponse {
    pub doc_id: Uuid,
    pub likes: i32,
    pub message: String,
    pub liked_by_current_user: bool,
}

impl DocsQuery {
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn limit(&self) -> u32 {
        self.limit.unwrap_or(10).clamp(1, 100)
    }

    pub fn offset(&self) -> u32 {
        (self.page() - 1) * self.limit()
    }
}

#[derive(Debug, Serialize)]
pub struct DocsResponse {
    pub docs: Vec<Doc>,
    pub total: i64,
    pub page: u32,
    pub limit: u32,
    pub total_pages: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocSlug {
    pub doc_id: Uuid,
    pub slug: String,
    pub created_at: DateTime<Utc>,
}
