"use client"

import { Sparkles, X } from "lucide-react"
import type { AISummaryProps } from "../types/doc-view"

export function AISummary({ summary, onClose }: AISummaryProps) {
	return (
		<div className="relative bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl">
			{/* Decorative elements */}
			<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-t-3xl"></div>

			{/* Summary header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
						<Sparkles className="w-5 h-5 text-purple-400" />
					</div>
					<div>
						<div className="flex items-center gap-2 mb-1">
							<div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
							<span className="text-xs font-medium text-purple-300 uppercase tracking-wider">AI Generated</span>
						</div>
						<h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-200 to-blue-200 bg-clip-text text-transparent">
							Quick Summary
						</h2>
					</div>
				</div>

				<button
					onClick={onClose}
					className="group w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
				>
					<X className="w-4 h-4 text-purple-400 group-hover:rotate-90 transition-transform duration-300" />
				</button>
			</div>

			{/* Summary content */}
			<div className="prose prose-invert prose-purple max-w-none">
				<div className="text-gray-200 leading-relaxed text-base sm:text-lg">
					{summary.split("\n").map((paragraph, index) => (
						<p key={index} className="mb-4 last:mb-0">
							{paragraph}
						</p>
					))}
				</div>
			</div>

			{/* Powered by indicator */}
			<div className="flex items-center justify-center mt-6 pt-4 border-t border-purple-500/20">
				<div className="flex items-center gap-2 text-xs text-purple-300/70">
					<div className="w-4 h-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded flex items-center justify-center">
						<Sparkles className="w-2.5 h-2.5 text-purple-400" />
					</div>
					<span>Powered by Google AI</span>
				</div>
			</div>
		</div>
	)
}
