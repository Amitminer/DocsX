use crate::utils::error::AppError;
use deadpool_postgres::{Config, Pool, Runtime};
use std::time::Duration;
use tokio::time::sleep;
use tokio_postgres::NoTls;

pub type DbPool = Pool;

pub async fn create_pool(database_url: &str) -> Result<DbPool, AppError> {
    // Parse the database URL using url crate for easier parsing
    let url = url::Url::parse(database_url).map_err(|e| {
        log::error!("Failed to parse database URL: {}", e);
        AppError::Internal
    })?;

    // Create deadpool config
    let mut cfg = Config::new();
    cfg.host = Some(url.host_str().unwrap_or("localhost").to_string());
    cfg.port = url.port();
    cfg.user = Some(url.username().to_string());
    cfg.password = url.password().map(|p| p.to_string());
    cfg.dbname = Some(url.path().trim_start_matches('/').to_string());

    let pool = cfg.create_pool(Some(Runtime::Tokio1), NoTls).map_err(|e| {
        log::error!("Failed to create pool: {}", e);
        AppError::Internal
    })?;

    // Test the connection
    let client = pool.get().await?;
    client.execute("SELECT 1", &[]).await?;
    log::info!("Database connection established successfully");

    Ok(pool)
}

/// Tries to create a pool with retry logic, retrying if connection fails (e.g. Postgres not ready yet)
pub async fn create_pool_with_retry(
    database_url: &str,
    max_retries: usize,
) -> Result<DbPool, AppError> {
    let mut retries = max_retries;

    loop {
        match create_pool(database_url).await {
            Ok(pool) => {
                log::info!(
                    "✅ Connected to Postgres after {} attempt(s)",
                    max_retries - retries
                );
                return Ok(pool);
            }
            Err(e) => {
                if retries == 0 {
                    log::error!("❌ Could not connect to DB after retries: {:?}", e);
                    return Err(e);
                }

                log::warn!(
                    "🔁 DB not ready, retrying in 2s... ({} retries left)",
                    retries
                );
                retries -= 1;
                sleep(Duration::from_secs(2)).await;
            }
        }
    }
}

pub async fn init_db(pool: &DbPool) -> Result<(), AppError> {
    let client = pool.get().await?;

    client
        .execute(
            r#"
        CREATE TABLE IF NOT EXISTS docs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            likes INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0
        )
        "#,
            &[],
        )
        .await?;

    client
        .execute(
            r#"
        CREATE TABLE IF NOT EXISTS doc_likes (
            doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            PRIMARY KEY (doc_id, user_id)
        )
        "#,
            &[],
        )
        .await?;

    // Create doc_views table for rate limiting views per IP
    client
        .execute(
            r#"
        CREATE TABLE IF NOT EXISTS doc_views (
            doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
            ip_hash TEXT NOT NULL,
            last_viewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (doc_id, ip_hash)
        )
        "#,
            &[],
        )
        .await?;

    // Create doc_tags table for document tags
    client
        .execute(
            r#"
        CREATE TABLE IF NOT EXISTS doc_tags (
            doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
            tag TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (doc_id, tag)
        )
        "#,
            &[],
        )
        .await?;

    client
        .execute(
            "ALTER TABLE docs ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'",
            &[],
        )
        .await?;

    // Create doc_assets table
    client
        .execute(
            r#"
        CREATE TABLE IF NOT EXISTS doc_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          doc_id UUID REFERENCES docs(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#,
            &[],
        )
        .await?;

    // Create doc_slugs table
    client
        .execute(
            r#"
        CREATE TABLE IF NOT EXISTS doc_slugs (
            doc_id UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
            slug TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (slug)
        )
        "#,
            &[],
        )
        .await?;

    // Create indexes
    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_docs_created_at ON docs(created_at DESC)",
            &[],
        )
        .await?;

    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_docs_likes ON docs(likes DESC)",
            &[],
        )
        .await?;

    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_docs_author_id ON docs(author_id)",
            &[],
        )
        .await?;

    client
        .execute(
            "CREATE INDEX IF NOT EXISTS idx_doc_assets_doc_id ON doc_assets(doc_id)",
            &[],
        )
        .await?;

    log::info!("Database tables initialized successfully");
    Ok(())
}
