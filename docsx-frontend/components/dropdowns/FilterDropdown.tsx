/**
 * @file FilterDropdown.tsx
 * @description This component provides a dropdown menu for filtering documents based on tags, author, and upload date.
 * It allows users to refine their search results with various criteria.
 * @author AmitxD
 * @Copyright 2025
 */

import { useState } from "react"
import { Filter, ChevronDown, Tag, User, Calendar } from "lucide-react"

/**
 * Predefined suggestions for tags to be used in filtering.
 */
const TAG_SUGGESTIONS = ["api", "rust", "backend", "frontend", "docs", "search", "auth"]

/**
 * Props for the `FilterDropdown` component.
 */
interface FilterDropdownProps {
  /** Callback function to apply the selected filter parameters. */
  onApply: (params: { author?: string; tags?: string[]; date?: string; sort?: string }) => void
}

/**
 * `FilterDropdown` component allows users to filter documents.
 * It provides input fields and tag suggestions for filtering by author, tags, and upload date.
 *
 * @param {FilterDropdownProps} { onApply } - The props for the component.
 * @returns {JSX.Element} The rendered FilterDropdown component.
 */
export default function FilterDropdown({ onApply }: FilterDropdownProps) {
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of the dropdown content. */
	const [show, setShow] = useState(false)
	/** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} State to store the selected filter tags. */
	const [filterTags, setFilterTags] = useState<string[]>([])
	/** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State to store the filter author input. */
	const [filterAuthor, setFilterAuthor] = useState("")
	/** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State to store the filter date input. */
	const [filterDate, setFilterDate] = useState("")
	/** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State to store the filter sort (currently unused in this component). */
	const [filterSort] = useState("")

	/**
	 * Handles the application of filters.
	 * Gathers the current filter states and calls the `onApply` callback with the selected parameters.
	 * Closes the dropdown after applying filters.
	 */	
	const handleApply = () => {
		onApply({
			tags: filterTags.length > 0 ? filterTags : undefined,
			author: filterAuthor || undefined,
			date: filterDate || undefined,
			sort: filterSort || undefined,
		})
		setShow(false)
	}

	return (
		<div className="relative w-full sm:w-auto">
			<button
				onClick={() => setShow(v => !v)}
				className={`flex items-center justify-center w-full gap-2 px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 hover:text-white hover:border-purple-400 transition-all duration-200 ${show ? 'ring-2 ring-purple-400' : ''}`}
				type="button"
			>
				<Filter className="w-4 h-4" />
				<span>Filter</span>
				<ChevronDown className={`w-4 h-4 transition-transform ${show ? "rotate-180" : "rotate-0"}`} />
			</button>
			{show && (
				<div className="absolute z-50 top-full left-0 mt-2 w-full max-w-[95vw] sm:w-80 bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-purple-500/30 rounded-2xl shadow-2xl p-1 sm:p-4 flex flex-col gap-2 sm:gap-4 text-xs sm:text-sm max-h-[60vh] overflow-y-auto">
					<div className="flex flex-col gap-1 sm:gap-2">
						<label className="text-xs font-semibold text-purple-300 flex items-center gap-2"><Tag className="w-4 h-4" />Tags</label>
						<div className="flex flex-wrap gap-1 sm:gap-2">
							{TAG_SUGGESTIONS.map(tag => (
								<button
									key={tag}
									onClick={() => setFilterTags(tags => tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])}
									className={`px-2 sm:px-3 py-1 rounded-full border text-xs font-medium transition-all duration-200 min-h-[36px] hover:bg-purple-500/10 active:bg-purple-500/20 ${filterTags.includes(tag) ? "bg-purple-500/30 border-purple-400 text-purple-200" : "bg-gray-800/60 border-gray-600 text-gray-300"}`}
								>
									{tag}
								</button>
							))}
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-xs font-semibold text-purple-300 flex items-center gap-2"><User className="w-4 h-4" />Author</label>
						<input
							type="text"
							value={filterAuthor}
							onChange={e => setFilterAuthor(e.target.value)}
							placeholder="e.g. amitxd"
							className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-xs font-semibold text-purple-300 flex items-center gap-2"><Calendar className="w-4 h-4" />Uploaded Date</label>
						<input
							type="text"
							value={filterDate}
							onChange={e => setFilterDate(e.target.value)}
							placeholder="today, last_week, 2024-06-01"
							className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
						/>
					</div>
					<button
						onClick={handleApply}
						className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold shadow hover:scale-105 transition-all duration-200"
					>
						Apply Filters
					</button>
				</div>
			)}
		</div>
	)
}