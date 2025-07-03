//! AmitxD DocsX - Assets API
//! Copyright 2025 AmitxD
//!
//! This module defines the API endpoints for managing document assets.
//! It provides routes for uploading, serving, listing, and deleting assets
//! associated with a document. It's the digital janitor for our assets.

use crate::auth::middleware::AuthMiddleware;
use crate::handlers::asset_handler::{delete_asset, list_assets, serve_asset, upload_asset};
use actix_web::web;

/// Configures the public routes for serving assets.
///
/// # Arguments
///
/// * `cfg` - The service configuration.
pub fn public_asset_config(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/assets/{doc_id}/{filename:.*}").route(web::get().to(serve_asset)));
}

/// Configures the protected routes for managing assets.
///
/// # Arguments
///
/// * `cfg` - The service configuration.
pub fn protected_asset_config(cfg: &mut web::ServiceConfig) {
    // Protected routes for uploading and listing assets
    cfg.service(
        web::scope("/docs/{doc_id}/assets")
            .wrap(AuthMiddleware::new())
            .route("", web::post().to(upload_asset))
            .route("", web::get().to(list_assets))
            .route("/{asset_id}", web::delete().to(delete_asset)),
    );
}
