use actix_multipart::MultipartError;
use actix_web::{HttpResponse, ResponseError};
use serde_json::json;
use thiserror::Error;
use validator::ValidationErrors;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] tokio_postgres::Error),

    #[error("Pool error: {0}")]
    Pool(#[from] deadpool_postgres::PoolError),

    #[error("Not found")]
    NotFound,

    #[allow(dead_code)]
    #[error("Unauthorized")]
    Unauthorized,

    #[error("Forbidden")]
    Forbidden,

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal server error")]
    Internal,

    #[error("UUID parse error: {0}")]
    UuidParse(#[from] uuid::Error),

    #[error("Parse error: {0}")]
    ParseError(#[from] std::string::ParseError),
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        log::error!("IO Error: {}", error);
        AppError::Internal
    }
}

impl From<MultipartError> for AppError {
    fn from(error: MultipartError) -> Self {
        log::error!("Multipart Error: {}", error);
        AppError::Validation(format!("File upload error: {}", error))
    }
}

impl From<ValidationErrors> for AppError {
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

pub type AppResult<T> = Result<T, AppError>;
