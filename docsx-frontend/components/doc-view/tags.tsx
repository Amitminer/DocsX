"use client"

import { TagChip } from "./tag-chip"

interface TagsProps {
	tags: string[]
	onTagClick?: (tag: string) => void
	onTagRemove?: (tag: string) => void
	clickable?: boolean
	removable?: boolean
	className?: string
}

export function Tags({ tags, onTagClick, onTagRemove, clickable = false, removable = false, className = "" }: TagsProps) {
	if (!tags || tags.length === 0) {
		return null
	}

	return (
		<div className={`flex flex-wrap gap-2 ${className}`}>
			{tags.map((tag, index) => (
				<TagChip
					key={`${tag}-${index}`}
					tag={tag}
					onClick={onTagClick ? () => onTagClick(tag) : undefined}
					onRemove={onTagRemove ? () => onTagRemove(tag) : undefined}
					clickable={clickable}
					removable={removable}
				/>
			))}
		</div>
	)
} 