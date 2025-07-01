"use client"

import { useState } from "react"

export function useEnhanceContent() {
	const [isEnhancing, setIsEnhancing] = useState(false)

	const enhanceContent = async (content: string): Promise<string | null> => {
		if (!content.trim()) {
			return null
		}

		setIsEnhancing(true)

		try {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout

			const response = await fetch("/api/enhance", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					content,
				}),
				signal: controller.signal,
			})

			clearTimeout(timeoutId)

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}))
				throw new Error(errorData.error || "Failed to enhance content")
			}

			const data = await response.json()
			return data.enhancedContent
		} catch (error) {
			console.error("Error enhancing content:", error)
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error("Content enhancement timed out. Please try again.")
			} else {
				throw new Error("Failed to enhance content. Please try again.")
			}
		} finally {
			setIsEnhancing(false)
		}
	}

	return {
		enhanceContent,
		isEnhancing,
	}
} 