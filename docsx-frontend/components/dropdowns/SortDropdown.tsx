/**
 * @file SortDropdown.tsx
 * @description This component provides a dropdown menu for sorting documents based on different criteria.
 * It allows users to sort by latest, most liked, or bookmarked documents.
 * @author AmitxD
 * @Copyright 2025
 */

import { Clock, TrendingUp, ChevronDown, Sparkles, Bookmark } from "lucide-react"
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { useState } from "react"

/**
 * Props for the `SortDropdown` component.
 */
interface SortDropdownProps {
  /** The current sorting criteria. */
  sortBy: "created_at" | "likes" | "bookmarked"
  /** Callback function to be called when the sort order changes. */
  onSortChange: (sort: "created_at" | "likes" | "bookmarked") => void
}

/**
 * `SortDropdown` component displays a dropdown menu for selecting document sorting criteria.
 * It allows users to sort documents by creation date (latest), number of likes (most liked), or bookmarked status.
 *
 * @param {SortDropdownProps} { sortBy, onSortChange } - The props for the component.
 * @returns {JSX.Element} The rendered SortDropdown component.
 */
export default function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the open/closed state of the dropdown menu. */
  const [isOpen, setIsOpen] = useState(false)

  /**
   * Returns configuration details for a given sort type.
   * @param {string} type - The type of sort (e.g., "created_at", "likes", "bookmarked").
   * @returns {object} An object containing the icon, label, and styling for the sort type.
   */
  const getSortConfig = (type: string) => {
    switch (type) {
      case "created_at":
        return {
          icon: Clock,
          label: "Latest",
          color: "from-violet-500 to-purple-600",
          bgColor: "from-violet-500/20 to-purple-600/20",
          borderColor: "border-violet-500/30",
          glowColor: "shadow-violet-500/25"
        }
      case "likes":
        return {
          icon: TrendingUp,
          label: "Most Liked",
          color: "from-cyan-500 to-blue-600",
          bgColor: "from-cyan-500/20 to-blue-600/20",
          borderColor: "border-cyan-500/30",
          glowColor: "shadow-cyan-500/25"
        }
      case "bookmarked":
        return {
          icon: Bookmark,
          label: "Bookmarked",
          color: "from-amber-500 to-orange-600",
          bgColor: "from-amber-500/20 to-orange-600/20",
          borderColor: "border-amber-500/30",
          glowColor: "shadow-amber-500/25"
        }
      default:
        return {
          icon: Clock,
          label: "Latest",
          color: "from-violet-500 to-purple-600",
          bgColor: "from-violet-500/20 to-purple-600/20",
          borderColor: "border-violet-500/30",
          glowColor: "shadow-violet-500/25"
        }
    }
  }

  /** @type {ReturnType<typeof getSortConfig>} The configuration for the currently selected sort option. */
  const currentConfig = getSortConfig(sortBy)
  /** @type {React.ElementType} The icon component for the currently selected sort option. */
  const IconComponent = currentConfig.icon

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <MenuButton
            onClick={() => setIsOpen(!isOpen)}
            className={`group relative flex items-center gap-3 px-6 py-3 rounded-full font-semibold text-white transition-all duration-700 ease-out transform hover:scale-105 active:scale-95 ${
              open ? 'scale-105' : 'scale-100'
            } flex-1 min-w-0 px-2 py-2 text-sm h-11`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${currentConfig.bgColor} rounded-full transition-all duration-700 ${open ? 'opacity-100 blur-0' : 'opacity-80 blur-sm'}`} />
            <div className={`absolute inset-0 bg-gradient-to-r ${currentConfig.color} rounded-full opacity-0 transition-all duration-700 ${open ? 'opacity-100 scale-105' : 'group-hover:opacity-50 scale-100'}`} />
            
            <div className="relative flex items-center gap-3">
              <div className={`relative p-2 rounded-full bg-gradient-to-r ${currentConfig.color} transition-all duration-700 ease-out ${open ? 'rotate-12 scale-110 shadow-lg' : 'rotate-0 scale-100'}`}>
                <IconComponent className="w-4 h-4 text-white" />
                {open && (
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" />
                )}
              </div>
              
              <span className="font-bold text-base tracking-wide">
                {currentConfig.label}
              </span>
              
              <ChevronDown 
                className={`w-4 h-4 transition-all duration-700 ease-out ${open ? 'rotate-180 text-white' : 'rotate-0 text-gray-300'}`} 
              />
            </div>
          </MenuButton>

          <MenuItems className="absolute right-0 mt-3 w-full max-w-[95vw] sm:w-60 origin-top-right rounded-3xl bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl focus:outline-none z-50 overflow-hidden min-w-0 text-xs sm:text-sm max-h-[60vh] overflow-y-auto p-1 sm:p-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 rounded-3xl" />
            <div className="relative p-1 sm:p-2">
              {[
                { type: "created_at", icon: Clock, label: "Latest", desc: "Recently created docs" },
                { type: "likes", icon: TrendingUp, label: "Most Liked", desc: "Popular in community" },
                { type: "bookmarked", icon: Bookmark, label: "Bookmarked", desc: "Your saved favorites" }
              ].map((option, index) => {
                const config = getSortConfig(option.type)
                const OptionIcon = option.icon
                const isActive = sortBy === option.type
                
                return (
                  <MenuItem key={option.type}>
                    <button
                      onClick={() => onSortChange(option.type as "created_at" | "likes" | "bookmarked")}
                      className={`group relative w-full flex items-center gap-3 p-2 sm:p-3 rounded-2xl transition-all duration-500 ease-out transform text-xs sm:text-sm min-h-[40px] hover:bg-white/10 active:bg-white/20 ${
                        isActive 
                          ? `bg-gradient-to-r ${config.bgColor} border ${config.borderColor} shadow-lg ${config.glowColor} scale-105` 
                          : 'hover:bg-white/10 hover:border hover:border-white/20 hover:scale-102'
                      }`}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        transform: `translateY(${index * 2}px)`
                      }}
                    >
                      <div className={`relative p-1.5 rounded-full transition-all duration-500 ease-out ${
                        isActive 
                          ? `bg-gradient-to-r ${config.color} shadow-lg` 
                          : 'bg-white/10 group-hover:bg-white/20'
                      }`}>
                        <OptionIcon className={`w-3.5 h-3.5 transition-colors duration-500 ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        }`} />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className={`font-semibold text-xs sm:text-sm transition-colors duration-500 ${
                          isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                        }`}>
                          {option.label}
                        </div>
                        <div className={`text-xs transition-colors duration-500 ${
                          isActive ? 'text-white/70' : 'text-gray-500 group-hover:text-gray-400'
                        }`}>
                          {option.desc}
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${config.color} animate-pulse shadow-lg`} />
                      )}
                    </button>
                  </MenuItem>
                )
              })}
            </div>
          </MenuItems>
        </>
      )}
    </Menu>
  )
}