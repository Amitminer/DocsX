/**
 * @file route.ts
 * @description This module defines the API route for handling AI chat interactions.
 * It uses the Google Gemini model via the Vercel AI SDK to generate responses based on document content.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from "next/server"
import { ApiError } from '@/lib/utils';

/**
 * Handles POST requests for AI chat interactions.
 * This function takes a user's question, document title, and document content,
 * and uses the Google Gemini model to generate a relevant answer.
 *
 * @param {NextRequest} request - The incoming Next.js request object, containing the question, document title, and content in its body.
 * @returns {NextResponse} A Next.js response object containing the AI-generated answer or an error message.
 */
export async function POST(request: NextRequest) {
	try {
		const { question, docTitle, docContent } = await request.json()

		if (!question || !docTitle || !docContent) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
		}

		// Check if API key exists
		if (!process.env.GOOGLE_AI_API_KEY) {
			console.error("GOOGLE_AI_API_KEY environment variable is not set")
			return NextResponse.json({ error: "API key not configured" }, { status: 500 })
		}

		// Truncate content if it's too long to improve performance
		const truncatedContent = docContent.length > 4000 ? docContent.substring(0, 4000) + "..." : docContent;

		console.log("Generating chat response with Vercel AI SDK...")

		const { text: answer } = await generateText({
			model: google('gemini-2.0-flash'),
			prompt: `You are a helpful AI assistant. A user is asking a question about a document. Please answer their question based on the document content provided.

Document Title: ${docTitle}

Document Content:
${truncatedContent}

User Question: ${question}

Please provide a helpful, accurate answer based on the document content. If the question cannot be answered from the document content, politely say so. Keep your response concise but informative.`,
			maxTokens: 500,
			temperature: 0.3,
		});

		if (!answer) {
			console.error("No answer generated")
			return NextResponse.json({ error: "No answer generated" }, { status: 500 })
		}

		return NextResponse.json({ answer })
	} catch (error) {
		console.error("Error generating chat response:", error)
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
			error: error instanceof Error ? error.message : "Failed to process your question"
		}, { status: 500 })
	}
}