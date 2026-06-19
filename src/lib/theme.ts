// Lightweight class-based dark mode. Toggling adds/removes `.dark` on <html>;
// index.css carries a `.dark` override layer that remaps the literal utility
// colors the pages use (bg-white, text-ink, text-neutral-*, etc.).
export type Theme = 'light' | 'dark'

const KEY = 'pmd-theme'

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* ignore */
  }
  // Respect the OS preference on first visit.
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignore */
  }
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  applyTheme(next)
  return next
}
