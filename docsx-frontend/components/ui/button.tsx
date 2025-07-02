/**
 * @file button.tsx
 * @description This module defines a reusable Button component based on Radix UI's Slot primitive and `class-variance-authority` for styling.
 * It provides various visual variants and sizes for consistent button styling across the application.
 * @author AmitxD
 * @copyright 2024 AmitxD
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Defines the visual variants and sizes for the button component.
 * Uses `class-variance-authority` for flexible and composable styling.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Props for the `Button` component.
 * Extends standard HTML button attributes and `VariantProps` for styling.
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** If true, the button will render its child as a slot, passing its props to it. */
  asChild?: boolean
}

/**
 * A reusable Button component that supports various visual styles and sizes.
 * It can render as a native button or as a slot, allowing for flexible composition.
 *
 * @param {ButtonProps} { className, variant, size, asChild = false, ...props } - The props for the component.
 * @param {React.Ref<HTMLButtonElement>} ref - Ref to the underlying HTML button element.
 * @returns {JSX.Element} The rendered button component.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    /** @type {React.ElementType} The component to render, either a `Slot` or a native `button`. */
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }