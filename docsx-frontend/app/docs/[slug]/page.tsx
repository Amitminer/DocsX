"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { Transition } from "@headlessui/react"
import HeaderBar from "@/components/header-bar"
import DocView from "@/components/doc-view"
import { useAuth, useUser } from "@clerk/nextjs"
import type { Doc } from "@/components/types/doc-view"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { config } from "@/lib/config"
import CustomNotFoundPage from "@/app/not-found"

async function resolveDocId(slug: string): Promise<string | null> {
	// If slug looks like a UUID, try to fetch the doc directly
	if (/^[a-fA-F0-9-]{36}$/.test(slug)) {
		return slug;
	}
	// Otherwise, resolve the slug via the API
	try {
		const res = await fetch(`/api/custom-slugs/${slug}`);
		if (res.ok) {
			const data = await res.json();
			if (data && data.doc_id) {
				return data.doc_id;
			}
		}
		return null;
	} catch {
		return null;
	}
}

export async function getCustomSlugForId(docId: string): Promise<string | null> {
	try {
		const res = await fetch(`/api/custom-slugs?docId=${docId}`);
		if (!res.ok) return null;
		const data = await res.json();
		if (data && data.slug) {
			return data.slug;
		}
		return null;
	} catch {
		return null;
	}
}

export default function DocViewPage() {
	const params = useParams()
	const router = useRouter()
	const { getToken } = useAuth()
	const { user, isSignedIn } = useUser()
	const [doc, setDoc] = useState<Doc | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [actionError, setActionError] = useState<string | null>(null)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [customSlug, setCustomSlug] = useState<string | null>(null)

	const fetchDoc = useCallback(async (incrementView = false) => {
		try {
			setLoading(true)
			const slug = params.slug as string
			const docId = await resolveDocId(slug)
			if (!docId) throw new Error("Documentation not found")
			// If accessed by ID and a custom slug exists, redirect
			if (/^\d+$/.test(slug)) {
				const customSlug = await getCustomSlugForId(docId)
				if (customSlug && customSlug !== slug) {
					router.replace(`/docs/${customSlug}`)
					return
				}
			}
			const response = await fetch(`${config.apiBaseUrl}/docs?id=${docId}`)

			if (!response.ok) {
				if (response.status === 404) {
					CustomNotFoundPage();
					// throw new Error("Documentation not found")
				} else {
					try {
						const errorData = await response.json()
						throw new Error(errorData.message || `Failed to fetch documentation (${response.status})`)
					} catch {
						throw new Error(`Failed to fetch documentation (${response.status})`)
					}
				}
			}

			const data: Doc = await response.json()

			// Increment view count only on initial load (rate-limited by backend)
			if (incrementView) {
				try {
					const viewResponse = await fetch(`${config.apiBaseUrl}/docs/view?id=${docId}`, {
						method: "POST",
					})
					if (viewResponse.ok) {
						const viewData = await viewResponse.json()
						// Update the view count in the data
						data.views = viewData.views || data.views
					}
				} catch (error) {
					// Silently fail - view increment is not critical
					console.warn("Failed to increment view count:", error)
				}
			}

			// Fetch custom slug for this doc
			const customSlugForDoc = await getCustomSlugForId(docId)
			setCustomSlug(customSlugForDoc)

			// Fetch like status if user is logged in
			if (isSignedIn) {
				try {
					const token = await getToken({ template: "docs" })
					const likeRes = await fetch(`${config.apiBaseUrl}/docs/likes?id=${docId}`, {
						headers: token ? { Authorization: `Bearer ${token}` } : {},
					})
					if (likeRes.ok) {
						const likeData = await likeRes.json()
						// likeData: { likes: number, liked_by_current_user: boolean }
						setDoc({ ...data, likes: likeData.likes, liked_by_current_user: likeData.liked_by_current_user })
						return
					}
				} catch { }
			}
			// fallback for not logged in
			setDoc({ ...data, liked_by_current_user: false })
		} catch (err) {
			console.error("Error fetching doc:", err)
			setError(err instanceof Error ? err.message : "An error occurred")
		} finally {
			setLoading(false)
		}
	}, [params.slug, isSignedIn, getToken, router])

	useEffect(() => {
		if (params.slug) {
			fetchDoc(true) // Increment view on initial load
		}
	}, [params.slug, fetchDoc])

	// Add to recently viewed docs in localStorage
	useEffect(() => {
		if (doc && doc.id && doc.title) {
			try {
				const key = 'recentDocs';
				const stored = localStorage.getItem(key);
				let recent = stored ? JSON.parse(stored) as Array<{ id: string; title: string; slug: string }> : [];
				recent = recent.filter((d: { id: string; title: string; slug: string }) => d.id !== doc.id); // Remove if already present
				recent.unshift({ id: doc.id, title: doc.title, slug: params.slug as string });
				recent = recent.slice(0, 8); // Keep only last 8
				localStorage.setItem(key, JSON.stringify(recent));
			} catch {}
		}
	}, [doc, params.slug]);

	const handleDelete = async () => {
		if (!doc || !user) {
			return
		}

		// Check if user is the author or admin
		if (!canDelete) {
			setActionError("You don't have permission to delete this documentation")
			return
		}

		try {
			setIsDeleting(true)
			setActionError(null)

			const token = await getToken({ template: "docs" })
			if (!token) {
				throw new Error("You must be logged in to delete documentation")
			}

			const response = await fetch(`${config.apiBaseUrl}/docs/delete?id=${doc.id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})

			if (!response.ok) {
				if (response.status === 403) {
					throw new Error("You don't have permission to delete this documentation")
				} else if (response.status === 401) {
					throw new Error("You must be logged in to delete documentation")
				} else {
					try {
						const errorData = await response.json()
						throw new Error(errorData.message || `Failed to delete documentation (${response.status})`)
					} catch {
						throw new Error(`Failed to delete documentation (${response.status})`)
					}
				}
			}

			// Remove custom slug mapping if exists
			await fetch("/api/custom-slugs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ docId: doc.id, custom: "__DELETE__" })
			})

			router.push("/")
		} catch (err) {
			console.error("Error deleting doc:", err)
			setActionError(err instanceof Error ? err.message : "Failed to delete documentation")
		} finally {
			setIsDeleting(false)
			setShowDeleteConfirm(false)
		}
	}

	const handleEdit = () => {
		if (!doc || !user) {
			return
		}

		// Check if user is the author (only authors can edit, not admins)
		if (!canEdit) {
			setActionError("You can only edit your own documentation")
			return
		}

		router.push(`/docs/${params.slug}/edit`)
	}

	const handleDownload = () => {
		if (!doc) return;
		const blob = new Blob([doc.content], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${doc.title || "document"}.md`;
		document.body.appendChild(a);
		a.click();
		setTimeout(() => {
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}, 100);
	};

	// Check if current user is the author of the document or admin
	const isAuthor = user && doc && user.id === doc.author_id
	const isAdmin = user && (user.username === "admin" || user.primaryEmailAddress?.emailAddress === "admin@example.com")
	const canEdit = isAuthor
	const canDelete = isAuthor || isAdmin

	if (loading) {
		return (
			<div className="min-h-screen bg-black">
				<HeaderBar />
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<Transition
						as="div"
						show={loading}
						enter="transition-all duration-500 ease-out"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="transition-all duration-300 ease-in"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<div className="max-w-4xl mx-auto">
							<div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8 animate-pulse">
								<div className="h-8 bg-gray-800 rounded mb-6"></div>
								<div className="flex justify-between mb-4">
									<div className="h-4 bg-gray-800 rounded w-48"></div>
									<div className="h-4 bg-gray-800 rounded w-24"></div>
								</div>
								<div className="space-y-3">
									<div className="h-4 bg-gray-800 rounded w-full"></div>
									<div className="h-4 bg-gray-800 rounded w-3/4"></div>
									<div className="h-4 bg-gray-800 rounded w-1/2"></div>
								</div>
							</div>
						</div>
					</Transition>
				</main>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-black">
				<HeaderBar />
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="max-w-4xl mx-auto text-center">
						<div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
							<h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
							<p className="text-gray-400 mb-6">{error}</p>
							<Button
								onClick={() => router.push("/")}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
							>
								Go Back Home
							</Button>
						</div>
					</div>
				</main>
			</div>
		)
	}

	if (!doc) {
		return (
			<div className="min-h-screen bg-black">
				<HeaderBar />
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="max-w-4xl mx-auto text-center">
						<div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
							<h1 className="text-2xl font-bold text-gray-300 mb-4">Documentation Not Found</h1>
							<p className="text-gray-400 mb-6">The documentation you&apos;re looking for doesn&apos;t exist.</p>
							<Button
								onClick={() => router.push("/")}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
							>
								Go Back Home
							</Button>
						</div>
					</div>
				</main>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-black">
			<HeaderBar />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Transition
					as="div"
					show={!loading && !!doc}
					enter="transition-all duration-700 ease-out"
					enterFrom="opacity-0 translate-y-8"
					enterTo="opacity-100 translate-y-0"
					leave="transition-all duration-500 ease-in"
					leaveFrom="opacity-100 translate-y-0"
					leaveTo="opacity-0 translate-y-8"
				>
					<DocView
						id={doc.id}
						docId={doc.id}
						title={doc.title}
						author={doc.author_name}
						authorId={doc.author_id}
						authorImageUrl={doc.author_image_url}
						createdDate={formatDate(doc.created_at)}
						likes={doc.likes}
						content={doc.content}
						views={doc.views}
						tags={doc.tags}
						isAuthor={isAuthor || false}
						onDelete={handleDelete}
						onEdit={handleEdit}
						onBookmark={() => {}}
						onReport={() => {}}
						onDownload={handleDownload}
						likeDisabled={false}
						customUrl={customSlug || undefined}
					/>
				</Transition>
			</main>

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
					onClick={() => setShowDeleteConfirm(false)}
				>
					<div
						className="bg-gray-900 p-6 rounded-lg border border-gray-700 max-w-md w-mx"
						onClick={e => e.stopPropagation()}
					>
						<h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
						<p className="text-gray-300 mb-6">Are you sure you want to delete this documentation? This action cannot be undone.</p>
						<div className="flex gap-3 justify-end">
							<Button
								onClick={() => setShowDeleteConfirm(false)}
								disabled={isDeleting}
								className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
							>
								Cancel
							</Button>
							<Button
								onClick={handleDelete}
								disabled={isDeleting}
								className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
							>
								{isDeleting ? "Deleting..." : "Delete"}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Action Error Display */}
			{actionError && (
				<div className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50">
					{actionError}
					<button
						onClick={() => setActionError(null)}
						className="ml-2 text-red-200 hover:text-white"
					>
						×
					</button>
				</div>
			)}
		</div>
	)
}