use crate::utils::error::AppError;

use super::clerk::{ClerkAuth, UserInfo};
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    Error, HttpMessage, HttpRequest,
};
use futures_util::future::LocalBoxFuture;
use std::future::{ready, Ready};
use std::rc::Rc;
use std::sync::Arc;
use tokio::sync::Mutex as TokioMutex;

pub struct AuthMiddleware {
    clerk_auth: Arc<TokioMutex<ClerkAuth>>,
}

impl AuthMiddleware {
    pub fn new() -> Self {
        Self {
            clerk_auth: Arc::new(TokioMutex::new(ClerkAuth::new())),
        }
    }
}

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareService {
            service: Rc::new(service),
            clerk_auth: self.clerk_auth.clone(),
        }))
    }
}

pub struct AuthMiddlewareService<S> {
    service: Rc<S>,
    clerk_auth: Arc<TokioMutex<ClerkAuth>>,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let auth_header = req
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string());

        let clerk_auth = self.clerk_auth.clone();
        let service = self.service.clone();

        let fut = async move {
            if let Some(token) = auth_header {
                let token = token.clone();
                let auth = clerk_auth.lock().await;
                let verify_result = auth.verify_token(&token).await;
                match verify_result {
                    Ok(user_info) => {
                        req.extensions_mut().insert(user_info);
                        let res = service.call(req).await?;
                        Ok(res)
                    }
                    Err(e) => {
                        log::warn!("Authentication failed: {}", e);
                        Err(actix_web::error::ErrorUnauthorized("Invalid token"))
                    }
                }
            } else {
                Err(actix_web::error::ErrorUnauthorized(
                    "Missing Authorization header",
                ))
            }
        };

        Box::pin(fut)
    }
}

// Helper function to extract user from request
pub fn extract_user_from_request(req: &HttpRequest) -> Result<UserInfo, AppError> {
    req.extensions()
        .get::<UserInfo>()
        .cloned()
        .ok_or(AppError::Unauthorized)
}

// // Helper to extract user_id as String
// fn extract_user_id(req: &HttpRequest) -> AppResult<String> {
//     let user_info = extract_user_from_request(req)?;
//     Ok(user_info.user_id)
// }
