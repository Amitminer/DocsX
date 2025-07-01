import { NextRequest, NextResponse } from "next/server"
import { ApiError } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

// GET /api/custom-slugs: fetch all slugs (for mapping)
// GET /api/custom-slugs?docId=...: get current slug for a doc
// GET /api/custom-slugs/{slug}: resolve a slug to docId
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

// Proxy POST: set or delete a slug
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