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

const MAX_FILE_SIZE: usize = 50 * 1024 * 1024; // 50 MB for videos
const MAX_IMAGE_SIZE: usize = 10 * 1024 * 1024; // 10 MB for images
const MAX_DOCUMENT_SIZE: usize = 25 * 1024 * 1024; // 25 MB for documents

// MIME type categories
struct AllowedMimeTypes {
    pub image: &'static [&'static str],
    pub video: &'static [&'static str],
    pub document: &'static [&'static str],
    pub archive: &'static [&'static str],
}

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

#[derive(Debug, Clone)]
enum AssetCategory {
    Image,
    Video,
    Document,
    Archive,
}

impl AssetCategory {
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

    fn get_max_size(&self) -> usize {
        match self {
            AssetCategory::Image => MAX_IMAGE_SIZE,
            AssetCategory::Video => MAX_FILE_SIZE,
            AssetCategory::Document => MAX_DOCUMENT_SIZE,
            AssetCategory::Archive => MAX_DOCUMENT_SIZE,
        }
    }
}

fn is_mime_type_allowed(mime_type: &str) -> bool {
    ALLOWED_MIME_TYPES.image.contains(&mime_type)
        || ALLOWED_MIME_TYPES.video.contains(&mime_type)
        || ALLOWED_MIME_TYPES.document.contains(&mime_type)
        || ALLOWED_MIME_TYPES.archive.contains(&mime_type)
}

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
                r#"<video controls width=\"100%\" style=\"max-width: 800px;\">\n  <source src=\"{}\" type=\"{}\">\n  Your browser does not support the video tag.\n  <a href=\"{}\">{}</a>\n</video>"#,
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
