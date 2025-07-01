"use client";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { useAuth } from "./AuthProvider";

interface ProtectedActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

export function ProtectedActionButton({ children, onClick, asChild = false, ...props }: ProtectedActionButtonProps) {
  const { isSignedIn } = useClerkAuth();
  const { openSignIn } = useAuth();
  const Comp = asChild ? Slot : "button";

  if (!isSignedIn) {
    return (
      <Comp {...props} onClick={openSignIn}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp {...props} onClick={onClick}>
      {children}
    </Comp>
  );
} 