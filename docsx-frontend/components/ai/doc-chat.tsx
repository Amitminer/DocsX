/**
 * @file doc-chat.tsx
 * @description AI-powered chat assistant component for DocsX, providing writing and content suggestions for documents.
 * Displays a chat UI for interacting with Google AI.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Send, X, Bot, User, Loader2 } from "lucide-react"
import type { DocChatProps } from "../types/doc-view"

interface ChatMessage {
	id: string
	content: string
	isUser: boolean
	timestamp: Date
}

interface DocChatPropsWithInsert extends DocChatProps {
	onInsert?: (text: string) => void;
}

/**
 * DocChat component displays an AI chat assistant for document content help.
 *
 * @param {DocChatPropsWithInsert} props - Props for the chat assistant.
 * @returns {JSX.Element} The rendered chat assistant UI.
 */
export function DocChat({ docTitle, docContent, onClose, onInsert }: DocChatPropsWithInsert) {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [inputValue, setInputValue] = useState("")
	const [isLoading, setIsLoading] = useState(false)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus()
	}, [])

	const handleSendMessage = async () => {
		if (!inputValue.trim() || isLoading) return

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			content: inputValue.trim(),
			isUser: true,
			timestamp: new Date()
		}

		setMessages(prev => [...prev, userMessage])
		setInputValue("")
		setIsLoading(true)

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					question: userMessage.content,
					docTitle,
					docContent,
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to get response")
			}

			const data = await response.json()
			
			const botMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				content: data.answer,
				isUser: false,
				timestamp: new Date()
			}

			setMessages(prev => [...prev, botMessage])
		} catch {
			const errorMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				content: "Sorry, I couldn't process your question. Please try again.",
				isUser: false,
				timestamp: new Date()
			}
			setMessages(prev => [...prev, errorMessage])
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
			<div className="relative w-full max-w-2xl h-[80vh] sm:h-[600px] bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/30 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700/30">
					<div className="flex items-center gap-2 sm:gap-3">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
							<MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
						</div>
						<div>
							<div className="flex items-center gap-1 sm:gap-2 mb-1">
								<div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
								<span className="text-xs font-medium text-blue-300 uppercase tracking-wider">AI Content Assistant</span>
							</div>
							<h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
								Get writing, editing, and content suggestions
							</h2>
						</div>
					</div>

					<button
						onClick={onClose}
						className="group w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
					>
						<X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
					</button>
				</div>

				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
					{messages.length === 0 && (
						<div className="text-center text-gray-400 py-6 sm:py-8">
							<MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-500" />
							<p className="text-xs sm:text-sm">Ask AI to help you write, improve, or generate documentation content!</p>
						</div>
					)}

					{messages.map((message) => (
						<div
							key={message.id}
							className={`flex gap-2 sm:gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
						>
							{!message.isUser && (
								<div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
									<Bot className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
								</div>
							)}
							
							<div
								className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
									message.isUser
										? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-100 border border-blue-500/30"
										: "bg-gradient-to-r from-gray-800/60 to-gray-700/60 text-gray-200 border border-gray-600/30"
								}`}
							>
								<p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
								<p className="text-xs text-gray-400 mt-1 sm:mt-2">
									{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</p>
								{/* Insert to Content button for AI messages */}
								{!message.isUser && onInsert && (
									<button
										className="mt-2 px-3 py-1 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-all"
										onClick={() => onInsert(message.content)}
									>
										Insert to Content
									</button>
								)}
							</div>

							{message.isUser && (
								<div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-full flex items-center justify-center flex-shrink-0">
									<User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
								</div>
							)}
						</div>
					))}

					{isLoading && (
						<div className="flex gap-2 sm:gap-3 justify-start">
							<div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
								<Bot className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
							</div>
							<div className="bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-600/30 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
								<div className="flex items-center gap-2">
									<Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 animate-spin" />
									<span className="text-xs sm:text-sm text-gray-300">Thinking...</span>
								</div>
							</div>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>

				{/* Input */}
				<div className="p-4 sm:p-6 border-t border-gray-700/30">
					<div className="flex gap-2 sm:gap-3">
						<input
							ref={inputRef}
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder="Ask AI to generate, rewrite, or improve content (e.g., 'Summarize this section', 'Expand on this topic')"
							className="flex-1 bg-gradient-to-r from-gray-800/60 to-gray-700/60 border border-gray-600/30 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
							disabled={isLoading}
						/>
						<button
							onClick={handleSendMessage}
							disabled={!inputValue.trim() || isLoading}
							className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-500/50 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
						>
							<Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
} 