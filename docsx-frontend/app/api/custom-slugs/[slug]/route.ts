import { NextRequest, NextResponse } from "next/server";
import { ApiError } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

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