import { useEffect, useState } from 'react'
import type { AutoSyncStatus } from '../../lib/autoIsi'
import { SmartNotificationOrchestrator } from '../SmartNotificationOrchestrator'

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

  const [syncDismissed, setSyncDismissed] = useState(() => {
    try { return sessionStorage.getItem('pmd_sync_dismissed') === '1' } catch { return false }
  })

  useEffect(() => {
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<AutoSyncStatus>).detail
      if (!detail) return
      if (detail.state === 'partial' || detail.state === 'offline') {
        try {
          if (sessionStorage.getItem('pmd_sync_dismissed') === '1') return
        } catch {}
        setSyncIssue(detail)
      } else if (detail.state === 'ok') {
        setSyncIssue(null)
      }
    }
    window.addEventListener('panacea:auto-sync', onSync)
    return () => window.removeEventListener('panacea:auto-sync', onSync)
  }, [])

  useEffect(() => {
    if (!syncIssue) return
    const timer = setTimeout(() => {
      setSyncDismissed(true)
      try { sessionStorage.setItem('pmd_sync_dismissed', '1') } catch {}
      setSyncIssue(null)
    }, 4500)
    return () => clearTimeout(timer)
  }, [syncIssue])

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
      <SmartNotificationOrchestrator />

      {offline && (
        <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-center text-xs font-semibold text-white">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> You are offline — last saved data stays available.
        </div>
      )}

      {syncIssue && !offline && !syncDismissed && (
        <div className="fixed bottom-4 left-4 z-40 flex max-w-sm items-center gap-2.5 rounded-2xl border border-amber-300/20 bg-neutral-900/90 px-3.5 py-2 text-xs text-white shadow-xl backdrop-blur-md">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-amber-200">Sinkronisasi lokal tertunda</span>
            <span className="ml-1 text-[11px] text-white/60">— data tersimpan aman</span>
          </div>
          <button
            onClick={() => {
              setSyncDismissed(true)
              try { sessionStorage.setItem('pmd_sync_dismissed', '1') } catch {}
              setSyncIssue(null)
            }}
            className="shrink-0 text-white/50 hover:text-white"
            aria-label="Tutup notifikasi sinkronisasi"
          >
            ✕
          </button>
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
