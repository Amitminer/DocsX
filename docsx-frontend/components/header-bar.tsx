"use client"
import { Plus, User, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ProtectedActionButton } from "./auth/protected-action-button"
import { useUser } from "@clerk/nextjs"
import { useAuth } from "./auth"
import UserButton from "./auth/UserButton"

export default function HeaderBar() {
	const [mounted, setMounted] = useState(false)
	const { user, isLoaded } = useUser()
	const { openSignIn } = useAuth()

	useEffect(() => {
		setMounted(true)
	}, [])

	// Don't render authentication components until mounted to prevent hydration mismatch
	if (!mounted) {
		return (
			<header
				className="sticky top-0 z-50 bg-gradient-to-r from-slate-950/95 via-gray-900/95 to-slate-950/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl"
				suppressHydrationWarning
			>
				{/* Top gradient line */}
				<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16 sm:h-18 gap-2 min-w-0">
						{/* Logo */}
						{/* Lazyy to make own icon so yeah */}
						<div className="flex items-center flex-shrink-0">
							<Link href="/" className="group flex items-center gap-2 hover:scale-105 transition-transform duration-300">
								<div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all duration-300 shadow-lg">
									<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 drop-shadow-sm" />
									<div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
										<span className="text-[6px] sm:text-[8px] font-bold text-black">X</span>
									</div>
								</div>
								<span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
									Docs
									<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">X</span>
								</span>
							</Link>
						</div>

						{/* Actions - Show loading state */}
						<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
							<div className="w-10 h-10 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl animate-pulse"></div>
							<div className="w-10 h-10 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl animate-pulse"></div>
						</div>
					</div>
				</div>

				{/* Bottom gradient line */}
				<div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
			</header>
		)
	}

	return (
		<header
			className="sticky top-0 z-50 bg-gradient-to-r from-slate-950/95 via-gray-900/95 to-slate-950/95 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl"
			suppressHydrationWarning
		>
			{/* Top gradient line */}
			<div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16 sm:h-18 gap-2 min-w-0">
					{/* Logo */}
					<div className="flex items-center flex-shrink-0">
						<Link href="/" className="group flex items-center gap-2 hover:scale-105 transition-transform duration-300">
							<div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all duration-300 shadow-lg">
								<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 drop-shadow-sm" />
								<div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
									<span className="text-[6px] sm:text-[8px] font-bold text-black">X</span>
								</div>
							</div>
							<span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
								Docs
								<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">X</span>
							</span>
						</Link>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
						<ProtectedActionButton asChild onClick={() => (window.location.href = "/create")}>
							<button className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl">
								<Plus className="w-5 h-5" />
							</button>
						</ProtectedActionButton>

						{isLoaded && user ? (
							<UserButton />
						) : (
							<button
								onClick={openSignIn}
								className="group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 text-sm"
							>
								<User className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
								<span className="hidden xs:inline">Sign In</span>
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Bottom gradient line */}
			<div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
		</header>
	)
}
