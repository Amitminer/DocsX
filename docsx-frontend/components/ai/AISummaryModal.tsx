/**
 * @file AISummaryModal.tsx
 * @description This component provides a modal dialog to display AI-generated summaries.
 * It shows a loading state while the summary is being generated and then displays the summary content.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { Sparkles, X } from "lucide-react"

/**
 * Props for the `AISummaryModal` component.
 */
interface AISummaryModalProps {
	/** Controls the open/closed state of the modal. */
	open: boolean
	/** Callback function to change the open state of the modal. */
	onOpenChange: (open: boolean) => void
	/** Indicates if the AI summary is currently being generated. */
	isGeneratingSummary: boolean
	/** The AI-generated summary text, or `null` if not yet available. */
	summary: string | null
}

/**
 * `AISummaryModal` component displays an AI-generated summary in a modal dialog.
 * It features a dynamic loading animation while the summary is being generated
 * and a clear, scrollable display for the summary text once available.
 *
 * @param {AISummaryModalProps} { open, onOpenChange, isGeneratingSummary, summary } - The props for the component.
 * @returns {JSX.Element} The rendered AI summary modal.
 */
export default function AISummaryModal({ open, onOpenChange, isGeneratingSummary, summary }: AISummaryModalProps) {
	return (
		<Dialog open={open} onClose={() => onOpenChange(false)} className="relative z-50">
			{/* Animated backdrop */}
			<div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500" aria-hidden="true" />

			{/* Modal container */}
			<div className="fixed inset-0 flex items-center justify-center p-4">
				<DialogPanel className="max-w-lg w-full bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 border border-gray-700/50 shadow-2xl rounded-3xl p-0 overflow-hidden transform transition-all duration-500 ease-out">
					{/* Animated border glow */}
					<div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

					{/* Header with organic styling */}
					<div className="relative px-6 pt-6 pb-2">
						<div className="flex items-center justify-between">
							<DialogTitle className="text-white flex items-center gap-3 text-lg font-bold">
								<div className="relative p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 shadow-lg">
									<Sparkles className="w-5 h-5 text-white" />
									<div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
								</div>
								AI Summary
							</DialogTitle>
							<button
								onClick={() => onOpenChange(false)}
								className="group p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
							>
								<X className="w-4 h-4" />
							</button>
						</div>
						<p className="text-gray-400 text-sm mt-3 ml-12">
							AI-generated summary of the documentation content
						</p>
					</div>

					{/* Content */}
					<div className="relative px-6 pb-6 pt-2 max-h-[60vh] overflow-y-auto">
						{isGeneratingSummary || !summary ? (
							<div className="flex flex-col items-center gap-6 py-12 justify-center">
								<div className="relative">
									<div className="relative p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20">
										<Sparkles className="w-8 h-8 animate-spin text-purple-400" />
									</div>
									<div className="absolute inset-0 w-16 h-16 border-2 border-purple-500/30 rounded-full animate-ping"></div>
									<div className="absolute inset-0 w-16 h-16 border-2 border-blue-500/20 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
								</div>
								<div className="text-center">
									<p className="text-xl text-white font-semibold mb-2">Generating summary...</p>
									<p className="text-gray-400">This usually takes 5-10 seconds</p>
								</div>
							</div>
						) : (
							<div className="relative">
								<div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 rounded-full opacity-50" />
								<div className="pl-4 whitespace-pre-line text-base text-gray-100 leading-relaxed animate-fade-in">
									{summary}
								</div>
							</div>
						)}
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	)
}