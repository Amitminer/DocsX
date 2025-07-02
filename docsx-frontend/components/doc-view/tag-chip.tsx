/**
 * @file tag-chip.tsx
 * @description This component renders a single tag as a clickable or removable chip.
 * It provides visual styling for tags and optional interaction capabilities.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import { X } from "lucide-react"

/**
 * Props for the `TagChip` component.
 */
interface TagChipProps {
	/** The text content of the tag. */
	tag: string
	/** Optional click handler for the tag. */
	onClick?: () => void
	/** Optional remove handler for the tag (displays an 'X' button). */
	onRemove?: () => void
	/** If true, the tag will be styled as clickable and `onClick` will be enabled. */
	clickable?: boolean
	/** If true, the tag will display a remove button and `onRemove` will be enabled. */
	removable?: boolean
	/** Optional CSS class names to apply to the tag chip. */
	className?: string
}

/**
 * `TagChip` component displays an individual tag with optional interactive features.
 * It can be configured to be clickable (e.g., for filtering) or removable (e.g., in a form).
 *
 * @param {TagChipProps} { tag, onClick, onRemove, clickable, removable, className } - The props for the component.
 * @returns {JSX.Element} The rendered tag chip.
 */
export function TagChip({ tag, onClick, onRemove, clickable = false, removable = false, className = "" }: TagChipProps) {
	return (
		<div
			className={`
				inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200
				${clickable 
					? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-400/50 cursor-pointer hover:scale-105" 
					: "bg-gradient-to-r from-gray-700/50 to-gray-600/50 text-gray-300 border border-gray-600/30"
				}
				${className}
			`}
			onClick={clickable ? onClick : undefined}
		>
			<span className="truncate">{tag}</span>
			{removable && onRemove && (
				<button
					onClick={(e) => {
						e.stopPropagation()
						onRemove()
					}}
					className="ml-1 p-0.5 hover:bg-red-500/20 rounded transition-colors duration-200"
					title="Remove tag"
				>
					<X className="w-3 h-3 text-red-400 hover:text-red-300" />
				</button>
			)}
		</div>
	)
}