import DocCard from "./doc-card"
import { formatDate } from "@/lib/utils"
import type { Doc } from "@/components/types/doc-view"
import { useRef, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Transition } from "@headlessui/react"

interface DocsGridProps {
  docs: Doc[]
  pfpLoaded: boolean
  authorImages: Record<string, string | undefined>
  activeSummaryDocId: string | null
  showSummary: boolean
  isGeneratingSummary: boolean
  handleSummarize: (title: string, content: string) => Promise<void>
  setShowSummary: (show: boolean) => void
  setActiveSummaryDocId: (id: string | null) => void
  setSummary: (summary: string | null) => void
  hasMore: boolean
  loadMore: () => void
  loadingMore: boolean
  onTagClick?: (tag: string) => void
}

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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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