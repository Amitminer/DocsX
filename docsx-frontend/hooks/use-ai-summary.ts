/**
 * @file use-ai-summary.ts
 * @description This hook provides functionality for generating AI summaries of document content.
 * It manages the state of the summary generation process, including loading, errors, and the summary text itself.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import { useState } from "react"

/**
 * `useAISummary` is a custom React hook for managing AI-powered document summarization.
 * It provides state and functions to trigger summary generation, handle loading states,
 * and display the generated summary or any errors.
 *
 * @returns {object} An object containing:
 *   - `showSummary`: A boolean indicating if the summary modal should be shown.
 *   - `summary`: The generated summary text, or `null` if not available.
 *   - `isGeneratingSummary`: A boolean indicating if a summary is currently being generated.
 *   - `handleSummarize`: An async function to initiate summary generation.
 *   - `setShowSummary`: A function to manually control the visibility of the summary modal.
 *   - `setSummary`: A function to manually set the summary content.
 */
export function useAISummary() {
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of the AI summary. */
	const [showSummary, setShowSummary] = useState(false)
	/** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} State to store the generated summary text. */
	const [summary, setSummary] = useState<string | null>(null)
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if the summary is currently being generated. */
	const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

	/**
	 * Initiates the AI summarization process.
	 * Sends the document title and content to the `/api/summarize` endpoint.
	 * Handles loading, success, and error states, including a timeout for the API call.
	 * @param {string} title - The title of the document to summarize.
	 * @param {string} content - The full content of the document to summarize.
	 */
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