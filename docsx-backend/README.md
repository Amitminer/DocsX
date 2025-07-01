# DocsX Backend

This is the Rust (Actix Web) backend for DocsX.

## Features

- RESTful API for docs, assets, and slugs
- PostgreSQL database
- JWT authentication (Clerk)
- CORS protection and input validation
- AI integration for content enhancement

## Getting Started

```bash
# Install Rust if needed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

cp env.example .env
# Edit .env with your database and Clerk config

cargo run --release
```

- API runs at: http://localhost:8080

## Environment Variables

See `.env.example` for all required variables (database URL, Clerk issuer, etc).

## Project Structure

- `src/api/` – API route handlers
- `src/auth/` – Auth middleware
- `src/db/` – Database logic
- `src/handlers/` – Business logic
- `src/models/` – Data models
- `src/utils/` – Utilities

## 🎯 Features

- **🚀 Blazing Fast**: Built with Rust and Actix Web for maximum performance
- **🔒 Secure**: JWT authentication, CORS protection, and input validation
- **📊 PostgreSQL**: Reliable, feature-rich database with connection pooling
- **🔍 Search**: Fast document search and filtering
- **❤️ Social**: Like/unlike functionality with user engagement
- **📝 CRUD Operations**: Full Create, Read, Update, Delete for documents
- **🛡️ Rate Limiting**: Protection against abuse and overload
- **📈 Scalable**: Designed for horizontal scaling

## 🚀 Quick Start

### Prerequisites

- Rust 1.70+ ([Install Rust](https://rustup.rs/))
- PostgreSQL 14+
- Docker (optional, for containerized setup)

### Installation

```bash
# Clone the repository (if not already done)
git clone https://github.com/yourusername/docsx.git
cd docsx/docsx-backend

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env

# Install dependencies and run
cargo run --release
```

Your API will be available at: http://localhost:8080

### Docker Setup

```bash
# Build and run with Docker
docker build -t docsx-backend .
docker run -p 8080:8080 --env-file .env docsx-backend
```

## 🔧 Environment Configuration

Create a `.env` file in the `docsx-backend` directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/docsx

# Logging
RUST_LOG=info

# CORS Configuration
ALLOWED_ORIGIN=http://localhost:3000

# Clerk Authentication
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev

# Server Configuration
PORT=8080
HOST=0.0.0.0
```

### Database Setup

```sql
-- Create database
CREATE DATABASE docsx;

-- Create user (optional)
CREATE USER docsx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE docsx TO docsx_user;
```

## 📁 Project Structure

```
docsx-backend/
├── src/
│   ├── api/               # API route handlers
│   │   └── docs.rs        # Document endpoints
│   ├── auth/              # Authentication middleware
│   │   ├── clerk.rs       # Clerk integration
│   │   └── middleware.rs  # JWT middleware
│   ├── db/                # Database operations
│   │   ├── mod.rs         # Database module
│   │   └── postgres.rs    # PostgreSQL connection
│   ├── handlers/          # Business logic
│   │   └── doc_handler.rs # Document operations
│   ├── models/            # Data models
│   │   ├── mod.rs         # Models module
│   │   └── doc.rs         # Document model
│   ├── utils/             # Utility functions
│   │   ├── mod.rs         # Utils module
│   │   └── error.rs       # Error handling
│   └── main.rs            # Application entry point
├── Cargo.toml             # Rust dependencies
└── Dockerfile             # Docker configuration
```

## 📁 Backend Source Structure

```
docsx-backend/src/
├── api/         # API route handlers (docs, assets, slugs)
├── auth/        # Authentication logic (Clerk, JWT middleware)
├── db/          # Database operations (PostgreSQL connection, migrations)
├── handlers/    # Business logic (document and asset handlers)
├── models/      # Data models (Doc, DocAsset)
├── utils/       # Utility functions (error handling, helpers)
└── main.rs      # Application entry point
```

For details on each module, see the comments in the respective files.

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/docs` | Get all documents (with pagination) |
| `GET` | `/api/docs?id={uuid}` | Get specific document |
| `GET` | `/api/docs/likes?id={uuid}` | Get document likes |

### Protected Endpoints (Require Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/docs/create` | Create new document |
| `POST` | `/api/docs/update?id={uuid}` | Update document |
| `POST` | `/api/docs/delete?id={uuid}` | Delete document |
| `POST` | `/api/docs/like?id={uuid}` | Like document |
| `POST` | `/api/docs/unlike?id={uuid}` | Unlike document |

## 📖 API Usage Examples

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     http://localhost:8080/api/docs
```

### Create Document

```bash
curl -X POST http://localhost:8080/api/docs/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Getting Started with Rust",
    "description": "A comprehensive guide to Rust programming",
    "content": "# Getting Started with Rust\n\nRust is a systems programming language..."
  }'
```

### Get Documents

```bash
# Get all documents
curl http://localhost:8080/api/docs

# Get documents with pagination
curl "http://localhost:8080/api/docs?page=1&limit=10"

# Search documents
curl "http://localhost:8080/api/docs?search=rust"

# Filter by author
curl "http://localhost:8080/api/docs?author=user123"

# Sort by likes
curl "http://localhost:8080/api/docs?sort_by=likes"
```

### Update Document

```bash
curl -X POST "http://localhost:8080/api/docs/update?id=DOCUMENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content..."
  }'
```

### Like/Unlike Document

```bash
# Like a document
curl -X POST "http://localhost:8080/api/docs/like?id=DOCUMENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Unlike a document
curl -X POST "http://localhost:8080/api/docs/unlike?id=DOCUMENT_UUID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🗄️ Database Schema

### Documents Table

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    author_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    likes INTEGER DEFAULT 0
);

CREATE INDEX idx_documents_author_id ON documents(author_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_likes ON documents(likes);
```

### Likes Table

```sql
CREATE TABLE document_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, user_id)
);

CREATE INDEX idx_document_likes_document_id ON document_likes(document_id);
CREATE INDEX idx_document_likes_user_id ON document_likes(user_id);
```

## 🔒 Security Features

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Clerk Integration**: Third-party authentication provider
- **Token Validation**: Automatic token verification on protected routes

### Authorization
- **User Ownership**: Users can only modify their own documents
- **Input Validation**: Comprehensive validation using `validator` crate
- **SQL Injection Prevention**: Parameterized queries with `tokio-postgres`

### CORS Protection
```rust
// Configured CORS middleware
let mut cors = Cors::default()
    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
    .allowed_headers(vec!["Authorization", "Content-Type"])
    .max_age(3600);
```

### Rate Limiting
- Built-in protection against abuse
- Configurable limits per endpoint
- Automatic request throttling

## 🚀 Performance Features

### Connection Pooling
```rust
// Efficient database connection pooling
let pool = create_pool_with_retry(&database_url, 5).await?;
```

### Optimized Queries
- Indexed database queries
- Efficient pagination
- Smart caching strategies

### Async/Await
- Non-blocking I/O operations
- Concurrent request handling
- High throughput processing

## 🛠️ Development

### Available Commands

```bash
# Development
cargo run              # Run in development mode
cargo run --release    # Run in release mode

# Testing
cargo test             # Run tests
cargo test --release   # Run tests in release mode

# Building
cargo build            # Build debug version
cargo build --release  # Build release version

# Code Quality
cargo clippy           # Run linter
cargo fmt             # Format code
```

### Logging

```bash
# Set log level
export RUST_LOG=debug

# Run with specific log level
RUST_LOG=info cargo run
```

### Database Migrations

```bash
# Run database initialization
cargo run --bin init-db

# Check database connection
cargo run --bin check-db
```

## 🧪 Testing

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_create_document

# Run tests with output
cargo test -- --nocapture

# Run integration tests
cargo test --test integration_tests
```

## 📊 Monitoring

### Health Check

```bash
# Check API health
curl http://localhost:8080/api/health

# Check database connection
curl http://localhost:8080/api/health/db
```

### Metrics

- Request count and response times
- Database connection pool status
- Error rates and types
- Memory usage and performance

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U username -d docsx
   ```

2. **Authentication Issues**
   - Verify Clerk configuration
   - Check JWT token validity
   - Ensure CORS settings are correct

3. **Build Errors**
   ```bash
   # Update Rust
   rustup update
   
   # Clean and rebuild
   cargo clean
   cargo build
   ```

4. **Performance Issues**
   - Check database indexes
   - Monitor connection pool usage
   - Review query performance

### Debug Mode

```bash
# Enable debug logging
RUST_LOG=debug cargo run

# Run with backtrace
RUST_BACKTRACE=1 cargo run
```

## 🔄 Deployment

### Production Build

```bash
# Build release version
cargo build --release

# Run production server
./target/release/docsx-backend
```

### Docker Deployment

```bash
# Build Docker image
docker build -t docsx-backend .

# Run container
docker run -p 8080:8080 --env-file .env docsx-backend
```

### Environment Variables for Production

```env
# Production settings
RUST_LOG=info
DATABASE_URL=postgresql://user:pass@prod-db:5432/docsx
ALLOWED_ORIGIN=https://yourdomain.com
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎨 Backend Theme & API Style

While the backend has no user-facing UI theme, it follows a strong design philosophy for developer experience:

- **Consistent API Responses**: All endpoints return clear, well-structured JSON, with predictable success and error formats.
- **RESTful Conventions**: Endpoints and HTTP methods follow REST best practices for clarity and interoperability.
- **Error Handling**: Errors are returned with meaningful messages and status codes, making debugging and integration easier.
- **Documentation**: This README and [API_USAGE.md](API_USAGE.md) provide detailed, example-driven docs for every endpoint and feature.

This approach ensures the backend is as pleasant and reliable for developers as the frontend is for end users.

---

**Built with Rust, Actix Web, and PostgreSQL for maximum performance and reliability**