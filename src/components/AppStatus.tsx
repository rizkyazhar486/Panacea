import { useEffect, useState } from 'react'

// Small ambient status layer: an offline banner and a "new version available"
// toast (driven by the service worker). Both are non-blocking and dismissible.
export function AppStatus() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  const [update, setUpdate] = useState(false)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false
    navigator.serviceWorker.ready
      .then((reg) => {
        const notifyIfUpdate = (worker: ServiceWorker | null) => {
          if (!worker) return
          worker.addEventListener('statechange', () => {
            // 'installed' while a controller already exists = an update (not first install).
            if (worker.state === 'installed' && navigator.serviceWorker.controller && !cancelled) {
              setUpdate(true)
            }
          })
        }
        reg.addEventListener('updatefound', () => notifyIfUpdate(reg.installing))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      {offline && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-center text-xs font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> You are offline — some features may be unavailable.
        </div>
      )}
      {update && (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-xl">
          <span>✨ A new version is available</span>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white transition hover:brightness-110"
          >
            Reload
          </button>
          <button onClick={() => setUpdate(false)} className="text-white/60 hover:text-white" aria-label="Close">✕</button>
        </div>
      )}
    </>
  )
}
