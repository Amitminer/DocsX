//! AmitxD DocsX - error
//! Copyright 2025 AmitxD
//!
//! This module defines the custom error types used throughout the application.
//! It's the single source of truth for all things that can go wrong.
//! It's like a catalog of failures, but in a good way.

use actix_multipart::MultipartError;
use actix_web::{HttpResponse, ResponseError};
use serde_json::json;
use thiserror::Error;
use validator::ValidationErrors;

/// The main error type for the application.
/// It's a collection of all the possible errors that can occur.
#[derive(Error, Debug)]
pub enum AppError {
    /// A database error occurred.
    #[error("Database error: {0}")]
    Database(#[from] tokio_postgres::Error),

    /// A connection pool error occurred.
    #[error("Pool error: {0}")]
    Pool(#[from] deadpool_postgres::PoolError),

    /// The requested resource was not found.
    #[error("Not found")]
    NotFound,

    /// The user is not authorized to perform the action.
    #[allow(dead_code)]
    #[error("Unauthorized")]
    Unauthorized,

    /// The user is forbidden from performing the action.
    #[error("Forbidden")]
    Forbidden,

    /// A validation error occurred.
    #[error("Validation error: {0}")]
    Validation(String),

    /// An internal server error occurred.
    #[error("Internal server error")]
    Internal,

    /// A UUID parsing error occurred.
    #[error("UUID parse error: {0}")]
    UuidParse(#[from] uuid::Error),

    /// A parsing error occurred.
    #[error("Parse error: {0}")]
    ParseError(#[from] std::string::ParseError),
}

impl From<std::io::Error> for AppError {
    /// Converts a `std::io::Error` into an `AppError`.
    fn from(error: std::io::Error) -> Self {
        log::error!("IO Error: {}", error);
        AppError::Internal
    }
}

impl From<MultipartError> for AppError {
    /// Converts a `MultipartError` into an `AppError`.
    fn from(error: MultipartError) -> Self {
        log::error!("Multipart Error: {}", error);
        AppError::Validation(format!("File upload error: {}", error))
    }
}

impl From<ValidationErrors> for AppError {
    /// Converts a `ValidationErrors` into an `AppError`.
    fn from(errors: ValidationErrors) -> Self {
        // You can customize how you format the errors
        let messages: Vec<String> = errors
            .field_errors()
            .into_iter()
            .map(|(field, errs)| {
                let msgs: Vec<String> = errs
                    .iter()
                    .map(|e| e.message.as_ref().unwrap().to_string())
                    .collect();
                format!("{}: {}", field, msgs.join(", "))
            })
            .collect();

        AppError::Validation(messages.join("; "))
    }
}

impl ResponseError for AppError {
    /// Creates an `HttpResponse` from an `AppError`.
    fn error_response(&self) -> HttpResponse {
        match self {
            AppError::NotFound => HttpResponse::NotFound().json(json!({
                "error": "Resource not found"
            })),
            AppError::Unauthorized => HttpResponse::Unauthorized().json(json!({
                "error": "Authentication required"
            })),
            AppError::Forbidden => HttpResponse::Forbidden().json(json!({
                "error": "Access denied"
            })),
            AppError::Validation(msg) => HttpResponse::BadRequest().json(json!({
                "error": "Validation failed",
                "message": msg
            })),
            AppError::Database(e) => {
                log::error!("Database error: {}", e);
                HttpResponse::InternalServerError().json(json!({
                    "error": "Database error occurred"
                }))
            }
            AppError::Pool(e) => {
                log::error!("Pool error: {}", e);
                HttpResponse::InternalServerError().json(json!({
                    "error": "Connection pool error"
                }))
            }
            AppError::UuidParse(_) => HttpResponse::BadRequest().json(json!({
                "error": "Invalid UUID format"
            })),
            AppError::ParseError(_) => {
                log::error!("Parse error: {}", self);
                HttpResponse::BadRequest().json(json!({
                    "error": "Parse error"
                }))
            }
            _ => {
                log::error!("Internal server error: {}", self);
                HttpResponse::InternalServerError().json(json!({
                    "error": "Internal server error"
                }))
            }
        }
    }
}

/// A type alias for a `Result` with the `AppError` type.
pub type AppResult<T> = Result<T, AppError>;
