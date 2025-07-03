//! AmitxD DocsX - Docs API
//! Copyright 2025 AmitxD
//!
//! This module defines the API endpoints for managing documents.
//! It handles everything from creating, reading, updating, and deleting documents
//! to managing likes and views. It's the core of the DocsX API.

use crate::auth::middleware::{extract_user_from_request, AuthMiddleware};
use crate::db::postgres::DbPool;
use crate::handlers::doc_handler::DocHandler;
use crate::models::doc::{CreateDocRequest, DocsQuery, UpdateDocRequest};
use crate::utils::error::{AppError, AppResult};
use actix_web::{web, HttpRequest, HttpResponse, Result};
use md5;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

/// Represents the query parameters for getting a single document by ID.
#[derive(Deserialize)]
pub struct IdQuery {
    /// The unique identifier of the document.
    pub id: String,
}

/// Represents the query parameters for liking or unliking a document.
#[derive(Deserialize)]
pub struct LikeQuery {
    /// The unique identifier of the document.
    pub id: String,
    /// The number of likes to add.
    pub count: Option<i32>,
}

// Constants for validation
const MAX_LIKES_PER_REQUEST: i32 = 100;
const MIN_LIKES_COUNT: i32 = 0;

/// Configures all document-related routes.
///
/// # Arguments
///
/// * `cfg` - The service configuration.
pub fn config(cfg: &mut web::ServiceConfig) {
    configure_public_routes(cfg);
    crate::api::slugs::config(cfg);
    configure_protected_routes(cfg);
    configure_fallback(cfg);
}

/// Configures public routes that don't require authentication.
///
/// # Arguments
///
/// * `cfg` - The service configuration.
fn configure_public_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(check_health));
    cfg.route("/docs", web::get().to(get_docs))
        .route("/docs/view", web::post().to(increment_views));
}

/// Configures protected routes that require authentication.
///
/// # Arguments
///
/// * `cfg` - The service configuration.
fn configure_protected_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("")
            .wrap(AuthMiddleware::new())
            .route("/docs/create", web::post().to(create_doc))
            .route("/docs/update", web::post().to(update_doc))
            .route("/docs/delete", web::delete().to(delete_doc))
            .route("/docs/like", web::post().to(add_likes))
            .route("/docs/unlike", web::post().to(remove_like))
            .route("/docs/likes", web::get().to(get_likes)),
    );
}

/// Configures a fallback route for unmatched requests.
///
/// # Arguments
///
/// * `cfg` - The service configuration.
fn configure_fallback(cfg: &mut web::ServiceConfig) {
    cfg.default_service(web::route().to(|| async {
        HttpResponse::NotFound().json(json!({
            "error": "Not Found"
        }))
    }));
}

/// The health checker endpoint.
///
/// # Returns
///
/// An `HttpResponse` with a status of "ok" if the backend is healthy.
async fn check_health() -> HttpResponse {
    HttpResponse::Ok().json(json!({
        "status": "ok",
        "message": "DocsX backend is healthy"
    }))
}

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/// Gets documents. Can be all documents or a specific document by ID.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters for filtering and pagination.
/// * `id_query` - An optional query parameter for getting a single document by ID.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
pub async fn get_docs(
    pool: web::Data<DbPool>,
    query: web::Query<DocsQuery>,
    id_query: Option<web::Query<IdQuery>>,
) -> Result<HttpResponse, AppError> {
    match id_query {
        Some(id_query) => get_single_doc(&pool, &id_query.id).await,
        None => get_all_docs(&pool, query.into_inner()).await,
    }
}

/// Gets the likes for a specific document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters containing the document ID.
/// * `req` - The HTTP request.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
pub async fn get_likes(
    pool: web::Data<DbPool>,
    query: web::Query<IdQuery>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(&query.id)?;
    let user_id = extract_user_id_optional(&req);

    let response = DocHandler::get_likes(&pool, doc_id, user_id.as_deref()).await?;
    Ok(HttpResponse::Ok().json(response))
}

/// Gets a single document by ID.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `id_str` - The ID of the document to retrieve.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
async fn get_single_doc(pool: &web::Data<DbPool>, id_str: &str) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(id_str)?;
    let doc = DocHandler::get_doc_by_id(pool, doc_id, None).await?;
    Ok(HttpResponse::Ok().json(doc))
}

/// Gets all documents with optional query parameters.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters for filtering and pagination.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
async fn get_all_docs(
    pool: &web::Data<DbPool>,
    query: DocsQuery,
) -> Result<HttpResponse, AppError> {
    let response = DocHandler::get_all_docs(pool, query).await?;
    Ok(HttpResponse::Ok().json(response))
}

/// Increments the view count of a document with rate limiting.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters containing the document ID.
/// * `req` - The HTTP request.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
async fn increment_views(
    pool: web::Data<DbPool>,
    query: web::Query<IdQuery>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(&query.id)?;

    // Get client IP for rate limiting
    let ip = req
        .connection_info()
        .realip_remote_addr()
        .unwrap_or("unknown")
        .to_string();

    // Simple hash of IP for rate limiting
    let ip_hash = format!("{:x}", md5::compute(ip.as_bytes()));

    let new_views = DocHandler::increment_views(&pool, doc_id, &ip_hash).await?;

    Ok(HttpResponse::Ok().json(json!({
        "doc_id": doc_id,
        "views": new_views,
        "message": "View count updated"
    })))
}

// ============================================================================
// PROTECTED ENDPOINTS
// ============================================================================

/// Creates a new document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `req` - The request to create the document.
/// * `http_req` - The HTTP request.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
pub async fn create_doc(
    pool: web::Data<DbPool>,
    req: web::Json<CreateDocRequest>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let author_id = extract_user_id(&http_req)?;
    let author_name = extract_username(&http_req);

    let doc = DocHandler::create_doc(&pool, req.into_inner(), author_id, author_name).await?;

    Ok(HttpResponse::Created().json(doc))
}

/// Updates an existing document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters containing the document ID.
/// * `req` - The request to update the document.
/// * `http_req` - The HTTP request.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
pub async fn update_doc(
    pool: web::Data<DbPool>,
    query: web::Query<IdQuery>,
    req: web::Json<UpdateDocRequest>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(&query.id)?;
    let author_id = extract_user_id(&http_req)?;
    let username = extract_username(&http_req);

    let doc = DocHandler::update_doc(&pool, doc_id, req.into_inner(), author_id, username).await?;

    Ok(HttpResponse::Ok().json(doc))
}

/// Deletes a document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters containing the document ID.
/// * `http_req` - The HTTP request.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
pub async fn delete_doc(
    pool: web::Data<DbPool>,
    query: web::Query<IdQuery>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(&query.id)?;
    let author_id = extract_user_id(&http_req)?;
    let username = extract_username(&http_req);

    DocHandler::delete_doc(&pool, doc_id, author_id, username).await?;

    Ok(HttpResponse::Ok().json(json!({
        "message": "Document deleted successfully"
    })))
}

/// Adds likes to a document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters containing the document ID and like count.
/// * `http_req` - The HTTP request.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
pub async fn add_likes(
    pool: web::Data<DbPool>,
    query: web::Query<LikeQuery>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(&query.id)?;
    let like_count = query.count.unwrap_or(1);

    validate_like_count(like_count)?;

    let user_id = extract_user_id(&http_req)?;
    let response = DocHandler::add_like(&pool, doc_id, &user_id, like_count).await?;

    Ok(HttpResponse::Ok().json(response))
}

/// Removes a like from a document.
///
/// # Arguments
///
/// * `pool` - The database pool.
/// * `query` - The query parameters containing the document ID.
/// * `http_req` - The HTTP request.
///
/// # Returns
///
/// A `Result` containing the `HttpResponse`.
pub async fn remove_like(
    pool: web::Data<DbPool>,
    query: web::Query<LikeQuery>,
    http_req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(&query.id)?;
    let user_id = extract_user_id(&http_req)?;

    let response = DocHandler::remove_like(&pool, doc_id, &user_id).await?;
    Ok(HttpResponse::Ok().json(response))
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Parses a string into a UUID.
///
/// # Arguments
///
/// * `id_str` - The string to parse.
///
/// # Returns
///
/// A `Result` containing the `Uuid` if parsing was successful, or an `AppError` otherwise.
fn parse_uuid(id_str: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(id_str).map_err(|_| AppError::Validation("Invalid UUID format".to_string()))
}

/// Validates that the like count is within acceptable bounds.
///
/// # Arguments
///
/// * `count` - The like count to validate.
///
/// # Returns
///
/// A `Result` containing `()` if the like count is valid, or an `AppError` otherwise.
fn validate_like_count(count: i32) -> Result<(), AppError> {
    if count < MIN_LIKES_COUNT {
        return Err(AppError::Validation(
            "Cannot add negative likes".to_string(),
        ));
    }

    if count > MAX_LIKES_PER_REQUEST {
        return Err(AppError::Validation(format!(
            "Cannot add more than {} likes at once",
            MAX_LIKES_PER_REQUEST
        )));
    }

    Ok(())
}

/// Extracts the user ID from the HTTP request.
///
/// # Arguments
///
/// * `req` - The HTTP request.
///
/// # Returns
///
/// An `AppResult` containing the user ID.
fn extract_user_id(req: &HttpRequest) -> AppResult<String> {
    let user_info = extract_user_from_request(req)?;
    Ok(user_info.user_id)
}

/// Extracts the user ID from the HTTP request, if it exists.
///
/// # Arguments
///
/// * `req` - The HTTP request.
///
/// # Returns
///
/// An `Option` containing the user ID if it exists, or `None` otherwise.
fn extract_user_id_optional(req: &HttpRequest) -> Option<String> {
    extract_user_from_request(req).ok().map(|info| info.user_id)
}

/// Extracts the username from the HTTP request, if it exists.
///
/// # Arguments
///
/// * `req` - The HTTP request.
///
/// # Returns
///
/// An `Option` containing the username if it exists, or `None` otherwise.
fn extract_username(req: &HttpRequest) -> Option<String> {
    extract_user_from_request(req)
        .ok()
        .and_then(|info| info.username)
}
