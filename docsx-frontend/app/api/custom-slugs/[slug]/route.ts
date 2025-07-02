/**
 * @file route.ts
 * @description This module defines the API route for resolving custom document slugs.
 * It allows fetching a document's ID based on its custom slug.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiError } from '@/lib/utils';

/**
 * The base URL for the backend API, retrieved from environment variables.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

/**
 * Handles GET requests to resolve a custom document slug to its corresponding document ID.
 *
 * @param {NextRequest} req - The incoming Next.js request object.
 * @param {object} context - The context object containing route parameters.
 * @param {Promise<{ slug: string }>} context.params - The route parameters, including the `slug` to resolve.
 * @returns {NextResponse} A Next.js response object containing the document ID if the slug is resolved, or an error message.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  try {
    const res = await fetch(`${API_BASE}/slugs/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Slug not found', res.status, data);
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        typeof error.body === 'object' ? error.body : { error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ error: "Failed to resolve slug" }, { status: 500 });
  }
}