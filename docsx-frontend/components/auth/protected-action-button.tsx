/**
 * @file protected-action-button.tsx
 * @description This component provides a button that, when clicked, either triggers a provided action if the user is signed in,
 * or opens the sign-in modal if the user is not authenticated.
 * @author AmitxD
 * @Copyright 2025
 */

"use client";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useAuth } from "./AuthProvider";

/**
 * Props for the `ProtectedActionButton` component.
 */
interface ProtectedActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The content to be rendered inside the button. */
  children: React.ReactNode;
  /** If true, the component will render its child as a slot, passing its props to it. */
  asChild?: boolean;
}

/**
 * `ProtectedActionButton` is a button component that conditionally executes an action
 * or prompts the user to sign in based on their authentication status.
 * If the user is signed in, the provided `onClick` handler is executed.
 * If the user is not signed in, the sign-in modal is opened.
 *
 * @param {ProtectedActionButtonProps} { children, onClick, asChild, ...props } - The props for the component.
 * @returns {JSX.Element} The rendered button component.
 */
export function ProtectedActionButton({ children, onClick, asChild = false, ...props }: ProtectedActionButtonProps) {
  /** @type {ReturnType<typeof useClerkAuth>["isSignedIn"]} Boolean indicating if the user is currently signed in. */
  const { isSignedIn } = useClerkAuth();
  /** @type {ReturnType<typeof useAuth>["openSignIn"]} Function to open the sign-in modal. */
  const { openSignIn } = useAuth();
  /** @type {React.ElementType} The component to render, either a `Slot` or a native `button`. */
  const Comp = asChild ? Slot : "button";

  // If the user is not signed in, render a button that opens the sign-in modal.
  if (!isSignedIn) {
    return (
      <Comp {...props} onClick={openSignIn}>
        {children}
      </Comp>
    );
  }

  // If the user is signed in, render a button that executes the provided onClick handler.
  return (
    <Comp {...props} onClick={onClick}>
      {children}
    </Comp>
  );
}