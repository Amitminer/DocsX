# DocsX Backend

Rust (Actix Web) backend for DocsX: a blazing-fast, AI-powered documentation and tutorial platform.

---

## ✨ Features

- RESTful API for docs, assets, and slugs
- PostgreSQL database with connection pooling
- JWT authentication (Clerk)
- CORS protection, input validation, and rate limiting
- AI integration for content enhancement
- Social features: like/unlike, engagement
- Scalable, production-ready architecture

---

## 🚀 Quick Start

### Prerequisites

- Rust 1.70+
- PostgreSQL 14+
- (Optional) Docker

### Local Development

```bash
cd docsx-backend
cp env.example .env
# Edit .env with your database and Clerk config
cargo run --release
```
Runs at: [http://localhost:8080](http://localhost:8080)

### Docker

```bash
docker build -t docsx-backend .
docker run -p 8080:8080 --env-file .env docsx-backend
```

---

## ⚙️ Environment Variables

See `.env.example` for all required variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/docsx
RUST_LOG=info
ALLOWED_ORIGIN=http://localhost:3000
CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
PORT=8080
HOST=0.0.0.0
```

---

## 🗄️ Database Setup

```sql
CREATE DATABASE docsx;
CREATE USER docsx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE docsx TO docsx_user;
```

---

## 📁 Source Structure

```
src/
  api/        # API route handlers (docs, assets, slugs)
  auth/       # Authentication logic (Clerk, JWT)
  db/         # Database operations
  handlers/   # Business logic
  models/     # Data models
  utils/      # Utilities
  main.rs     # Entry point
```

---

## 📡 API Overview

- See [API_USAGE.md](API_USAGE.md) for full details and examples.

**Key Endpoints:**

| Method | Endpoint                  | Description                |
|--------|---------------------------|----------------------------|
| GET    | /api/docs                 | List all documents         |
| GET    | /api/docs?id={uuid}       | Get a specific document    |
| POST   | /api/docs/create          | Create a new document      |
| POST   | /api/docs/update?id={uuid}| Update a document          |
| POST   | /api/docs/delete?id={uuid}| Delete a document          |
| POST   | /api/docs/like?id={uuid}  | Like a document            |
| POST   | /api/docs/unlike?id={uuid}| Unlike a document          |

---

## 🔒 Security

- JWT authentication (Clerk)
- CORS, input validation, and SQL injection prevention
- Rate limiting and user ownership checks

---

## 🧪 Development

```bash
cargo run           # Dev mode
cargo run --release # Release mode
cargo test          # Run tests
cargo clippy        # Lint
cargo fmt           # Format code
```

---

## 🤝 Contributing

1. Fork & branch
2. Make changes (+ tests)
3. Ensure all tests pass
4. Submit a pull request

---

## 📄 License

MIT License © [AmitxD](https://github.com/Amitminer)

---