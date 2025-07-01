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
  title: "DocsHub - Documentation Blog",
  description: "A modern documentation blog platform",
    generator: 'Next.js',
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
