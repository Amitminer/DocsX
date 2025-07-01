import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { type NextRequest, NextResponse } from "next/server"
import { ApiError } from '@/lib/utils';

export async function POST(request: NextRequest) {
	try {
		const { title, content } = await request.json()

		if (!title || !content) {
			return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
		}

		// Check if API key exists
		if (!process.env.GOOGLE_AI_API_KEY) {
			console.error("GOOGLE_AI_API_KEY environment variable is not set")
			return NextResponse.json({ error: "API key not configured" }, { status: 500 })
		}

		// Truncate content if it's too long to improve performance
		const truncatedContent = content.length > 4000 ? content.substring(0, 4000) + "..." : content;

		console.log("Generating summary with Vercel AI SDK...")

		const { text: summary } = await generateText({
			model: google('gemini-2.0-flash'),
			prompt: `Summarize this documentation. Focus on the main purpose and key points.

Title: ${title}

Content: ${truncatedContent}`,
			maxTokens: 150, // Reduced for faster response
			temperature: 0.1, // Lower temperature for more consistent, faster responses
		});

		if (!summary) {
			console.error("No summary generated")
			return NextResponse.json({ error: "No summary generated" }, { status: 500 })
		}

		return NextResponse.json({ summary })

	} catch (error) {
		console.error("Error generating summary:", error)
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
			error: error instanceof Error ? error.message : "Failed to generate summary"
		}, { status: 500 })
	}
}
