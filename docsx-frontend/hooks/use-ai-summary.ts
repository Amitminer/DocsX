"use client"

import { useState } from "react"

export function useAISummary() {
	const [showSummary, setShowSummary] = useState(false)
	const [summary, setSummary] = useState<string | null>(null)
	const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

	const handleSummarize = async (title: string, content: string) => {
		setIsGeneratingSummary(true)
		setSummary(null)
		setShowSummary(false)

		try {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

			const response = await fetch("/api/summarize", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title,
					content,
				}),
				signal: controller.signal,
			})

			clearTimeout(timeoutId)

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || "Failed to generate summary")
			}

			const data = await response.json()
			setSummary(data.summary)
			setShowSummary(true)
		} catch (error) {
			console.error("Error generating summary:", error)
			if (error instanceof Error && error.name === 'AbortError') {
				setSummary("Summary generation timed out. Please try again.")
			} else {
				setSummary("Failed to generate summary. Please try again.")
			}
			setShowSummary(true)
		} finally {
			setIsGeneratingSummary(false)
		}
	}

	return {
		showSummary,
		summary,
		isGeneratingSummary,
		handleSummarize,
		setShowSummary,
		setSummary,
	}
}
