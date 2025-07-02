/**
 * @file doc-form.tsx
 * @description This component provides a form for creating and editing documents.
 * It includes fields for title, description, content (with Markdown preview and AI enhancement),
 * and tags. It also supports asset uploads via drag-and-drop.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Save, X, FileText, UploadCloud, Maximize2 } from "lucide-react"
import { Combobox } from "@headlessui/react"
import MarkdownPreview from "./doc-view/markdown-preview"
import { useEnhanceContent } from "@/hooks/use-enhance-content"
import Link from "next/link"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import AssetCard from "./doc-view/asset-card"
import { useDocAssets } from "@/hooks/useDocAssets"
import { AnimatePresence, motion } from "framer-motion"
import { config } from "@/lib/config"


/**
 * Props for the `DocForm` component.
 */
interface DocFormProps {
	/** Initial data to pre-fill the form fields when editing. */
	initialData?: {
		/** The unique ID of the document (only present when editing). */
		id?: string
		/** The title of the document. */
		title: string
		/** The description of the document. */
		description: string
		/** The content of the document in Markdown format. */
		content: string
		/** An array of tags associated with the document. */
		tags?: string[]
	}
	/** Callback function to be called when the form is submitted. */
	onSubmit?: (data: {
		/** The title of the document. */
		title: string
		/** The description of the document. */
		description: string
		/** The content of the document. */
		content: string
		/** An array of tags. */
		tags?: string[]
	}) => void
	/** Callback function to be called when the form is cancelled. */	onCancel?: () => void
	/** Indicates whether the form is in editing mode. */	isEditing?: boolean
	/** Indicates whether the form is currently submitting. */	isSubmitting?: boolean
}

/**
 * Predefined options for AI content enhancement.
 */
const ENHANCE_OPTIONS = [
	"Summarize",
	"Expand",
	"Fix grammar",
	"Make concise",
	"Improve clarity"
];

/**
 * `DocForm` component provides a comprehensive form for creating and editing documents.
 * It features fields for title, description, and Markdown content, along with tag management.
 * Integrated AI enhancement tools and drag-and-drop asset upload functionality streamline the content creation process.
 *
 * @param {DocFormProps} props - The props for the component.
 * @returns {JSX.Element} The rendered document form.
 */
export default function DocForm({
	initialData = {
		title: "",
		description: "",
		content: "",
		tags: [],
	},
	onSubmit,
	onCancel,
	isEditing = false,
}: DocFormProps) {
	/** @type {[typeof initialData, React.Dispatch<React.SetStateAction<typeof initialData>>]} State for managing form data. */
	const [formData, setFormData] = useState(initialData)
	/** @type {[string[], React.Dispatch<React.SetStateAction<string[]>>]} State for managing document tags. */
	const [tags, setTags] = useState<string[]>(initialData.tags || [])
	/** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the current tag input value. */
	const [tagInput, setTagInput] = useState("")
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if the form is currently submitting. */
	const [isSubmitting, setIsSubmitting] = useState(false)
	/** @type {ReturnType<typeof useEnhanceContent>} Hook for AI content enhancement functionality. */
	const { enhanceContent, isEnhancing } = useEnhanceContent()
	/** @type {ReturnType<typeof useAuth>["getToken"]} Function to get the authentication token. */
	const { getToken } = useAuth()
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if an asset is currently uploading. */
	const [isUploading, setIsUploading] = useState(false)
	/** @type {React.RefObject<HTMLTextAreaElement>} Ref for the content textarea element. */
	const contentRef = useRef<HTMLTextAreaElement>(null)
	/** @type {ReturnType<typeof useDocAssets>} Hook for managing document assets. */
	const { assets, loadingAssets, fetchAssets } = useDocAssets(initialData?.id, isEditing)
	/** @type {[object, React.Dispatch<React.SetStateAction<object>>]} State for form validation errors. */
	const [errors, setErrors] = useState<{ title?: string; description?: string; content?: string }>({})
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control fullscreen mode for the content editor. */
	const [isFullScreen, setIsFullScreen] = useState(false);
	/** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the AI enhancement instruction. */
	const [enhanceInstruction, setEnhanceInstruction] = useState("");

	/**
	 * Callback function for handling dropped files (asset uploads).
	 * If no document ID exists (new document), it attempts to auto-save a draft first.
	 * Uploads files to the backend and inserts Markdown links into the content.
	 * @param {File[]} acceptedFiles - An array of files accepted by the dropzone.
	 */
	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		if (!acceptedFiles.length) return;

		// If we don't have a document ID, we are creating a new doc. Auto-save first.
		if (!initialData?.id) {
			if (onSubmit) {
				const toastId = toast.loading("Creating a draft to enable uploads...");
				try {
					await onSubmit({
						title: formData.title || "Untitled Document",
						description: formData.description || "No description",
						content: formData.content || "No content",
					});
					toast.success("Draft created! You can now upload assets.", { id: toastId });
				} catch (error) {
					console.error("Auto-save failed:", error);
					toast.error("Could not create a draft. Please save manually first.", { id: toastId });
				}
			}
			return;
		}

		setIsUploading(true)
		const toastId = toast.loading(`Uploading ${acceptedFiles.length} file(s)...`)

		try {
			const token = await getToken({ template: "docs" })
			const formData = new FormData()
			acceptedFiles.forEach(file => {
				formData.append("files", file)
			})
			const uploadUrl = `${config.apiBaseUrl}/docs/${initialData.id}/assets`;
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: "Upload failed with non-JSON response" }));
				throw new Error(errorData.message || "Upload failed");
			}
			const newAsset = await response.json();
			// Always insert markdown with just the filename
			const altText = newAsset.original_name.split('.').slice(0, -1).join('');
			const isImage = newAsset.mime_type && newAsset.mime_type.startsWith('image/');
			const markdownToInsert = isImage
				? `![${altText}](${newAsset.filename})`
				: `[${newAsset.original_name}](${newAsset.filename})`;
			if (contentRef.current) {
				const { selectionStart, selectionEnd } = contentRef.current;
				const currentContent = contentRef.current.value;
				const newContent =
					currentContent.substring(0, selectionStart) +
					markdownToInsert +
					currentContent.substring(selectionEnd);
				setFormData(prev => ({ ...prev, content: newContent }));
			}
			if (typeof fetchAssets === "function") fetchAssets();
			toast.success(`Asset "${acceptedFiles[0].name}" uploaded successfully!`);
		} catch (error) {
			console.error("Upload error:", error);
			toast.error(error instanceof Error ? error.message : "An unknown error occurred", { id: toastId })
		} finally {
			setIsUploading(false)
			toast.dismiss(toastId)
		}
	}, [getToken, initialData?.id, onSubmit, formData.title, formData.description, formData.content, fetchAssets]);

	/** @type {ReturnType<typeof useDropzone>} Dropzone hook for file uploads. */
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		disabled: isUploading,
		accept: {
			"image/jpeg": [],
			"image/png": [],
			"application/pdf": [],
			"application/postscript": [".xd"],
			"application/zip": [".zip"],
			"video/mp4": [".mp4"],
			"video/webm": [".webm"],
			"video/ogg": [".ogv", ".ogg"],
		}
	})

	/**
	 * Handles the form submission.
	 * Performs client-side validation and calls the `onSubmit` prop if validation passes.
	 * @param {React.FormEvent} e - The form event.
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)
		// Validate required fields
		const newErrors: typeof errors = {}
		if (!formData.title.trim()) newErrors.title = "Title is required"
		if (!formData.description.trim()) newErrors.description = "Description is required"
		if (!formData.content.trim()) newErrors.content = "Content is required"
		setErrors(newErrors)
		if (Object.keys(newErrors).length > 0) {
			setIsSubmitting(false)
			return
		}
		try {
			onSubmit?.({ ...formData, tags })
		} finally {
			setIsSubmitting(false)
		}
	}

	/**
	 * Handles changes to form input fields (title, description).
	 * @param {string} field - The name of the field being changed.
	 * @param {string} value - The new value of the field.
	 */
	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	/**
	 * Handles changes to the content textarea.
	 * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event from the textarea.
	 */
	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setFormData(prev => ({ ...prev, content: e.target.value }))
	}

	/**
	 * Adds a new tag to the list of tags.
	 * Trims and converts the tag to lowercase, and only adds if it's not empty and not already present.
	 */
	const handleAddTag = () => {
		const trimmedTag = tagInput.trim().toLowerCase()
		if (trimmedTag && !tags.includes(trimmedTag)) {
			setTags(prev => [...prev, trimmedTag])
			setTagInput("")
		}
	}

	/**
	 * Removes a tag from the list of tags.
	 * @param {string} tagToRemove - The tag to be removed.

	 */
	const handleRemoveTag = (tagToRemove: string) => {
		setTags(prev => prev.filter(tag => tag !== tagToRemove))
	}

	/**
	 * Handles key down events in the tag input field.
	 * Adds a tag on Enter, comma, or space key press.
	 * @param {React.KeyboardEvent} e - The keyboard event.
	 */
	const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault()
			handleAddTag()
		} else if (e.key === "," || e.key === " ") {
			e.preventDefault()
			handleAddTag()
		}
	}

	/**
	 * Handles the AI content enhancement request.
	 * Calls the `enhanceContent` hook with the current content and enhancement instruction.
	 */
	const handleEnhanceContent = async () => {
		if (!formData.content.trim()) return;
		try {
			const instruction = enhanceInstruction.trim() || "Enhance this content";
			const enhancedContent = await enhanceContent(`${instruction}\n\n${formData.content}`);
			if (enhancedContent) {
				setFormData(prev => ({ ...prev, content: enhancedContent }));
			}
		} catch (error) {
			console.error("Error enhancing content:", error);
		}
	}

	/**
	 * Effect hook to listen for a custom 'refresh-assets' event.
	 * When triggered, it refetches the document assets.
	 */
	useEffect(() => {
		const handler = () => {
			if (typeof fetchAssets === "function") fetchAssets();
		};
		window.addEventListener('refresh-assets', handler);
		return () => window.removeEventListener('refresh-assets', handler);
	}, [fetchAssets]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 overflow-auto">
			<AnimatePresence>
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 40 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="relative max-w-2xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8"
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<Link href="/" className="text-purple-400 hover:underline text-sm font-semibold">
							← Back
						</Link>
						{/* <h1 className="text-lg sm:text-2xl font-bold text-white text-center flex-1">
							{isEditing ? "Edit Documentation" : "Create New Documentation"}
						</h1> */}
						{onCancel ? (
							<button
								type="button"
								onClick={onCancel}
								className="ml-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900/80 text-gray-300 hover:bg-gray-800/80 border border-gray-700/30 transition-all duration-200 shadow-md"
								aria-label="Cancel"
							>
								Cancel
							</button>
						) : <span className="w-16" />} {/* Spacer for alignment */}
					</div>

					{/* Form Container */}
					<div className="bg-gradient-to-br from-gray-900/80 to-slate-900/80 rounded-2xl shadow-lg p-6 mb-6 border border-gray-700/30">
						<form onSubmit={handleSubmit} className="space-y-8">
							{/* Title */}
							<div className="space-y-2">
								<label className="block text-sm font-semibold text-gray-300">Title *</label>
								<input
									type="text"
									value={formData.title}
									onChange={(e) => handleChange("title", e.target.value)}
									placeholder="How to install Minecraft Bedrock in Windows"
									className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 shadow-md"
									required
								/>
								{errors.title && <div className="text-red-400 text-xs mt-1">{errors.title}</div>}
							</div>

							<div className="border-t border-gray-700/20 my-4" />

							{/* Description */}
							<div className="space-y-2">
								<label className="block text-sm font-semibold text-gray-300">Description *</label>
								<textarea
									value={formData.description}
									onChange={(e) => handleChange("description", e.target.value)}
									placeholder="A comprehensive guide on installing Minecraft Bedrock Edition on Windows..."
									rows={3}
									className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 shadow-md resize-none"
									required
								/>
								{errors.description && <div className="text-red-400 text-xs mt-1">{errors.description}</div>}
							</div>

							<div className="border-t border-gray-700/20 my-4" />

							{/* Tags */}
							<div className="space-y-2">
								<label className="block text-sm font-semibold text-gray-300">Tags</label>
								<div className="flex flex-col sm:flex-row gap-2 w-full">
									<input
										type="text"
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										onKeyDown={handleTagInputKeyDown}
										placeholder="Add tags (press Enter, comma, or space)"
										className="flex-1 px-4 py-3 bg-gray-900/80 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-300 shadow-md"
									/>
									<button
										type="button"
										onClick={handleAddTag}
										disabled={!tagInput.trim()}
										className="px-4 py-3 bg-green-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
									>
										Add
									</button>
								</div>
								<div className="flex flex-wrap gap-2 mt-2">
									{tags.map((tag) => (
										<span key={tag} className="flex items-center gap-1 px-3 py-1 bg-green-700/20 text-green-200 border border-green-500/20 rounded-full text-xs font-medium shadow-sm">
											{tag}
											<button
												type="button"
												onClick={() => handleRemoveTag(tag)}
												className="text-green-400 hover:text-green-200 transition-colors duration-200"
											>
												<X className="w-3 h-3" />
											</button>
										</span>
									))}
								</div>
							</div>

							<div className="border-t border-gray-700/20 my-4" />

							{/* Content */}
							<div className="space-y-2">
								<label className="block text-sm font-semibold text-gray-300">Content *</label>
								<div className="flex flex-col sm:flex-row gap-2 mb-2">
									<button type="button" onClick={() => setIsFullScreen(true)} className="flex items-center gap-1 px-3 py-1 rounded-xl bg-gray-900/80 text-gray-300 hover:bg-gray-800/80 text-xs font-medium border border-gray-700/30 transition-all shadow-md">
										<Maximize2 className="w-4 h-4" /> Full Screen
									</button>
									<div className="w-full sm:w-auto flex-1 min-w-0">
										<Combobox value={enhanceInstruction} onChange={val => setEnhanceInstruction(val ?? "")} as="div">
											<div className="relative">
												<Combobox.Input
													className="w-full px-3 py-1 rounded-xl border border-purple-500/20 bg-gray-900/80 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
													placeholder="What should AI do? (e.g., Summarize, Fix grammar...)"
													onChange={e => setEnhanceInstruction(e.target.value)}
													displayValue={val => (val ? String(val) : "")}
												/>
												<Combobox.Options className="absolute z-10 mt-1 w-full bg-gray-900 border border-purple-500/20 rounded-xl shadow-lg max-h-40 overflow-auto">
													{ENHANCE_OPTIONS.filter(opt => opt.toLowerCase().includes((enhanceInstruction || "").toLowerCase())).map(option => (
														<Combobox.Option key={option} value={option} className={({ active }) => `cursor-pointer select-none px-4 py-2 text-sm rounded-xl ${active ? 'bg-purple-600 text-white' : 'text-gray-200'}`}>
															{option}
														</Combobox.Option>
													))}
												</Combobox.Options>
											</div>
										</Combobox>
									</div>
									<button
										type="button"
										onClick={handleEnhanceContent}
										disabled={isEnhancing || !formData.content.trim()}
										className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto shadow-md"
									>
										{isEnhancing ? 'Enhancing...' : '✨ Enhance with AI'}
									</button>
								</div>
								<textarea
									ref={contentRef}
									value={formData.content}
									onChange={handleContentChange}
									placeholder="# Getting Started\n\n## Prerequisites\n- Windows 10 or later\n- At least 4GB RAM\n\n## Installation Steps\n1. Download the installer from the official website\n2. Run the installer as administrator\n3. Follow the setup wizard..."
									rows={10}
									className="w-full px-4 py-3 bg-gray-900/80 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 text-base font-mono resize-none shadow-md"
									required
								/>
								{errors.content && <div className="text-red-400 text-xs mt-1">{errors.content}</div>}
							</div>
							<MarkdownPreview content={formData.content} docId={initialData.id} />


							{/* Full Screen Content Modal */}
							{isFullScreen && (
								<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
									<div className="bg-gray-900 rounded-2xl p-6 max-w-3xl w-full h-[90vh] flex flex-col relative shadow-2xl border border-purple-500/20">
										<button
											onClick={() => setIsFullScreen(false)}
											className="absolute top-3 right-3 text-gray-400 hover:text-purple-400"
											aria-label="Exit Full Screen"
										>
											<X className="w-5 h-5" />
										</button>
										<h4 className="text-lg font-bold mb-3 text-purple-300">Full Screen Editor</h4>
										<textarea
											ref={contentRef}
											value={formData.content}
											onChange={handleContentChange}
											className="flex-1 w-full px-4 py-3 bg-gray-900/80 border border-gray-700/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 text-base font-mono resize-none shadow-md"
											style={{ minHeight: '60vh' }}
										/>
									</div>
								</div>
							)}

							{/* Asset Upload Section - Improved */}
							<div className="space-y-4">
								<label className="block text-sm font-semibold text-gray-300">Attachments</label>

								{/* Upload Dropzone */}
								<div
									{...getRootProps()}
									className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 ${isDragActive
										? "border-purple-500 bg-purple-500/10 scale-[1.02]"
										: "border-gray-700/40 hover:border-purple-500/50 hover:bg-purple-500/5"
										} shadow-sm hover:shadow-md`}
								>
									<input {...getInputProps()} />
									<div className="flex flex-col items-center justify-center gap-3 text-gray-400">
										<div className={`p-3 rounded-full transition-colors duration-300 ${isDragActive ? "bg-purple-500/20 text-purple-400" : "bg-gray-800/50"
											}`}>
											<UploadCloud className="w-8 h-8" />
										</div>
										{isUploading ? (
											<div className="flex items-center gap-2">
												<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												<p className="text-purple-400 font-medium">Uploading...</p>
											</div>
										) : isDragActive ? (
											<p className="text-purple-400 font-medium">Drop the files here</p>
										) : (
											<div className="space-y-2">
												<p className="text-gray-300 font-medium">
													Drag & drop files here, or click to browse
												</p>
												<p className="text-xs text-gray-500">
													{isEditing
														? "Images, PDFs, ZIP files up to 10MB each"
														: "Save document first to enable file uploads"
													}
											</p>
											</div>
										)}
									</div>
								</div>

								{/* Assets Grid - Only show when editing and assets exist */}
								{isEditing && (
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
												<FileText className="w-4 h-4" />
												Uploaded Assets
											</h4>
											{assets.length > 0 && (
												<span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
													{assets.length} {assets.length === 1 ? 'file' : 'files'}
												</span>
											)}
										</div>

										{loadingAssets ? (
											<div className="flex items-center justify-center py-8 space-x-2">
												<div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
												<p className="text-gray-400">Loading assets...</p>
											</div>
										) : assets.length > 0 ? (
											<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
												{assets.map(asset => (
													<AssetCard key={asset.id} asset={asset} />
												))}
											</div>
										) : (
											<div className="flex flex-col items-center justify-center py-8 px-4 text-center">
												<div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mb-3">
													<FileText className="w-6 h-6 text-gray-500" />
												</div>
												<p className="text-gray-400 font-medium mb-1">No files uploaded yet</p>
												<p className="text-xs text-gray-500">
													Upload images, documents, or other files to enhance your documentation
												</p>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Submit Button */}
							<div className="flex justify-end mt-8">
								<button
									type="submit"
									disabled={isSubmitting}
									className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-base bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:from-purple-600 hover:to-blue-600 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
								>
									{isSubmitting && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>}
									{isEditing ? "Save Changes" : "Create Document"}
									<Save className="w-5 h-5" />
								</button>
							</div>
						</form>
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	)
}