/**
 * @file page.tsx
 * @description This page allows users to create new documentation entries.
 * It provides a form for inputting document details and handles the submission to the backend API.
 * @author AmitxD
 * @Copyright 2025
 */

"use client"

import { useRouter } from "next/navigation"
import HeaderBar from "@/components/header-bar"
import DocForm from "@/components/doc-form"
import { useAuth } from "@clerk/nextjs"
import { config } from "@/lib/config"

/**
 * `CreatePage` component provides the interface for creating new documentation.
 * It renders a `DocForm` and handles the submission of new document data to the backend.
 *
 * @returns {JSX.Element} The rendered create document page.
 */
export default function CreatePage() {
	/** @type {ReturnType<typeof useRouter>} Next.js router instance for navigation. */
	const router = useRouter()
	/** @type {ReturnType<typeof useAuth>["getToken"]} Function to get the authentication token from Clerk. */
	const { getToken } = useAuth();

	/**
	 * Handles the submission of the document creation form.
	 * Sends a POST request to the backend API to create a new document.
	 * @param {object} data - The document data from the form.
	 * @param {string} data.title - The title of the new document.
	 * @param {string} data.description - The description of the new document.
	 * @param {string} data.content - The content of the new document.
	 * @throws {Error} If authentication token is missing or API request fails.
	 */
	const handleSubmit = async (data: {
		title: string;
		description: string;
		content: string;
	}) => {
		try {
			const token = await getToken({ template: "docs" });
			if (!token) {
				throw new Error("No auth token available");
			}

			const response = await fetch(`${config.apiBaseUrl}/docs/create`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					title: data.title,
					description: data.description,
					content: data.content,
				}),
			});

			if (response.status === 401) {
				router.push("/");
				return;
			}

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || "Failed to create documentation");
			}

			const newDoc = await response.json();
			router.push(`/docs/${newDoc.id}`);
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to create documentation");
			throw err;
		}
	};

	/**
	 * Handles the cancellation of the form.
	 * Redirects the user back to the home page.
	 */	
	const handleCancel = () => {
		router.push("/");
	};

	return (
		<div className="min-h-screen bg-black">
			<HeaderBar />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="bg-gradient-to-br from-gray-900/80 to-slate-900/80 rounded-xl shadow-md px-4 py-2 mb-4 flex flex-col items-center sm:items-start">
					<span className="text-xs text-blue-300 font-semibold mb-1 tracking-wider text-center sm:text-left">Create Mode</span>
					<span className="text-base sm:text-lg font-bold text-white break-words text-center sm:text-left">
						Create New Documentation
					</span>
				</div>
				<DocForm onSubmit={handleSubmit} onCancel={handleCancel} />
			</main>
		</div>
	);
}