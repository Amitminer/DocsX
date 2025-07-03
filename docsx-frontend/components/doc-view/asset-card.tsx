/**
 * @file asset-card.tsx
 * @description Card component for displaying and managing document assets (files, images) in DocsX.
 * Shows asset info, download, copy, and delete actions.
 * @author AmitxD
 * @Copyright 2025
 */

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { config } from "@/lib/config";
import { Image as ImageIcon, File as FileIcon, Archive, Download, Copy, Trash2 } from "lucide-react";
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';

export interface DocAsset {
	id: string;
	doc_id: string;
	filename: string;
	original_name: string;
	mime_type: string;
	size: number;
	created_at: string;
	url: string;
}

/**
 * AssetCard component displays a document asset with actions (download, copy, delete).
 *
 * @param {{ asset: DocAsset }} props - Props containing the asset to display.
 * @returns {JSX.Element} The rendered asset card.
 */
export default function AssetCard({ asset }: { asset: DocAsset }) {
	const { getToken } = useAuth();
	const [open, setOpen] = useState(false);

	const getFileIcon = (mimeType: string) => {
		if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-400" />;
		if (mimeType === "application/zip") return <Archive className="w-5 h-5 text-yellow-400" />;
		return <FileIcon className="w-5 h-5 text-gray-400" />;
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	};

	const handleCopyMarkdown = () => {
		const altText = asset.original_name.split('.').slice(0, -1).join('');
		const isImage = asset.mime_type && asset.mime_type.startsWith('image/');
		const markdownToInsert = isImage
			? `![${altText}](${asset.filename})`
			: `[${asset.original_name}](${asset.filename})`;
		navigator.clipboard.writeText(markdownToInsert);
		toast.success("Markdown copied to clipboard!");
	};

	const handleDelete = async () => {
		setOpen(false);
		try {
			const token = await getToken({ template: "docs" });
			const response = await fetch(`${config.apiBaseUrl}/docs/${asset.doc_id}/assets/${asset.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (response.ok) {
				toast.success("Asset deleted!");
				if (typeof window !== 'undefined') {
					window.dispatchEvent(new Event('refresh-assets'));
				}
			} else {
				const data = await response.json().catch(() => ({}));
				toast.error(data.message || "Failed to delete asset.");
			}
		} catch {
			toast.error("Failed to delete asset.");
		}
	};

	useEffect(() => {
		const handler = () => {
			if (typeof window !== 'undefined') {
				// This will trigger the parent to refetch assets
			}
		};

		window.addEventListener('refresh-assets', handler);
		return () => window.removeEventListener('refresh-assets', handler);
	}, []);

	return (
		<>
			<div className="group bg-gray-900/60 backdrop-blur-sm border border-gray-700/40 rounded-xl p-2 hover:bg-gray-900/80 hover:border-gray-600/50 transition-all duration-200 shadow-md hover:shadow-lg min-h-[80px]">
				{/* Header with icon and filename */}
				<div className="flex items-start gap-2 mb-2">
					<div className="flex-shrink-0 p-1 bg-gray-800/60 rounded-lg">
						{getFileIcon(asset.mime_type)}
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-medium text-white text-xs leading-tight mb-0.5 truncate" title={asset.original_name}>
							{asset.original_name}
						</h3>
						<p className="text-xs text-gray-400">
							{formatFileSize(asset.size)}
						</p>
					</div>
				</div>
				{/* Action buttons */}
				<div className="space-y-1">
					<div className="flex gap-1">
						<a
							href={asset.url}
							download={asset.original_name}
							target="_blank"
							rel="noopener noreferrer"
							className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors duration-200"
						>
							<Download className="w-3 h-3" />
							<span>Download</span>
						</a>
						<button
							type="button"
							onClick={handleCopyMarkdown}
							className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-xs font-medium transition-colors duration-200"
						>
							<Copy className="w-3 h-3" />
							<span className="hidden sm:inline">Copy</span>
						</button>
					</div>
					<button
						type="button"
						onClick={() => setOpen(true)}
						className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-red-600/70 hover:bg-red-600 text-white rounded-md text-xs font-medium transition-all duration-200"
					>
						<Trash2 className="w-3 h-3" />
						<span>Delete</span>
					</button>
				</div>
			</div>
			{/* Custom Delete Confirmation Modal */}
			<Dialog open={open} onClose={() => setOpen(false)} className="fixed z-50 inset-0 flex items-center justify-center">
				<div className="fixed inset-0 bg-black/60" aria-hidden="true" />
				<DialogPanel className="relative bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-700 max-w-xs w-full mx-auto flex flex-col items-center">
					<DialogTitle className="text-lg font-bold text-red-400 mb-2">Delete Asset?</DialogTitle>
					<p className="text-gray-300 mb-4 text-center text-sm">Are you sure you want to delete <span className="font-semibold">{asset.original_name}</span>? This cannot be undone.</p>
					<div className="flex gap-3 w-full mt-2">
						<button
							onClick={handleDelete}
							className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition"
						>
							Delete
						</button>
						<button
							onClick={() => setOpen(false)}
							className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold text-sm transition"
						>
							Cancel
						</button>
					</div>
				</DialogPanel>
			</Dialog>
		</>
	);
}
