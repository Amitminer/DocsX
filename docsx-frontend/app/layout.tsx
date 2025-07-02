/**
 * @file layout.tsx
 * @description This is the root layout component for the DocsX frontend application.
 * It sets up the Clerk authentication provider, applies global styles, and defines metadata for the application.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { AuthProvider } from "@/components/auth"
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

/**
 * Metadata for the DocsX application.
 * This object defines the title, description, and keywords for the application,
 * which are used for SEO and browser display.
 */
export const metadata: Metadata = {
  title: "DocsX - Blazing-fast AI-powered documentation platform",
  description: "DocsX is a documentation and tutorial platform to help you create, share, and discover tutorials and docs—powered by AI and a modern tech stack.",
  keywords: "DocsX, documentation, tutorials, markdown, AI, Next.js, Rust, Actix, Clerk, search, blogging, tech docs, knowledge base, instant search, Google AI, open source",
}

/**
 * The root layout component for the DocsX application.
 * This component wraps the entire application, providing global contexts such as Clerk authentication
 * and a toast notification system. It also applies global CSS and sets the HTML language.
 *
 * @param {Object} props - The properties for the RootLayout component.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {JSX.Element} The rendered root layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <AuthProvider>
        <html lang="en" className="dark">
          <head />
          <body className={inter.className}>
            {children}
            <Toaster richColors theme="dark" />
          </body>
        </html>
      </AuthProvider>
    </ClerkProvider>
  )
}