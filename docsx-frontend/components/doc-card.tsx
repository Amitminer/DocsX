"use client"

import { useState, useEffect } from "react"
import { Heart, User, Calendar, ArrowRight, Sparkles, Bookmark, Eye, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getBookmarkedDocIds } from "@/lib/utils";

interface DocCardProps {
	id: string
	title: string
	description: string
	author: string
	author_name: string
	authorImageUrl?: string
	createdDate: string
	likes: number
	tags?: string[]
	views?: number
	slug?: string
	onSummarize?: () => void
	isGeneratingSummary?: boolean
	onTagClick?: (tag: string) => void
}

export default function DocCard({
	id,
	title,
	description,
	author_name,
	authorImageUrl,
	createdDate,
	likes,
	tags = [],
	views = 0,
	slug = id,
	onSummarize,
	isGeneratingSummary = false,
	onTagClick,
}: DocCardProps) {
	const [avatarLoaded, setAvatarLoaded] = useState(false);
	const actualAuthorImage = authorImageUrl || null;

	// Bookmark indicator logic
	const [isBookmarked, setIsBookmarked] = useState(false);
	useEffect(() => {
		const bookmarked = getBookmarkedDocIds();
		setIsBookmarked(bookmarked.includes(id));
	}, [id]);

	// Modal state for full description
	const [showModal, setShowModal] = useState(false);
	const previewLength = 150;
	const isLongDescription = description.length > previewLength;
	const descriptionPreview = isLongDescription ? description.slice(0, previewLength) + '...' : description;

	return (
		<div className="max-w-xl group relative bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-4 sm:p-6 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105 focus-within:ring-2 focus-within:ring-purple-400 transition-all duration-300 shadow-xl ring-0">
			{/* Decorative gradient border */}
			<div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 pointer-events-none"></div>

			{/* Top decoration */}
			<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-500/50 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

			{/* Bookmark indicator: only show if bookmarked */}
			{isBookmarked && (
				<div className="absolute top-4 right-4 z-10">
					<Bookmark
						className="w-6 h-6 text-yellow-400 fill-current"
						strokeWidth={2}
					/>
				</div>
			)}

			{/* Content */}
			<div className="relative">
				{/* Title */}
				<div className="flex items-start justify-between gap-3 mb-3">
					<h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent group-hover:from-purple-200 group-hover:to-blue-200 transition-all duration-300 leading-tight flex-1">
						{title}
					</h3>
					{/* AI Summary Button */}
					<div className="flex-shrink-0 z-10">
						<button
							type="button"
							onClick={onSummarize}
							aria-label="AI Summary"
							title="AI Summary"
							disabled={isGeneratingSummary}
							className={`group flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-300 border backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105
								bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-gray-400 hover:text-purple-400 border-gray-600/30 hover:border-purple-500/30
								${isGeneratingSummary ? 'opacity-60 cursor-not-allowed' : ''} z-10`}
						>
							<Sparkles
								className={`w-4 h-4 transition-all duration-300 ${isGeneratingSummary ? 'animate-spin' : 'group-hover:scale-110'}`}
							/>
						</button>
					</div>
				</div>

				{/* Description Preview with Read More */}
				<p className="text-gray-400 group-hover:text-gray-300 mb-2 leading-relaxed text-sm sm:text-base transition-colors duration-300">
					{descriptionPreview}
					{isLongDescription && (
						<button
							type="button"
							onClick={() => setShowModal(true)}
							className="ml-2 text-purple-400 hover:underline text-xs sm:text-sm font-semibold"
						>
							Read More
						</button>
					)}
				</p>

				{/* Modal for full description */}
				{showModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
						<div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full relative shadow-2xl border border-purple-500/30">
							<button
								onClick={() => setShowModal(false)}
								className="absolute top-3 right-3 text-gray-400 hover:text-purple-400"
								aria-label="Close"
							>
								<X className="w-5 h-5" />
							</button>
							<h4 className="text-lg font-bold mb-3 text-purple-300">Full Description</h4>
							<p className="text-gray-200 whitespace-pre-line text-base">{description}</p>
						</div>
					</div>
				)}

				{/* Tags row */}
				{tags && tags.length > 0 && (
					<div className="flex flex-wrap gap-2 mb-3 max-w-full overflow-x-auto">
						{tags.map(tag => (
							<button
								key={tag}
								onClick={() => onTagClick && onTagClick(tag)}
								className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border text-xs sm:text-xs font-medium bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-purple-500/10 hover:text-purple-200 transition-all duration-200 whitespace-nowrap"
							>
								#{tag}
							</button>
						))}
					</div>
				)}

				{/* Meta Information */}
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5">
					<div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500 flex-wrap">
						<div className="flex items-center space-x-1 sm:space-x-2 group/meta hover:text-purple-400 transition-colors duration-200">
							<div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg overflow-hidden group-hover/meta:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400">
								{actualAuthorImage ? (
									<Image
										src={actualAuthorImage}
										alt={`${author_name}'s profile`}
										width={24}
										height={24}
										className={`w-full h-full object-cover transition-opacity duration-500 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`}
										onLoad={() => setAvatarLoaded(true)}
										tabIndex={0}
									/>
								) : (
									<div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center animate-pulse">
										<User className="w-3 h-3 text-purple-400" />
									</div>
								)}
							</div>
							{!avatarLoaded && actualAuthorImage && (
								<div className="absolute inset-0 w-full h-full bg-gray-700/30 animate-pulse rounded-lg" />
							)}
							<span className="font-medium">{author_name}</span>
						</div>
						<div className="flex items-center space-x-1 sm:space-x-2 group/meta hover:text-blue-400 transition-colors duration-200">
							<div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center group-hover/meta:scale-110 transition-transform duration-200">
								<Calendar className="w-3 h-3 text-blue-400" />
							</div>
							<span>{createdDate}</span>
						</div>
					</div>
					{/* Engagement bar: views, likes, bookmark */}
					<div className="flex items-center gap-2 sm:gap-4 mt-2 flex-wrap">
						<div className="flex items-center gap-1 text-gray-400">
							<Eye className="w-4 h-4 sm:w-4 sm:h-4" />
							<span className="text-xs font-medium">{views}</span>
						</div>
						<div className="flex items-center gap-1 text-red-400">
							<Heart className="w-4 h-4 sm:w-4 sm:h-4 fill-current" />
							<span className="text-xs font-bold">{likes}</span>
						</div>
						{isBookmarked && (
							<div className="flex items-center gap-1 text-yellow-400">
								<Bookmark className="w-4 h-4 sm:w-4 sm:h-4 fill-current" />
								<span className="text-xs font-medium hidden sm:inline">Bookmarked</span>
							</div>
						)}
					</div>
				</div>

				{/* View Button */}
				<Link
					href={`/docs/${slug}`}
					className="group/btn relative inline-flex items-center justify-center w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 overflow-hidden"
					tabIndex={0}
				>
					<div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-blue-400/30 translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-500 ease-out opacity-80"></div>

					<span className="relative flex items-center gap-2 text-sm sm:text-base">
						View Documentation
						<ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
					</span>
				</Link>
			</div>
		</div>
	)
}
