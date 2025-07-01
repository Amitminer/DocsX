import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { AuthProvider } from "@/components/auth"
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DocsX - Blazing-fast AI-powered documentation platform",
  description: "DocsX is a documentation and tutorial platform to help you create, share, and discover tutorials and docs—powered by AI and a modern tech stack.",
  keywords: "DocsX, documentation, tutorials, markdown, AI, Next.js, Rust, Actix, Clerk, search, blogging, tech docs, knowledge base, instant search, Google AI, open source",
}

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
