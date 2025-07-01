"use client"

import { Heart, Bookmark, Sparkles, Eye, MessageCircle } from "lucide-react"
import { ProtectedActionButton } from "../auth/protected-action-button"
import type { EngagementActionsProps } from "../types/doc-view"

export function EngagementActions({
	likes,
	views = 0,
	isLiked,
	isBookmarked,
	showSummary,
	isGeneratingSummary,
	showChat,
	onLike,
	onBookmark,
	onSummarize,
	onChat,
	likeDisabled = false,
}: EngagementActionsProps) {
	// Format view count for display
	const formatViews = (count: number) => {
		if (count >= 1000000) {
			return `${(count / 1000000).toFixed(1)}M`
		} else if (count >= 1000) {
			return `${(count / 1000).toFixed(1)}k`
		}
		return count.toString()
	}

	return (
		<div className="inline-flex items-center gap-1 p-1 sm:p-2 bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-600/30 rounded-xl shadow">
			{/* View Counter */}
			<div className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-gray-400 text-xs sm:text-base">
				<Eye className="w-4 h-4 sm:w-5 sm:h-5" />
				<span className="font-medium">{formatViews(views)}</span>
			</div>

			{/* Separator */}
			<div className="w-px h-6 bg-gray-600/30 mx-1" />

			{/* Like Button */}
			<ProtectedActionButton
				onClick={onLike}
				className={`group flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 border backdrop-blur-sm shadow hover:shadow-lg hover:scale-105 text-xs sm:text-base ${isLiked
					? "bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-400 border-red-500/40 shadow-red-500/30 hover:bg-gradient-to-r hover:from-gray-800/80 hover:to-gray-900/80 hover:text-gray-400 hover:border-gray-600/30"
					: "bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-gray-400 hover:text-red-400 border-gray-600/30 hover:border-red-500/30"
				}`}
				disabled={likeDisabled}
				title={isLiked ? "Unlike this doc" : "Like this doc"}
			>
				<Heart
					className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${isLiked ? "fill-current scale-105" : "group-hover:scale-110"}`}
				/>
				<span className="font-bold">{likes}</span>
			</ProtectedActionButton>

			{/* Bookmark Button */}
			<ProtectedActionButton
				onClick={onBookmark}
				className={`group flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 border backdrop-blur-sm shadow hover:shadow-lg hover:scale-105 text-xs sm:text-base ${isBookmarked
					? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/20"
					: "bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-gray-400 hover:text-yellow-400 border-gray-600/30 hover:border-yellow-500/30"
				}`}
				title="Bookmark this document"
			>
				<Bookmark
					className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${isBookmarked ? "fill-current scale-105" : "group-hover:scale-110"}`}
				/>
			</ProtectedActionButton>

			{/* AI Summary Button */}
			<button
				onClick={onSummarize}
				className={`group flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 border backdrop-blur-sm shadow hover:shadow-lg hover:scale-105 text-xs sm:text-base ${showSummary
					? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-purple-500/30 shadow-purple-500/20"
					: "bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-gray-400 hover:text-purple-400 border-gray-600/30 hover:border-purple-500/30"
				}`}
				title="AI Summary"
				disabled={isGeneratingSummary}
			>
				<Sparkles
					className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${isGeneratingSummary
						? "animate-spin"
						: showSummary
							? "fill-current scale-105"
							: "group-hover:scale-110"
					}`}
				/>
			</button>

			{/* AI Chat Button */}
			<button
				onClick={onChat}
				className={`group flex items-center justify-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-300 border backdrop-blur-sm shadow hover:shadow-lg hover:scale-105 text-xs sm:text-base ${showChat
					? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/20"
					: "bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-gray-400 hover:text-blue-400 border-gray-600/30 hover:border-blue-500/30"
				}`}
				title="AI Chat"
			>
				<MessageCircle
					className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${showChat
						? "fill-current scale-105"
						: "group-hover:scale-110"
					}`}
				/>
			</button>
		</div>
	)
}
