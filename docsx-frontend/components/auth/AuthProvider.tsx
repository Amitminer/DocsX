"use client"
/**
 * @file AuthProvider.tsx
 * @description This module provides an authentication context and provider for the application.
 * It manages the state of sign-in and sign-up modals and exposes functions to control them.
 * @author AmitxD
 * @Copyright 2025
 */

import { createContext, useContext, useState, ReactNode } from "react"
import SignInModal from "./SignInModal"
import SignUpModal from "./SignUpModal"

/**
 * Defines the shape of the authentication context.
 */
interface AuthContextType {
  /** Function to open the sign-in modal. */
  openSignIn: () => void
  /** Function to open the sign-up modal. */
  openSignUp: () => void
  /** Function to close all authentication modals. */
  closeModals: () => void
}

/**
 * React Context for authentication operations.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Custom hook to access the authentication context.
 * @returns {AuthContextType} The authentication context.
 * @throws {Error} If used outside of an `AuthProvider`.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/**
 * Props for the `AuthProvider` component.
 */
interface AuthProviderProps {
  /** The child components to be rendered within the provider's scope. */
  children: ReactNode
}

/**
 * `AuthProvider` component provides the authentication context to its children.
 * It manages the visibility of sign-in and sign-up modals.
 *
 * @param {AuthProviderProps} { children } - The props for the component.
 * @returns {JSX.Element} The rendered AuthProvider component.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of the sign-in modal. */
  const [signInOpen, setSignInOpen] = useState(false)
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} State to control the visibility of the sign-up modal. */
  const [signUpOpen, setSignUpOpen] = useState(false)

  /**
   * Opens the sign-in modal and closes the sign-up modal.
   */
  const openSignIn = () => {
    setSignUpOpen(false)
    setSignInOpen(true)
  }

  /**
   * Opens the sign-up modal and closes the sign-in modal.
   */
  const openSignUp = () => {
    setSignInOpen(false)
    setSignUpOpen(true)
  }

  /**
   * Closes both sign-in and sign-up modals.
   */
  const closeModals = () => {
    setSignInOpen(false)
    setSignUpOpen(false)
  }

  /** @type {AuthContextType} The value provided to the AuthContext. */
  const value = {
    openSignIn,
    openSignUp,
    closeModals,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInModal isOpen={signInOpen} onClose={closeModals} />
      <SignUpModal isOpen={signUpOpen} onClose={closeModals} />
    </AuthContext.Provider>
  )
}