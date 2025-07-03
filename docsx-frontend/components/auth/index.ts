/**
 * @file index.ts
 * @description This barrel file re-exports authentication-related components and hooks for easier import.
 * It provides a centralized point of access to the authentication modules.
 * @author AmitxD
 * @Copyright 2025
 */

/**
 * Re-exports the `AuthProvider` component and the `useAuth` hook from `./AuthProvider`.
 * @see AuthProvider
 * @see useAuth
 */
export { AuthProvider, useAuth } from "./AuthProvider"
/**
 * Re-exports the `SignInModal` component from `./SignInModal`.
 * @see SignInModal
 */
export { default as SignInModal } from "./SignInModal"
/**
 * Re-exports the `SignUpModal` component from `./SignUpModal`.
 * @see SignUpModal
 */
export { default as SignUpModal } from "./SignUpModal"
/**
 * Re-exports the `UserButton` component from `./UserButton`.
 * @see UserButton
 */
export { default as UserButton } from "./UserButton"