use crate::db::postgres::DbPool;
use crate::models::doc::{
    CreateDocRequest, Doc, DocsQuery, DocsResponse, LikesResponse, UpdateDocRequest,
};
use crate::utils::error::{AppError, AppResult};
use chrono::{DateTime, Utc};
use regex;
use tokio_postgres::Row;
use uuid::Uuid;
use validator::Validate;

// Constants for admin privileges
const ADMIN_USERNAME: &str = "admin";

// SQL query constants
const SELECT_DOCS_BASE: &str = "SELECT id, title, description, content, author_id, author_name, created_at, likes, views, tags FROM docs";

const SELECT_DOC_BY_ID: &str = "SELECT id, title, description, content, author_id, author_name, created_at, likes, views, tags FROM docs WHERE id = $1";

const INSERT_DOC: &str = r#"
    INSERT INTO docs (id, title, description, content, author_id, author_name, created_at, likes, views, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, title, description, content, author_id, author_name, created_at, likes, views, tags
"#;

const CHECK_USER_LIKE: &str = "SELECT 1 FROM doc_likes WHERE doc_id = $1 AND user_id = $2";
const INSERT_LIKE: &str = "INSERT INTO doc_likes (doc_id, user_id) VALUES ($1, $2)";
const DELETE_LIKE: &str = "DELETE FROM doc_likes WHERE doc_id = $1 AND user_id = $2";
const UPDATE_LIKES_INCREMENT: &str =
    "UPDATE docs SET likes = likes + $1 WHERE id = $2 RETURNING likes";
const UPDATE_LIKES_DECREMENT: &str =
    "UPDATE docs SET likes = GREATEST(likes - 1, 0) WHERE id = $1 RETURNING likes";
const DELETE_DOC: &str = "DELETE FROM docs WHERE id = $1";

// Tag-related constants
const INSERT_DOC_TAGS: &str =
    "INSERT INTO doc_tags (doc_id, tag) VALUES ($1, $2) ON CONFLICT (doc_id, tag) DO NOTHING";
const DELETE_DOC_TAGS: &str = "DELETE FROM doc_tags WHERE doc_id = $1";
// const GET_DOC_TAGS: &str = "SELECT tag FROM doc_tags WHERE doc_id = $1 ORDER BY tag";

// View tracking constants
const CHECK_VIEW_RATE_LIMIT: &str =
    "SELECT last_viewed FROM doc_views WHERE doc_id = $1 AND ip_hash = $2";
const INSERT_VIEW_RECORD: &str = "INSERT INTO doc_views (doc_id, ip_hash, last_viewed) VALUES ($1, $2, NOW()) ON CONFLICT (doc_id, ip_hash) DO UPDATE SET last_viewed = NOW()";
const INCREMENT_VIEWS: &str = "UPDATE docs SET views = views + 1 WHERE id = $1 RETURNING views";

pub struct DocHandler;

impl DocHandler {
    /// Get all documents with optional filtering, searching, and pagination
    pub async fn get_all_docs(pool: &DbPool, query: DocsQuery) -> AppResult<DocsResponse> {
        let client = pool.get().await?;

        let (sql, params, _search_holders) = build_docs_query(&query);
        // Fix 1: Convert Vec<Box<dyn ToSql>> to Vec<&dyn ToSql>
        let param_refs = params_as_refs(&params);
        let rows = client.query(&sql, &param_refs).await?;
        let docs: Vec<Doc> = rows.into_iter().map(row_to_doc).collect();

        let total = count_docs(&client, &query).await?;
        let total_pages = calculate_total_pages(total, query.limit());

        Ok(DocsResponse {
            docs,
            total,
            page: query.page(),
            limit: query.limit(),
            total_pages,
        })
    }

    /// Get a single document by ID with optional user context for likes
    pub async fn get_doc_by_id(pool: &DbPool, id: Uuid, user_id: Option<&str>) -> AppResult<Doc> {
        let client = pool.get().await?;

        let row = client
            .query_opt(SELECT_DOC_BY_ID, &[&id])
            .await?
            .ok_or(AppError::NotFound)?;

        let mut doc = row_to_doc(row);
        doc.liked_by_current_user = check_user_liked_doc(&client, id, user_id).await?;

        Ok(doc)
    }

    /// Create a new document
    pub async fn create_doc(
        pool: &DbPool,
        req: CreateDocRequest,
        author_id: String,
        author_name: Option<String>,
    ) -> AppResult<Doc> {
        validate_request(&req)?;

        let mut client = pool.get().await?;
        let doc_data = DocumentData::new(req.clone(), author_id, author_name);

        // Start transaction
        let transaction = client.transaction().await?;

        // Insert document
        let row = transaction
            .query_one(INSERT_DOC, &doc_data.as_params())
            .await?;
        let doc = row_to_doc(row);

        // Insert tags if provided
        if let Some(tags) = &req.tags {
            for tag in tags {
                if !tag.trim().is_empty() {
                    transaction
                        .execute(INSERT_DOC_TAGS, &[&doc.id, &tag.trim().to_lowercase()])
                        .await?;
                }
            }
        }

        transaction.commit().await?;
        Ok(doc)
    }

    /// Get likes information for a document
    pub async fn get_likes(
        pool: &DbPool,
        id: Uuid,
        user_id: Option<&str>,
    ) -> AppResult<LikesResponse> {
        let existing = Self::get_doc_by_id(pool, id, None).await?;
        let client = pool.get().await?;
        let liked_by_current_user = check_user_liked_doc(&client, id, user_id).await?;

        Ok(LikesResponse {
            doc_id: id,
            likes: existing.likes,
            message: format!("Current likes: {}", existing.likes),
            liked_by_current_user,
        })
    }

    /// Add a like to a document
    pub async fn add_like(
        pool: &DbPool,
        id: Uuid,
        user_id: &str,
        count: i32,
    ) -> AppResult<LikesResponse> {
        let client = pool.get().await?;

        // Verify document exists
        Self::get_doc_by_id(pool, id, Some(user_id)).await?;

        // Check if user already liked the document
        if check_user_liked_doc(&client, id, Some(user_id)).await? {
            return Err(AppError::Validation(
                "User already liked this doc".to_string(),
            ));
        }

        // Perform like operation in a logical transaction
        client.execute(INSERT_LIKE, &[&id, &user_id]).await?;
        let row = client
            .query_one(UPDATE_LIKES_INCREMENT, &[&count, &id])
            .await?;
        let new_likes: i32 = row.get("likes");

        Ok(LikesResponse {
            doc_id: id,
            likes: new_likes,
            message: format!("Added {} like(s). Total likes: {}", count, new_likes),
            liked_by_current_user: true,
        })
    }

    /// Remove a like from a document
    pub async fn remove_like(pool: &DbPool, id: Uuid, user_id: &str) -> AppResult<LikesResponse> {
        let client = pool.get().await?;

        // Verify document exists
        Self::get_doc_by_id(pool, id, Some(user_id)).await?;

        // Check if user has liked the document
        if !check_user_liked_doc(&client, id, Some(user_id)).await? {
            return Err(AppError::Validation(
                "User has not liked this doc".to_string(),
            ));
        }

        // Perform unlike operation in a logical transaction
        client.execute(DELETE_LIKE, &[&id, &user_id]).await?;
        let row = client.query_one(UPDATE_LIKES_DECREMENT, &[&id]).await?;
        let new_likes: i32 = row.get("likes");

        Ok(LikesResponse {
            doc_id: id,
            likes: new_likes,
            message: format!("Removed like. Total likes: {}", new_likes),
            liked_by_current_user: false,
        })
    }

    /// Update an existing document
    pub async fn update_doc(
        pool: &DbPool,
        id: Uuid,
        req: UpdateDocRequest,
        author_id: String,
        username: Option<String>,
    ) -> AppResult<Doc> {
        validate_request(&req)?;

        let mut client = pool.get().await?;
        let existing = Self::get_doc_by_id(pool, id, None).await?;

        verify_author_or_admin(&existing, &author_id, username.as_deref())?;

        // Start transaction
        let transaction = client.transaction().await?;

        let update_query = build_update_query(&req, id)?;
        let doc = match update_query {
            Some((sql, params)) => {
                // Fix 2: Convert Vec<Box<dyn ToSql>> to Vec<&dyn ToSql>
                let param_refs = params_as_refs(&params);
                let row = transaction.query_one(&sql, &param_refs).await?;
                row_to_doc(row)
            }
            None => existing, // No updates needed
        };

        // Update tags if provided
        if let Some(tags) = req.tags {
            // Delete existing tags
            transaction.execute(DELETE_DOC_TAGS, &[&id]).await?;

            // Insert new tags
            for tag in &tags {
                if !tag.trim().is_empty() {
                    transaction
                        .execute(INSERT_DOC_TAGS, &[&id, &tag.trim().to_lowercase()])
                        .await?;
                }
            }

            // Update tags array in docs table
            let tags_array = tags
                .iter()
                .map(|t| t.trim().to_lowercase())
                .collect::<Vec<_>>();
            transaction
                .execute(
                    "UPDATE docs SET tags = $1 WHERE id = $2",
                    &[&tags_array, &id],
                )
                .await?;
        }

        transaction.commit().await?;
        Ok(doc)
    }

    /// Delete a document
    pub async fn delete_doc(
        pool: &DbPool,
        id: Uuid,
        author_id: String,
        username: Option<String>,
    ) -> AppResult<()> {
        let client = pool.get().await?;
        let existing = Self::get_doc_by_id(pool, id, None).await?;

        verify_author_or_admin(&existing, &author_id, username.as_deref())?;

        let rows_affected = client.execute(DELETE_DOC, &[&id]).await?;

        if rows_affected == 0 {
            Err(AppError::NotFound)
        } else {
            Ok(())
        }
    }

    /// Increment document views with rate limiting
    pub async fn increment_views(pool: &DbPool, id: Uuid, ip_hash: &str) -> AppResult<i32> {
        let client = pool.get().await?;

        // Verify document exists
        Self::get_doc_by_id(pool, id, None).await?;

        // Check rate limit (1 view per IP per 5 minutes)
        let rate_limit_result = client
            .query_opt(CHECK_VIEW_RATE_LIMIT, &[&id, &ip_hash])
            .await?;

        if let Some(row) = rate_limit_result {
            let last_viewed: chrono::DateTime<chrono::Utc> = row.get("last_viewed");
            let five_minutes_ago = chrono::Utc::now() - chrono::Duration::minutes(5);

            if last_viewed > five_minutes_ago {
                // Rate limited - return current view count without incrementing
                let doc = Self::get_doc_by_id(pool, id, None).await?;
                return Ok(doc.views);
            }
        }

        // Update view record and increment views
        client.execute(INSERT_VIEW_RECORD, &[&id, &ip_hash]).await?;
        let row = client.query_one(INCREMENT_VIEWS, &[&id]).await?;
        let new_views: i32 = row.get("views");

        Ok(new_views)
    }

    // Update document tags
    // pub async fn update_doc_tags(pool: &DbPool, doc_id: Uuid, tags: Vec<String>) -> AppResult<()> {
    //     let mut client = pool.get().await?;

    //     // Verify document exists
    //     Self::get_doc_by_id(pool, doc_id, None).await?;

    //     // Start transaction
    //     let transaction = client.transaction().await?;

    //     // Delete existing tags
    //     transaction.execute(DELETE_DOC_TAGS, &[&doc_id]).await?;

    //     // Insert new tags
    //     for tag in &tags {
    //         if !tag.trim().is_empty() {
    //             transaction
    //                 .execute(INSERT_DOC_TAGS, &[&doc_id, &tag.trim().to_lowercase()])
    //                 .await?;
    //         }
    //     }

    //     // Update tags array in docs table
    //     let tags_array = tags
    //         .iter()
    //         .map(|t| t.trim().to_lowercase())
    //         .collect::<Vec<_>>();
    //     transaction
    //         .execute(
    //             "UPDATE docs SET tags = $1 WHERE id = $2",
    //             &[&tags_array, &doc_id],
    //         )
    //         .await?;

    //     transaction.commit().await?;
    //     Ok(())
    // }

    // /// Get tags for a document
    // pub async fn get_doc_tags(pool: &DbPool, doc_id: Uuid) -> AppResult<Vec<String>> {
    //     let client = pool.get().await?;
    //     let rows = client.query(GET_DOC_TAGS, &[&doc_id]).await?;
    //     let tags: Vec<String> = rows.into_iter().map(|row| row.get("tag")).collect();
    //     Ok(tags)
    // }
}

// ============================================================================
// HELPER STRUCTURES
// ============================================================================

/// Helper structure for document creation data
struct DocumentData {
    id: Uuid,
    title: String,
    description: String,
    content: String,
    author_id: String,
    author_name: Option<String>,
    created_at: DateTime<Utc>,
    likes: i32,
    views: i32,
    tags: Vec<String>,
}

impl DocumentData {
    fn new(req: CreateDocRequest, author_id: String, author_name: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            title: req.title,
            description: req.description,
            content: req.content,
            author_id,
            author_name,
            created_at: Utc::now(),
            likes: 0,
            views: 0,
            tags: req.tags.unwrap_or_default(),
        }
    }

    fn as_params(&self) -> [&(dyn tokio_postgres::types::ToSql + Sync); 10] {
        [
            &self.id,
            &self.title,
            &self.description,
            &self.content,
            &self.author_id,
            &self.author_name,
            &self.created_at,
            &self.likes,
            &self.views,
            &self.tags,
        ]
    }
}

// ============================================================================
// QUERY BUILDING HELPERS
// ============================================================================

/// Build SQL query with filters, search, and pagination
fn build_docs_query(
    query: &DocsQuery,
) -> (
    String,
    Vec<Box<dyn tokio_postgres::types::ToSql + Send + Sync>>,
    Vec<String>,
) {
    let mut sql = String::from(SELECT_DOCS_BASE);
    let mut params: Vec<Box<dyn tokio_postgres::types::ToSql + Send + Sync>> = Vec::new();
    let search_holders = Vec::new();

    let mut where_clauses = Vec::new();

    // Parse smart search filters
    if let Some(ref search) = query.search {
        let (parsed_filters, search_text) = parse_smart_search(search);

        // Apply parsed filters
        for filter in parsed_filters {
            match filter {
                SmartFilter::Author(author) => {
                    where_clauses.push(format!("author_id = ${}", params.len() + 1));
                    params.push(Box::new(author));
                }
                SmartFilter::AuthorName(author_name) => {
                    where_clauses.push(format!("author_name = ${}", params.len() + 1));
                    params.push(Box::new(author_name));
                }
                SmartFilter::DateRange(start_date, end_date) => {
                    where_clauses.push(format!(
                        "created_at BETWEEN ${} AND ${}",
                        params.len() + 1,
                        params.len() + 2
                    ));
                    params.push(Box::new(start_date));
                    params.push(Box::new(end_date));
                }
                SmartFilter::Tag(tag) => {
                    where_clauses.push(format!("${} = ANY(tags)", params.len() + 1));
                    params.push(Box::new(tag.to_lowercase()));
                }
                SmartFilter::Sort(_sort_field) => {
                    // Sort will be applied at the end
                }
            }
        }

        // Apply free text search if there's remaining text
        if !search_text.trim().is_empty() {
            let param_num = params.len() + 1;
            where_clauses.push(format!(
                "(title ILIKE ${} OR description ILIKE ${} OR content ILIKE ${})",
                param_num, param_num, param_num
            ));
            let search_pattern = format!("%{}%", search_text.trim());
            params.push(Box::new(search_pattern));
        }
    }

    // Apply explicit filters
    if let Some(ref author) = query.author {
        where_clauses.push(format!("author_id = ${}", params.len() + 1));
        params.push(Box::new(author.clone()));
    }

    // NEW: filter by author_name if provided
    if let Some(ref author_name) = query.author_name {
        where_clauses.push(format!("author_name = ${}", params.len() + 1));
        params.push(Box::new(author_name.clone()));
    }

    if let Some(ref tags) = query.tags {
        for tag in tags {
            where_clauses.push(format!("${} = ANY(tags)", params.len() + 1));
            params.push(Box::new(tag.to_lowercase()));
        }
    }

    if !where_clauses.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&where_clauses.join(" AND "));
    }

    // Apply sorting
    let sort_field = get_sort_field(query);
    sql.push_str(&format!(" ORDER BY {} DESC", sort_field));

    // Apply pagination
    sql.push_str(&format!(
        " LIMIT {} OFFSET {}",
        query.limit(),
        query.offset()
    ));

    (sql, params, search_holders)
}

/// Parse smart search filters from search string
fn parse_smart_search(search: &str) -> (Vec<SmartFilter>, String) {
    let mut filters = Vec::new();
    let mut remaining_text = search.to_string();

    // Extract by_author: filter
    if let Some(cap) = regex::Regex::new(r"by_author:(\S+)")
        .unwrap()
        .captures(search)
    {
        if let Some(author) = cap.get(1) {
            filters.push(SmartFilter::Author(author.as_str().to_string()));
            remaining_text = remaining_text.replace(&cap[0], "").trim().to_string();
        }
    }

    // NEW: Extract by_author_name: filter
    if let Some(cap) = regex::Regex::new(r"by_author_name:(\S+)")
        .unwrap()
        .captures(search)
    {
        if let Some(author_name) = cap.get(1) {
            filters.push(SmartFilter::AuthorName(author_name.as_str().to_string()));
            remaining_text = remaining_text.replace(&cap[0], "").trim().to_string();
        }
    }

    // Extract uploaded_date: filter (supports date ranges)
    if let Some(cap) = regex::Regex::new(r"uploaded_date:(\S+)")
        .unwrap()
        .captures(search)
    {
        if let Some(date_range) = cap.get(1) {
            if let Some((start, end)) = parse_date_range(date_range.as_str()) {
                filters.push(SmartFilter::DateRange(start, end));
                remaining_text = remaining_text.replace(&cap[0], "").trim().to_string();
            }
        }
    }

    // Extract tag: filter
    if let Some(cap) = regex::Regex::new(r"tag:(\S+)").unwrap().captures(search) {
        if let Some(tag) = cap.get(1) {
            filters.push(SmartFilter::Tag(tag.as_str().to_string()));
            remaining_text = remaining_text.replace(&cap[0], "").trim().to_string();
        }
    }

    // Extract sort: filter
    if let Some(cap) = regex::Regex::new(r"sort:(\S+)").unwrap().captures(search) {
        if let Some(sort) = cap.get(1) {
            filters.push(SmartFilter::Sort(sort.as_str().to_string()));
            remaining_text = remaining_text.replace(&cap[0], "").trim().to_string();
        }
    }

    (filters, remaining_text)
}

/// Parse date range (e.g., "2024-01-01:2024-12-31" or "last_week")
fn parse_date_range(
    date_range: &str,
) -> Option<(chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>)> {
    if date_range.contains(':') {
        let parts: Vec<&str> = date_range.split(':').collect();
        if parts.len() == 2 {
            let start = chrono::NaiveDateTime::parse_from_str(
                &format!("{} 00:00:00", parts[0]),
                "%Y-%m-%d %H:%M:%S",
            )
            .ok()?;
            let end = chrono::NaiveDateTime::parse_from_str(
                &format!("{} 23:59:59", parts[1]),
                "%Y-%m-%d %H:%M:%S",
            )
            .ok()?;
            return Some((start.and_utc(), end.and_utc()));
        }
    }

    // Handle relative dates
    let now = chrono::Utc::now();
    match date_range {
        "today" => {
            let start = now.date_naive().and_hms_opt(0, 0, 0).unwrap().and_utc();
            let end = now.date_naive().and_hms_opt(23, 59, 59).unwrap().and_utc();
            Some((start, end))
        }
        "yesterday" => {
            let yesterday = now.date_naive() - chrono::Duration::days(1);
            let start = yesterday.and_hms_opt(0, 0, 0).unwrap().and_utc();
            let end = yesterday.and_hms_opt(23, 59, 59).unwrap().and_utc();
            Some((start, end))
        }
        "last_week" => {
            let start = now - chrono::Duration::days(7);
            Some((start, now))
        }
        "last_month" => {
            let start = now - chrono::Duration::days(30);
            Some((start, now))
        }
        _ => None,
    }
}

/// Get sort field based on query and smart filters
fn get_sort_field(query: &DocsQuery) -> &'static str {
    // Check for sort filter in search
    if let Some(ref search) = query.search {
        if search.contains("sort:likes") {
            return "likes";
        }
        if search.contains("sort:date") {
            return "created_at";
        }
    }

    // Use query sort_by
    match query.sort_by.as_deref() {
        Some("likes") => "likes",
        Some("date") => "created_at",
        _ => "created_at",
    }
}

#[derive(Debug)]
enum SmartFilter {
    Author(String),
    AuthorName(String),
    DateRange(chrono::DateTime<chrono::Utc>, chrono::DateTime<chrono::Utc>),
    Tag(String),
    Sort(String),
}

/// Build update query for document updates
fn build_update_query(req: &UpdateDocRequest, id: Uuid) -> AppResult<MaybeSqlParams> {
    let mut updates = Vec::new();
    let mut params: Vec<Box<dyn tokio_postgres::types::ToSql + Send + Sync>> = Vec::new();

    if let Some(ref title) = req.title {
        updates.push(format!("title = ${}", params.len() + 1));
        params.push(Box::new(title.clone()));
    }

    // Fix 3: Handle Option<String> correctly
    if req.description.is_some() {
        updates.push(format!("description = ${}", params.len() + 1));
        params.push(Box::new(req.description.clone()));
    }

    if let Some(ref content) = req.content {
        updates.push(format!("content = ${}", params.len() + 1));
        params.push(Box::new(content.clone()));
    }

    if updates.is_empty() {
        return Ok(None);
    }

    let sql = format!(
        "UPDATE docs SET {} WHERE id = ${} RETURNING id, title, description, content, author_id, author_name, created_at, likes, views, tags",
        updates.join(", "),
        params.len() + 1
    );
    params.push(Box::new(id));

    Ok(Some((sql, params)))
}

// ============================================================================
// DATABASE OPERATION HELPERS
// ============================================================================

/// Count total documents matching the query
async fn count_docs(client: &tokio_postgres::Client, query: &DocsQuery) -> AppResult<i64> {
    let mut count_sql = String::from("SELECT COUNT(*) FROM docs");
    let mut params: Vec<Box<dyn tokio_postgres::types::ToSql + Send + Sync>> = Vec::new();

    let mut where_clauses = Vec::new();

    if let Some(ref author) = query.author {
        where_clauses.push(format!("author_id = ${}", params.len() + 1));
        params.push(Box::new(author.clone()));
    }

    if let Some(ref search) = query.search {
        let param_num = params.len() + 1;
        where_clauses.push(format!(
            "(title ILIKE ${} OR description ILIKE ${} OR content ILIKE ${})",
            param_num, param_num, param_num
        ));
        let search_pattern = format!("%{}%", search);
        params.push(Box::new(search_pattern));
    }

    if !where_clauses.is_empty() {
        count_sql.push_str(" WHERE ");
        count_sql.push_str(&where_clauses.join(" AND "));
    }

    // Fix 4: Convert parameters correctly
    let param_refs = params_as_refs(&params);
    let count_row = client.query_one(&count_sql, &param_refs).await?;
    Ok(count_row.get(0))
}

/// Check if a user has liked a specific document
async fn check_user_liked_doc(
    client: &tokio_postgres::Client,
    doc_id: Uuid,
    user_id: Option<&str>,
) -> AppResult<bool> {
    match user_id {
        Some(uid) => {
            let result = client.query_opt(CHECK_USER_LIKE, &[&doc_id, &uid]).await?;
            Ok(result.is_some())
        }
        None => Ok(false),
    }
}

// ============================================================================
// VALIDATION AND AUTHORIZATION HELPERS
// ============================================================================

/// Validate request data
fn validate_request<T: Validate>(req: &T) -> AppResult<()> {
    req.validate()
        .map_err(|e| AppError::Validation(e.to_string()))
}

/// Verify user is document author or admin
pub fn verify_author_or_admin(doc: &Doc, author_id: &str, username: Option<&str>) -> AppResult<()> {
    if doc.author_id == author_id {
        return Ok(());
    }
    let is_admin = username == Some(ADMIN_USERNAME);
    if !is_admin {
        return Err(AppError::Forbidden);
    }
    Ok(())
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/// Calculate total pages for pagination
fn calculate_total_pages(total: i64, limit: u32) -> u32 {
    ((total as f64) / (limit as f64)).ceil() as u32
}

/// Convert Vec<Box<dyn ToSql>> to Vec<&dyn ToSql> for query execution
fn params_as_refs(
    params: &[Box<dyn tokio_postgres::types::ToSql + Send + Sync>],
) -> Vec<&(dyn tokio_postgres::types::ToSql + Sync)> {
    params
        .iter()
        .map(|p| p.as_ref() as &(dyn tokio_postgres::types::ToSql + Sync))
        .collect()
}

/// Convert database row to Doc model
fn row_to_doc(row: Row) -> Doc {
    Doc {
        id: row.get("id"),
        title: row.get("title"),
        description: row.get("description"),
        content: row.get("content"),
        author_id: row.get("author_id"),
        author_name: row.get("author_name"),
        created_at: row.get::<_, DateTime<Utc>>("created_at"),
        likes: row.get("likes"),
        views: row.get("views"),
        tags: row.get("tags"),
        liked_by_current_user: false, // Set by caller if needed
    }
}

type SqlParams = (
    String,
    Vec<Box<dyn tokio_postgres::types::ToSql + Send + Sync>>,
);
type MaybeSqlParams = Option<SqlParams>;
