/**
 * @file SignInModal.tsx
 * @description This component provides a modal for user sign-in functionality.
 * It allows users to sign in using either their username or email address, along with a password.
 * It handles loading states, displays error messages, and provides a toggle for password visibility.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "./AuthProvider"

/**
 * Props for the `SignInModal` component.
 */
interface SignInModalProps {
  /** Controls the open/closed state of the modal. */
  isOpen: boolean
  /** Callback function to close the modal. */
  onClose: () => void
}

/**
 * `SignInModal` component provides a user-friendly interface for signing into the application.
 * It supports sign-in via username or email, includes password visibility toggle, and displays
 * loading and error states during the authentication process.
 *
 * @param {SignInModalProps} { isOpen, onClose } - The props for the component.
 * @returns {JSX.Element | null} The rendered sign-in modal, or `null` if not open or Clerk is not loaded.
 */
export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  /** @type {ReturnType<typeof useSignIn>} Clerk's `useSignIn` hook for managing sign-in flow. */
  const { isLoaded, signIn, setActive } = useSignIn()
  /** @type {ReturnType<typeof useAuth>["openSignUp"]} Function to open the sign-up modal from the AuthProvider context. */
  const { openSignUp } = useAuth()
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the identifier input (username or email). */
  const [identifier, setIdentifier] = useState("")
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the password input. */
  const [password, setPassword] = useState("")
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to toggle password visibility. */
  const [showPassword, setShowPassword] = useState(false)
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if the sign-in process is loading. */
  const [isLoading, setIsLoading] = useState(false)
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State to store and display error messages. */
  const [error, setError] = useState("")
  /** @type {["username" | "email", React.Dispatch<React.SetStateAction<"username" | "email">]} State to switch between username and email login methods. */
  const [loginMethod, setLoginMethod] = useState<"username" | "email">("username")

  // Return null if Clerk is not yet loaded to prevent hydration errors.
  if (!isLoaded) {
    return null
  }

  /**
   * Handles the form submission for signing in.
   * Attempts to create a new sign-in session with Clerk.
   * @param {React.FormEvent} e - The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn.create({
        identifier: identifier,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        onClose()
        // Reset form fields after successful sign-in.
        setIdentifier("")
        setPassword("")
      } else {
        // Fallback error message if Clerk returns an unexpected status.
        setError("Something went wrong. Please try again.")
      }
    } catch (err: unknown) {
      // Type assertion for error handling from Clerk.
      const error = err as { errors?: Array<{ message: string }> }
      setError(error.errors?.[0]?.message || "An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles the click event for switching to the sign-up modal.
   * Closes the current sign-in modal and opens the sign-up modal.
   */
  const handleSignUpClick = () => {
    onClose()
    openSignUp()
  }

  /**
   * Changes the login method (username or email) and resets related form states.
   * @param {"username" | "email"} method - The new login method to set.
   */
  const handleMethodChange = (method: "username" | "email") => {
    setLoginMethod(method)
    setIdentifier("")
    setError("")
  }

  // Render null if the modal is not open.
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Sign In
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800/50 rounded-xl transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Login Method Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-800/30 rounded-xl p-1">
              <button
                type="button"
                onClick={() => handleMethodChange("username")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginMethod === "username"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange("email")}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginMethod === "email"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                {loginMethod === "username" ? "Username" : "Email Address"}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {loginMethod === "username" ? (
                    <User className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Mail className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <input
                  type={loginMethod === "username" ? "text" : "email"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/80 transition-all duration-200"
                  placeholder={loginMethod === "username" ? "Enter your username" : "Enter your email"}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus://purple-400/60 focus:border-purple-400/80 transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <button
                onClick={handleSignUpClick}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}