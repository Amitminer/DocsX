//! AmitxD DocsX - Main Entry Point
//! Copyright 2025 AmitxD
//!
//! This is the main entry point for the DocsX backend server.
//! It sets up the database connection, initializes the logger, configures CORS,
//! and starts the Actix web server. It's the conductor of our orchestra.

mod api;
mod auth;
mod db;
mod handlers;
mod models;
mod utils;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, App, HttpServer};
use db::postgres::{create_pool_with_retry, init_db};
use dotenvy::dotenv;
use std::env;

/// The main function that starts the DocsX backend server.
///
/// This function performs the following steps:
/// 1. Loads environment variables from a `.env` file.
/// 2. Initializes the logger.
/// 3. Connects to the PostgreSQL database with retry logic.
/// 4. Initializes the database schema.
/// 5. Configures and starts the Actix web server.
///
/// # Returns
///
/// A `std::io::Result<()>` which is `Ok(())` if the server runs successfully,
/// or an `Err` if the server fails to start.
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables from `.env` file
    dotenv().ok();
    env_logger::init();

    println!("🟢 Starting DocsX server...");

    // Fetch database URL or fallback to default
    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
        println!("⚠️ DATABASE_URL not set, using default.");
        "postgresql://localhost/docsx".to_string()
    });

    println!("🔌 Connecting to database: {}", database_url);

    // Create a connection pool with retries
    let pool = create_pool_with_retry(&database_url, 5)
        .await
        .expect("❌ Failed to create database pool");

    println!("✅ Database pool created. Initializing...");

    // Initialize the database schema
    init_db(&pool)
        .await
        .expect("❌ Failed to initialize database");

    println!("🚀 DocsX server running at http://localhost:8080");

    let port = env::var("BACKEND_PORT").unwrap_or_else(|_| {
        println!("⚠️ BACKEND_PORT not set, using default");
        "8080".to_string()
    });

    let port_num = port.parse::<u16>().expect("Failed to parse port number");

    // Start the server
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(Logger::default())
            .wrap(configure_cors())
            // Public asset serving
            .configure(api::assets::public_asset_config)
            // Public and Protected API routes
            .service(
                web::scope("/api")
                    .configure(api::assets::protected_asset_config)
                    .configure(api::docs::config),
            )
    })
    .bind(("0.0.0.0", port_num))?
    .run()
    .await
}

/// Configures CORS middleware with allowed origins from the `ALLOWED_ORIGIN` environment variable.
///
/// This function reads the `ALLOWED_ORIGIN` environment variable, which is expected to be a
/// comma-separated list of URLs. It then configures the `Cors` middleware to allow requests
/// from these origins.
///
/// # Returns
///
/// A `Cors` middleware instance configured with the allowed origins.
fn configure_cors() -> Cors {
    let origins = env::var("ALLOWED_ORIGIN").unwrap_or_default();

    let allowed_origins: Vec<String> = origins
        .split(',')
        .map(|origin| origin.trim().to_string())
        .filter(|origin| !origin.is_empty())
        .collect();

    let mut cors = Cors::default()
        .allowed_methods(vec!["GET", "POST", "PUT", "OPTIONS", "DELETE"])
        .allowed_headers(vec!["Authorization", "Content-Type"])
        .max_age(3600);

    for origin in allowed_origins {
        cors = cors.allowed_origin(&origin);
    }

    cors
}
