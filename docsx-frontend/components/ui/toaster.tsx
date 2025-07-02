/**
 * @file toaster.tsx
 * @description This component is responsible for rendering toast notifications using the `useToast` hook.
 * It acts as a container for all active toasts, ensuring they are displayed correctly.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/**
 * `Toaster` component is the main container for displaying toast notifications.
 * It consumes toasts from the `useToast` hook and renders them using Radix UI's Toast primitives.
 *
 * @returns {JSX.Element} The rendered toaster component.
 */
export function Toaster() {
  /** @type {ReturnType<typeof useToast>["toasts"]} The array of active toast notifications. */
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}