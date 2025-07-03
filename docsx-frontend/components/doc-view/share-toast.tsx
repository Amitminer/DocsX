/**
 * @file share-toast.tsx
 * @description This component displays a transient toast notification indicating that a link has been copied to the clipboard.
 * It provides visual feedback to the user after a successful copy action.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { Link } from "lucide-react"

/**
 * Props for the `ShareToast` component.
 */
interface ShareToastProps {
	/** Controls the visibility of the toast notification. */
	show: boolean
}

/**
 * `ShareToast` component displays a small, temporary notification to the user.
 * It is typically used to confirm that a link or other content has been successfully copied to the clipboard.
 *
 * @param {ShareToastProps} { show } - The props for the component.
 * @returns {JSX.Element | null} The rendered toast notification, or `null` if `show` is false.
 */
export function ShareToast({ show }: ShareToastProps) {
	// Render null if the toast should not be shown.
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