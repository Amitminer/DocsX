/**
 * @file use-doc-chat.ts
 * @description This hook manages the state and functionality for the document-specific AI chat feature.
 * It provides methods to open and close the chat interface.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import { useState } from "react"

/**
 * `useDocChat` is a custom React hook that provides state and functions
 * to control the visibility of a document-specific AI chat interface.
 *
 * @returns {object} An object containing:
 *   - `showChat`: A boolean indicating if the chat interface is currently visible.
 *   - `handleChat`: A function to open the chat interface.
 *   - `closeChat`: A function to close the chat interface.
 */
export function useDocChat() {
	/** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of the chat interface. */
	const [showChat, setShowChat] = useState(false)

	/**
	 * Opens the document chat interface.
	 */
	const handleChat = () => {
		setShowChat(true)
	}

	/**
	 * Closes the document chat interface.
	 */
	const closeChat = () => {
		setShowChat(false)
	}

	return {
		showChat,
		handleChat,
		closeChat,
	}
}