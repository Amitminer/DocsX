//! AmitxD DocsX - Clerk Authentication
//! Copyright 2025 AmitxD
//!
//! This module handles the authentication logic using Clerk.
//! It provides a way to verify JWT tokens and extract user information.
//! It's the bouncer of our club, checking IDs at the door.

use crate::utils::error::{AppError, AppResult};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use tokio::sync::Mutex as TokioMutex;

/// The claims contained in the Clerk JWT.
/// This is the information we get from Clerk about the user.
#[derive(Debug, Serialize, Deserialize)]
pub struct ClerkClaims {
    /// The user ID.
    pub sub: String,
    /// The user's email address.
    pub email: Option<String>,
    /// The user's given name.
    pub given_name: Option<String>,
    /// The user's family name.
    pub family_name: Option<String>,
    /// The user's username.
    pub username: Option<String>,
    /// The expiration time of the token.
    pub exp: usize,
    /// The time the token was issued at.
    pub iat: usize,
    /// The issuer of the token.
    pub iss: String,
}

/// The user information extracted from the JWT.
/// This is the information we use to identify the user in our system.
#[derive(Debug, Clone)]
pub struct UserInfo {
    /// The user ID.
    pub user_id: String,
    /// The user's username.
    pub username: Option<String>,
}

/// The Clerk authentication service.
/// This service is responsible for verifying JWT tokens from Clerk.
pub struct ClerkAuth {
    jwks_cache: TokioMutex<HashMap<String, DecodingKey>>,
}

impl ClerkAuth {
    /// Creates a new `ClerkAuth` instance.
    pub fn new() -> Self {
        Self {
            jwks_cache: TokioMutex::new(HashMap::new()),
        }
    }

    /// Verifies a JWT token and extracts the user information.
    ///
    /// # Arguments
    ///
    /// * `token` - The JWT token to verify.
    ///
    /// # Returns
    ///
    /// A `Result` containing the `UserInfo` if the token is valid, or an `AppError` otherwise.
    pub async fn verify_token(&self, token: &str) -> AppResult<UserInfo> {
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

    /// Gets the decoding key for a given key ID (kid).
    ///
    /// # Arguments
    ///
    /// * `kid` - The key ID to get the decoding key for.
    ///
    /// # Returns
    ///
    /// A `Result` containing the `DecodingKey` if it is found, or an `AppError` otherwise.
    async fn get_decoding_key(&self, kid: &str) -> AppResult<DecodingKey> {
        log::debug!("Getting decoding key for kid: {}", kid);

        // Check cache first
        {
            let cache = self.jwks_cache.lock().await;
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
        {
            let mut cache = self.jwks_cache.lock().await;
            cache.insert(kid.to_string(), decoding_key.clone());
        }

        log::debug!("Successfully cached decoding key for kid: {}", kid);
        Ok(decoding_key)
    }

    /// Gets the Clerk issuer URL from the environment variables.
    fn get_issuer(&self) -> String {
        env::var("CLERK_ISSUER").expect("CLERK_ISSUER environment variable must be set!")
    }
}

/// The response from the JWKS endpoint.
#[derive(Debug, Deserialize)]
struct JWKSResponse {
    keys: Vec<Jwk>,
}

/// A JSON Web Key (JWK).
#[derive(Debug, Deserialize)]
struct Jwk {
    kid: String,
    n: String,
    e: String,
}
