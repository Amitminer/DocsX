# DocsX Frontend

This is the Next.js 15 frontend for DocsX, a modern documentation and tutorial platform.

## Features

- Create, edit, and view docs/tutorials in Markdown
- AI-powered summaries and content enhancement (Google AI)
- Authentication via Clerk
- Responsive, modern UI (Tailwind CSS)
- Fast search and community engagement features

## Getting Started

```bash
pnpm install
cp env.example .env.local
# Edit .env.local with your API keys and config
pnpm run dev
```

- App runs at: http://localhost:3000

## Environment Variables

See `.env.example` for all required variables (API base URL, Clerk keys, Google AI key, etc).

## Customization

- Theme: Edit `tailwind.config.ts` and `app/globals.css`
- API base URL: Set in `.env.local`

## 🎯 Features

- **📝 Markdown Editor**: Rich markdown editing with live preview
- **🔍 Advanced Search**: Fast, real-time search across all documents
- **🤖 AI Integration**: AI-powered content summaries and enhancement
- **👥 User Authentication**: Secure authentication via Clerk
- **❤️ Social Features**: Like, bookmark, and share documents
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🌙 Dark Mode**: Beautiful dark theme with smooth transitions
- **⚡ Performance**: Optimized for speed with Next.js 15

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- A running DocsX backend server

### Installation

```bash
# Clone the repository (if not already done)
git clone https://github.com/Amitminer/DocsX
cd DocsX/docsx-frontend

# Install dependencies
pnpm install

# Copy environment file
cp env.example .env.local

# Edit environment variables
nano .env.local

# Start development server
pnpm run dev
```

Your frontend will be available at: http://localhost:3000

## 🔧 Environment Configuration

Create a `.env.local` file in the `docsx-frontend` directory:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# AI Integration
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Getting API Keys

1. **Clerk Authentication**:
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your publishable and secret keys

2. **Google AI API**:
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create an API key for Gemini models

## 📁 Frontend Source Structure

```
docsx-frontend/
├── app/           # Next.js App Router (pages, API routes, middleware)
├── components/    # Reusable React components (AI, auth, doc-view, dropdowns, UI, types)
├── hooks/         # Custom React hooks (data fetching, AI, UI helpers)
├── lib/           # Utility functions and configuration
├── public/        # Static assets (images, logos, etc.)
└── styles/        # Additional stylesheets
```

For details on each module, see the comments in the respective files.

## 🎨 Key Components

### Authentication
- **AuthProvider**: Manages authentication state
- **SignInModal**: User sign-in interface
- **SignUpModal**: User registration interface
- **UserButton**: User profile and actions

### Document Management
- **DocForm**: Create and edit documents
- **DocView**: Display documents with markdown rendering
- **DocsGrid**: Grid layout for document listings
- **DocCard**: Individual document card component

### AI Features
- **AISummaryModal**: AI-powered document summaries
- **EnhanceContent**: AI content enhancement

### UI Components
- **Button**: Consistent button styling
- **Dialog**: Modal dialogs
- **Toast**: Notification system
- **ThemeProvider**: Dark/light theme management

## 🛠️ Available Scripts

```bash
# Development
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run lint         # Run ESLint

# Type checking
pnpm run type-check   # Check TypeScript types
```

## 🎯 Key Features Explained

### 1. Markdown Support
- Full markdown rendering with syntax highlighting
- Code block support with language detection
- Math equation support (KaTeX)
- GitHub Flavored Markdown (GFM)

### 2. AI Integration
- **Document Summarization**: Get AI-generated summaries
- **Content Enhancement**: Improve document quality
- **Smart Suggestions**: AI-powered writing assistance

### 3. Search & Discovery
- Real-time search across all documents
- Filter by author, date, and popularity
- Sort by creation date, likes, or relevance

### 4. Social Features
- Like/unlike documents
- Bookmark favorite documents
- Share documents with others
- View author profiles

### 5. Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Adaptive layouts for all screen sizes

## 🔒 Security Features

- **Authentication**: Secure user authentication via Clerk
- **Authorization**: Role-based access control
- **Input Validation**: Client-side and server-side validation
- **XSS Protection**: Sanitized markdown rendering
- **CSRF Protection**: Built-in Next.js protection

## 🚀 Performance Optimizations

- **Next.js 15**: Latest performance improvements
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Intelligent caching strategies
- **Bundle Analysis**: Optimized bundle sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with Next.js 15, TypeScript, and Tailwind CSS** 