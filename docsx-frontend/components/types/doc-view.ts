import { ReactNode } from "react"

export interface DocViewProps {
	id: string
	title: string
	docId: string
	author: string
	authorId: string
	authorImageUrl?: string
	createdDate: string
	likes: number
	content: string
	views?: number
	tags?: string[]
	isAuthor?: boolean
	showDelete?: boolean
	onDelete?: () => void
	onEdit?: () => void
	onLike?: () => void
	onShare?: () => void
	onBookmark?: () => void
	onReport?: () => void
	onDownload?: () => void
	isLiked?: boolean
	likeDisabled?: boolean
	customUrl?: string
}

export interface DocHeaderProps {
	title: string
	author: string
	authorId: string
	authorImageUrl?: string
	createdDate: string
	views?: number
	tags?: string[]
	isAuthor?: boolean
	onEdit?: () => void
	onDelete?: () => void
	onDownload?: () => void
	onReport?: () => void
	children?: ReactNode
	customUrl?: string
}

export interface EngagementActionsProps {
	likes: number
	views?: number
	isLiked: boolean
	isBookmarked: boolean
	showSummary: boolean
	isGeneratingSummary: boolean
	showChat: boolean
	onLike: () => void
	onBookmark: () => void
	onSummarize: () => void
	onChat: () => void
	likeDisabled?: boolean
}

export interface AISummaryProps {
	summary: string
	onClose: () => void
}

export interface DocChatProps {
	docTitle: string
	docContent: string
	onClose: () => void
}

export interface Doc {
	id: string
	title: string
	description: string
	content: string
	author_id: string
	author_name: string
	created_at: string
	likes: number
	views: number
	tags: string[]
	author_image_url?: string
	liked_by_current_user?: boolean
}

export interface ApiResponse {
	docs: Doc[]
	total: number
	page: number
	limit: number
}
