/**
 * @file smart-search.tsx
 * @description Smart search bar component for DocsX, supporting filters, suggestions, and advanced search for documents.
 * Provides a UI for searching and filtering docs with helpful UX.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Filter, X, Tag, User, Calendar, TrendingUp, ChevronDown } from "lucide-react"

interface SmartSearchProps {
	value: string
	onChange: (value: string) => void
	onSearch: () => void
	placeholder?: string
	className?: string
}

const FILTER_SUGGESTIONS = [
	{ prefix: "by_author:", description: "Filter by author", icon: User },
	{ prefix: "uploaded_date:", description: "Filter by date (today, last_week, 2024-01-01:2024-12-31)", icon: Calendar },
	{ prefix: "tag:", description: "Filter by tag", icon: Tag },
	{ prefix: "sort:", description: "Sort by (likes, date)", icon: TrendingUp },
]

const TAG_SUGGESTIONS = ["rust", "python", "minecraft"]

/**
 * SmartSearch component renders a search bar with filter and suggestion support.
 *
 * @param {SmartSearchProps} props - Props for the smart search bar.
 * @returns {JSX.Element} The rendered smart search UI.
 */
export function SmartSearch({ value, onChange, onSearch, placeholder = "Search docs...", className = "" }: SmartSearchProps) {
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
	const [showFilter, setShowFilter] = useState(false)
	const [filterTags, setFilterTags] = useState<string[]>([])
	const [filterAuthor, setFilterAuthor] = useState("")
	const [filterDate, setFilterDate] = useState("")
	const [filterSort, setFilterSort] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)
	const suggestionsRef = useRef<HTMLDivElement>(null)

	// Filter suggestions based on current input
	const filteredSuggestions = FILTER_SUGGESTIONS.filter(suggestion =>
		suggestion.prefix.toLowerCase().includes(value.toLowerCase()) ||
		suggestion.description.toLowerCase().includes(value.toLowerCase())
	)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
				setShowSuggestions(false)
			}
		}

		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [])

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		onChange(newValue)
		setShowSuggestions(true)
		setSelectedSuggestion(-1)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault()
			setSelectedSuggestion(prev =>
				prev < filteredSuggestions.length - 1 ? prev + 1 : prev
			)
		} else if (e.key === "ArrowUp") {
			e.preventDefault()
			setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1)
		} else if (e.key === "Enter") {
			e.preventDefault()
			if (selectedSuggestion >= 0 && filteredSuggestions[selectedSuggestion]) {
				insertSuggestion(filteredSuggestions[selectedSuggestion].prefix)
			} else {
				onSearch()
			}
		} else if (e.key === "Escape") {
			setShowSuggestions(false)
			inputRef.current?.blur()
		}
	}

	const insertSuggestion = (suggestion: string) => {
		onChange(suggestion)
		setShowSuggestions(false)
		inputRef.current?.focus()
	}

	const clearSearch = () => {
		onChange("")
		setShowSuggestions(false)
		inputRef.current?.focus()
	}

	const handleApplyFilters = () => {
		let filterString = value.trim()
		if (filterTags.length > 0) filterString += ` tag:${filterTags.join(",")}`
		if (filterAuthor) filterString += ` by_author:${filterAuthor}`
		if (filterDate) filterString += ` uploaded_date:${filterDate}`
		if (filterSort) filterString += ` sort:${filterSort}`
		onChange(filterString.trim())
		setShowFilter(false)
		onSearch()
	}

	return (
		<div className={`relative w-full max-w-2xl mx-auto ${className}`}>
			<div className="relative">
				{/* Search input with filter button */}
				<div className="relative flex items-center">
					<div className="absolute left-3 text-gray-400">
						<Search className="w-5 h-5" />
					</div>
					<input
						ref={inputRef}
						type="text"
						value={value}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={() => setShowSuggestions(true)}
						placeholder={placeholder}
						className="w-full pl-10 pr-20 py-2 text-base bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-600/50 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
					/>
					{/* Filter button */}
					<button
						onClick={() => setShowFilter(v => !v)}
						className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1.5 h-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl text-purple-300 hover:text-white hover:border-purple-400 transition-all duration-200"
						type="button"
					>
						<Filter className="w-4 h-4" />
						<ChevronDown className={`w-4 h-4 transition-transform ${showFilter ? "rotate-180" : "rotate-0"}`} />
					</button>
					{/* Clear button */}
					{value && (
						<button
							onClick={clearSearch}
							className="absolute right-3 p-1 text-gray-400 hover:text-white transition-colors duration-200"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>

				{/* Filter dropdown/modal */}
				{showFilter && (
					<div className="absolute z-50 top-full right-0 mt-2 w-full sm:w-[420px] bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-purple-500/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<label className="text-xs font-semibold text-purple-300 flex items-center gap-2"><Tag className="w-4 h-4" />Tags</label>
							<div className="flex flex-wrap gap-2">
								{TAG_SUGGESTIONS.map(tag => (
									<button
										key={tag}
										onClick={() => setFilterTags(tags => tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])}
										className={`px-3 py-1 rounded-full border text-xs font-medium transition-all duration-200 ${filterTags.includes(tag) ? "bg-purple-500/30 border-purple-400 text-purple-200" : "bg-gray-800/60 border-gray-600 text-gray-300 hover:bg-purple-500/10"}`}
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
						<div className="flex flex-col gap-2">
							<label className="text-xs font-semibold text-purple-300 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Sort By</label>
							<select
								value={filterSort}
								onChange={e => setFilterSort(e.target.value)}
								className="bg-gray-800/60 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
							>
								<option value="">Default</option>
								<option value="likes">Likes</option>
								<option value="date">Date</option>
							</select>
						</div>
						<button
							onClick={handleApplyFilters}
							className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold shadow hover:scale-105 transition-all duration-200"
						>
							Apply Filters
						</button>
					</div>
				)}
			</div>

			{/* Suggestions dropdown */}
			{showSuggestions && filteredSuggestions.length > 0 && (
				<div
					ref={suggestionsRef}
					className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto"
				>
					<div className="p-2">
						{filteredSuggestions.map((suggestion, index) => {
							const Icon = suggestion.icon
							return (
								<button
									key={suggestion.prefix}
									onClick={() => insertSuggestion(suggestion.prefix)}
									className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${index === selectedSuggestion
										? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border border-purple-500/30"
										: "text-gray-300 hover:bg-gray-800/50 hover:text-white"
										}`}
								>
									<Icon className="w-4 h-4 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<div className="font-medium text-sm">{suggestion.prefix}</div>
										<div className="text-xs text-gray-400 truncate">{suggestion.description}</div>
									</div>
								</button>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
