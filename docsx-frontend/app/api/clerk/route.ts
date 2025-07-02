/**
 * @file route.ts
 * @description This module defines the API route for fetching Clerk user data, specifically profile image URLs.
 * It supports fetching data for single users or in batches.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/utils';

/**
 * Handles GET requests to fetch Clerk user data.
 * It can fetch the profile image URL for a single user by `userId` or for multiple users by `userIds` (comma-separated).
 *
 * @param {NextRequest} req - The incoming Next.js request object, containing `userId` or `userIds` as search parameters.
 * @returns {NextResponse} A Next.js response object containing the user's image URL(s) or an error message.
 */
export async function GET(req: NextRequest) {
  const userIdsParam = req.nextUrl.searchParams.get('userIds');
  const userId = req.nextUrl.searchParams.get('userId');

  // Batch mode: Fetch image URLs for multiple user IDs.
  if (userIdsParam) {
    const userIds = userIdsParam.split(',').map(id => id.trim()).filter(Boolean);
    const results: Record<string, string | null> = {};
    await Promise.all(userIds.map(async (id) => {
      try {
        const res = await fetch(`https://api.clerk.dev/v1/users/${id}`, {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        });
        if (res.ok) {
          const user = await res.json();
          results[id] = user.image_url || null;
        } else {
          results[id] = null;
        }
      } catch (error) {
        if (error instanceof ApiError) {
          results[id] = null;
        } else {
        results[id] = null;
        }
      }
    }));
    return NextResponse.json(results);
  }

  // Single user fallback: Fetch image URL for a single user ID.
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const res = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    },
  });

  if (!res.ok) {
    throw new ApiError('User not found', res.status, {});
  }

  const user = await res.json();
  return NextResponse.json({ image_url: user.image_url });
}