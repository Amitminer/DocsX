"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { config } from "../lib/config"

function isValidUUID(id: string): boolean {
	return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}

export function useDocActions(initialLikes: number, docId: string) {
	const [isLiked, setIsLiked] = useState(false)
	const [likeCount, setLikeCount] = useState(initialLikes)
	const [isBookmarked, setIsBookmarked] = useState(false)
	const [showShareToast, setShowShareToast] = useState(false)
	const { getToken, isSignedIn } = useAuth();

	useEffect(() => {
		let cancelled = false;
		async function fetchLikeState() {
			if (!docId || !isValidUUID(docId)) return;
			try {
				const token = await getToken();
				if (!token) throw new Error("No token");
				const res = await fetch(`${config.apiBaseUrl}/docs/likes?id=${docId}`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) throw new Error("Failed to fetch like state");
				const data = await res.json();
				if (!cancelled) {
					setIsLiked(!!data.liked_by_current_user);
					setLikeCount(data.likes ?? initialLikes);
				}
			} catch {
				// Fallback to localStorage if not signed in or API fails
			}
		}
		fetchLikeState();
		return () => { cancelled = true; };
	}, [docId, getToken, isSignedIn, initialLikes]);

	useEffect(() => {
		const bookmarked: string[] = JSON.parse(localStorage.getItem("bookmarkedDocs") || "[]");
		setIsBookmarked(bookmarked.includes(docId));
	}, [docId])

	const fetchBackendLikeState = async () => {
		if (!docId || !isValidUUID(docId)) return;
		try {
			const token = await getToken();
			if (!token) throw new Error("No token");
			const res = await fetch(`${config.apiBaseUrl}/docs/likes?id=${docId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!res.ok) throw new Error("Failed to fetch like state");
			const data = await res.json();
			setIsLiked(!!data.liked_by_current_user);
			setLikeCount(data.likes ?? initialLikes);
		} catch (err) {
			// ignore, fallback to localStorage
		}
	};

	const handleLike = async (onLike?: () => void) => {
		if (!docId || !isValidUUID(docId)) return;
		const likedDocs: string[] = JSON.parse(localStorage.getItem("likedDocs") || "[]")
		const token = await getToken();

		if (isLiked) {
			const updated = likedDocs.filter(id => id !== docId)
			localStorage.setItem("likedDocs", JSON.stringify(updated))
			setLikeCount(prev => Math.max(prev - 1, 0))
			setIsLiked(false)
			try {
				const res = await fetch(`${config.apiBaseUrl}/docs/unlike?id=${docId}`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				})
				if (!res.ok) {
					const errorData = await res.json().catch(() => ({ message: "Unlike failed" }));
					throw new Error(errorData.message || "Unlike failed");
				}
				await fetchBackendLikeState();
			} catch (err) {
				console.error("[useDocActions] Failed to unlike doc:", err)
				setLikeCount(prev => prev + 1)
				setIsLiked(true)
				localStorage.setItem("likedDocs", JSON.stringify([...updated, docId]))
			}
		} else {
			localStorage.setItem("likedDocs", JSON.stringify([...likedDocs, docId]))
			setLikeCount(prev => prev + 1)
			setIsLiked(true)
			try {
				const res = await fetch(`${config.apiBaseUrl}/docs/like?id=${docId}`, {
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				})
				if (!res.ok) {
					const errorData = await res.json().catch(() => ({ message: "Like failed" }));
					throw new Error(errorData.message || "Like failed");
				}
				onLike?.() 
				await fetchBackendLikeState();
			} catch (err) {
				console.error("[useDocActions] Failed to like doc:", err)
				setLikeCount(prev => Math.max(prev - 1, 0))
				setIsLiked(false)
				localStorage.setItem("likedDocs", JSON.stringify(likedDocs))
			}
		}
	}

	const handleBookmark = (onBookmark?: () => void) => {
		const bookmarked: string[] = JSON.parse(localStorage.getItem("bookmarkedDocs") || "[]");
		let updated: string[];
		let newState: boolean;
		if (isBookmarked) {
			updated = bookmarked.filter(id => id !== docId);
			newState = false;
		} else {
			updated = [...new Set([...bookmarked, docId])];
			newState = true;
		}
		localStorage.setItem("bookmarkedDocs", JSON.stringify(updated));
		setIsBookmarked(newState);
		onBookmark?.();
	}

	const handleShare = async (
		title: string,
		url: string,
		onShare?: () => void,
		onCopied?: () => void
	) => {
		if (navigator.share) {
			try {
				await navigator.share({
					title,
					text: `Check out this document: ${title}`,
					url,
				})
				onCopied?.();
			} catch {
				console.log("Share cancelled or failed")
			}
		} else {
			try {
				await navigator.clipboard.writeText(url)
				setShowShareToast(true)
				onCopied?.();
				setTimeout(() => setShowShareToast(false), 2000)
			} catch (err) {
				console.error("Failed to copy link:", err)
			}
		}
		onShare?.()
	}

	return {
		isLiked,
		likeCount,
		isBookmarked,
		showShareToast,
		handleLike,
		handleBookmark,
		handleShare,
	}
}
