/**
 * @file tags.tsx
 * @description This component renders a collection of tags using `TagChip` components.
 * It provides a flexible way to display tags, with optional click and remove functionalities.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { TagChip } from "./tag-chip"

/**
 * Props for the `Tags` component.
 */
interface TagsProps {
	/** An array of tag strings to be displayed. */
	tags: string[]
	/** Optional callback function when a tag is clicked. */
	onTagClick?: (tag: string) => void
	/** Optional callback function when a tag's remove button is clicked. */
	onTagRemove?: (tag: string) => void
	/** If true, tags will be styled as clickable and `onTagClick` will be enabled. */
	clickable?: boolean
	/** If true, tags will display a remove button and `onTagRemove` will be enabled. */
	removable?: boolean
	/** Optional CSS class names to apply to the container div. */
	className?: string
}

/**
 * `Tags` component displays a list of tags, each rendered as a `TagChip`.
 * It provides options for making tags clickable (e.g., for filtering) and/or removable.
 *
 * @param {TagsProps} { tags, onTagClick, onTagRemove, clickable, removable, className } - The props for the component.
 * @returns {JSX.Element | null} The rendered tags container, or `null` if no tags are provided.
 */
export function Tags({ tags, onTagClick, onTagRemove, clickable = false, removable = false, className = "" }: TagsProps) {
	// Render null if there are no tags to display.
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