import { useEffect, useState } from 'react'
import type { AutoSyncStatus } from '../lib/autoIsi'

// Small ambient status layer: offline state, service-worker updates, and a
// non-blocking automation-sync notice. The sync notice appears only after an
// actual partial/failed refresh event; it does not occupy dashboard space and
// does not turn a stale status from an old session into a permanent warning.
export function AppStatus() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  const [update, setUpdate] = useState(false)
  const [syncIssue, setSyncIssue] = useState<AutoSyncStatus | null>(null)

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
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<AutoSyncStatus>).detail
      if (!detail) return
      if (detail.state === 'partial' || detail.state === 'offline') setSyncIssue(detail)
      else if (detail.state === 'ok') setSyncIssue(null)
    }
    window.addEventListener('panacea:auto-sync', onSync)
    return () => window.removeEventListener('panacea:auto-sync', onSync)
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
          <span className="h-2 w-2 rounded-full bg-amber-400" /> You are offline — last saved data stays available.
        </div>
      )}

      {syncIssue && !offline && (
        <div className="fixed bottom-20 left-1/2 z-[60] flex w-[min(92vw,560px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-200/20 bg-[#10130f]/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-xl">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,.55)]" />
          <div className="min-w-0 flex-1">
            <div className="font-bold">Automatic sync is temporarily incomplete</div>
            <div className="mt-0.5 text-white/60">PanaceaMed is keeping your last known-good data and will retry automatically when the connection recovers.</div>
          </div>
          <button onClick={() => setSyncIssue(null)} className="shrink-0 text-white/45 hover:text-white" aria-label="Close sync notice">✕</button>
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
