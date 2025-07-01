"use client"

import { useState } from "react"
import { Copy, Check } from 'lucide-react'

interface CodeBlockProps {
  children: string
  className?: string
  inline?: boolean
}

export default function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  // Extract language from className (format: "language-python")
  const language = className?.replace("language-", "") || ""

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
