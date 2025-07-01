use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocAsset {
    pub id: Uuid,
    pub doc_id: Uuid,
    pub filename: String,
    pub original_name: String,
    pub mime_type: String,
    pub size: i32,
    pub created_at: DateTime<Utc>,
} 