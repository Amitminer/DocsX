//! AmitxD ProjectName(DocsX) - doc_asset
//! Copyright 2024 AmitxD
//!
//! This module defines the `DocAsset` model, which represents an asset associated with a document.
//! It's a simple struct, but it's the foundation of our asset management system.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents an asset associated with a document.
/// It's the digital equivalent of a paperclip, holding everything together.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocAsset {
    /// The unique identifier for the asset.
    pub id: Uuid,
    /// The unique identifier for the document the asset belongs to.
    pub doc_id: Uuid,
    /// The name of the file as it is stored on the server.
    pub filename: String,
    /// The original name of the file.
    pub original_name: String,
    /// The MIME type of the file.
    pub mime_type: String,
    /// The size of the file in bytes.
    pub size: i32,
    /// The date and time the asset was created.
    pub created_at: DateTime<Utc>,
}
