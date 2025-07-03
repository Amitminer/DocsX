/**
 * @file route.ts
 * @description This module defines the API route for enhancing document content using AI.
 * It leverages the Google Gemini model via the Vercel AI SDK to improve the quality of Markdown content.
 * @author AmitxD
 * @Copyright 2025
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { type NextRequest, NextResponse } from "next/server"
import { ApiError } from '@/lib/utils';

/**
 * Handles POST requests for content enhancement.
 * It takes Markdown content as input and returns an AI-enhanced version of it.
 *
 * @param {NextRequest} request - The incoming Next.js request object, containing the content to be enhanced in its body.
 * @returns {NextResponse} A Next.js response object containing the enhanced content or an error message.
 */
export async function POST(request: NextRequest) {
	try {
		const { content } = await request.json()

		if (!content) {
			return NextResponse.json({ error: "Content is required" }, { status: 400 })
		}

		// Check if API key exists
		if (!process.env.GOOGLE_AI_API_KEY) {
			console.error("GOOGLE_AI_API_KEY environment variable is not set")
			return NextResponse.json({ error: "API key not configured" }, { status: 500 })
		}

		// Truncate content if it's too long to improve performance
		const truncatedContent = content.length > 6000 ? content.substring(0, 6000) + "..." : content;

		console.log("Enhancing content with Vercel AI SDK...")

		const result = await generateText({
			model: google('gemini-2.0-flash'),
			messages: [
				{
					role: "user",
					content: `Improve the grammar, formatting, and clarity of this markdown content (don't include the \`\`\`markdown\`\`\`). Make it more professional and easy to read while preserving all the technical information and structure. Return only the improved markdown content without any explanations.

Content to enhance:
${truncatedContent}`
				}
			],
			maxTokens: 2000,
			temperature: 0.1,
		});
		const enhancedContent = result.text;

			if (!enhancedContent) {
			console.error("No enhanced content generated")
			return NextResponse.json({ error: "No enhanced content generated" }, { status: 500 })
		}

		return NextResponse.json({ enhancedContent })

	} catch (error) {
		console.error("Error enhancing content:", error)
		if (error instanceof ApiError) {
			return NextResponse.json(
				typeof error.body === 'object' ? error.body : { error: error.message },
				{ status: error.status }
			);
		}
		// Provide more specific error messages
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return NextResponse.json({ error: "Network error - check your internet connection" }, { status: 500 })
		}

		return NextResponse.json({
			error: error instanceof Error ? error.message : "Failed to enhance content"
		}, { status: 500 })
	}
}