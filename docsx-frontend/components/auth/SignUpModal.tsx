/**
 * @file SignUpModal.tsx
 * @description This component provides a modal for user sign-up functionality.
 * It allows users to create a new account with their first name, last name, username, email, and password.
 * It also handles email verification and displays loading states and error messages.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import { useState } from "react"
import { useSignUp } from "@clerk/nextjs"
import { X, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, User, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "./AuthProvider"

/**
 * Props for the `SignUpModal` component.
 */
interface SignUpModalProps {
  /** Controls the open/closed state of the modal. */
  isOpen: boolean
  /** Callback function to close the modal. */
  onClose: () => void
}

/**
 * Type guard to check if an error object is a Clerk error.
 * @param {unknown} err - The error object to check.
 * @returns {boolean} `true` if the error is a Clerk error, `false` otherwise.
 */
function isClerkError(err: unknown): err is { errors: { longMessage?: string; message?: string }[] } {
  return (
    typeof err === "object" &&
    err !== null &&
    "errors" in err &&
    Array.isArray((err as { errors?: unknown }).errors)
  );
}

/**
 * `SignUpModal` component provides a user-friendly interface for signing up for a new account.
 * It supports email/password registration, includes password visibility toggle, and handles
 * email verification with a separate step. It also displays loading and error states.
 *
 * @param {SignUpModalProps} { isOpen, onClose } - The props for the component.
 * @returns {JSX.Element | null} The rendered sign-up modal, or `null` if not open or Clerk is not loaded.
 */
export default function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  /** @type {ReturnType<typeof useSignUp>} Clerk's `useSignUp` hook for managing sign-up flow. */
  const { isLoaded, signUp, setActive } = useSignUp()
  /** @type {ReturnType<typeof useAuth>["openSignIn"]} Function to open the sign-in modal from the AuthProvider context. */
  const { openSignIn } = useAuth()
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the first name input. */
  const [firstName, setFirstName] = useState("")
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the last name input. */
  const [lastName, setLastName] = useState("")
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the username input. */
  const [username, setUsername] = useState("")
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the email input. */
  const [email, setEmail] = useState("")
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the password input. */
  const [password, setPassword] = useState("")
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to toggle password visibility. */
  const [showPassword, setShowPassword] = useState(false)
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if the sign-up process is loading. */
  const [isLoading, setIsLoading] = useState(false)
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State to store and display error messages. */
  const [error, setError] = useState("")
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to indicate if email verification is pending. */
  const [pendingVerification, setPendingVerification] = useState(false)
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} State for the verification code input. */
  const [code, setCode] = useState("")

  // Return null if Clerk is not yet loaded to prevent hydration errors.
  if (!isLoaded) {
    return null
  }

  /**
   * Handles the form submission for signing up.
   * Attempts to create a new user account with Clerk.
   * @param {React.FormEvent} e - The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signUp.create({
        username,
        emailAddress: email,
        password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        onClose()
        // Reset form fields after successful sign-up.
        setFirstName("")
        setLastName("")
        setUsername("")
        setEmail("")
        setPassword("")
      } else if (result.status === "missing_requirements") {
        setPendingVerification(true)
      } else {
        // Fallback error message if Clerk returns an unexpected status.
        setError("Something went wrong. Please try again.")
      }
    } catch (err: unknown) {
      let errorMessage = "An error occurred during sign up.";
      if (isClerkError(err)) {
        errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles the form submission for email verification.
   * Attempts to verify the email address with the provided code.
   * @param {React.FormEvent} e - The form event.
   */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        onClose()
        // Reset form fields after successful verification.
        setFirstName("")
        setLastName("")
        setUsername("")
        setEmail("")
        setPassword("")
        setCode("")
        setPendingVerification(false)
      } else {
        setError("Verification failed. Please try again.")
      }
    } catch (err: unknown) {
      let errorMessage = "Verification failed.";
      if (isClerkError(err)) {
        errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handles the click event for switching to the sign-in modal.
   * Closes the current sign-up modal and opens the sign-in modal.
   */
  const handleSignInClick = () => {
    onClose()
    openSignIn()
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
              {pendingVerification ? "Verify Email" : "Sign Up"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800/50 rounded-xl transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {!pendingVerification ? (
            /* Sign Up Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/80 transition-all duration-200"
                      placeholder="First name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/80 transition-all duration-200"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <AtSign className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/80 transition-all duration-200"
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/80 transition-all duration-200"
                    placeholder="Enter your email"
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
                    className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/80 transition-all duration-200"
                    placeholder="Create a password"
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

              {/* Clerk CAPTCHA Element */}
              <div id="clerk-captcha" className="w-full flex justify-center" />

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
                    Creating Account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          ) : (
            /* Verification Form */
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-gray-300 mb-2">
                  We&apos;ve sent a verification code to:
                </p>
                <p className="text-purple-400 font-medium">{email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/80 transition-all duration-200 text-center text-lg font-mono"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                />
              </div>

              {/* Clerk CAPTCHA Element */}
              <div id="clerk-captcha" className="w-full flex justify-center" />

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
                    Verifying...
                  </div>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {pendingVerification ? (
                "Didn&apos;t receive the code? Check your spam folder or try again."
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={handleSignInClick}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}