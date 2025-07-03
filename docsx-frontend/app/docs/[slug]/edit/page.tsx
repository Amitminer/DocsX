/**
 * @file page.tsx
 * @description This page allows users to edit existing documentation entries.
 * It fetches the document data, pre-fills the `DocForm`, and handles the update submission to the backend API.
 * It also manages loading states, errors, and user permissions.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import HeaderBar from "@/components/header-bar"
import DocForm from "@/components/doc-form"
import { useAuth, useUser } from "@clerk/nextjs"
import { useCallback } from "react"
import { AlertCircle, Home, Eye, X, Edit } from "lucide-react"
import type { Doc } from "@/components/types/doc-view"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"

/**
 * `EditPage` component provides the interface for editing existing documentation.
 * It fetches the document based on the slug from the URL, pre-populates the `DocForm`,
 * and handles the submission of updated document data to the backend.
 * It also includes robust error handling and permission checks.
 *
 * @returns {JSX.Element} The rendered edit document page.
 */
export default function EditPage() {
	/** @type {ReturnType<typeof useParams>} Next.js hook to access route parameters. */
	const params = useParams()
	/** @type {ReturnType<typeof useRouter>} Next.js router instance for navigation. */
	const router = useRouter()
	/** @type {ReturnType<typeof useAuth>["getToken"]} Function to get the authentication token from Clerk. */
	const { getToken } = useAuth()
	/** @type {ReturnType<typeof useUser>["user"]} Current authenticated user from Clerk. */
	const { user } = useUser()
	/** @type {[Doc | null, React.Dispatch<React.SetStateAction<Doc | null>>]} State to store the fetched document data. */
	const [doc, setDoc] = useState<Doc | null>(null)
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if the document is currently loading. */
	const [loading, setLoading] = useState(true)
	/** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} State to store any error messages during document fetching. */
	const [error, setError] = useState<string | null>(null)
	/** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} State to store any error messages during form submission. */
	const [submitError, setSubmitError] = useState<string | null>(null)
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if the form is currently submitting. */
	const [isSubmitting, setIsSubmitting] = useState(false)

	/**
	 * Fetches the document data from the backend API based on the slug.
	 * Handles authentication and various error scenarios, including not found, forbidden, and unauthorized.
	 * Also checks if the current user is the author of the document.
	 */
	const fetchDoc = useCallback(async () => {
		try {
			setLoading(true)
			const token = await getToken({ template: "docs" })

			const response = await fetch(`${config.apiBaseUrl}/docs?id=${params.slug}`, {
				headers: {
					...(token && { Authorization: `Bearer ${token}` }),
				},
			})

			if (!response.ok) {
				if (response.status === 404) {
					throw new Error("Documentation not found")
				} else if (response.status === 403) {
					throw new Error("You don't have permission to edit this documentation")
				} else if (response.status === 401) {
					throw new Error("You must be logged in to edit documentation")
				} else {
					try {
						const errorData = await response.json()
						throw new Error(errorData.message || `Server error: ${response.status}`)
					} catch {
						throw new Error(`Failed to fetch documentation (${response.status})`)
					}
				}
			}

			const data: Doc = await response.json()

			if (user && data.author_id !== user.id) {
				throw new Error("You can only edit your own documentation")
			}

			setDoc(data)
		} catch (err) {
			console.error("Error fetching doc:", err)
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}, [getToken, params.slug, user])


	/**
	 * Effect hook to fetch the document when the component mounts or when `params.slug` or `user` changes.
	 */
	useEffect(() => {
		if (params.slug) {
			fetchDoc()
		}
	}, [params.slug, user, fetchDoc])


	/**
	 * Handles the submission of the document update form.
	 * Sends a POST request to the backend API to update the document.
	 * @param {object} data - The updated document data from the form.
	 * @param {string} data.title - The title of the document.
	 * @param {string} data.description - The description of the document.
	 * @param {string} data.content - The content of the document.
	 * @param {string[]} [data.tags] - An array of tags for the document.
	 * @throws {Error} If authentication token is missing, required fields are empty, or API request fails.
	 */
	const handleSubmit = async (data: { title: string; description: string; content: string; imageUrl?: string; videoUrl?: string; tags?: string[] }) => {
		if (!doc) return

		try {
			setIsSubmitting(true)
			setSubmitError(null)

			const token = await getToken({ template: "docs" })
			if (!token) {
				throw new Error("You must be logged in to update documentation")
			}
			if (!data.title || !data.description || !data.content) {
				throw new Error("Title, description, and content are required")
			}

			const response = await fetch(`${config.apiBaseUrl}/docs/update?id=${doc.id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					title: data.title,
					description: data.description,
					content: data.content,
					tags: data.tags || [],
				}),
			})

			if (!response.ok) {
				if (response.status === 403) {
					throw new Error("You don't have permission to update this documentation")
				} else if (response.status === 401) {
					throw new Error("You must be logged in to update documentation")
				} else {
					try {
						const errorData = await response.json()
						throw new Error(errorData.message || `Failed to update documentation (${response.status})`)
					} catch {
						throw new Error(`Failed to update documentation (${response.status})`)
					}
				}
			}

			router.push(`/docs/${doc.id}`)
		} catch (err) {
			console.error("Error updating doc:", err)
			setSubmitError(err instanceof Error ? err.message : "Failed to update documentation")
		} finally {
			setIsSubmitting(false)
		}
	}

	/**
	 * Handles the cancellation of the form.
	 * Redirects the user back to the document view page or home page if the document is not found.
	 */
	const handleCancel = () => {
		if (doc) {
			router.push(`/docs/${doc.id}`)
		} else {
			router.push("/")
		}
	}

	// Renders a loading state while the document is being fetched.
	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
				{/* Ambient background effects */}
				<div className="fixed inset-0 overflow-hidden pointer-events-none">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
				</div>

				<HeaderBar />
				<main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="max-w-5xl mx-auto">
						<div className="bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl animate-pulse">
							{/* Decorative elements */}
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-t-3xl"></div>

							{/* Loading header */}
							<div className="flex items-center gap-3 mb-8">
								<div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
									<Edit className="w-6 h-6 text-blue-400" />
								</div>
								<div>
									<div className="h-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg w-24 mb-2"></div>
									<div className="h-8 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl w-64"></div>
								</div>
							</div>

							{/* Loading form fields */}
							<div className="space-y-8">
								<div className="space-y-3">
									<div className="h-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg w-16"></div>
									<div className="h-12 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl"></div>
								</div>
								<div className="space-y-3">
									<div className="h-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg w-24"></div>
									<div className="h-24 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl"></div>
								</div>
								<div className="space-y-3">
									<div className="h-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg w-32"></div>
									<div className="h-64 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl"></div>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
		)
	}

	// Renders an error message if the document is not found or the user does not have permission.
	if (error || !doc) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
				{/* Ambient background effects */}
				<div className="fixed inset-0 overflow-hidden pointer-events-none">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl"></div>
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
				</div>

				<HeaderBar />
				<main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="text-center py-16">
						<div className="relative bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-2xl mx-auto">
							{/* Decorative elements */}
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-3xl"></div>

							<div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
								<AlertCircle className="w-10 h-10 text-red-400" />
							</div>

							<h3 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
								{error || "Documentation not found"}
							</h3>
							<p className="text-gray-400 mb-8 text-lg leading-relaxed">
								{error?.includes("permission")
									? "You can only edit documentation that you created."
									: "The documentation you're looking for might have been deleted or moved."}
							</p>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Button
									onClick={() => router.push("/")}
									className="group flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
								>
									<Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
									Back to Home
								</Button>
								{doc && (
									<Button
										onClick={() => router.push(`/docs/${doc.id}`)}
										className="group flex items-center justify-center gap-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/80 hover:to-gray-600/80 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl border border-gray-600/30"
									>
										<Eye className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
										View Documentation
									</Button>
								)}
							</div>
						</div>
					</div>
				</main>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
			{/* Ambient background effects */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
			</div>

			<HeaderBar />

			<main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Error Alert */}
				{submitError && (
					<div className="max-w-5xl mx-auto mb-6">
						<div className="relative bg-gradient-to-r from-red-900/60 via-red-800/60 to-red-900/60 backdrop-blur-xl border border-red-600/50 rounded-2xl p-4 sm:p-6 shadow-2xl">
							{/* Decorative top line */}
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 rounded-t-2xl"></div>

							<div className="flex items-start space-x-4">
								<div className="w-10 h-10 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
									<AlertCircle className="w-5 h-5 text-red-400" />
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-red-400 font-bold text-lg mb-1">Update Failed</h3>
									<p className="text-red-300 leading-relaxed">{submitError}</p>
								</div>
								<Button
									onClick={() => setSubmitError(null)}
									className="group w-8 h-8 bg-gradient-to-br from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
								>
									<X className="w-4 h-4 text-red-400 group-hover:rotate-90 transition-transform duration-300" />
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Page Header */}
				<div className="bg-gradient-to-br from-gray-900/80 to-slate-900/80 rounded-xl shadow-md px-4 py-2 mb-4 flex flex-col items-center">
					<span className="text-xs text-purple-300 font-semibold mb-1 tracking-wider text-center">Edit Mode</span>
					<span className="flex items-center gap-2 text-base sm:text-lg font-bold text-white break-words text-center">
						{doc.title || "Untitled Document"}
					</span>
				</div>

				<DocForm
					initialData={{
						id: doc.id,
						title: doc.title,
						description: doc.description,
						content: doc.content,
					}}
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					isEditing={true}
					isSubmitting={isSubmitting}
				/>
			</main>
		</div>
	)
}