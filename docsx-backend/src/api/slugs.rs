//! AmitxD DocsX - Slugs API
//! Copyright 2025 AmitxD
//!
//! This module defines the API endpoints for managing custom URL slugs for documents.
//! It allows users to create, retrieve, and delete custom slugs for their documents,
//! making them more accessible and user-friendly.

use crate::auth::middleware::{extract_user_from_request, AuthMiddleware};
use crate::db::postgres::DbPool;
use crate::utils::error::AppError;
use actix_web::{web, HttpRequest, HttpResponse, Result};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents the request to set a custom slug for a document.
#[derive(Deserialize)]
pub struct SetSlugRequest {
    /// The unique identifier of the document.
    pub doc_id: Uuid,
    /// The custom slug to be set.
    pub slug: String,
}

/// Represents the response for a slug operation.
#[derive(Serialize)]
pub struct SlugResponse {
    /// The unique identifier of the document.
    pub doc_id: Uuid,
    /// The custom slug.
    pub slug: String,
}

/// Configures the routes for the slugs API.
///
/// # Arguments
///
/// * `cfg` - The service configuration.
pub fn config(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/slugs")
            .route("", web::get().to(get_all_slugs))
            .route("", web::post().to(set_slug).wrap(AuthMiddleware::new()))
            .route("/{slug}", web::get().to(get_slug))
            .route(
                "/{slug}",
                web::delete().to(delete_slug).wrap(AuthMiddleware::new()),
            ),
    );
}

/// Sets or updates a custom slug for a document. This operation requires authentication.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `req` - The request to set the slug.
/// * `http_req` - The HTTP request.
///
/// # Returns
///
/// An `AppResult` containing the HTTP response.
pub async fn set_slug(
    pool: web::Data<DbPool>,
    req: web::Json<SetSlugRequest>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let user_info = extract_user_from_request(&http_req)?;
    let doc_id = req.doc_id;
    let slug = req.slug.trim().to_lowercase();
    if slug.is_empty() {
        return Err(AppError::Validation("Slug cannot be empty".to_string()));
    }
    if !is_valid_slug(&slug) {
        return Err(AppError::Validation("Invalid slug format".to_string()));
    }
    let client = pool.get().await?;
    // Check doc ownership (author or admin)
    let row = client
        .query_opt("SELECT author_id FROM docs WHERE id = $1", &[&doc_id])
        .await?;
    let author_id: String = match row {
        Some(row) => row.get("author_id"),
        None => return Err(AppError::NotFound),
    };
    if author_id != user_info.user_id && user_info.username.as_deref() != Some("admin") {
        return Err(AppError::Forbidden);
    }
    // Check if slug is already used for another doc
    let existing = client
        .query_opt("SELECT doc_id FROM doc_slugs WHERE slug = $1", &[&slug])
        .await?;
    if let Some(row) = existing {
        let existing_doc_id: Uuid = row.get("doc_id");
        if existing_doc_id != doc_id {
            return Err(AppError::Validation(
                "Slug is already used by another document".to_string(),
            ));
        }
    }
    // Upsert slug
    client
        .execute(
            "INSERT INTO doc_slugs (doc_id, slug, created_at) VALUES ($1, $2, $3)
            ON CONFLICT (slug) DO UPDATE SET doc_id = $1, created_at = $3",
            &[&doc_id, &slug, &Utc::now()],
        )
        .await?;
    Ok(HttpResponse::Ok().json(SlugResponse { doc_id, slug }))
}

/// Gets the document ID for a given slug.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `path` - The slug to look up.
///
/// # Returns
///
/// An `AppResult` containing the HTTP response.
pub async fn get_slug(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let slug = path.into_inner().to_lowercase();
    let client = pool.get().await?;
    let row = client
        .query_opt("SELECT doc_id FROM doc_slugs WHERE slug = $1", &[&slug])
        .await?;
    if let Some(row) = row {
        let doc_id: Uuid = row.get("doc_id");
        Ok(HttpResponse::Ok().json(SlugResponse { doc_id, slug }))
    } else {
        Err(AppError::NotFound)
    }
}

/// Deletes a slug. This operation requires authentication.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `path` - The slug to delete.
/// * `http_req` - The HTTP request.
///
/// # Returns
///
/// An `AppResult` containing the HTTP response.
pub async fn delete_slug(
    pool: web::Data<DbPool>,
    path: web::Path<String>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let user_info = extract_user_from_request(&http_req)?;
    let slug = path.into_inner().to_lowercase();
    let client = pool.get().await?;
    // Check ownership
    let row = client
        .query_opt("SELECT doc_id FROM doc_slugs WHERE slug = $1", &[&slug])
        .await?;
    let doc_id: Uuid = match row {
        Some(row) => row.get("doc_id"),
        None => return Err(AppError::NotFound),
    };
    let row = client
        .query_opt("SELECT author_id FROM docs WHERE id = $1", &[&doc_id])
        .await?;
    let author_id: String = match row {
        Some(row) => row.get("author_id"),
        None => return Err(AppError::NotFound),
    };
    if author_id != user_info.user_id && user_info.username.as_deref() != Some("admin") {
        return Err(AppError::Forbidden);
    }
    client
        .execute("DELETE FROM doc_slugs WHERE slug = $1", &[&slug])
        .await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "success": true })))
}

/// Gets all slugs.
///
/// # Arguments
///
/// * `pool` - The database pool.
///
/// # Returns
///
/// An `AppResult` containing the HTTP response.
pub async fn get_all_slugs(pool: web::Data<DbPool>) -> Result<HttpResponse, AppError> {
    println!("get_all_slugs called!");
    let client = pool.get().await?;
    let rows = client
        .query("SELECT doc_id, slug FROM doc_slugs", &[])
        .await?;
    let slugs: Vec<_> = rows
        .iter()
        .map(|row| {
            serde_json::json!({
                "doc_id": row.get::<_, Uuid>("doc_id").to_string(),
                "slug": row.get::<_, String>("slug"),
            })
        })
        .collect();
    Ok(HttpResponse::Ok().json(slugs))
}

/// Checks if a slug is valid.
///
/// # Arguments
///
/// * `slug` - The slug to validate.
///
/// # Returns
///
/// `true` if the slug is valid, `false` otherwise.
fn is_valid_slug(slug: &str) -> bool {
    let re = regex::Regex::new(r"^[a-z0-9][a-z0-9-_]{2,62}$").unwrap();
    re.is_match(slug)
}
