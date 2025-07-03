/**
 * @file middleware.ts
 * @description This module defines the Clerk middleware for the Next.js application.
 * It protects routes and handles authentication by integrating with Clerk's authentication system.
 * @author AmitxD
 * @Copyright 2025
 */

import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * The default Clerk middleware.
 * This middleware automatically handles authentication and user session management for protected routes.
 */
export default clerkMiddleware();

/**
 * Configuration for the Clerk middleware.
 * Defines which routes the middleware should apply to.
 */
export const config = {
  /**
   * A matcher array that specifies which paths the middleware should run on.
   * It excludes static assets and the 404 page, while including all API routes.
   */
  matcher: [
    // Exclude 404 page from middleware
    "/((?!_next|404|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};