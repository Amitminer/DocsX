"use client"

import { Link } from "lucide-react"

interface ShareToastProps {
	show: boolean
}

export function ShareToast({ show }: ShareToastProps) {
	if (!show) return null

	return (
		<div className="fixed top-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border border-emerald-500/30 animate-in fade-in slide-in-from-top-4 duration-500">
			<div className="flex items-center space-x-3">
				<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
				<Link className="w-5 h-5" />
				<span className="font-medium">Link copied to clipboard!</span>
			</div>
		</div>
	)
}
