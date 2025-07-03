/**
 * @file useDocs.ts
 * @description React hook for fetching and managing a list of DocsX documents, with filtering, sorting, and pagination.
 * Handles state and API calls for document discovery and infinite scroll.
 * @author AmitxD
 * @Copyright 2025
 */

import { useState, useEffect } from "react"
import type { Doc, ApiResponse } from "@/components/types/doc-view"
import { config } from "@/lib/config"
import { getBookmarkedDocIds } from "@/lib/utils";

/**
 * useDocs hook provides state and handlers for fetching, filtering, and paginating DocsX documents.
 *
 * @param {object} [filterParams] - Optional filters (author, tags, date, sort).
 * @returns {object} Document list state and handlers.
 */
export function useDocs(filterParams?: { author?: string; tags?: string[]; date?: string; sort?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<"created_at" | "likes" | "bookmarked">("created_at");
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const buildParams = (page = 1, search = searchQuery, sort = sortBy) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: sort === "bookmarked" ? "1000" : "12",
        sort_by: sort === "bookmarked" ? "created_at" : sort,
      });
      if (search.trim()) {
        params.append("search", search.trim());
      }
    if (filterParams) {
      if (filterParams.author) params.append("author", filterParams.author);
      if (filterParams.tags && filterParams.tags.length > 0) params.append("tags", filterParams.tags.join(","));
      if (filterParams.date) params.append("uploaded_date", filterParams.date);
      if (filterParams.sort) params.set("sort_by", filterParams.sort);
    }
    return params;
  };

  const fetchDocs = async (page = 1, search = "", sort: "created_at" | "likes" | "bookmarked" = "created_at") => {
    try {
      setLoading(true);
      const params = buildParams(page, search, sort);
      const response = await fetch(`${config.apiBaseUrl}/docs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch docs");
      }
      const data: ApiResponse = await response.json();
      let docsToShow = data.docs;
      if (sort === "bookmarked") {
        const bookmarkedIds = getBookmarkedDocIds();
        docsToShow = data.docs.filter(doc => bookmarkedIds.includes(doc.id));
      }
      setDocs(docsToShow);
      setTotalPages(Math.ceil(data.total / data.limit));
      setCurrentPage(data.page);
      setHasMore(data.docs.length > 0 && (data.page * data.limit) < data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs(1, searchQuery, sortBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortBy, filterParams?.author, filterParams?.tags?.join(","), filterParams?.date, filterParams?.sort]);

  const handlePageChange = (page: number) => {
    fetchDocs(page, searchQuery, sortBy);
  };

  // Infinite scroll: load more docs and append
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const params = buildParams(nextPage);
      const response = await fetch(`${config.apiBaseUrl}/docs?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch docs");
      }
      const data: ApiResponse = await response.json();
      const docsToShow = data.docs;
      setDocs(prev => [...prev, ...docsToShow]);
      setCurrentPage(nextPage);
      setHasMore(docsToShow.length > 0 && (nextPage * data.limit) < data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    docs,
    loading,
    error,
    currentPage,
    totalPages,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    handlePageChange,
    fetchDocs,
    hasMore,
    loadMore,
    loadingMore,
  };
} 