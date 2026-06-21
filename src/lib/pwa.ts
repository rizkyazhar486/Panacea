// PWA install helper — captures the browser's install prompt so we can offer a
// "Pasang Aplikasi" (Add to Home Screen) button. This is the FREE way to turn
// the site into an installable app (no Play Store / App Store fee required).

let deferredPrompt: any = null
const EVT = 'pmd-installable'
const DISMISS_KEY = 'pmd-install-dismissed'

// Attach listeners once, as early as possible (called from main.tsx).
export function initPwaInstall() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    window.dispatchEvent(new Event(EVT))
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new Event(EVT))
  })
}

export function onInstallableChange(cb: () => void): () => void {
  window.addEventListener(EVT, cb)
  return () => window.removeEventListener(EVT, cb)
}

export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as any).standalone === true
  )
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
}

export type InstallState = 'installed' | 'available' | 'ios' | 'unavailable'

export function installState(): InstallState {
  if (isStandalone()) return 'installed'
  if (deferredPrompt) return 'available'
  if (isIos()) return 'ios' // iOS doesn't fire beforeinstallprompt — show manual steps
  return 'unavailable'
}

// Trigger the native install prompt. Returns true if the user accepted.
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }))
  deferredPrompt = null
  window.dispatchEvent(new Event(EVT))
  return choice?.outcome === 'accepted'
}

export function isBannerDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === 'true'
  } catch {
    return false
  }
}
export function dismissBanner() {
  try {
    localStorage.setItem(DISMISS_KEY, 'true')
  } catch {
    /* ignore */
  }
}
