/**
 * @file page.tsx
 * @description This is the main home page component for the DocsX frontend application.
 * It displays a list of documentation and tutorials, provides search and filtering capabilities,
 * and integrates AI features like summarization. It also handles loading states, errors, and pagination.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { Transition } from "@headlessui/react"
import HeaderBar from "@/components/header-bar"
import { AlertCircle, RefreshCw, Bookmark, BookOpen, File, Heart } from "lucide-react"
import SortDropdown from "@/components/dropdowns/SortDropdown"
import DocsGrid from "@/components/DocsGrid"
import AISummaryModal from "@/components/ai/AISummaryModal"
import { useAISummary } from "@/hooks/use-ai-summary"
import { useDocs } from "@/hooks/useDocs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import RecentsDropdown from "@/components/dropdowns/RecentsDropdown"
import { SmartSearch } from "@/components/ai/smart-search"

/**
 * The main home page component for the DocsX frontend.
 * It fetches and displays documentation, handles search, sorting, pagination,
 * and integrates AI summarization and bookmarking features.
 *
 * @returns {JSX.Element} The rendered home page.
 */
export default function HomePage() {
	/** @type {React.MutableRefObject<Record<string, string | undefined>>} Ref to cache author profile picture URLs. */
	const pfpCache = useRef<Record<string, string | undefined>>({})
	/** @type {[Record<string, string | undefined>, React.Dispatch<React.SetStateAction<Record<string, string | undefined>>]} State to store author image URLs. */
	const [authorImages, setAuthorImages] = useState<Record<string, string | undefined>>({})
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to track if profile pictures have been loaded. */
	const [pfpLoaded, setPfpLoaded] = useState(false)
	/** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} State to store the ID of the document for which a summary is active. */
	const [activeSummaryDocId, setActiveSummaryDocId] = useState<string | null>(null);
	/** @type {ReturnType<typeof useAISummary>} Hook for AI summarization functionality. */
	const {
		showSummary,
		summary,
		isGeneratingSummary,
		handleSummarize,
		setShowSummary,
		setSummary,
	} = useAISummary();
	/** @type {[object, React.Dispatch<React.SetStateAction<object>>]} State for filter parameters (currently unused, but part of the original hook). */
	const [filterParams] = useState<{ author?: string; tags?: string[]; date?: string; sort?: string }>({})
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to toggle displaying bookmarked documents. */
	const [showBookmarks, setShowBookmarks] = useState(false)
	/** @type {ReturnType<typeof useDocs>} Hook for document fetching and management. */
	const {
		docs,
		loading,
		error,
		currentPage,
		totalPages,
		sortBy,
		setSortBy,
		searchQuery,
		setSearchQuery,
		handlePageChange,
		fetchDocs,
		hasMore,
		loadMore,
		loadingMore,
	} = useDocs(filterParams)
	/** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the current search input value. */
	const [searchValue, setSearchValue] = useState("")

	// Footer constants
	/** @type {number} The current year for the footer copyright. */
	const currentYear = new Date().getFullYear()
	/** @type {string} The GitHub repository link for DocsX. */
	const CurrentGithubLink = "https://github.com/Amitminer/DocsX"

	/**
	 * Effect to fetch author profile pictures based on unique author IDs from fetched documents.
	 * Caches fetched URLs to avoid redundant API calls.
	 */
	useEffect(() => {
		if (docs.length === 0) return;
		const uniqueAuthors = Array.from(new Set(docs.map(doc => doc.author_id).filter(Boolean)));
		if (uniqueAuthors.length === 0) return;
		// Check cache first
		const uncached = uniqueAuthors.filter(id => !pfpCache.current[id]);
		if (uncached.length === 0) {
			setAuthorImages({ ...pfpCache.current });
			setPfpLoaded(true);
			return;
		}
		fetch(`/api/clerk?userIds=${uncached.join(',')}`)
			.then(res => res.ok ? res.json() : {})
			.then((data: Record<string, string | undefined>) => {
				uncached.forEach(id => {
					pfpCache.current[id] = data[id] || undefined;
				});
				setAuthorImages({ ...pfpCache.current });
				setPfpLoaded(true);
			});
	}, [docs]);

	// Renders an error message if document fetching fails.
	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 contain-paint">
				{/* Ambient background effects */}
				<div className="fixed inset-0 overflow-hidden pointer-events-none will-change-transform transform-gpu">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-2xl will-change-transform transform-gpu"></div>
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-2xl will-change-transform transform-gpu"></div>
				</div>

				<HeaderBar />
				<main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
					<div className="flex items-center justify-center min-h-[60vh]">
						<div className="relative bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80 backdrop-blur-xl will-change-transform border border-gray-700/50 rounded-3xl p-8 sm:p-12 shadow-2xl max-w-md">
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-t-3xl"></div>

							<div className="text-center">
								<div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
									<AlertCircle className="w-8 h-8 text-red-400" />
								</div>

								<h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-3">
									Failed to load docs
								</h3>
								<p className="text-gray-400 mb-6 text-sm">{error}</p>

								<Button
									onClick={() => {
										if (loading) return;
										fetchDocs(currentPage, searchQuery, sortBy);
									}}
									className="group inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/30"
								>
									<RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
									Retry
								</Button>
							</div>
						</div>
					</div>
				</main>
			</div>
		)
	}

	/**
	 * Handles a click on a tag, adding it to the search query and refetching documents.
	 * @param {string} tag - The tag to add to the search query.
	 */
	const handleTagClick = (tag: string) => {
		const newQuery = searchQuery.includes(`tag:${tag}`) ? searchQuery : `${searchQuery} tag:${tag}`.trim();
		setSearchQuery(newQuery);
		handlePageChange(1);
	};

	/**
	 * Handles the smart search submission, updating the search query and resetting to the first page.
	 */
	const handleSmartSearch = () => {
		setSearchQuery(searchValue)
		handlePageChange(1)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 contain-paint">
			{/* Ambient background effects */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none will-change-transform transform-gpu">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-2xl will-change-transform transform-gpu"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl will-change-transform transform-gpu"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-2xl will-change-transform transform-gpu"></div>
			</div>

			<HeaderBar />

			{/* Search Bar Row */}
			<section className="w-full max-w-3xl mx-auto mt-8 mb-6 px-4">
				<div className="flex flex-row items-center gap-2 w-full">
					<div className="flex-1">
						<SmartSearch
							value={searchValue}
							onChange={setSearchValue}
							onSearch={handleSmartSearch}
							placeholder="Search docs, tags, authors..."
						/>
					</div>
					<button
						onClick={() => {
							setShowBookmarks(v => {
								const next = !v;
								setSortBy(next ? "bookmarked" : "created_at");
								return next;
							});
						}}
						className={`ml-2 p-2 rounded-full border border-gray-700 bg-gradient-to-br from-gray-900/80 to-gray-800/80 text-yellow-400 hover:bg-yellow-400/10 transition-all duration-200 ${showBookmarks ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''}`}
						title="Show Bookmarked"
					>
						<Bookmark className={`w-6 h-6 ${showBookmarks ? 'fill-yellow-400' : 'fill-none'}`} />
					</button>
				</div>
				<div className="mt-3 flex justify-center gap-2">
					<div className="w-full max-w-xs">
						<SortDropdown sortBy={sortBy} onSortChange={setSortBy} />
					</div>
					<div className="w-full max-w-xs">
						<RecentsDropdown />
					</div>
				</div>
			</section>

			<main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Compact Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
							<BookOpen className="w-4 h-4 text-purple-400" />
						</div>
						<h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
							Documentation & Tutorials
						</h1>
					</div>
				</div>

				{/* Loading State */}
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
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{[...Array(6)].map((_, i) => (
							<div
								key={i}
								className="bg-gradient-to-br from-gray-900/60 via-slate-900/60 to-gray-900/60 backdrop-blur-xl will-change-transform border border-gray-700/30 rounded-2xl p-6 animate-pulse shadow-xl"
								style={{ animationDelay: `${i * 100}ms` }}
							>
								<div className="h-5 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg mb-3"></div>
								<div className="h-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-md mb-2"></div>
								<div className="h-4 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-md mb-4 w-3/4"></div>
								<div className="flex justify-between mb-4">
									<div className="h-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-md w-20"></div>
									<div className="h-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-md w-16"></div>
								</div>
								<div className="h-10 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl"></div>
							</div>
						))}
					</div>
				</Transition>

				{/* Documentation Cards */}
				<Transition
					as="div"
					show={!loading && docs.length > 0}
					enter="transition-all duration-700 ease-out"
					enterFrom="opacity-0 translate-y-8"
					enterTo="opacity-100 translate-y-0"
					leave="transition-all duration-500 ease-in"
					leaveFrom="opacity-100 translate-y-0"
					leaveTo="opacity-0 translate-y-8"
				>
					<DocsGrid
						docs={docs}
						pfpLoaded={pfpLoaded}
						authorImages={authorImages}
						activeSummaryDocId={activeSummaryDocId}
						showSummary={showSummary}
						isGeneratingSummary={isGeneratingSummary}
						handleSummarize={handleSummarize}
						setShowSummary={setShowSummary}
						setActiveSummaryDocId={setActiveSummaryDocId}
						setSummary={setSummary}
						hasMore={hasMore}
						loadMore={loadMore}
						loadingMore={loadingMore}
						onTagClick={handleTagClick}
					/>
				</Transition>

				{/* Empty State */}
				<Transition
					as="div"
					show={!loading && docs.length === 0}
					enter="transition-all duration-700 ease-out"
					enterFrom="opacity-0 scale-95 translate-y-8"
					enterTo="opacity-100 scale-100 translate-y-0"
					leave="transition-all duration-500 ease-in"
					leaveFrom="opacity-100 scale-100 translate-y-0"
					leaveTo="opacity-0 scale-95 translate-y-8"
				>
					<div className="flex items-center justify-center py-20">
						<div className="relative bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80 backdrop-blur-xl will-change-transform border border-gray-700/50 rounded-2xl p-12 shadow-2xl max-w-md text-center">
							<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-t-2xl"></div>

							<div className="w-16 h-16 bg-gradient-to-br from-gray-500/20 to-slate-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
								<BookOpen className="w-8 h-8 text-gray-400" />
							</div>

							<h3 className="text-xl font-bold text-gray-300 mb-3">No documentation found</h3>
							<p className="text-gray-500 text-sm">
								{searchQuery
									? "Try different search terms or clear your search"
									: "No documentation available yet"}
							</p>
						</div>
					</div>
				</Transition>

				{/* Pagination */}
				<Transition
					as="div"
					show={totalPages > 1}
					enter="transition-all duration-500 ease-out"
					enterFrom="opacity-0 translate-y-4"
					enterTo="opacity-100 translate-y-0"
					leave="transition-all duration-300 ease-in"
					leaveFrom="opacity-100 translate-y-0"
					leaveTo="opacity-0 translate-y-4"
				>
					<div className="flex items-center justify-center gap-2 mt-12">
						<Button
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1}
							className="px-4 py-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-gray-700/80 hover:to-gray-600/80 transition-all duration-300 backdrop-blur-sm shadow-lg font-medium text-sm border border-gray-600/30"
						>
							Previous
						</Button>

						<div className="flex items-center gap-1">
							{[...Array(Math.min(5, totalPages))].map((_, i) => {
								const page = i + 1
								return (
									<Button
										key={page}
										onClick={() => handlePageChange(page)}
										className={`px-3 py-2 rounded-lg transition-all duration-300 font-medium text-sm border ${currentPage === page
											? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-500/30 shadow-lg shadow-purple-500/20"
											: "bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-gray-400 hover:text-white border-gray-600/30 hover:from-gray-700/80 hover:to-gray-600/80 backdrop-blur-sm"
											}`}
									>
										{page}
									</Button>
								)
							})}
						</div>

						<Button
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages}
							className="px-4 py-2 bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-gray-700/80 hover:to-gray-600/80 transition-all duration-300 backdrop-blur-sm shadow-lg font-medium text-sm border border-gray-600/30"
						>
							Next
						</Button>
					</div>
				</Transition>
			</main>

			{/* AI Summary Modal */}
			<AISummaryModal
				open={showSummary}
				onOpenChange={setShowSummary}
				isGeneratingSummary={isGeneratingSummary}
				summary={summary}
			/>

			{/* Footer */}
			<footer className="w-full mt-16">
				<div className="container mx-auto px-4 md:px-6 relative">
					<div className="flex flex-col items-center space-y-4">
						<Link href="/" className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent hover:from-purple-300 hover:via-blue-300 hover:to-cyan-300 transition-all duration-300">
							<File className="w-6 h-6 text-purple-400" />
							DocsX
						</Link>


						<div className="flex items-center space-x-2 text-sm text-gray-400">
							<span>Made with</span>
							<Heart className="w-4 h-4 text-[#FF1493] animate-pulse" />
							<span>by AmitxD</span>
						</div>

						<div className="flex items-center space-x-4">
							<a
								href={CurrentGithubLink}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center space-x-2 text-sm text-gray-400 hover:text-[#00FFFF] transition-colors duration-300"
								/* eslint-disable @next/next/no-img-element */
							>
								<img src="/github.svg" alt="GitHub" width={16} height={16} className="w-4 h-4" />
								<span>Open Source</span>
								<span className="text-gray-600">•</span>
								<span className="text-sm text-gray-400">© {currentYear}</span>
							</a>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}