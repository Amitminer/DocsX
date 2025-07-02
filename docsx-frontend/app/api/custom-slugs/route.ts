/**
 * @file route.ts
 * @description This module defines the API routes for managing custom document slugs.
 * It acts as a proxy to the backend slug API, handling GET and POST requests for slug creation, retrieval, and deletion.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { NextRequest, NextResponse } from "next/server"
import { ApiError } from '@/lib/utils'

/**
 * The base URL for the backend API, retrieved from environment variables.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

/**
 * Handles GET requests for custom slugs.
 * Supports fetching all slugs, getting the current slug for a specific document ID, or resolving a slug to a document ID.
 *
 * @param {NextRequest} req - The incoming Next.js request object.
 * @returns {NextResponse} A Next.js response object containing the requested slug data or an error message.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get('docId');
  const slugParam = req.nextUrl.pathname.split('/').filter(Boolean).pop();

  // If /api/custom-slugs/{slug}
  if (slugParam && slugParam !== 'custom-slugs') {
    try {
      const res = await fetch(`${API_BASE}/slugs/${encodeURIComponent(slugParam)}`);
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
        )
      }
      return NextResponse.json({ error: "Failed to resolve slug" }, { status: 500 })
    }
  }

  // If /api/custom-slugs?docId=...
  if (docId) {
    try {
      const res = await fetch(`${API_BASE}/slugs`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data.error || 'Failed to fetch slugs', res.status, data);
      }
      const all = await res.json();
      // Find the slug for this docId
      type SlugObj = { doc_id: string; slug: string };
      const found = Array.isArray(all) ? (all as SlugObj[]).find((s) => s.doc_id === docId) : null;
      return NextResponse.json(found || {});
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          typeof error.body === 'object' ? error.body : { error: error.message },
          { status: error.status }
        )
      }
      return NextResponse.json({ error: "Failed to fetch doc slug" }, { status: 500 })
    }
  }

  // Default: all slugs
  try {
    const res = await fetch(`${API_BASE}/slugs`, { method: 'GET' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Failed to fetch slugs', res.status, data);
    }
    return NextResponse.json(await res.json());
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        typeof error.body === 'object' ? error.body : { error: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json({ error: "Failed to fetch slugs" }, { status: 500 })
  }
}

/**
 * Handles POST requests for custom slugs.
 * Supports setting a new custom slug for a document or deleting an existing one.
 *
 * @param {NextRequest} req - The incoming Next.js request object, containing `docId` and `custom` (the slug or "__DELETE__") in its body.
 * @returns {NextResponse} A Next.js response object indicating success or failure of the operation.
 */
export async function POST(req: NextRequest) {
  try {
    const { docId, custom } = await req.json()
    if (!docId || typeof custom === 'undefined') {
      return NextResponse.json({ error: "docId and custom are required" }, { status: 400 })
    }
    let backendRes;
    if (custom === "__DELETE__") {
      // Delete slug
      backendRes = await fetch(`${API_BASE}/slugs/${encodeURIComponent(docId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': req.headers.get('Authorization') || '' },
      });
    } else {
      // Set slug
      backendRes = await fetch(`${API_BASE}/slugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ doc_id: docId, slug: custom })
      });
    }
    const data = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      throw new ApiError(data.error || 'Failed to update slug', backendRes.status, data);
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        typeof error.body === 'object' ? error.body : { error: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json({ error: "Failed to update custom slug" }, { status: 500 })
  }
}