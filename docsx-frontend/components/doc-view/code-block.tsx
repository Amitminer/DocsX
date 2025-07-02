/**
 * @file code-block.tsx
 * @description This component renders a code block with syntax highlighting, language labels, and a copy-to-clipboard button.
 * It is designed to be used within Markdown content rendering.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import { useState } from "react"
import { Copy, Check } from 'lucide-react'

/**
 * Props for the `CodeBlock` component.
 */
interface CodeBlockProps {
  /** The code content to be displayed. */
  children: string
  /** Optional CSS class names to apply to the code block container. */
  className?: string
  /** If true, renders the code as an inline code snippet without a block container or copy button. */
  inline?: boolean
}

/**
 * `CodeBlock` component displays code snippets with enhanced features.
 * It automatically extracts the language from `className` (e.g., `language-js`), provides a copy-to-clipboard button,
 * and can render as either a block-level element or an inline snippet.
 *
 * @param {CodeBlockProps} { children, className, inline } - The props for the component.
 * @returns {JSX.Element} The rendered code block.
 */
export default function CodeBlock({ children, className, inline }: CodeBlockProps) {
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if the code has been copied to the clipboard. */
  const [copied, setCopied] = useState(false)

  /**
   * Handles copying the code content to the clipboard.
   * Sets `copied` state to true temporarily and logs any errors.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  /**
   * Extracts the language from the `className` prop.
   * @type {string}
   */
  const language = className?.replace("language-", "") || ""

  // Render as inline code if `inline` prop is true.
  if (inline) {
    return <code className="bg-gray-800 px-2 py-1 rounded text-purple-300 text-sm font-mono">{children}</code>
  }

  return (
    <div className="relative group my-4">
      {/* Language label */}
      {language && (
        <div className="absolute top-2 left-4 z-10">
          <span className="text-xs text-gray-400 font-mono uppercase bg-gray-700 px-2 py-1 rounded">{language}</span>
        </div>
      )}

      {/* Copy button */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-2 py-1 rounded text-xs transition-colors"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto p-4 text-sm">
        <code className="text-gray-300 font-mono">{children}</code>
      </pre>
    </div>
  )
}