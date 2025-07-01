"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import SignInModal from "./SignInModal"
import SignUpModal from "./SignUpModal"

interface AuthContextType {
  openSignIn: () => void
  openSignUp: () => void
  closeModals: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [signInOpen, setSignInOpen] = useState(false)
  const [signUpOpen, setSignUpOpen] = useState(false)

  const openSignIn = () => {
    setSignUpOpen(false)
    setSignInOpen(true)
  }

  const openSignUp = () => {
    setSignInOpen(false)
    setSignUpOpen(true)
  }

  const closeModals = () => {
    setSignInOpen(false)
    setSignUpOpen(false)
  }

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