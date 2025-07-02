//! AmitxD ProjectName(DocsX) - asset_handler
//! Copyright 2024 AmitxD
//!
//! This module handles all the business logic for asset management.
//! From uploading, listing, serving, and deleting assets, this module has it all.
//! It's the backbone of our asset management system, ensuring that all assets are handled with care.

use crate::{
    auth::middleware::extract_user_from_request,
    db::postgres::DbPool,
    handlers::doc_handler::{verify_author_or_admin, DocHandler},
    models::doc_asset::DocAsset,
    utils::error::{AppError, AppResult},
};
use actix_files::NamedFile;
use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse};
use futures_util::stream::TryStreamExt;
use log;
use sanitize_filename::sanitize;
use serde_json::json;
use std::{
    collections::HashMap,
    env,
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
};
use uuid::Uuid;

/// The maximum file size for videos, set to 50MB.
const MAX_FILE_SIZE: usize = 50 * 1024 * 1024; // 50 MB for videos
/// The maximum file size for images, set to 10MB.
const MAX_IMAGE_SIZE: usize = 10 * 1024 * 1024; // 10 MB for images
/// The maximum file size for documents, set to 25MB.
const MAX_DOCUMENT_SIZE: usize = 25 * 1024 * 1024; // 25 MB for documents

/// A struct that holds the allowed MIME types for different asset categories.
/// It's like a bouncer for our files, only letting the cool kids in.
struct AllowedMimeTypes {
    /// A list of allowed image MIME types.
    pub image: &'static [&'static str],
    /// A list of allowed video MIME types.
    pub video: &'static [&'static str],
    /// A list of allowed document MIME types.
    pub document: &'static [&'static str],
    /// A list of allowed archive MIME types.
    pub archive: &'static [&'static str],
}

/// A constant that holds the allowed MIME types for different asset categories.
/// This is where we define what files are allowed to be uploaded.
const ALLOWED_MIME_TYPES: AllowedMimeTypes = AllowedMimeTypes {
    image: &[
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/bmp",
        "image/tiff",
    ],
    video: &[
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/avi",
        "video/mov",
        "video/quicktime",
        "video/x-msvideo",
        "video/3gpp",
        "video/x-ms-wmv",
    ],
    document: &[
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
        "application/rtf",
        "application/postscript", // .xd can be this
    ],
    archive: &[
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
        "application/gzip",
        "application/x-tar",
    ],
};

/// An enum that represents the different categories of assets.
/// It's like a filing cabinet for our files, keeping everything organized.
#[derive(Debug, Clone)]
enum AssetCategory {
    /// The image asset category.
    Image,
    /// The video asset category.
    Video,
    /// The document asset category.
    Document,
    /// The archive asset category.
    Archive,
}

impl AssetCategory {
    /// Creates an `AssetCategory` from a MIME type.
    ///
    /// # Arguments
    ///
    /// * `mime_type` - The MIME type to convert.
    ///
    /// # Returns
    ///
    /// An `Option` containing the `AssetCategory` if the MIME type is supported, or `None` otherwise.
    fn from_mime_type(mime_type: &str) -> Option<Self> {
        if ALLOWED_MIME_TYPES.image.contains(&mime_type) {
            Some(AssetCategory::Image)
        } else if ALLOWED_MIME_TYPES.video.contains(&mime_type) {
            Some(AssetCategory::Video)
        } else if ALLOWED_MIME_TYPES.document.contains(&mime_type) {
            Some(AssetCategory::Document)
        } else if ALLOWED_MIME_TYPES.archive.contains(&mime_type) {
            Some(AssetCategory::Archive)
        } else {
            None
        }
    }

    /// Gets the maximum file size for the asset category.
    ///
    /// # Returns
    ///
    /// The maximum file size in bytes.
    fn get_max_size(&self) -> usize {
        match self {
            AssetCategory::Image => MAX_IMAGE_SIZE,
            AssetCategory::Video => MAX_FILE_SIZE,
            AssetCategory::Document => MAX_DOCUMENT_SIZE,
            AssetCategory::Archive => MAX_DOCUMENT_SIZE,
        }
    }
}

/// Checks if a MIME type is allowed.
///
/// # Arguments
///
/// * `mime_type` - The MIME type to check.
///
/// # Returns
///
/// `true` if the MIME type is allowed, `false` otherwise.
fn is_mime_type_allowed(mime_type: &str) -> bool {
    ALLOWED_MIME_TYPES.image.contains(&mime_type)
        || ALLOWED_MIME_TYPES.video.contains(&mime_type)
        || ALLOWED_MIME_TYPES.document.contains(&mime_type)
        || ALLOWED_MIME_TYPES.archive.contains(&mime_type)
}

/// Generates a Markdown string for an asset.
///
/// # Arguments
///
/// * `asset` - The asset to generate the Markdown for.
/// * `asset_url` - The URL of the asset.
///
/// # Returns
///
/// A Markdown string that represents the asset.
fn generate_markdown_for_asset(asset: &DocAsset, asset_url: &str) -> String {
    let category = AssetCategory::from_mime_type(&asset.mime_type);
    let alt_text = std::path::Path::new(&asset.original_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("");

    match category {
        Some(AssetCategory::Image) => {
            format!("![{}]({})", alt_text, asset_url)
        }
        Some(AssetCategory::Video) => {
            format!(
                r#"<video controls width="100%" style="max-width: 800px;">
  <source src="{}" type="{}">
  Your browser does not support the video tag.
  <a href="{}">{}</a>
</video>"#,
                asset_url, asset.mime_type, asset_url, asset.original_name
            )
        }
        Some(AssetCategory::Document) | Some(AssetCategory::Archive) => {
            format!("[{}]({})", asset.original_name, asset_url)
        }
        None => {
            format!("[{}]({})", asset.original_name, asset_url)
        }
    }
}

/// Uploads an asset for a document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `req` - The HTTP request.
/// * `payload` - The multipart payload containing the file.
///
/// # Returns
///
/// An `AppResult` containing the HTTP response.
pub async fn upload_asset(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    mut payload: Multipart,
) -> AppResult<HttpResponse> {
    let user_info = extract_user_from_request(&req)?;
    let doc_id_str = req
        .match_info()
        .get("doc_id")
        .ok_or_else(|| AppError::Validation("doc_id is required".to_string()))?;
    let doc_id = Uuid::parse_str(doc_id_str)?;

    // 1. Verify user is the author of the doc
    let doc = DocHandler::get_doc_by_id(&pool, doc_id, None).await?;
    verify_author_or_admin(&doc, &user_info.user_id, user_info.username.as_deref())?;

    let storage_path = env::var("STORAGE_PATH").unwrap_or_else(|_| "/app/storage".to_string());
    let doc_assets_path = Path::new(&storage_path)
        .join("docs")
        .join(doc_id.to_string())
        .join("assets");
    fs::create_dir_all(&doc_assets_path)?;

    if let Some(mut field) = payload.try_next().await? {
        let content_disposition = field.content_disposition().clone();
        let mime_type = field
            .content_type()
            .map(|ct| ct.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        let original_name = content_disposition
            .get_filename()
            .ok_or_else(|| AppError::Validation("Filename not provided".to_string()))?
            .to_string();

        // Validate MIME type early
        if !is_mime_type_allowed(&mime_type) {
            return Err(AppError::Validation(format!(
                "MIME type {} is not allowed",
                mime_type
            )));
        }

        let category = AssetCategory::from_mime_type(&mime_type)
            .ok_or_else(|| AppError::Validation("Unsupported file type".to_string()))?;

        // 2. Sanitize and prepare filename
        let sanitized_name = sanitize(&original_name);
        let file_ext = Path::new(&sanitized_name)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("");
        let file_stem = Path::new(&sanitized_name)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or(&sanitized_name);

        // Find a unique filename: sample.png, sample (1).png, sample (2).png, ...
        log::info!("Checking for duplicate filenames for: {}", sanitized_name);
        let mut final_filename = if file_ext.is_empty() {
            file_stem.to_string()
        } else {
            format!("{}.{}", file_stem, file_ext)
        };
        let mut counter = 1;
        while doc_assets_path.join(&final_filename).exists() {
            log::info!("Filename exists: {}. Trying next...", final_filename);
            if file_ext.is_empty() {
                final_filename = format!("{} ({})", file_stem, counter);
            } else {
                final_filename = format!("{} ({}).{}", file_stem, counter, file_ext);
            }
            counter += 1;
        }
        log::info!("Final filename chosen: {}", final_filename);

        let file_path = doc_assets_path.join(&final_filename);
        let max_size = category.get_max_size();

        // 3. Stream and save file
        let mut file = File::create(&file_path)?;
        let mut file_size = 0;
        while let Some(chunk) = field.try_next().await? {
            file_size += chunk.len();
            if file_size > max_size {
                fs::remove_file(&file_path)?;
                return Err(AppError::Validation(format!(
                    "File size exceeds {}MB limit for {:?} files",
                    max_size / 1024 / 1024,
                    category
                )));
            }
            file.write_all(&chunk)?;
        }

        // 4. Save to database
        let client = pool.get().await?;
        let statement = "INSERT INTO doc_assets (doc_id, filename, original_name, mime_type, size) VALUES ($1, $2, $3, $4, $5) RETURNING *";
        let row = client
            .query_one(
                statement,
                &[
                    &doc_id,
                    &final_filename,
                    &original_name,
                    &mime_type,
                    &(file_size as i32),
                ],
            )
            .await?;

        let asset: DocAsset = DocAsset {
            id: row.get("id"),
            doc_id: row.get("doc_id"),
            filename: row.get("filename"),
            original_name: row.get("original_name"),
            mime_type: row.get("mime_type"),
            size: row.get("size"),
            created_at: row.get("created_at"),
        };

        let asset_url = format!("/assets/{}/{}", asset.doc_id, asset.filename);
        let markdown = generate_markdown_for_asset(&asset, &asset_url);

        let response_data = json!({
            "id": asset.id,
            "doc_id": asset.doc_id,
            "url": asset_url,
            "filename": asset.filename,
            "original_name": asset.original_name,
            "mime_type": asset.mime_type,
            "size": asset.size,
            "markdown": markdown,
            "created_at": asset.created_at,
            "category": format!("{:?}", category),
        });

        Ok(HttpResponse::Ok().json(response_data))
    } else {
        Err(AppError::Validation("No file was uploaded".to_string()))
    }
}

/// Lists all assets for a document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `req` - The HTTP request.
///
/// # Returns
///
/// An `AppResult` containing the HTTP response.
pub async fn list_assets(pool: web::Data<DbPool>, req: HttpRequest) -> AppResult<HttpResponse> {
    let user_info = extract_user_from_request(&req)?;
    let doc_id_str = req
        .match_info()
        .get("doc_id")
        .ok_or_else(|| AppError::Validation("doc_id is required".to_string()))?;
    let doc_id = Uuid::parse_str(doc_id_str)?;

    // Check if client wants enhanced response (backward compatibility)
    let query_string = req.query_string();
    let include_categories = query_string.contains("include_categories=true");
    let include_summary = query_string.contains("include_summary=true");

    // Verify user is the author of the doc
    let doc = DocHandler::get_doc_by_id(&pool, doc_id, None).await?;
    verify_author_or_admin(&doc, &user_info.user_id, user_info.username.as_deref())?;

    let client = pool.get().await?;
    let rows = client
        .query(
            "SELECT * FROM doc_assets WHERE doc_id = $1 ORDER BY created_at DESC",
            &[&doc_id],
        )
        .await?;

    let mut assets_by_category: HashMap<String, Vec<serde_json::Value>> = HashMap::new();
    let mut all_assets = Vec::new();

    for row in rows {
        let asset = DocAsset {
            id: row.get("id"),
            doc_id: row.get("doc_id"),
            filename: row.get("filename"),
            original_name: row.get("original_name"),
            mime_type: row.get("mime_type"),
            size: row.get("size"),
            created_at: row.get("created_at"),
        };

        let asset_url = format!("/assets/{}/{}", asset.doc_id, asset.filename);
        let markdown = generate_markdown_for_asset(&asset, &asset_url);
        let category = AssetCategory::from_mime_type(&asset.mime_type)
            .map(|c| format!("{:?}", c))
            .unwrap_or_else(|| "Unknown".to_string());

        let mut asset_json = json!({
            "id": asset.id,
            "doc_id": asset.doc_id,
            "url": asset_url,
            "filename": asset.filename,
            "original_name": asset.original_name,
            "mime_type": asset.mime_type,
            "size": asset.size,
            "markdown": markdown,
            "created_at": asset.created_at,
        });

        // Add category only if requested (maintains backward compatibility)
        if include_categories || include_summary {
            asset_json["category"] = json!(category);
        }

        // Add to category grouping if needed
        if include_categories {
            assets_by_category
                .entry(category.clone())
                .or_default()
                .push(asset_json.clone());
        }

        // Add to main list
        all_assets.push(asset_json);
    }

    // Build response based on what client requested
    let mut response = json!({ "assets": all_assets });

    if include_categories {
        response["assets_by_category"] = json!(assets_by_category);
    }

    if include_summary {
        response["summary"] = json!({
            "total": all_assets.len(),
            "by_category": assets_by_category.iter().map(|(k, v)| (k, v.len())).collect::<HashMap<_, _>>()
        });
    }

    Ok(HttpResponse::Ok().json(response))
}

/// Serves an asset file.
///
/// # Arguments
///
/// * `path` - The path to the asset file.
///
/// # Returns
///
/// An `AppResult` containing the `NamedFile`.
pub async fn serve_asset(path: web::Path<(String, String)>) -> AppResult<NamedFile> {
    let (doc_id_str, filename) = path.into_inner();

    if filename.contains("..") {
        return Err(AppError::NotFound);
    }

    let storage_path = env::var("STORAGE_PATH").unwrap_or_else(|_| "/app/storage".to_string());
    let file_path = PathBuf::from(storage_path)
        .join("docs")
        .join(doc_id_str)
        .join("assets")
        .join(filename);

    let file = NamedFile::open(file_path).map_err(|_| AppError::NotFound)?;
    Ok(file)
}

/// Deletes an asset.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `req` - The HTTP request.
/// * `path` - The path to the asset to delete.
///
/// # Returns
///
/// An `AppResult` containing the HTTP response.
pub async fn delete_asset(
    pool: web::Data<DbPool>,
    req: HttpRequest,
    path: web::Path<(String, String)>, // (doc_id, asset_id)
) -> AppResult<HttpResponse> {
    let user_info = extract_user_from_request(&req)?;
    let (doc_id_str, asset_id_str) = path.into_inner();
    let doc_id = Uuid::parse_str(&doc_id_str)?;
    let asset_id = Uuid::parse_str(&asset_id_str)?;

    // 1. Verify user is the author of the doc
    let doc = DocHandler::get_doc_by_id(&pool, doc_id, None).await?;
    verify_author_or_admin(&doc, &user_info.user_id, user_info.username.as_deref())?;

    // 2. Get asset info from DB
    let client = pool.get().await?;
    let row = client
        .query_opt(
            "SELECT * FROM doc_assets WHERE id = $1 AND doc_id = $2",
            &[&asset_id, &doc_id],
        )
        .await?;
    let asset_row = match row {
        Some(row) => row,
        None => return Err(AppError::NotFound),
    };
    let filename: String = asset_row.get("filename");

    // 3. Delete file from disk
    let storage_path = env::var("STORAGE_PATH").unwrap_or_else(|_| "/app/storage".to_string());
    let file_path = Path::new(&storage_path)
        .join("docs")
        .join(doc_id.to_string())
        .join("assets")
        .join(&filename);
    if file_path.exists() {
        fs::remove_file(&file_path)?;
    }

    // 4. Delete DB record
    let rows_affected = client
        .execute(
            "DELETE FROM doc_assets WHERE id = $1 AND doc_id = $2",
            &[&asset_id, &doc_id],
        )
        .await?;
    if rows_affected == 0 {
        return Err(AppError::NotFound);
    }

    Ok(HttpResponse::Ok().json(json!({ "message": "Asset deleted" })))
}
