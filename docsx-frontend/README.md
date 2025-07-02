# DocsX Frontend

Next.js 15 frontend for DocsX: a modern, AI-powered documentation and tutorial platform.

---

## ✨ Features

- Create, edit, and view docs/tutorials in Markdown
- AI-powered summaries and content enhancement (Google AI)
- Authentication via Clerk
- Fast search, social features, and responsive UI (Tailwind CSS)
- Custom URLs, dark mode, and mobile-first design

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Running DocsX backend

### Local Development

```bash
cd docsx-frontend
pnpm install
cp env.example .env.local
# Edit .env.local with your API keys and config
pnpm run dev
```
Runs at: [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

See `.env.example` for all required variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## 🗂️ Source Structure

```
app/         # Next.js App Router (pages, API routes, middleware)
components/  # Reusable React components (AI, auth, doc-view, UI)
hooks/       # Custom React hooks
lib/         # Utilities and config
public/      # Static assets
```

---

## 🛠️ Scripts

```bash
pnpm run dev        # Start dev server
pnpm run build      # Build for production
pnpm run start      # Start production server
pnpm run lint       # Run ESLint
pnpm run type-check # TypeScript check
```

---

## 🔒 Security

- Clerk authentication
- Role-based access control
- Input validation and XSS/CSRF protection

---

## 🤝 Contributing

1. Fork & branch
2. Make changes (+ tests)
3. Submit a pull request

---

## 📄 License

MIT License © [AmitxD](https://github.com/Amitminer) 