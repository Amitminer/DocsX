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
use sanitize_filename::sanitize;
use serde_json::json;
use std::{
    env,
    fs::{self, File},
    io::Write,
    path::{Path, PathBuf},
};
use uuid::Uuid;
use log;

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES: &[&str] = &[
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/postscript", // .xd can be this
    "application/zip",
];

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

    let storage_path =
        env::var("STORAGE_PATH").unwrap_or_else(|_| "/app/storage".to_string());
    let doc_assets_path = Path::new(&storage_path).join("docs").join(doc_id.to_string()).join("assets");
    fs::create_dir_all(&doc_assets_path)?;

    if let Some(mut field) = payload.try_next().await? {
        let content_disposition = field.content_disposition().clone();
        let mime_type = field.content_type().map(|ct| ct.to_string()).unwrap_or_else(|| "application/octet-stream".to_string());
        
        let original_name = content_disposition
            .get_filename()
            .ok_or_else(|| AppError::Validation("Filename not provided".to_string()))?
            .to_string();

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

        // 3. Stream and save file
        let mut file = File::create(&file_path)?;
        let mut file_size = 0;
        while let Some(chunk) = field.try_next().await? {
            file_size += chunk.len();
            if file_size > MAX_FILE_SIZE {
                fs::remove_file(&file_path)?;
                return Err(AppError::Validation(format!(
                    "File size exceeds {}MB limit",
                    MAX_FILE_SIZE / 1024 / 1024
                )));
            }
            file.write_all(&chunk)?;
        }

        // 4. MIME type validation (optional but recommended)
        if !ALLOWED_MIME_TYPES.contains(&mime_type.as_str()) {
             fs::remove_file(&file_path)?;
             return Err(AppError::Validation(format!("MIME type {} is not allowed", mime_type)));
        }

        // 5. Save to database
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
        let alt_text = Path::new(&asset.original_name).file_stem().and_then(|s| s.to_str()).unwrap_or("");
        let markdown = if asset.mime_type.starts_with("image/") {
            format!("![{}]({})", alt_text, asset_url)
        } else {
            format!("[{}]({})", asset.original_name, asset_url)
        };

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
        });

        Ok(HttpResponse::Ok().json(response_data))
    } else {
        Err(AppError::Validation("No file was uploaded".to_string()))
    }
}

pub async fn list_assets(
    pool: web::Data<DbPool>,
    req: HttpRequest,
) -> AppResult<HttpResponse> {
    let user_info = extract_user_from_request(&req)?;
    let doc_id_str = req
        .match_info()
        .get("doc_id")
        .ok_or_else(|| AppError::Validation("doc_id is required".to_string()))?;
    let doc_id = Uuid::parse_str(doc_id_str)?;

    // Verify user is the author of the doc
    let doc = DocHandler::get_doc_by_id(&pool, doc_id, None).await?;
    verify_author_or_admin(&doc, &user_info.user_id, user_info.username.as_deref())?;

    let client = pool.get().await?;
    let rows = client
        .query("SELECT * FROM doc_assets WHERE doc_id = $1 ORDER BY created_at DESC", &[&doc_id])
        .await?;
    
    let assets: Vec<_> = rows.into_iter().map(|row| {
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
        let alt_text = Path::new(&asset.original_name).file_stem().and_then(|s| s.to_str()).unwrap_or("");
        let markdown = if asset.mime_type.starts_with("image/") {
            format!("![{}]({})", alt_text, asset_url)
        } else {
            format!("[{}]({})", asset.original_name, asset_url)
        };

        json!({
            "id": asset.id,
            "doc_id": asset.doc_id,
            "url": asset_url,
            "filename": asset.filename,
            "original_name": asset.original_name,
            "mime_type": asset.mime_type,
            "size": asset.size,
            "markdown": markdown,
            "created_at": asset.created_at,
        })
    }).collect();

    Ok(HttpResponse::Ok().json(json!({ "assets": assets })))
}

pub async fn serve_asset(path: web::Path<(String, String)>) -> AppResult<NamedFile> {
    let (doc_id_str, filename) = path.into_inner();

    if filename.contains("..") {
        return Err(AppError::NotFound);
    }

    let storage_path =
        env::var("STORAGE_PATH").unwrap_or_else(|_| "/app/storage".to_string());
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