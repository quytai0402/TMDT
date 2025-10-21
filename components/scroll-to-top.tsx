"use client"

import { useEffect } from "react"

export function ScrollToTop() {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0)
  }, [])

  return null
}
