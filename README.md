# 📚 DocsX

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**DocsX** is a blazing-fast, AI-powered documentation and tutorial platform. Create, share, and discover docs and tutorials with instant search, smart AI features, and a beautiful modern UI.

---

## ✨ Features

- 📝 **Markdown Docs & Tutorials**: Rich editing and viewing in Markdown.
- ⚡ **Instant Search**: Millisecond-fast, full-text search.
- 🤖 **AI Summaries & Enhancement**: Google AI (Gemini) for smarter docs.
- 🔒 **Secure Auth**: Clerk + JWT for robust authentication.
- 💬 **Community Engagement**: Like, bookmark, and interact.
- 🌗 **Modern UI**: Next.js 15 + Tailwind CSS, dark mode by default.
- 🏷️ **Custom URLs**: Share docs with memorable slugs.
- 🗂️ **Asset Support**: Attach files and media to docs.

---

## 🚀 Quick Start

### One-liner (Linux)

```bash
chmod +x start.sh
./start.sh
```

- Installs Docker & Docker Compose if missing
- Sets up your `.env` file
- Starts DocsX with Docker Compose

*For other OS, see manual setup below.*

---

## 🛠️ Manual Setup

### Prerequisites

- [Rust (latest stable)](https://www.rust-lang.org/tools/install)
- [Node.js v20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Docker](https://docs.docker.com/get-docker/) (optional, for containers)

### Backend (Rust + Actix)

```bash
cd docsx-backend
cp env.example .env
# Edit .env with your config
cargo run --release
```
Runs at: [http://localhost:8080](http://localhost:8080)

### Frontend (Next.js + Tailwind)

```bash
cd docsx-frontend
pnpm install
cp env.example .env.local
# Edit .env.local with your config
pnpm run dev
```
Runs at: [http://localhost:3000](http://localhost:3000)

---

## 🐳 Docker Support

```bash
git clone https://github.com/Amitminer/DocsX
cd DocsX
cp .env.example .env
# Edit .env with your keys (Clerk, Google AI, database, etc.)
docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8080](http://localhost:8080)

---

## ⚙️ Environment Variables

- Edit the root `.env` file for Docker, or service-specific `.env` files for local dev.
- See `.env.example` and `docsx-backend/env.example` for required variables.

---

## 📡 API Reference

- Full API docs: [docsx-backend/API_USAGE.md](docsx-backend/API_USAGE.md)
- Example endpoints: `/api/docs`, `/api/assets`, `/api/slugs`

---

## 🧱 Tech Stack

| Layer      | Tech                                      |
| ---------- | ----------------------------------------- |
| Backend    | Rust, Actix Web, PostgreSQL, JWT, Clerk   |
| Frontend   | Next.js 15, React, TypeScript, Tailwind   |
| AI         | Google AI (Gemini)                        |
| Auth       | Clerk                                     |
| Infra      | Docker, Railway, Vercel                   |

---

## 📂 Project Structure

```
DocsX/
  docsx-frontend/    # Next.js frontend
  docsx-backend/     # Rust backend
  README.md          # (this file)
  docker-compose.yml # Docker orchestration
  start.sh           # Linux quickstart script
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (+ tests if needed)
4. Ensure all tests pass
5. Submit a pull request

---

## 📄 More Info

- [Frontend Docs](docsx-frontend/README.md)
- [Backend Docs](docsx-backend/README.md)
- [API Usage](docsx-backend/API_USAGE.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

© 2025 [AmitxD](https://github.com/Amitminer)

---

**Built with Rust, Actix Web, Next.js, TypeScript, and ❤️**

---
 