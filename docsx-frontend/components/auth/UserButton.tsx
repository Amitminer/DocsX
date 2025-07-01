"use client"

import { useState, useRef } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { Settings, LogOut } from "lucide-react"
import Image from "next/image"
import { useClickAway } from "react-use"

export default function UserButton() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickAway(dropdownRef, () => {
    if (isOpen) setIsOpen(false)
  })

  if (!user) return null

  const handleSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    setIsOpen(false)
    try {
      await signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      setIsSigningOut(false)
      window.location.href = "/"
    }
  }

  const handleProfileClick = () => {
    setIsOpen(false)
    openUserProfile()
  }

  const userInitials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || "U"

  const userImage = user.imageUrl
  const userDisplayName = user.fullName && user.fullName !== user.username
    ? user.fullName
    : `@${user.username}`;
  const userUsername = user.username;

  return (
    <div ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-gray-800/50 rounded-xl transition-all duration-200 group"
      >
        <div className="relative">
          {userImage ? (
            <Image
              src={userImage}
              alt={userDisplayName || "User"}
              width={40}
              height={40}
              className="w-10 h-10 rounded-xl border-2 border-gray-600/50 group-hover:border-purple-500/50 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-105 object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl border-2 border-gray-600/50 group-hover:border-purple-500/50 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-105 flex items-center justify-center text-white font-semibold text-sm">
              {userInitials}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-50">
          {/* User Info */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userDisplayName || "User"}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl border-2 border-gray-600/50 object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl border-2 border-gray-600/50 flex items-center justify-center text-white font-semibold">
                  {userInitials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{userDisplayName}</p>
                {userUsername && userDisplayName !== `@${userUsername}` && (
                  <p className="text-gray-400 text-sm truncate">@{userUsername}</p>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            <div className="h-px bg-gray-700/50 my-2" />

            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 