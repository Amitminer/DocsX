use crate::auth::middleware::AuthMiddleware;
use crate::handlers::asset_handler::{delete_asset, list_assets, serve_asset, upload_asset};
use actix_web::web;

pub fn public_asset_config(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/assets/{doc_id}/{filename:.*}").route(web::get().to(serve_asset)));
}

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
