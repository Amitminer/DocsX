/**
 * @file not-found.tsx
 * @description This component serves as a custom 404 Not Found page for the DocsX application.
 * It provides a user-friendly interface when a requested page or resource cannot be found.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import HeaderBar from "@/components/header-bar"
import { File, AlertCircle } from "lucide-react"
import Link from "next/link"

/**
 * `CustomNotFoundPage` component displays a custom 404 error page.
 * It informs the user that the requested page was not found and provides a link to return to the home page.
 *
 * @returns {JSX.Element} The rendered 404 Not Found page.
 */
export default function CustomNotFoundPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex flex-col">
			{/* Ambient background effects */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
			</div>
			<HeaderBar />
			<main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
				<div className="relative bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md w-full text-center">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-3xl"></div>
					<div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
						<AlertCircle className="w-10 h-10 text-red-400" />
					</div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">404 - Page Not Found</h1>
					<p className="text-gray-400 mb-8 text-lg leading-relaxed">
						Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
					</p>
					<Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl">
						<File className="w-5 h-5" />
						Go Back Home
					</Link>
				</div>
			</main>
		</div>
	)
}