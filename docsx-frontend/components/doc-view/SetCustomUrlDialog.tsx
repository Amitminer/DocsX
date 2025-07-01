"use client"

import { useState, useEffect, Fragment } from "react"
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react"
import { Link as LinkIcon, Trash2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"

interface SetCustomUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  docId: string
  onSuccess?: () => void
}

export default function SetCustomUrlDialog({ open, onOpenChange, docId, onSuccess }: SetCustomUrlDialogProps) {
  const { getToken } = useAuth();
  const [customUrl, setCustomUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [currentCustomUrl, setCurrentCustomUrl] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open && docId) {
      setChecking(true)
      fetch(`/api/custom-slugs?docId=${docId}`)
        .then(res => res.ok ? res.json() : {})
        .then((data: { slug?: string }) => {
          if (data && data.slug) {
            setCurrentCustomUrl(data.slug)
          } else {
            setCurrentCustomUrl(null)
          }
        })
        .finally(() => setChecking(false))
    } else {
      setCurrentCustomUrl(null)
    }
  }, [open, docId])

  function handleCancel() {
    onOpenChange(false)
  }

  async function handleSave() {
    setLoading(true)
    setError("")
    setSuccess(false)
    if (!customUrl) {
      setError("Custom URL cannot be empty.")
      setLoading(false)
      return
    }
    // Check uniqueness
    try {
      const res = await fetch(`/api/custom-slugs/${customUrl}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.doc_id && data.doc_id !== docId) {
            setError(`This custom URL is already used by another doc.\nTry again with something else.`)
            setLoading(false)
            return
        }
      }
    } catch {
      // ignore, fallback to save
    }
    const token = await getToken({ template: "docs" });
    const res = await fetch("/api/custom-slugs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ docId, custom: customUrl })
    })
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
        onSuccess?.()
      }, 300)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Failed to save custom URL.")
    }
    setLoading(false)
  }

  async function handleDelete() {
    setDeleting(true)
    setError("")
    const token = await getToken({ template: "docs" });
    const res = await fetch("/api/custom-slugs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ docId, custom: "__DELETE__" })
    })
    if (res.ok) {
      setCurrentCustomUrl(null)
      setCustomUrl("")
      setSuccess(false)
      setDeleting(false)
      onOpenChange(false)
      onSuccess?.()
    } else {
      setError("Failed to delete custom URL.")
      setDeleting(false)
    }
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleCancel} open={open}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 transition-opacity" />
        </TransitionChild>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 border border-gray-700 p-4 sm:p-8 text-left align-middle shadow-2xl transition-all">
                <button
                  type="button"
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  onClick={handleCancel}
                  aria-label="Close"
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                    <LinkIcon className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <DialogTitle as="h3" className="text-xl font-semibold leading-6 text-white mb-2 text-center">Set Custom URL</DialogTitle>
                <div className="mb-6">
                  <div className="text-gray-400 text-sm text-center">
                    Choose a unique, human-friendly URL for your doc. Only a-z, 0-9, - and _ allowed.
                  </div>
                </div>
                {checking ? (
                  <div className="text-gray-400 text-center py-6">Checking current custom URL...</div>
                ) : currentCustomUrl ? (
                  <div className="flex flex-col items-center gap-4 p-4 sm:p-6 bg-gray-800/80 border border-gray-700/50 rounded-xl">
                    <div className="text-gray-300 text-center mb-2">
                      You have already set a custom URL for this doc:<br />
                      <span className="font-mono text-purple-400 break-all block mt-2 mb-2 px-2 py-1 bg-gray-900 rounded-md max-w-full" style={{wordBreak: 'break-all'}}>/docs/{currentCustomUrl}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium disabled:opacity-60 w-full sm:w-auto"
                        disabled={deleting}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleting ? "Deleting..." : "Delete Custom URL"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium w-full sm:w-auto"
                        disabled={deleting}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={e => setCustomUrl(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                      placeholder="how-to-install-xyz"
                      className="w-full px-4 py-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300 mb-4"
                      maxLength={64}
                      autoFocus
                    />
                    {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
                    {success && <div className="text-green-400 text-sm mb-2">Custom URL saved!</div>}
                    <div className="flex gap-3 justify-end flex-col sm:flex-row w-full">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors font-medium w-full sm:w-auto"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium disabled:opacity-60 w-full sm:w-auto"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}