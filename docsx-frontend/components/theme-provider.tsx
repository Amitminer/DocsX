/**
 * @file theme-provider.tsx
 * @description This component provides theme-related context to the Next.js application.
 * It wraps the `next-themes` ThemeProvider to enable theme switching capabilities.
 * @author AmitxD
 * @Copyright 2025
 */

'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * `ThemeProvider` component wraps the `next-themes` provider to enable theme switching.
 * It makes the theme available to all child components.
 *
 * @param {ThemeProviderProps} { children, ...props } - The props for the component.
 * @returns {JSX.Element} The rendered theme provider.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}