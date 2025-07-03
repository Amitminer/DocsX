/**
 * @file markdown-renderer.tsx
 * @description This component renders Markdown content using `react-markdown` with custom styling and handling for various elements.
 * It supports GitHub Flavored Markdown, raw HTML, and includes custom rendering for code blocks, headings, tables, links, and images/videos.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import { Copy, Archive, FileText, Download } from "lucide-react"
import { config } from "@/lib/config"
import CustomVideoPlayer from "./CustomVideoPlayer"
import React from "react"

/**
 * Props for the `MarkdownRenderer` component.
 */
interface MarkdownRendererProps {
	/** The Markdown content to be rendered. */
	content: string
	/** The unique identifier of the document, used for resolving asset URLs. */
	docId: string;
}

/**
 * Renders Markdown content with custom components and styling.
 * It provides enhanced rendering for code blocks (with copy functionality and language labels),
 * headings, tables, blockquotes, and intelligent handling of internal asset links (images, videos, files).
 *
 * @param {MarkdownRendererProps} { content, docId } - The props for the component.
 * @returns {JSX.Element} The rendered Markdown content.
 */
export function MarkdownRenderer({ content, docId }: MarkdownRendererProps) {
	/**
	 * Determines the appropriate file icon based on the file extension in the given href.
	 * @param {string} href - The URL or path of the file.
	 * @returns {JSX.Element} The Lucide icon component for the file type.
	 */
	const getFileIcon = (href: string) => {
		if (/\.(zip|tar|gz|rar)$/i.test(href)) return <Archive className="inline w-4 h-4 mr-1 text-yellow-400 align-text-bottom" />;
		if (/\.(pdf|docx?|txt)$/i.test(href)) return <FileText className="inline w-4 h-4 mr-1 text-red-400 align-text-bottom" />;
		return <Download className="inline w-4 h-4 mr-1 text-blue-400 align-text-bottom" />;
	};

	/**
	 * Checks if children contain any block-level elements or components that render block elements
	 */
	const hasBlockElements = (children: React.ReactNode): boolean => {
		return React.Children.toArray(children).some((child) => {
			if (React.isValidElement(child)) {
				// Check for HTML block elements
				if (typeof child.type === 'string' && 
					['div', 'video', 'table', 'ul', 'ol', 'pre', 'blockquote', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(child.type)) {
					return true;
				}
				// Check for custom components that might render block elements
				if (typeof child.type === 'function' || typeof child.type === 'object') {
					return true;
				}
				// Check for images that might be videos (which render as div)
				if (
					child.type === 'img' &&
					typeof (child.props as { src?: unknown })?.src === 'string'
				) {
					const src = (child.props as { src: string }).src;
					if (/\.(mp4|webm|ogg|mov|avi)$/i.test(src)) {
						return true;
					}
				}
			}
			return false;
		});
	};

	return (
		<div className="prose prose-invert prose-purple max-w-none prose-lg">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]} // Enables GitHub Flavored Markdown
				rehypePlugins={[rehypeRaw]} // Allows rendering raw HTML within Markdown
				components={{
					/** Custom renderer for `code` blocks (both inline and fenced). */
					code(props) {
						const { children, className, ...rest } = props
						const match = /language-(\w+)/.exec(className || "")
						const language = match ? match[1] : ""
						const isInline = !match

						// Render inline code with specific styling
						if (isInline) {
							return (
								<code
									className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-purple-300 text-sm font-mono break-all border border-gray-600/30 shadow-sm"
									{...rest}
								>
									{children}
								</code>
							)
						}

						// Render fenced code blocks with language label, copy button, and custom highlighting
						const codeString = String(children).replace(/\n$/, "")

						return (
							<div className="relative group my-6 sm:my-8">
								{/* Language label */}
								{language && (
									<div className="absolute -top-4 sm:-top-5 left-4 sm:left-6 z-10">
										<span
											className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white shadow-xl backdrop-blur-sm border ${language === "rust" || language === "rs"
												? "bg-gradient-to-r from-orange-600/90 to-red-600/90 border-orange-400/40 shadow-orange-500/30"
												: language === "python" || language === "py"
													? "bg-gradient-to-r from-green-600/90 to-blue-600/90 border-green-400/40 shadow-green-500/30"
													: language === "javascript" || language === "js"
														? "bg-gradient-to-r from-yellow-600/90 to-orange-600/90 border-yellow-400/40 shadow-yellow-500/30"
														: language === "typescript" || language === "ts"
															? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 border-blue-400/40 shadow-blue-500/30"
															: language === "bash" || language === "shell" || language === "sh"
																? "bg-gradient-to-r from-purple-600/90 to-pink-600/90 border-purple-400/40 shadow-purple-500/30"
																: language === "powershell" || language === "ps1"
																	? "bg-gradient-to-r from-blue-600/90 to-cyan-600/90 border-blue-400/40 shadow-blue-500/30"
																	: "bg-gradient-to-r from-gray-600/90 to-slate-600/90 border-gray-400/40 shadow-gray-500/30"
												}`}
										>
											{language.toUpperCase()}
										</span>
									</div>
								)}

								{/* Copy button */}
								<div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
									<button
										onClick={async () => {
											try {
												await navigator.clipboard.writeText(codeString)
											} catch (err) {
												console.error("Failed to copy code:", err)
											}
										}}
										className="flex items-center gap-2 bg-gradient-to-r from-gray-800/95 to-gray-700/95 hover:from-gray-700/95 hover:to-gray-600/95 text-gray-300 hover:text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 backdrop-blur-sm border border-gray-600/40 shadow-lg hover:shadow-xl hover:scale-105"
										title="Copy code"
									>
										<Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
										<span className="font-medium">Copy</span>
									</button>
								</div>

								<pre className="bg-gradient-to-br from-gray-950/90 via-slate-900/90 to-gray-950/90 border border-gray-700/40 rounded-2xl overflow-x-auto p-4 pt-8 sm:p-8 sm:pt-12 text-sm sm:text-base shadow-2xl backdrop-blur-sm">
									<code className="text-gray-100 font-mono leading-relaxed tracking-wide">
										{language === "bash" || language === "shell" || language === "sh"
											? codeString.split("\n").map((line, index) => {
												if (line.trim().startsWith("#")) {
													return (
														<div key={index} className="text-gray-500 italic">
															{line}
														</div>
													)
												}
												const highlightedLine = line.replace(
													/\b(cargo|cd|ls|mkdir|rm|cp|mv|cat|grep|find|chmod|sudo|apt|yum|brew|curl|wget|git|echo|pwd|which|whoami|ps|kill|top|htop|df|du|tar|zip|unzip|ssh|scp|rsync|new|build|run|test|install|update)\b/g,
													'<span class="text-purple-400 font-semibold">$1</span>',
												)
												return <div key={index} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
											})
											: language === "powershell" || language === "ps1"
												? codeString.split("\n").map((line, index) => {
													if (line.trim().startsWith("#")) {
														return (
															<div key={index} className="text-gray-500 italic">
																{line}
															</div>
														)
													}
													const highlightedLine = line
														.replace(/(\$\w+)/g, '<span class="text-orange-400">$1</span>')
														.replace(
															/\b(Get-|Set-|New-|Remove-|Start-|Stop-|Restart-|Test-|Write-|Read-|Copy-|Move-|Select-|Where-|ForEach|if|else|elseif|switch|for|foreach|while|do|try|catch|finally|function|param|return|Import-|Export-|Install-|Uninstall-)\w*/gi,
															'<span class="text-purple-400 font-semibold">$1</span>',
														)
													return <div key={index} dangerouslySetInnerHTML={{ __html: highlightedLine }} />
												})
												: codeString}
									</code>
								</pre>
							</div>
						)
					},
					/** Custom renderer for `h1` (level 1 heading). */
					h1: ({ children }) => (
						<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mt-8 sm:mt-12 mb-4 sm:mb-6 first:mt-0 border-b border-b-purple-500/50 pb-3">
							{children}
						</h1>
					),
					/** Custom renderer for `h2` (level 2 heading). */
					h2: ({ children }) => (
						<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent mt-6 sm:mt-8 mb-3 sm:mb-4 border-b border-gray-700/50 pb-2">
							{children}
						</h2>
					),
					/** Custom renderer for `h3` (level 3 heading). */
					h3: ({ children }) => (
						<h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white mt-5 sm:mt-6 mb-2 sm:mb-3">
							{children}
						</h3>
					),
					/** Custom renderer for `h4` (level 4 heading). */
					h4: ({ children }) => (
						<h4 className="text-base sm:text-lg lg:text-xl font-semibold text-white mt-4 sm:mt-5 mb-2 sm:mb-3">
							{children}
						</h4>
					),
					/** Custom renderer for `h5` (level 5 heading). */
					h5: ({ children }) => (
						<h5 className="text-sm sm:text-base lg:text-lg font-semibold text-white mt-3 sm:mt-4 mb-2">{children}</h5>
					),
					/** Custom renderer for `h6` (level 6 heading). */
					h6: ({ children }) => (
						<h6 className="text-xs sm:text-sm lg:text-base font-semibold text-white mt-3 mb-2">{children}</h6>
					),
					/** Custom renderer for `blockquote`. */
					blockquote: ({ children }) => (
						<blockquote className="relative border-l-4 border-gradient-to-b fro pl-6 my-6 italic text-gray-300 bg-gradient-to-r from-gray-800/30 to-transparent py-4 rounded-r-xl">
							<div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
							{children}
						</blockquote>
					),
					/** Custom renderer for `table`. */
					table: ({ children }) => (
						<div className="overflow-x-auto my-6 sm:my-8 -mx-4 sm:mx-0 rounded-2xl border border-gray-700/50 shadow-xl">
							<table className="w-full border-collapse bg-gradient-to-br from-gray-900/50 to-slate-900/50 backdrop-blur-sm">
								{children}
							</table>
						</div>
					),
					/** Custom renderer for `th` (table header). */
					th: ({ children }) => (
						<th className="border-b border-gray-700/50 px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-gray-800/80 to-gray-700/80 font-bold text-white text-left text-sm sm:text-base">
							{children}
						</th>
					),
					/** Custom renderer for `td` (table data). */
					td: ({ children }) => (
						<td className="border-b border-gray-800/30 px-4 py-3 sm:px-6 sm:py-4 text-gray-300 text-sm sm:text-base">
							{children}
						</td>
					),
					/** Custom renderer for `a` (links). */
					a: ({ href, children }) => {
						let finalHref = href || "";
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
						const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(finalHref);
						return (
							<a
								href={finalHref}
								className="text-purple-400 hover:text-purple-300 underline decoration-purple-500/50 hover:decoration-purple-400 underline-offset-2 transition-all duration-200 break-words font-medium"
								target={finalHref.startsWith("http") ? "_blank" : undefined}
								rel={finalHref.startsWith("http") ? "noopener noreferrer" : undefined}
								download={!finalHref.startsWith("http") && !isImage} // Suggest download for non-image internal links
							>
								{!isImage && getFileIcon(finalHref)} {/* Show file icon for non-image links */}
								{children}
							</a>
						);
					},
					/** Custom renderer for `img` (images). */
					img: ({ src, alt }) => {
						let finalSrc = (typeof src === 'string' ? src : '') || "/placeholder.svg";
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
						// If the source is a video, render the CustomVideoPlayer component
						if (isVideo) {
							return (
								<div className="w-full h-full my-6">
									<CustomVideoPlayer src={finalSrc} alt={alt} />
								</div>
							);
						}
						return (
							/* eslint-disable @next/next/no-img-element */
							<img
								src={finalSrc}
								alt={alt || ""}
								className="my-6 sm:my-8 rounded-2xl border border-gray-700/50 shadow-2xl"
								style={{ maxWidth: '100%', height: 'auto' }}
							/>
						);
					},
					/** Custom renderer for `ul` (unordered lists). */
					ul: ({ children }) => (
						<ul className="list-none my-4 sm:my-6 space-y-2 text-gray-300 text-base sm:text-lg">{children}</ul>
					),
					/** Custom renderer for `ol` (ordered lists). */
					ol: ({ children }) => (
						<ol className="list-none my-4 sm:my-6 space-y-2 text-gray-300 text-base sm:text-lg counter-reset-list">
							{children}
						</ol>
					),
					/** Custom renderer for `li` (list items). */
					li: ({ children }) => (
						<li className="text-gray-300 leading-relaxed flex items-start gap-3">
							<div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mt-2.5 flex-shrink-0"></div>
							<div className="flex-1">{children}</div>
						</li>
					),
					/** Custom renderer for `p` (paragraphs). */
					p: ({ children }) => {
						const hasBlock = hasBlockElements(children);
						const Wrapper = hasBlock ? 'div' : 'p';
						return (
							<Wrapper className="text-gray-300 leading-relaxed mb-4 sm:mb-6 text-base sm:text-lg">
								{children}
							</Wrapper>
						);
					},
					/** Custom renderer for `hr` (horizontal rule). */
					hr: () => (
						<hr className="border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent my-8 sm:my-12" />
					),
					/** Custom renderer for `strong` (bold text). */
					strong: ({ children }) => (
						<strong className="font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
							{children}
						</strong>
					),
					/** Custom renderer for `em` (emphasized text). */
					em: ({ children }) => <em className="italic text-gray-300 font-medium">{children}</em>,
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	)
}