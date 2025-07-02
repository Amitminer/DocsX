/**
 * @file DocsGrid.tsx
 * @description This component displays a grid of document cards.
 * It handles infinite scrolling to load more documents as the user scrolls down.
 * It also integrates AI summarization functionality for each document card.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import DocCard from "./doc-card"
import { formatDate } from "@/lib/utils"
import type { Doc } from "@/components/types/doc-view"
import { useRef, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Transition } from "@headlessui/react"

/**
 * Props for the `DocsGrid` component.
 */
interface DocsGridProps {
  /** An array of document objects to display. */
  docs: Doc[]
  /** Indicates if author profile pictures have been loaded. */
  pfpLoaded: boolean
  /** A record mapping author IDs to their image URLs. */
  authorImages: Record<string, string | undefined>
  /** The ID of the document for which a summary is currently active. */
  activeSummaryDocId: string | null
  /** Indicates if the summary modal is currently shown. */
  showSummary: boolean
  /** Indicates if an AI summary is currently being generated. */
  isGeneratingSummary: boolean
  /** Function to trigger AI summarization for a document. */
  handleSummarize: (title: string, content: string) => Promise<void>
  /** Function to control the visibility of the summary modal. */
  setShowSummary: (show: boolean) => void
  /** Function to set the active summary document ID. */
  setActiveSummaryDocId: (id: string | null) => void
  /** Function to set the summary content. */
  setSummary: (summary: string | null) => void
  /** Indicates if there are more documents to load. */
  hasMore: boolean
  /** Function to load more documents. */
  loadMore: () => void
  /** Indicates if more documents are currently being loaded. */
  loadingMore: boolean
  /** Optional callback function when a tag is clicked. */
  onTagClick?: (tag: string) => void
}

/**
 * `DocsGrid` component displays documents in a responsive grid layout.
 * It supports infinite scrolling to load more documents as the user reaches the end of the current list.
 * Each document is rendered using `DocCard`, and AI summarization is integrated for individual documents.
 *
 * @param {DocsGridProps} props - The props for the component.
 * @returns {JSX.Element} The rendered document grid.
 */
export default function DocsGrid({
  docs,
  pfpLoaded,
  authorImages,
  activeSummaryDocId,
  showSummary,
  isGeneratingSummary,
  handleSummarize,
  setShowSummary,
  setActiveSummaryDocId,
  setSummary,
  hasMore,
  loadMore,
  loadingMore,
  onTagClick,
}: DocsGridProps) {
  /** @type {React.RefObject<HTMLDivElement>} Ref for the sentinel element used for infinite scrolling. */
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /**
   * Effect hook for implementing infinite scrolling.
   * Observes the `sentinelRef` and calls `loadMore` when it intersects the viewport.
   */
  useEffect(() => {
    if (!hasMore) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12">
      {docs.map((doc, i) => (
        <div
          key={doc.id}
          className="relative w-full animate-fade-in transition-transform duration-500"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <DocCard
            id={doc.id}
            title={doc.title}
            description={doc.description}
            author={doc.author_id}
            author_name={doc.author_name}
            authorImageUrl={pfpLoaded ? authorImages[doc.author_id] : undefined}
            createdDate={formatDate(doc.created_at)}
            likes={doc.likes}
            tags={doc.tags}
            views={doc.views}
            slug={doc.id}
            onSummarize={async () => {
              if (activeSummaryDocId === doc.id && showSummary) {
                setShowSummary(false);
                setActiveSummaryDocId(null);
                return;
              }
              setActiveSummaryDocId(doc.id);
              setSummary(null);
              setShowSummary(true);
              await handleSummarize(doc.title, doc.content);
            }}
            isGeneratingSummary={activeSummaryDocId === doc.id && isGeneratingSummary}
            onTagClick={onTagClick}
          />
        </div>
      ))}
      
      {/* Load More Section */}
      <Transition
        as="div"
        show={hasMore}
        enter="transition-all duration-500 ease-out"
        enterFrom="opacity-0 translate-y-4"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all duration-300 ease-in"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-4"
      >
        <div className="col-span-full flex flex-col items-center justify-center py-6" ref={sentinelRef}>
          {loadingMore ? (
            <div className="flex items-center gap-2 text-purple-300">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading more...</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="mt-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-blue-700 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300"
            >
              Load More
            </button>
          )}
        </div>
      </Transition>
    </div>
  )
}