"use client"

import { User, Calendar, MoreVertical, Sparkles, Zap } from "lucide-react"
import { useState, useRef, useEffect, type ReactNode } from "react"
import { ProtectedActionButton } from "./auth/protected-action-button"
import { ActionDropdown } from "./dropdowns/action-dropdown"
import { Tags } from "./doc-view/tags"
import type { DocHeaderProps } from "./types/doc-view"
import Image from "next/image"
import React from "react"

function wrapEmojis(text: string) {
	// Regex to match emoji characters
	return text.split(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu).map((part, i) =>
		/\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(part)
			? <span key={i} className="text-inherit animate-pulse">{part}</span>
			: part
	);
}

export function DocHeader({
	title,
	author,
	authorId,
	authorImageUrl,
	createdDate,
	tags = [],
	isAuthor,
	onEdit,
	onDelete,
	onDownload,
	onReport,
	children,
	customUrl,
}: DocHeaderProps & { children?: ReactNode }) {
	const [showDropdown, setShowDropdown] = useState(false)
	const pfpCache = useRef<Record<string, string | undefined>>({})
	const [actualAuthorImage, setActualAuthorImage] = useState<string | null>(authorImageUrl && authorImageUrl.length > 0 ? authorImageUrl : null)
	const dropdownRef = useRef<HTMLDivElement>(null)
	const [avatarLoaded, setAvatarLoaded] = useState(false)
	const [dropdownPosition, setDropdownPosition] = useState<{ left: number; top: number } | null>(null)
	const buttonWrapperRef = useRef<HTMLSpanElement>(null)

	useEffect(() => {
		// Load cache from localStorage on mount
		const stored = typeof window !== 'undefined' ? localStorage.getItem('pfpCache') : null;
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				Object.assign(pfpCache.current, parsed);
				if (authorId && pfpCache.current[authorId]) {
					setActualAuthorImage(pfpCache.current[authorId] || null);
				}
			} catch { }
		}
	}, [authorId]);

	useEffect(() => {
		if (!authorImageUrl && authorId) {
			if (pfpCache.current[authorId]) {
				setActualAuthorImage(pfpCache.current[authorId] || null);
				return;
			}
			let isMounted = true;
			fetch(`/api/clerk?userId=${authorId}`)
				.then(res => res.ok ? res.json() : null)
				.then(data => {
					if (isMounted && data && data.image_url) {
						pfpCache.current[authorId] = data.image_url;
						setActualAuthorImage(data.image_url);
						// Save to localStorage
						if (typeof window !== 'undefined') {
							localStorage.setItem('pfpCache', JSON.stringify(pfpCache.current));
						}
					}
				})
				.catch(() => { });
			return () => { isMounted = false; };
		}
	}, [authorId, authorImageUrl]);

	return (
		<div 
			className="relative mb-4 sm:mb-6 group"
		>
			{/* Dynamic background glow */}
			<div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-blue-600/20 to-cyan-600/20 rounded-3xl blur-3xl scale-105 opacity-0 group-hover:opacity-100 transition-all duration-700" />
			
			{/* Main container */}
			<div className="relative bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-800/95 backdrop-blur-2xl border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl">
				{/* Animated top accent */}
				<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 animate-pulse" />
				<div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
				
				{/* Floating orbs */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="absolute w-2 h-2 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-float"
							style={{
								left: `${20 + (i * 25)}%`,
								top: `${15 + (i * 20)}%`,
								animationDelay: `${i * 0.5}s`,
								animationDuration: `${4 + (i * 0.5)}s`
							}}
						/>
					))}
				</div>

				{/* Content */}
				<div className="relative p-4 sm:p-6 lg:p-8">
					{/* Header row */}
					<div className="flex items-start gap-3 mb-6">
						{/* Title section */}
						<div className="flex-1 min-w-0">
							{/* Document badge */}
							<div className="flex items-center gap-2 mb-3">
								<div className="flex items-center gap-1.5">
									<Sparkles className="w-3 h-3 text-violet-400 animate-pulse" />
									<span className="text-xs font-bold text-violet-400 uppercase tracking-wider">
										Document
									</span>
									<div className="w-1 h-1 bg-violet-400 rounded-full animate-pulse" />
								</div>
								{isAuthor && (
									<div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full border border-emerald-500/30">
										<Zap className="w-2.5 h-2.5 text-emerald-400" />
										<span className="text-xs font-medium text-emerald-400">Author</span>
									</div>
								)}
							</div>
							
							{/* Title */}
							<h1 className="text-xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-blue-100 to-violet-100 bg-clip-text text-transparent leading-tight break-words mb-2">
								{wrapEmojis(title)}
							</h1>
						</div>

						{/* Action button */}
						<div className="relative flex-shrink-0" ref={dropdownRef}>
							<span ref={buttonWrapperRef} className="inline-block">
								<ProtectedActionButton
									onClick={() => {
										setShowDropdown(!showDropdown)
										if (!showDropdown && buttonWrapperRef.current) {
											const rect = buttonWrapperRef.current.getBoundingClientRect()
											setDropdownPosition({ left: rect.left, top: rect.bottom })
										}
									}}
									className="group relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white rounded-2xl transition-all duration-300 border border-gray-600/50 hover:border-gray-500/50 shadow-lg hover:shadow-2xl hover:scale-105 overflow-hidden"
								>
									{/* Button glow effect */}
									<div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
									<MoreVertical className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
								</ProtectedActionButton>
							</span>

							{showDropdown && dropdownPosition && (
								<ActionDropdown
									isAuthor={isAuthor}
									onEdit={onEdit}
									onDelete={onDelete}
									onDownload={onDownload}
									onReport={onReport}
									onClose={() => setShowDropdown(false)}
									position={dropdownPosition}
									customUrl={customUrl}
								/>
							)}
						</div>
					</div>

					{/* Stats section */}
					<div className="flex flex-row flex-wrap items-center gap-2 mb-1">
						{/* Author info - Compact */}
						<div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded-lg border border-gray-600/30">
							{/* Avatar */}
							<div className="relative w-7 h-7 rounded-xl overflow-hidden border border-gray-600/40">
								{actualAuthorImage ? (
									<Image
										src={actualAuthorImage}
										alt={`${author}'s profile`}
										width={28}
										height={28}
										className={`w-full h-full object-cover transition-all duration-500 ${avatarLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
										onLoad={() => setAvatarLoaded(true)}
									/>
								) : (
									<div className="w-full h-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
										<User className="w-4 h-4 text-violet-400" />
									</div>
								)}
								{/* Online indicator */}
								<div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border-2 border-gray-900" />
							</div>
							<span className="text-xs font-semibold text-violet-300 truncate max-w-[80px]">{author}</span>
						</div>
						{/* Created date - Compact */}
						<div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
							<Calendar className="w-4 h-4 text-blue-400" />
							<span className="text-xs font-semibold text-blue-200 truncate max-w-[80px]">{createdDate}</span>
						</div>
					</div>

					{/* Tags section */}
					{tags && tags.length > 0 && (
						<div className="mt-3 mb-2">
							<Tags 
								tags={tags} 
								clickable={true}
								className="justify-start"
							/>
						</div>
					)}

					{/* Engagement Actions */}
					{children && (
						<div className="mt-3 pt-2 border-t border-gray-700/30">
							{children}
						</div>
					)}
				</div>
			</div>

			{/* Custom animations */}
			<style jsx>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px) rotate(0deg); }
					50% { transform: translateY(-10px) rotate(180deg); }
				}
				.animate-float {
					animation: float 4s ease-in-out infinite;
				}
			`}</style>
		</div>
	)
}