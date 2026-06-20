// Appearance preferences — class-based dark mode + text scale + reduced motion.
// Toggling theme adds/removes `.dark` on <html>; index.css carries a `.dark`
// override layer that remaps the literal utility colors the pages use.
export type Theme = 'light' | 'dark'
export type ThemePref = Theme | 'system'
export type TextScale = 'sm' | 'md' | 'lg'

const THEME_KEY = 'pmd-theme'
const SCALE_KEY = 'pmd-text-scale'
const MOTION_KEY = 'pmd-reduced-motion'
const SIMPLE_KEY = 'pmd-simple-mode'

function systemTheme(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

// ── Theme ────────────────────────────────────────────────────────────────
export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

export function resolveTheme(pref: ThemePref = getThemePref()): Theme {
  return pref === 'system' ? systemTheme() : pref
}

// Apply a concrete theme to <html>. Kept for the header/landing toggle buttons.
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref)
  } catch {
    /* ignore */
  }
  applyTheme(resolveTheme(pref))
}

// Back-compat: callers that just want the active (resolved) theme.
export function getTheme(): Theme {
  return resolveTheme()
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  setThemePref(next)
  return next
}

// ── Text scale ───────────────────────────────────────────────────────────
const SCALE_PX: Record<TextScale, string> = { sm: '15px', md: '16px', lg: '18px' }

export function getTextScale(): TextScale {
  try {
    const v = localStorage.getItem(SCALE_KEY)
    if (v === 'sm' || v === 'md' || v === 'lg') return v
  } catch {
    /* ignore */
  }
  return 'md'
}

export function setTextScale(scale: TextScale) {
  try {
    localStorage.setItem(SCALE_KEY, scale)
  } catch {
    /* ignore */
  }
  document.documentElement.style.fontSize = SCALE_PX[scale]
}

// ── Reduced motion ─────────────────────────────────────────────────────────
export function getReducedMotion(): boolean {
  try {
    return localStorage.getItem(MOTION_KEY) === 'true'
  } catch {
    return false
  }
}

export function setReducedMotion(on: boolean) {
  try {
    localStorage.setItem(MOTION_KEY, String(on))
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('reduce-motion', on)
}

// ── Simple mode (lansia / non-tech) ─────────────────────────────────────────
// Bigger text & tap targets, calmer layout. Toggling adds `.simple-mode` to
// <html>; index.css carries the matching overrides.
export function getSimpleMode(): boolean {
  try {
    return localStorage.getItem(SIMPLE_KEY) === 'true'
  } catch {
    return false
  }
}

export function setSimpleMode(on: boolean) {
  try {
    localStorage.setItem(SIMPLE_KEY, String(on))
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('simple-mode', on)
}

// Apply every saved appearance preference before first paint.
export function applyAppearance() {
  applyTheme(resolveTheme())
  setTextScale(getTextScale())
  setReducedMotion(getReducedMotion())
  setSimpleMode(getSimpleMode())
}
