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

/// Configures CORS middleware with allowed origins from .env
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
