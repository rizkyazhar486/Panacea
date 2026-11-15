import { useEffect, useState } from 'react'

const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

/** Whether the app's class-based dark theme is on, following later toggles of `<html class="dark">`. */
export function useDarkClass(): boolean {
  const [dark, setDark] = useState(isDark)
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return
    const observer = new MutationObserver(() => setDark(isDark()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

/** Chart ink for the dialog/brief surfaces in each theme (slate steps the app already uses). */
export const INK = {
  light: { ink: '#0f172a', secondary: '#475569', muted: '#64748b', grid: '#e2e8f0', surface: '#ffffff' },
  dark: { ink: '#f1f5f9', secondary: '#cbd5e1', muted: '#94a3b8', grid: '#262626', surface: '#171717' },
} as const
