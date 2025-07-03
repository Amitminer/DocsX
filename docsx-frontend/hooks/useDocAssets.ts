/**
 * @file useDocAssets.ts
 * @description React hook for managing document assets (fetch, upload, delete) in DocsX.
 * Handles asset state and API calls for document file management.
 * @author AmitxD
 * @Copyright 2025
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { config } from "@/lib/config";
import { useAuth } from "@clerk/nextjs";
import type { DocAsset } from "@/components/doc-view/asset-card";

/**
 * useDocAssets hook provides state and handlers for fetching, uploading, and deleting document assets.
 *
 * @param {string} [docId] - The document's unique identifier.
 * @param {boolean} [isEditing] - Whether the document is in editing mode.
 * @returns {object} Asset state and action handlers.
 */
export function useDocAssets(docId?: string, isEditing?: boolean) {
	const [assets, setAssets] = useState<DocAsset[]>([]);
	const [loadingAssets, setLoadingAssets] = useState(false);
	const { getToken } = useAuth();

	const fetchAssets = useCallback(async () => {
		if (!isEditing || !docId) {
			setLoadingAssets(false);
			return;
		}
		setLoadingAssets(true);
		try {
			const token = await getToken({ template: "docs" });
			let response = await fetch(`${config.apiBaseUrl}/docs/${docId}/assets`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (response.ok) {
				const data = await response.json();
				setAssets(data.assets || []);
			}
		} catch (error) {
			console.error("Failed to fetch assets", error);
			toast.error("Could not load document assets.");
		} finally {
			setLoadingAssets(false);
		}
	}, [isEditing, docId, getToken]);

	const uploadAsset = useCallback(async (acceptedFiles: File[], onSuccess?: (newAsset: DocAsset) => void) => {
		if (!docId) return;
		const token = await getToken({ template: "docs" });
		const formData = new FormData();
		acceptedFiles.forEach(file => {
			formData.append("files", file);
		});
		let response = await fetch(`${config.apiBaseUrl}/docs/${docId}/assets`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}` },
			body: formData,
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ message: "Upload failed with non-JSON response" }));
			throw new Error(errorData.message || "Upload failed");
		}
		const newAsset = await response.json();
		toast.success(`Asset "${acceptedFiles[0].name}" uploaded successfully!`);
		fetchAssets();
		onSuccess?.(newAsset);
	}, [docId, getToken, fetchAssets]);

	const deleteAsset = useCallback(async (asset: DocAsset) => {
		const token = await getToken({ template: "docs" });
		const response = await fetch(`${config.apiBaseUrl}/docs/${asset.doc_id}/assets/${asset.id}`, {
			method: "DELETE",
			headers: { Authorization: `Bearer ${token}` },
		});
		if (response.ok) {
			toast.success("Asset deleted!");
			fetchAssets();
		} else {
			const data = await response.json().catch(() => ({}));
			toast.error(data.message || "Failed to delete asset.");
		}
	}, [getToken, fetchAssets]);

	useEffect(() => {
		fetchAssets();
	}, [fetchAssets]);

	return { assets, loadingAssets, fetchAssets, uploadAsset, deleteAsset };
}
