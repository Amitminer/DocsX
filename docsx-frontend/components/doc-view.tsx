/**
 * @file doc-view.tsx
 * @description This component displays a single document, including its header, content, and engagement actions.
 * It integrates AI features like summarization and chat, and handles user interactions such as liking, bookmarking, and sharing.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { Sparkles } from "lucide-react"
import { DocHeader } from "./doc-header"
import { EngagementActions } from "./doc-view/engagement-actions"
import { AISummary } from "./ai/ai-summary"
import { DocChat } from "./ai/doc-chat"
import { MarkdownRenderer } from "./doc-view/markdown-renderer"
import { ShareToast } from "./doc-view/share-toast"
import { useDocActions } from "../hooks/use-doc-actions"
import { useAISummary } from "../hooks/use-ai-summary"
import { useDocChat } from "../hooks/use-doc-chat"
import type { DocViewProps } from "./types/doc-view"

/**
 * Renders a single document view with all its associated features.
 * This includes the document header, content rendered from Markdown, and various engagement actions.
 * It also integrates AI-powered summarization and chat functionalities.
 *
 * @param {DocViewProps} props - The properties for the DocView component.
 * @param {string} props.id - The unique identifier of the document.
 * @param {string} props.title - The title of the document.
 * @param {string} props.author - The name of the document's author.
 * @param {string} props.authorId - The unique identifier of the document's author.
 * @param {string} [props.authorImageUrl] - The URL of the author's profile image.
 * @param {string} props.createdDate - The creation date of the document.
 * @param {number} props.likes - The number of likes the document has.
 * @param {string} props.content - The Markdown content of the document.
 * @param {number} [props.views=0] - The number of views the document has.
 * @param {string[]} [props.tags=[]] - An array of tags associated with the document.
 * @param {boolean} [props.isAuthor=false] - Indicates if the current user is the author of the document.
 * @param {() => void} [props.onDelete] - Callback function for document deletion.
 * @param {() => void} [props.onEdit] - Callback function for document editing.
 * @param {() => void} [props.onBookmark] - Callback function for bookmarking the document.
 * @param {() => void} [props.onReport] - Callback function for reporting the document.
 * @param {() => void} [props.onDownload] - Callback function for downloading the document.
 * @param {boolean} [props.likeDisabled=false] - Indicates if the like action is disabled.
 * @param {string} [props.customUrl] - A custom URL for the document.
 * @returns {JSX.Element} The rendered document view component.
 */
export default function DocView({
	id, title, author, authorId, authorImageUrl, createdDate, likes, content, views = 0, tags = [], isAuthor = false,
	onDelete, onEdit, onBookmark, onReport, onDownload, likeDisabled = false, customUrl,
}: DocViewProps) {
	const { isLiked, likeCount, isBookmarked, showShareToast, handleLike, handleBookmark } = useDocActions(likes, id)
	const { showSummary, summary, isGeneratingSummary, handleSummarize, setShowSummary } = useAISummary()
	const { showChat, handleChat, closeChat } = useDocChat()

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
			{/* Ambient background effects */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
			</div>

			<div className="relative max-w-5xl mx-auto sm:px-6 lg:px-8 py-6 lg:py-12">
				{/* Share Toast */}
				<ShareToast show={showShareToast} />

				{/* Header */}
				<DocHeader
					title={title}
					author={author}
					authorId={authorId}
					authorImageUrl={authorImageUrl}
					createdDate={createdDate}
					views={views}
					tags={tags}
					isAuthor={isAuthor}
					onEdit={onEdit}
					onDelete={onDelete}
					onDownload={onDownload}
					onReport={onReport}
					customUrl={customUrl}
				>
					{/* Engagement Actions  */}
					<EngagementActions
						likes={likeCount}
						views={views}
						isLiked={isLiked}
						isBookmarked={isBookmarked}
						showSummary={showSummary}
						isGeneratingSummary={isGeneratingSummary}
						showChat={showChat}
						onLike={() => handleLike()}
						onBookmark={() => handleBookmark(onBookmark)}
						onSummarize={() => handleSummarize(title, content)}
						onChat={handleChat}
						likeDisabled={likeDisabled}
					/>
				</DocHeader>

				{/* AI Summary Section */}
				{showSummary && summary && <AISummary summary={summary} onClose={() => setShowSummary(false)} />}

				{/* AI Chat Section */}
				{showChat && <DocChat docTitle={title} docContent={content} onClose={closeChat} />}

				{/* Content */}
				<div className="relative bg-gradient-to-br from-gray-900/60 via-slate-900/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/30 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-2xl">
					{/* Content header decoration */}
					<div className="flex items-center gap-3 mb-8">
						<Sparkles className="w-5 h-5 text-purple-400" />
						<span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Content</span>
						<div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 via-transparent to-transparent"></div>
					</div>

					<MarkdownRenderer content={content} docId={id} />
				</div>
			</div>
		</div>
	)
}