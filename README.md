# 📚 DocsX

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Stop repeating yourself!** DocsX is a blazing-fast documentation and tutorial platform to help you create, share, and discover tutorials and docs—powered by AI and a modern tech stack.

---

## ✨ Features

- 📝 **Markdown Docs & Tutorials**: Write and edit in rich Markdown.
- ⚡ **Instant Search**: Find docs and answers in milliseconds.
- 🤖 **AI Summaries & Enhancement**: Google AI for smarter docs.
- 🔒 **Secure Auth**: Clerk + JWT for robust authentication.
- 💬 **Community Engagement**: Like, bookmark, and interact.
- 🌗 **Modern UI**: Next.js 15 + Tailwind CSS, dark mode by default.
- 🏷️ **Custom URLs**: Share docs with memorable slugs.
- 🗂️ **Asset Support**: Attach files and media to docs.

---

## 🚀 Getting Started

On **Linux**, you can simply run:

```bash
chmod +x start.sh
./start.sh
```

This will:
- Install Docker & Docker Compose if missing
- Set up your .env file
- Start DocsX with Docker Compose

*Only for Linux users. For other OS, follow the manual Docker or local setup below.*

---

### 🛠️ Local Development Setup

#### Prerequisites
- [Rust (latest stable)](https://www.rust-lang.org/tools/install)
- [Node.js v20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

#### Backend (Rust + Actix)
```bash
cd docsx-backend
cp env.example .env
# Edit .env with your config
cargo run --release
```
Runs at: `http://localhost:8080`

#### Frontend (Next.js + Tailwind)
```bash
cd docsx-frontend
pnpm install
cp env.example .env.local
# Edit .env.local with your config
pnpm run dev
```
Runs at: `http://localhost:3000`

---

## 🐳 Docker Support

You only need to edit the **root `.env` file** for all environment variables. Docker Compose will automatically use this file for both frontend and backend services.

#### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose v2+](https://docs.docker.com/compose/install/)

#### ▶️ Run Everything with Docker
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

## ⚙️ Environment Configuration

- Edit the root `.env` file with your Clerk, Google AI, and database keys.
- No need to edit service-specific env files for Docker usage.
- See `.env.example` for required variables.

---

## 📡 API Reference

See [API Usage](docsx-backend/API_USAGE.md) for full details and examples.

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
  DEPLOYMENT.md      # Deployment guide
```

---

## 📄 More Info
- [Frontend Docs](docsx-frontend/README.md)
- [Backend Docs](docsx-backend/README.md)
- [API Usage](docsx-backend/API_USAGE.md)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

© 2025 [AmitxD](https://github.com/Amitminer)
 