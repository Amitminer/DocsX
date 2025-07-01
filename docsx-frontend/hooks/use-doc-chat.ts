import { useState } from "react"

export function useDocChat() {
	const [showChat, setShowChat] = useState(false)

	const handleChat = () => {
		setShowChat(true)
	}

	const closeChat = () => {
		setShowChat(false)
	}

	return {
		showChat,
		handleChat,
		closeChat,
	}
} 