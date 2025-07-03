/**
 * @file markdown-preview.tsx
 * @description This component provides a live preview of Markdown content, including custom rendering for code blocks, images, and other Markdown elements.
 * It allows users to toggle the visibility of the preview.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { useState } from "react"
import { Eye, EyeOff } from 'lucide-react'
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import CodeBlock from "./code-block"
import { config } from "@/lib/config"
import rehypeRaw from "rehype-raw"

/**
 * Props for the `MarkdownPreview` component.
 */
interface MarkdownPreviewProps {
	/** The Markdown content to be previewed. */
	content: string
	/** Optional CSS class names to apply to the container. */
	className?: string
	/** The unique identifier of the document, used for resolving asset URLs. */
	docId?: string
}

/**
 * Renders a live preview of Markdown content.
 * It includes a toggle to show/hide the preview and custom rendering for various Markdown elements
 * to ensure consistency with the main document view.
 *
 * @param {MarkdownPreviewProps} { content, className, docId } - The props for the component.
 * @returns {JSX.Element} The rendered Markdown preview component.
 */
export default function MarkdownPreview({ content, className = "", docId }: MarkdownPreviewProps) {
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of the Markdown preview. */
	const [showPreview, setShowPreview] = useState(true)

	// If content is empty, display a message prompting the user to start typing.
	if (!content.trim()) {
		return (
			<div className={className}>
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-white">Preview</h3>
				</div>
				<div className="text-center py-16">
					<div className="text-gray-500 mb-4">
						<svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 className="text-xl font-medium text-gray-400 mb-2">Live Preview</h3>
					<p className="text-gray-500">Start typing in the content field to see a live preview of your markdown.</p>
				</div>
			</div>
		)
	}

	return (
		<div className={className}>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-white">Preview</h3>
				<button
					type="button"
					onClick={() => setShowPreview(!showPreview)}
					className="flex items-center space-x-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors duration-200"
				>
					{showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
					<span>{showPreview ? "Hide" : "Show"} Preview</span>
				</button>
			</div>

			{showPreview && (
				<div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-h-96 overflow-y-auto">
					<div className="prose prose-invert prose-purple max-w-none">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]} // Enables GitHub Flavored Markdown
							rehypePlugins={[rehypeRaw]} // Allows rendering raw HTML within Markdown
							components={{
								/** Custom renderer for `code` blocks (both inline and fenced). */
								code(props) {
									const { children, className, ...rest } = props
									const match = /language-(\w+)/.exec(className || "")
									const isInline = !match

									if (isInline) {
										return (
											<code className="bg-gray-800 px-2 py-1 rounded text-purple-300 text-sm font-mono" {...rest}>
												{children}
											</code>
										)
									}

									return (
										<CodeBlock className={className} inline={false}>
											{String(children).replace(/\n$/, "")}
										</CodeBlock>
									)
								},
								/** Custom renderer for `img` (images). */
								img: (props) => {
									if (!props.src) {
										return null;
									}
									let finalSrc = typeof props.src === "string" ? props.src : "";
									// Resolve internal asset paths to full API URLs
									if (docId) {
										if (finalSrc.startsWith('/docs/')) {
											const parts = finalSrc.split("/");
											const filename = parts.slice(3).join("/");
											finalSrc = `${config.apiBaseUrl.replace(/\/api$/, "")}/assets/${docId}/${filename}`;
										} else if (!finalSrc.startsWith('http') && !finalSrc.startsWith('/assets/')) {
											finalSrc = `${config.apiBaseUrl.replace(/\/api$/, "")}/assets/${docId}/${finalSrc.replace(/^\/*/, "")}`;
										} else if (finalSrc.startsWith('/assets/')) {
											finalSrc = `${config.apiBaseUrl.replace(/\/api$/, "")}${finalSrc}`;
										}
									}
									const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(finalSrc);
									// If the source is a video, render a simple video tag for preview
									if (isVideo) {
										return (
											<video
												src={finalSrc}
												controls
												style={{ maxWidth: '100%', borderRadius: '1rem', margin: '1.5rem 0' }}
											>
												{props.alt || "Your browser does not support the video tag."}
											</video>
										);
									}
									return (
										/* eslint-disable @next/next/no-img-element */
										<img
											{...props}
											src={finalSrc}
											alt={props.alt || ""}
											className="rounded-lg shadow-lg my-4"
											onError={e => {
												(e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
											}}
										/>
									);
								},
								// Simplified styles for preview
								h1: ({ children }) => (
									<h1 className="text-2xl font-bold text-white mt-6 mb-3 first:mt-0 border-b border-gray-700 pb-2">
										{children}
									</h1>
								),
								h2: ({ children }) => (
									<h2 className="text-xl font-bold text-white mt-5 mb-2 border-b border-gray-700 pb-1">{children}</h2>
								),
								h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
								blockquote: ({ children }) => (
									<blockquote className="border-l-4 border-purple-500 pl-4 my-3 italic text-gray-400 bg-gray-800/50 py-2 rounded-r">
										{children}
									</blockquote>
								),
								a: ({ href, children }) => {
									let finalHref = typeof href === "string" ? href : "";
									// Resolve internal asset paths to full API URLs
									if (typeof finalHref === "string" && docId) {
										if (finalHref.startsWith("/docs/")) {
											// Convert /docs/{docId}/{filename} to /assets/{docId}/{filename}
											const parts = finalHref.split("/");
											const filename = parts.slice(3).join("/");
											finalHref = `${config.apiBaseUrl.replace(/\/api$/, "")}/assets/${docId}/${filename}`;
										} else if (!finalHref.startsWith("http") && !finalHref.startsWith("/assets/")) {
											// Bare filename or other relative, treat as asset
											finalHref = `${config.apiBaseUrl.replace(/\/api$/, "")}/assets/${docId}/${finalHref.replace(/^\/*/, "")}`;
										} else if (finalHref.startsWith("/assets/")) {
											finalHref = `${config.apiBaseUrl.replace(/\/api$/, "")}${finalHref}`;
										}
									}
									return (
										<a
											href={finalHref}
											className="text-purple-400 hover:text-purple-300 underline transition-colors"
											target={finalHref?.startsWith("http") ? "_blank" : undefined}
											rel={finalHref?.startsWith("http") ? "noopener noreferrer" : undefined}
										>
											{children}
										</a>
									);
								},
								/** Custom renderer for `p` (paragraphs). */
								p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3">{children}</p>,
								/** Custom renderer for `ul` (unordered lists). */
								ul: ({ children }) => (
									<ul className="list-disc list-inside my-3 space-y-1 text-gray-300">{children}</ul>
								),
								/** Custom renderer for `ol` (ordered lists). */
								ol: ({ children }) => (
									<ol className="list-decimal list-inside my-3 space-y-1 text-gray-300">{children}</ol>
								),
								/** Custom renderer for `hr` (horizontal rule). */
								hr: () => <hr className="border-gray-700 my-4" />,
								/** Custom renderer for `strong` (bold text). */
								strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
								/** Custom renderer for `em` (emphasized text). */
								em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
							}}
						>
							{content}
						</ReactMarkdown>
					</div>
				</div>
			)}
		</div>
	)
}