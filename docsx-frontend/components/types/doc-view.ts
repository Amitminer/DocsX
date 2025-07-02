/**
 * @file doc-view.ts
 * @description This module defines interfaces for document viewing components and their props.
 * It includes types for document data, header properties, engagement actions, and AI-related features.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { ReactNode } from "react"

/**
 * Props for the `DocView` component.
 */
export interface DocViewProps {
	/** The unique identifier for the document. */
	id: string
	/** The title of the document. */
	title: string
	/** The unique identifier for the document (redundant with `id`, consider refactoring). */
	docId: string
	/** The name of the document's author. */
	author: string
	/** The unique identifier of the document's author. */
	authorId: string
	/** The URL of the author's profile image (optional). */
	authorImageUrl?: string
	/** The creation date of the document, formatted as a string. */
	createdDate: string
	/** The number of likes the document has. */
	likes: number
	/** The main content of the document in Markdown format. */
	content: string
	/** The number of views the document has (optional, defaults to 0). */
	views?: number
	/** An array of tags associated with the document (optional). */
	tags?: string[]
	/** Indicates if the current user is the author of the document (optional). */
	isAuthor?: boolean
	/** Indicates if the delete button should be shown (optional). */
	showDelete?: boolean
	/** Callback function for document deletion (optional). */
	onDelete?: () => void
	/** Callback function for document editing (optional). */
	onEdit?: () => void
	/** Callback function for liking the document (optional). */
	onLike?: () => void
	/** Callback function for sharing the document (optional). */
	onShare?: () => void
	/** Callback function for bookmarking the document (optional). */
	onBookmark?: () => void
	/** Callback function for reporting the document (optional). */
	onReport?: () => void
	/** Callback function for downloading the document (optional). */
	onDownload?: () => void
	/** Indicates if the document is liked by the current user (optional). */
	isLiked?: boolean
	/** Indicates if the like button should be disabled (optional). */
	likeDisabled?: boolean
	/** A custom URL slug for the document (optional). */
	customUrl?: string
}

/**
 * Props for the `DocHeader` component.
 */
export interface DocHeaderProps {
	/** The title of the document. */
	title: string
	/** The name of the document's author. */
	author: string
	/** The unique identifier of the document's author. */
	authorId: string
	/** The URL of the author's profile image (optional). */
	authorImageUrl?: string
	/** The creation date of the document, formatted as a string. */
	createdDate: string
	/** The number of views the document has (optional, defaults to 0). */
	views?: number
	/** An array of tags associated with the document (optional). */
	tags?: string[]
	/** Indicates if the current user is the author of the document (optional). */
	isAuthor?: boolean
	/** Callback function for document editing (optional). */
	onEdit?: () => void
	/** Callback function for document deletion (optional). */
	onDelete?: () => void
	/** Callback function for downloading the document (optional). */
	onDownload?: () => void
	/** Callback function for reporting the document (optional). */
	onReport?: () => void
	/** Child components to be rendered within the header (optional). */
	children?: ReactNode
	/** A custom URL slug for the document (optional). */
	customUrl?: string
}

/**
 * Props for the `EngagementActions` component.
 */
export interface EngagementActionsProps {
	/** The number of likes the document has. */
	likes: number
	/** The number of views the document has (optional, defaults to 0). */
	views?: number
	/** Indicates if the document is liked by the current user. */
	isLiked: boolean
	/** Indicates if the document is bookmarked by the current user. */
	isBookmarked: boolean
	/** Indicates if the AI summary is currently shown. */
	showSummary: boolean
	/** Indicates if an AI summary is currently being generated. */
	isGeneratingSummary: boolean
	/** Indicates if the AI chat is currently shown. */
	showChat: boolean
	/** Callback function for liking the document. */
	onLike: () => void
	/** Callback function for bookmarking the document. */
	onBookmark: () => void
	/** Callback function for generating an AI summary. */
	onSummarize: () => void
	/** Callback function for opening the AI chat. */
	onChat: () => void
	/** Indicates if the like button should be disabled (optional). */
	likeDisabled?: boolean
}

/**
 * Props for the `AISummary` component.
 */
export interface AISummaryProps {
	/** The AI-generated summary text. */
	summary: string
	/** Callback function to close the summary display. */
	onClose: () => void
}

/**
 * Props for the `DocChat` component.
 */
export interface DocChatProps {
	/** The title of the document for the chat context. */
	docTitle: string
	/** The content of the document for the chat context. */
	docContent: string
	/** Callback function to close the chat interface. */
	onClose: () => void
}

/**
 * Represents a full document object retrieved from the API.
 */
export interface Doc {
	/** The unique identifier for the document. */
	id: string
	/** The title of the document. */
	title: string
	/** A brief description of the document. */
	description: string
	/** The main content of the document. */
	content: string
	/** The unique identifier of the author. */
	author_id: string
	/** The name of the author. */
	author_name: string
	/** The creation timestamp of the document. */
	created_at: string
	/** The number of likes the document has. */
	likes: number
	/** The number of views the document has. */
	views: number
	/** An array of tags associated with the document. */
	tags: string[]
	/** The URL of the author's profile image (optional). */
	author_image_url?: string
	/** Indicates if the document is liked by the current user (optional). */
	liked_by_current_user?: boolean
}

/**
 * Represents the structure of a paginated API response containing documents.
 */
export interface ApiResponse {
	/** An array of document objects. */
	docs: Doc[]
	/** The total number of documents available. */
	total: number
	/** The current page number. */
	page: number
	/** The maximum number of documents per page. */
	limit: number
}