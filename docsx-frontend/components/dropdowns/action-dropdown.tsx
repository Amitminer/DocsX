/**
 * @file action-dropdown.tsx
 * @description Dropdown menu component for document actions (edit, delete, share, custom URL) in DocsX.
 * Provides contextual actions for docs.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Share2, Download, Edit, Trash2, Flag, Check, AlertTriangle, X, Link as LinkIcon, Sparkles } from "lucide-react"
import { useDocActions } from "../../hooks/use-doc-actions"
import SetCustomUrlDialog from "../doc-view/SetCustomUrlDialog"

interface ActionDropdownProps {
	isAuthor?: boolean
	onEdit?: () => void
	onDelete?: () => void
	onDownload?: () => void
	onReport?: () => void
	onClose: () => void
	position?: { left: number; top: number }
	customUrl?: string
}

/**
 * ActionDropdown component renders a dropdown menu for document actions.
 *
 * @param {ActionDropdownProps} props - Props for the dropdown actions.
 * @returns {JSX.Element} The rendered dropdown menu.
 */
export function ActionDropdown({ isAuthor, onEdit, onDelete, onDownload, onReport, onClose, position, customUrl }: ActionDropdownProps) {
	const [isCopied, setIsCopied] = useState(false)
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [showCustomUrlModal, setShowCustomUrlModal] = useState(false)
	const [dropdownStyle, setDropdownStyle] = useState<{ left: number; top: number } | undefined>(undefined)
	const dropdownRef = useRef<HTMLDivElement>(null)

	// Get docId from URL
	const match = typeof window !== 'undefined' ? window.location.pathname.match(/\/docs\/([^/]+)/) : null;
	const docId: string = match && match[1] ? match[1] : "";

	// Only call useDocActions if docId is valid
	const docActions = useDocActions(0, docId);
	const { handleShare } = docActions;

	useEffect(() => {
		if (position) {
			const isMobile = window.innerWidth < 640;
			const width = isMobile ? 160 : 192; // w-40 (160px) for mobile, w-48 (192px) for desktop
			let left = position.left + window.scrollX;
			if (isMobile) left -= 12;
			const top = position.top + 4 + window.scrollY;
			const rightEdge = left + width;
			if (rightEdge > window.innerWidth - 8 + window.scrollX) {
				left = window.innerWidth - width - 8 + window.scrollX;
				if (left < 8 + window.scrollX) left = 8 + window.scrollX;
			}
			setDropdownStyle({ left, top });
		}
	}, [position]);

	const urlToCopy = customUrl ? `${window.location.origin}/docs/${customUrl}` : window.location.href;

	return (
		<>
			{/* Dropdown menu */}
			{position && dropdownStyle && createPortal(
				<div ref={dropdownRef} className="absolute z-50 w-40 sm:w-48 text-xs sm:text-sm px-1 py-1 sm:px-3 sm:py-2 bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-xl shadow-lg animate-in fade-in duration-150"
					style={{ left: dropdownStyle.left, top: dropdownStyle.top }}>
					{/* Subtle glow effect behind dropdown */}
					<div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-lg scale-105 opacity-40" />

					{/* Main dropdown */}
					<div className="relative bg-gray-900/98 backdrop-blur-xl rounded-2xl shadow-2xl py-3 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
						{/* Subtle animated border gradient */}
						<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />

						{/* Subtle floating particles effect */}
						<div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="absolute w-0.5 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse"
									style={{
										left: `${30 + (i * 20)}%`,
										top: `${20 + (i * 25)}%`,
										animationDelay: `${i * 0.8}s`,
										animationDuration: `${3 + (i * 0.5)}s`
									}}
								/>
							))}
						</div>

						{/* Share */}
						<button
							onClick={() => handleShare(
								document.title,
								urlToCopy,
								onClose,
								() => {
									setIsCopied(true);
									setTimeout(() => setIsCopied(false), 1500);
								}
							)}
							className="relative group w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white transition-all duration-300 text-sm overflow-hidden"
						>
							{/* Hover background effect */}
							<div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							<div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

							<div className="relative z-10 flex items-center gap-3 w-full">
								{isCopied ? (
									<div className="flex items-center justify-center w-5 h-5">
										<Check className="w-4 h-4 text-green-400 animate-in zoom-in duration-200" />
									</div>
								) : (
									<div className="flex items-center justify-center w-5 h-5 group-hover:scale-110 transition-transform duration-300">
										<Share2 className="w-4 h-4" />
									</div>
								)}
								<span className={`font-medium transition-colors duration-300 ${isCopied ? "text-green-400" : "group-hover:text-white"}`}>
									{isCopied ? "Copied!" : "Share Link"}
								</span>
								{isCopied && <Sparkles className="w-3 h-3 text-green-400 animate-pulse" />}
							</div>
						</button>

						{/* Download */}
						{onDownload && (
							<button
								onClick={() => {
									onDownload()
									onClose()
								}}
								className="relative group w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:text-white transition-all duration-300 text-sm overflow-hidden"
							>
								<div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
								<div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

								<div className="relative z-10 flex items-center gap-3 w-full">
									<div className="flex items-center justify-center w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
										<Download className="w-4 h-4" />
									</div>
									<span className="font-medium">Download</span>
								</div>
							</button>
						)}

						{/* Elegant divider with gradient */}
						{(isAuthor || onReport) && (
							<div className="my-2 mx-4">
								<div className="h-px bg-gradient-to-r from-transparent via-gray-600/80 to-transparent" />
							</div>
						)}

						{/* Author Actions */}
						{isAuthor ? (
							<>
								<button
									onClick={() => {
										onEdit?.()
										onClose()
									}}
									className="relative group w-full flex items-center gap-3 px-4 py-3 text-left text-blue-400 hover:text-blue-300 transition-all duration-300 text-sm overflow-hidden"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									<div className="absolute inset-0 bg-blue-400/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

									<div className="relative z-10 flex items-center gap-3 w-full">
										<div className="flex items-center justify-center w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
											<Edit className="w-4 h-4" />
										</div>
										<span className="font-medium">Edit Document</span>
									</div>
								</button>

								<button
									onClick={() => setShowCustomUrlModal(true)}
									className="relative group w-full flex items-center gap-3 px-4 py-3 text-left text-purple-400 hover:text-purple-300 transition-all duration-300 text-sm overflow-hidden"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									<div className="absolute inset-0 bg-purple-400/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

									<div className="relative z-10 flex items-center gap-3 w-full">
										<div className="flex items-center justify-center w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
											<LinkIcon className="w-4 h-4" />
										</div>
										<span className="font-medium">Custom URL</span>
									</div>
								</button>

								<button
									onClick={() => {
										setShowDeleteModal(true)
									}}
									className="relative group w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:text-red-300 transition-all duration-300 text-sm overflow-hidden"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-red-500/15 via-red-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									<div className="absolute inset-0 bg-red-400/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

									<div className="relative z-10 flex items-center gap-3 w-full">
										<div className="flex items-center justify-center w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
											<Trash2 className="w-4 h-4" />
										</div>
										<span className="font-medium">Delete Forever</span>
									</div>
								</button>
							</>
						) : (
							onReport && (
								<button
									onClick={() => {
										onReport()
										onClose()
									}}
									className="relative group w-full flex items-center gap-3 px-4 py-3 text-left text-orange-400 hover:text-orange-300 transition-all duration-300 text-sm overflow-hidden"
								>
									<div className="absolute inset-0 bg-gradient-to-r from-orange-500/15 via-orange-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									<div className="absolute inset-0 bg-orange-400/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />

									<div className="relative z-10 flex items-center gap-3 w-full">
										<div className="flex items-center justify-center w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
											<Flag className="w-4 h-4" />
										</div>
										<span className="font-medium">Report Issue</span>
									</div>
								</button>
							)
						)}
					</div>
				</div>,
				document.body
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteModal && typeof window !== 'undefined' && createPortal(
				<div
					className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
					onClick={() => setShowDeleteModal(false)}
				>
					{/* Background gradient effect */}
					<div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-500/10" />

					<div
						className="relative bg-gray-900/95 backdrop-blur-2xl border border-gray-700/60 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
						onClick={e => e.stopPropagation()}
					>
						{/* Subtle glow effect */}
						<div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-red-500/20 rounded-3xl blur-xl scale-105 opacity-30" />

						{/* Close button with hover effect */}
						<button
							onClick={() => setShowDeleteModal(false)}
							className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 hover:rotate-90 p-1 rounded-full hover:bg-gray-800/50"
						>
							<X className="w-6 h-6" />
						</button>

						{/* Animated icon */}
						<div className="flex justify-center mb-6">
							<div className="relative w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-3xl flex items-center justify-center animate-pulse">
								<div className="absolute inset-0 bg-red-500/10 rounded-3xl animate-ping" />
								<AlertTriangle className="w-10 h-10 text-red-400 relative z-10 animate-bounce" />
							</div>
						</div>

						{/* Content */}
						<div className="text-center mb-8 relative z-10">
							<h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">
								Delete Document
							</h2>
							<p className="text-gray-400 leading-relaxed">
								This action cannot be undone. The document will be permanently removed from our servers.
							</p>
						</div>

						{/* Buttons */}
						<div className="flex gap-4 relative z-10">
							<button
								onClick={() => setShowDeleteModal(false)}
								className="flex-1 py-4 px-6 bg-gray-800/80 hover:bg-gray-700/80 text-white rounded-2xl transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg border border-gray-700/50 hover:border-gray-600/50"
							>
								Keep Document
							</button>
							<button
								onClick={() => {
									onDelete?.()
									setShowDeleteModal(false)
									onClose()
								}}
								className="flex-1 py-4 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-2xl transition-all duration-300 font-semibold hover:scale-105 hover:shadow-lg hover:shadow-red-500/25 border border-red-500/50"
							>
								Delete Forever
							</button>
						</div>
					</div>
				</div>,
				document.body
			)}

			{/* Custom URL Modal */}
			<SetCustomUrlDialog
				open={showCustomUrlModal}
				onOpenChange={setShowCustomUrlModal}
				docId={docId}
				onSuccess={() => { }}
			/>
		</>
	)
}
