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

// Query parameter structs
#[derive(Deserialize)]
pub struct IdQuery {
    pub id: String,
}

#[derive(Deserialize)]
pub struct LikeQuery {
    pub id: String,
    pub count: Option<i32>,
}

// Constants for validation
const MAX_LIKES_PER_REQUEST: i32 = 100;
const MIN_LIKES_COUNT: i32 = 0;

/// Configure all document-related routes
pub fn config(cfg: &mut web::ServiceConfig) {
    configure_public_routes(cfg);
    crate::api::slugs::config(cfg);
    configure_protected_routes(cfg);
    configure_fallback(cfg);
}

/// Configure public routes that don't require authentication
fn configure_public_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/health", web::get().to(check_health));
    cfg.route("/docs", web::get().to(get_docs))
        .route("/docs/view", web::post().to(increment_views));
}

/// Configure protected routes that require authentication
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
/// Configure fallback route for unmatched requests
fn configure_fallback(cfg: &mut web::ServiceConfig) {
    cfg.default_service(web::route().to(|| async {
        HttpResponse::NotFound().json(json!({
            "error": "Not Found"
        }))
    }));
}

/// Health Checker Endpoint
async fn check_health() -> HttpResponse {
    HttpResponse::Ok().json(json!({
        "status": "ok",
        "message": "DocsX backend is healthy"
    }))
}

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/// Get documents - either all documents or a specific document by ID
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

/// Get likes for a specific document
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

/// Get a single document by ID
async fn get_single_doc(pool: &web::Data<DbPool>, id_str: &str) -> Result<HttpResponse, AppError> {
    let doc_id = parse_uuid(id_str)?;
    let doc = DocHandler::get_doc_by_id(pool, doc_id, None).await?;
    Ok(HttpResponse::Ok().json(doc))
}

/// Get all documents with optional query parameters
async fn get_all_docs(
    pool: &web::Data<DbPool>,
    query: DocsQuery,
) -> Result<HttpResponse, AppError> {
    let response = DocHandler::get_all_docs(pool, query).await?;
    Ok(HttpResponse::Ok().json(response))
}

/// Increment document views with rate limiting
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

/// Create a new document
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

/// Update an existing document
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

/// Delete a document
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

/// Add likes to a document
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

/// Remove a like from a document
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

/// Parse a string into a UUID
fn parse_uuid(id_str: &str) -> Result<Uuid, AppError> {
    Uuid::parse_str(id_str).map_err(|_| AppError::Validation("Invalid UUID format".to_string()))
}

/// Validate like count is within acceptable bounds
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

/// Extract user ID from HTTP request
fn extract_user_id(req: &HttpRequest) -> AppResult<String> {
    let user_info = extract_user_from_request(req)?;
    Ok(user_info.user_id)
}

/// Extract user ID from HTTP request
fn extract_user_id_optional(req: &HttpRequest) -> Option<String> {
    extract_user_from_request(req).ok().map(|info| info.user_id)
}

/// Extract username from HTTP request
fn extract_username(req: &HttpRequest) -> Option<String> {
    extract_user_from_request(req)
        .ok()
        .and_then(|info| info.username)
}
