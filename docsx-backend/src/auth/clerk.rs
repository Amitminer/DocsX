use crate::utils::error::{AppError, AppResult};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClerkClaims {
    pub sub: String,           // User ID
    pub email: Option<String>, // User email (optional)
    pub given_name: Option<String>,
    pub family_name: Option<String>,
    pub username: Option<String>,
    pub exp: usize,  // Expiration time
    pub iat: usize,  // Issued at
    pub iss: String, // Issuer
}

#[derive(Debug, Clone)]
pub struct UserInfo {
    pub user_id: String,
    pub username: Option<String>,
}

pub struct ClerkAuth {
    jwks_cache: Option<HashMap<String, DecodingKey>>,
}

impl ClerkAuth {
    pub fn new() -> Self {
        Self { jwks_cache: None }
    }

    pub async fn verify_token(&mut self, token: &str) -> AppResult<UserInfo> {
        // Remove "Bearer " prefix if present
        let token = token.strip_prefix("Bearer ").unwrap_or(token);

        log::debug!(
            "Attempting to verify token: {}...",
            &token[..std::cmp::min(20, token.len())]
        );

        // Decode JWT header to get key ID (kid)
        let header = jsonwebtoken::decode_header(token).map_err(|e| {
            log::error!("Failed to decode JWT header: {}", e);
            AppError::Unauthorized
        })?;

        log::debug!("JWT Header: {:?}", header);

        let kid = header.kid.ok_or_else(|| {
            log::error!("No 'kid' found in JWT header");
            AppError::Unauthorized
        })?;

        // Just log basic info - we'll let the proper verification handle everything
        log::debug!("Token kid: {}", kid);

        // Get or fetch the public key
        let decoding_key = self.get_decoding_key(&kid).await?;

        // Set up validation with clock skew tolerance
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[&self.get_issuer()]);
        validation.leeway = 60; // Allow 60 seconds of clock skew

        log::debug!("Validation settings: {:?}", validation);

        // Decode and verify the token
        let token_data = decode::<ClerkClaims>(token, &decoding_key, &validation).map_err(|e| {
            log::error!("JWT decode error: {}", e);
            match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                    log::error!("Token has expired - client needs to refresh token");
                }
                jsonwebtoken::errors::ErrorKind::InvalidIssuer => {
                    log::error!("Invalid issuer - check CLERK_ISSUER environment variable");
                }
                jsonwebtoken::errors::ErrorKind::InvalidSignature => {
                    log::error!("Invalid signature - check if using correct JWKS endpoint");
                }
                _ => {}
            }
            AppError::Unauthorized
        })?;

        let claims = token_data.claims;
        log::debug!("Successfully verified token for user: {}", claims.sub);

        Ok(UserInfo {
            user_id: claims.sub,
            username: claims.username,
        })
    }

    async fn get_decoding_key(&mut self, kid: &str) -> AppResult<DecodingKey> {
        log::debug!("Getting decoding key for kid: {}", kid);

        // Check cache first
        if let Some(ref cache) = self.jwks_cache {
            if let Some(key) = cache.get(kid) {
                log::debug!("Found cached key for kid: {}", kid);
                return Ok(key.clone());
            }
        }

        // Fetch JWKS from Clerk
        let jwks_url = format!("{}/.well-known/jwks.json", self.get_issuer());
        log::debug!("Fetching JWKS from: {}", jwks_url);

        let response = reqwest::get(&jwks_url).await.map_err(|e| {
            log::error!("Failed to fetch JWKS from {}: {}", jwks_url, e);
            AppError::Internal
        })?;

        let jwks: JWKSResponse = response.json().await.map_err(|e| {
            log::error!("Failed to parse JWKS: {}", e);
            AppError::Internal
        })?;

        log::debug!("Fetched JWKS with {} keys", jwks.keys.len());
        for key in &jwks.keys {
            log::debug!("Available key ID: {}", key.kid);
        }

        // Find the key with matching kid
        let jwk = jwks.keys.iter().find(|k| k.kid == kid).ok_or_else(|| {
            log::error!("Key ID '{}' not found in JWKS", kid);
            AppError::Unauthorized
        })?;

        // Convert JWK to DecodingKey
        let decoding_key = DecodingKey::from_rsa_components(&jwk.n, &jwk.e).map_err(|e| {
            log::error!("Failed to create decoding key: {}", e);
            AppError::Internal
        })?;

        // Cache the key
        if self.jwks_cache.is_none() {
            self.jwks_cache = Some(HashMap::new());
        }

        if let Some(ref mut cache) = self.jwks_cache {
            cache.insert(kid.to_string(), decoding_key.clone());
        }

        log::debug!("Successfully cached decoding key for kid: {}", kid);
        Ok(decoding_key)
    }

    fn get_issuer(&self) -> String {
        env::var("CLERK_ISSUER").expect("CLERK_ISSUER environment variable must be set!")
    }
}

#[derive(Debug, Deserialize)]
struct JWKSResponse {
    keys: Vec<JWK>,
}

#[derive(Debug, Deserialize)]
struct JWK {
    kid: String,
    n: String,
    e: String,
}
