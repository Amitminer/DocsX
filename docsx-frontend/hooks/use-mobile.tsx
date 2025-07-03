/**
 * @file use-mobile.tsx
 * @description This hook provides a way to detect if the current viewport width corresponds to a mobile device.
 * It is useful for conditionally rendering UI elements or applying mobile-specific logic.
 * @author AmitxD
 * @Copyright 2025
 */

import * as React from "react"

/**
 * The breakpoint (in pixels) at which a device is considered mobile.
 */
const MOBILE_BREAKPOINT = 768

/**
 * `useIsMobile` is a custom React hook that determines if the current viewport
 * width is considered a mobile size based on a predefined breakpoint.
 * It updates dynamically when the window is resized.
 *
 * @returns {boolean} `true` if the current viewport is mobile, `false` otherwise.
 */
export function useIsMobile() {
  /** @type {[boolean | undefined, React.Dispatch<React.SetStateAction<boolean | undefined>>]} State to store the mobile detection result. `undefined` initially to handle hydration. */
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  /**
   * Effect hook to set up and clean up a media query listener.
   * It initializes `isMobile` based on the current window width and updates it on resize.
   */
  React.useEffect(() => {
    // Create a media query list for the mobile breakpoint.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Define the change handler for the media query.
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Add the event listener for changes to the media query.
    mql.addEventListener("change", onChange)
    
    // Set the initial state.
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Cleanup function to remove the event listener.
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return a boolean value, ensuring it's always `false` if `isMobile` is `undefined` (e.g., during SSR).
  return !!isMobile
}