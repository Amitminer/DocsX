import { useState, useEffect } from "react"
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { Clock, ChevronDown, ArrowRight, Trash2 } from "lucide-react"

interface RecentDoc {
  id: string
  title: string
  slug: string
}

export default function RecentsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [recentDocs, setRecentDocs] = useState<RecentDoc[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('recentDocs')
        if (stored) setRecentDocs(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const clearRecents = () => {
    localStorage.removeItem('recentDocs')
    setRecentDocs([])
    setIsOpen(false)
  }

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      {({ open }) => (
        <>
          <MenuButton
            onClick={() => setIsOpen(!isOpen)}
            className={`group relative flex items-center gap-3 px-3 py-3 h-11 rounded-full font-semibold text-white text-base transition-all duration-700 ease-out transform hover:scale-105 active:scale-95 w-full ${
              open ? 'scale-105 ring-2 ring-purple-400' : 'scale-100'
            } bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-cyan-500/25`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full transition-all duration-700 ${open ? 'opacity-100 blur-0' : 'opacity-80 blur-sm'}`} />
            <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full opacity-0 transition-all duration-700 ${open ? 'opacity-100 scale-105' : 'group-hover:opacity-50 scale-100'}`} />
            <div className="relative flex items-center gap-3">
              <div className={`relative p-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700 ease-out ${open ? 'rotate-12 scale-110 shadow-lg' : 'rotate-0 scale-100'}`}> 
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm tracking-wide">Recents</span>
              <ChevronDown className={`w-4 h-4 transition-all duration-700 ease-out ${open ? 'rotate-180 text-white' : 'rotate-0 text-gray-300'}`} />
            </div>
          </MenuButton>

          <MenuItems className="absolute left-0 mt-3 origin-top rounded-3xl bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl focus:outline-none z-50 overflow-hidden w-full max-w-[95vw] sm:w-72 min-w-0 text-xs sm:text-sm max-h-[60vh] overflow-y-auto p-1 sm:p-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-3xl" />
            <div className="relative p-1 sm:p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Recently Viewed
                </span>
                {recentDocs.length > 0 && (
                  <button
                    onClick={clearRecents}
                    title="Clear recent docs"
                    className="p-1 rounded hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </div>
              {recentDocs.length > 0 ? recentDocs.map((doc, index) => (
                <MenuItem key={doc.id}>
                  <a
                    href={`/docs/${doc.slug}`}
                    className="group relative w-full flex items-center gap-3 p-2 sm:p-3 rounded-2xl transition-all duration-500 ease-out transform text-xs sm:text-sm min-h-[40px] hover:bg-white/10 active:bg-white/20"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      transform: `translateY(${index * 2}px)`
                    }}
                  >
                    <div className="relative p-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-xs text-white truncate max-w-[100px]">
                        {doc.title}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </a>
                </MenuItem>
              )) : (
                <div className="text-xs text-gray-500 text-center py-2">No recent docs</div>
              )}
            </div>
          </MenuItems>
        </>
      )}
    </Menu>
  )
} 