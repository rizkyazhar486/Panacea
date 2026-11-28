import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  appendDiagnosticEvent,
  DIAGNOSTICS_OPEN_EVENT,
  isDiagnosticsShortcut,
  resolveAmbientStatus,
  ROUTE_ERROR_EVENT,
  SERVER_WAKE_EVENT,
  type DiagnosticEvent,
  type ServerWakeNotice,
} from '../../domains/observability'
import type { AutoSyncStatus } from '../../lib/autoIsi'
import { SmartNotificationOrchestrator } from '../SmartNotificationOrchestrator'

const SystemDiagnosticsDialog = lazy(() =>
  import('./SystemDiagnosticsDialog').then((m) => ({ default: m.SystemDiagnosticsDialog })),
)

function readCurrentHashRoute(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.hash || window.location.pathname || '/'
}

// Small cross-page ambient status & diagnostic orchestrator:
// - Shows at most one non-ambiguous notice (offline, cold-start wake, update,
//   sync pending, or back-online confirmation) — never overlapping bars.
// - Renders zero visual chrome when idle so initial screen clarity is untouched.
// - Lazily mounts the cross-page diagnostics drawer on demand (Alt+Shift+D,
//   status Detail action, or RouteErrorBoundary recovery).
export function AppStatus() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  const [justReconnected, setJustReconnected] = useState(false)
  const [wakeNotice, setWakeNotice] = useState<ServerWakeNotice | null>(null)
  const [update, setUpdate] = useState(false)
  const [syncIssue, setSyncIssue] = useState<AutoSyncStatus | null>(null)
  const [syncDismissed, setSyncDismissed] = useState(() => {
    try { return sessionStorage.getItem('pmd_sync_dismissed') === '1' } catch { return false }
  })
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [events, setEvents] = useState<DiagnosticEvent[]>([])
  const eventCounterRef = useRef(0)

  const recordEvent = useCallback((next: {
    kind: DiagnosticEvent['kind']
    severity: DiagnosticEvent['severity']
    summary: unknown
    route?: unknown
    requestId?: string | null
  }) => {
    eventCounterRef.current += 1
    const id = `ev-${eventCounterRef.current}`
    const atIso = new Date().toISOString()
    setEvents((prev) =>
      appendDiagnosticEvent(prev, {
        id,
        atIso,
        kind: next.kind,
        severity: next.severity,
        summary: next.summary,
        route: next.route ?? readCurrentHashRoute(),
        requestId: next.requestId ?? null,
      }),
    )
  }, [])

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    const on = () => {
      setOffline(false)
      setJustReconnected(true)
      if (reconnectTimer) clearTimeout(reconnectTimer)
      reconnectTimer = setTimeout(() => setJustReconnected(false), 2500)
      recordEvent({
        kind: 'network',
        severity: 'info',
        summary: 'Koneksi jaringan kembali online',
      })
    }
    const off = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      setJustReconnected(false)
      setOffline(true)
      recordEvent({
        kind: 'network',
        severity: 'warn',
        summary: 'Perangkat berada dalam mode offline',
      })
    }
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [recordEvent])

  useEffect(() => {
    const onSync = (event: Event) => {
      const detail = (event as CustomEvent<AutoSyncStatus>).detail
      if (!detail) return
      if (detail.state === 'partial' || detail.state === 'offline') {
        recordEvent({
          kind: 'sync',
          severity: 'warn',
          summary: `Sinkronisasi latar belakang ${detail.state === 'offline' ? 'offline' : 'parsial'}`,
        })
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
  }, [recordEvent])

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
    const onWake = (event: Event) => {
      const detail = (event as CustomEvent<ServerWakeNotice>).detail
      if (!detail || typeof detail.phase !== 'string') return
      if (detail.phase === 'idle') {
        setWakeNotice(null)
        return
      }
      setWakeNotice(detail)
      recordEvent({
        kind: 'server-wake',
        severity: detail.phase === 'timeout' ? 'error' : 'info',
        summary: detail.message || (detail.phase === 'waking' ? 'Menunggu layanan cloud aktif' : 'Server belum merespons'),
      })
    }
    const onRouteError = (event: Event) => {
      const detail = (event as CustomEvent<{ route?: unknown; message?: unknown; requestId?: string | null }>).detail
      if (!detail) return
      recordEvent({
        kind: 'route-error',
        severity: 'error',
        summary: detail.message ?? 'Halaman gagal dimuat',
        route: detail.route ?? readCurrentHashRoute(),
        requestId: detail.requestId ?? null,
      })
    }
    const onOpenDiagnostics = () => setDiagnosticsOpen(true)
    const onError = (event: ErrorEvent) => {
      recordEvent({
        kind: 'error',
        severity: 'error',
        summary: event.error ?? event.message ?? 'Runtime error',
      })
    }
    const onRejection = (event: PromiseRejectionEvent) => {
      recordEvent({
        kind: 'rejection',
        severity: 'error',
        summary: event.reason ?? 'Unhandled promise rejection',
      })
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        isDiagnosticsShortcut({
          altKey: event.altKey,
          shiftKey: event.shiftKey,
          ctrlKey: event.ctrlKey,
          metaKey: event.metaKey,
          key: event.key,
          targetTagName: target?.tagName ?? null,
          isContentEditable: Boolean(target?.isContentEditable),
        })
      ) {
        event.preventDefault()
        setDiagnosticsOpen((prev) => !prev)
      }
    }

    window.addEventListener(SERVER_WAKE_EVENT, onWake)
    window.addEventListener(ROUTE_ERROR_EVENT, onRouteError)
    window.addEventListener(DIAGNOSTICS_OPEN_EVENT, onOpenDiagnostics)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener(SERVER_WAKE_EVENT, onWake)
      window.removeEventListener(ROUTE_ERROR_EVENT, onRouteError)
      window.removeEventListener(DIAGNOSTICS_OPEN_EVENT, onOpenDiagnostics)
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [recordEvent])

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

  const banner = useMemo(
    () =>
      resolveAmbientStatus({
        offline,
        justReconnected,
        wake: wakeNotice,
        syncPending: Boolean(syncIssue),
        syncDismissed,
        updateAvailable: update,
      }),
    [offline, justReconnected, wakeNotice, syncIssue, syncDismissed, update],
  )

  const handleDismissPill = () => {
    if (banner.kind === 'sync-pending') {
      setSyncDismissed(true)
      try { sessionStorage.setItem('pmd_sync_dismissed', '1') } catch {}
      setSyncIssue(null)
    } else if (banner.kind === 'waking' || banner.kind === 'wake-timeout') {
      setWakeNotice(null)
    } else if (banner.kind === 'update-available') {
      setUpdate(false)
    }
  }

  return (
    <>
      <SmartNotificationOrchestrator />

      {(banner.kind === 'offline' || banner.kind === 'reconnected') && (
        <div
          role="status"
          aria-live="polite"
          className={`dark fixed inset-x-0 top-0 z-[70] flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 text-center text-xs font-semibold text-white shadow-md ${banner.kind === 'reconnected' ? 'bg-brand-dark' : 'bg-neutral-900'}`}
          style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top))' }}
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${banner.kind === 'reconnected' ? 'bg-emerald-300' : 'bg-amber-400'}`}
            aria-hidden="true"
          />
          <span>{banner.label}</span>
          {banner.showDiagnosticsAction && (
            <button
              type="button"
              onClick={() => setDiagnosticsOpen(true)}
              className="min-h-[44px] rounded-full border border-white/20 px-3.5 py-1 text-xs font-semibold"
            >
              Detail
            </button>
          )}
        </div>
      )}

      {banner.kind !== 'none' && banner.kind !== 'offline' && banner.kind !== 'reconnected' && (
        <div
          role="status"
          aria-live="polite"
          data-ambient-status={banner.kind}
          className="dark fixed bottom-4 left-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-2xl border border-white/15 bg-neutral-900/95 px-3.5 py-2 text-xs text-white shadow-xl backdrop-blur-md sm:max-w-md"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${banner.tone === 'brand' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white" title={banner.detailHint}>
              {banner.label}
            </p>
            {banner.detailHint && banner.kind !== 'sync-pending' && (
              <p className="truncate text-[11px] text-neutral-300">{banner.detailHint}</p>
            )}
          </div>
          {banner.kind === 'update-available' && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              data-variant="primary"
              className="min-h-[44px] shrink-0 rounded-full bg-brand px-3.5 py-1.5 text-xs font-bold"
            >
              Muat Ulang
            </button>
          )}
          {banner.showDiagnosticsAction && (
            <button
              type="button"
              onClick={() => setDiagnosticsOpen(true)}
              className="min-h-[44px] shrink-0 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold"
            >
              Detail
            </button>
          )}
          <button
            type="button"
            onClick={handleDismissPill}
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-white/80 hover:text-white"
            aria-label="Tutup status layanan"
          >
            <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </button>
        </div>
      )}

      {diagnosticsOpen && (
        <Suspense fallback={null}>
          <SystemDiagnosticsDialog
            isOpen={diagnosticsOpen}
            onClose={() => setDiagnosticsOpen(false)}
            offline={offline}
            banner={banner}
            events={events}
            onClearEvents={() => setEvents([])}
            onRecordEvent={recordEvent}
          />
        </Suspense>
      )}
    </>
  )
}
