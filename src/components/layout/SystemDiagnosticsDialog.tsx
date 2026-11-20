import { useEffect, useMemo, useState } from 'react'
import {
  extractApiHostLabel,
  formatDiagnosticReport,
  HEALTH_PROBE_TIMEOUT_MS,
  redactSensitiveText,
  sanitizeDiagnosticRoute,
  type AmbientStatusBanner,
  type DiagnosticEvent,
  type DiagnosticSnapshot,
  type HealthProbeSummary,
} from '../../domains/observability'
import { API_BASE } from '../../lib/api'
import { AdaptiveDialog } from '../../shared/adaptive/AdaptiveDialog'

export interface SystemDiagnosticsDialogProps {
  isOpen: boolean
  onClose: () => void
  offline: boolean
  banner: AmbientStatusBanner
  events: readonly DiagnosticEvent[]
  onClearEvents: () => void
  onRecordEvent: (next: {
    kind: DiagnosticEvent['kind']
    severity: DiagnosticEvent['severity']
    summary: unknown
    route?: unknown
    requestId?: string | null
  }) => void
}

type EventFilter = 'all' | 'error' | 'network'

const INITIAL_PROBE: HealthProbeSummary = {
  state: 'idle',
  httpStatus: null,
  latencyMs: null,
  storage: null,
  checkedAtIso: null,
  note: null,
}

function readViewportLabel(): string {
  if (typeof window === 'undefined') return 'unknown'
  return `${window.innerWidth}x${window.innerHeight}`
}

function readThemeMode(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function readCurrentRoute(): string {
  if (typeof window === 'undefined') return '/'
  return sanitizeDiagnosticRoute(window.location.hash || window.location.pathname)
}

function formatEventTime(atIso: string): string {
  const match = atIso.match(/T(\d{2}:\d{2}:\d{2})/)
  if (match) return match[1]
  return atIso.slice(0, 19)
}

export function SystemDiagnosticsDialog({
  isOpen,
  onClose,
  offline,
  banner,
  events,
  onClearEvents,
  onRecordEvent,
}: SystemDiagnosticsDialogProps) {
  const [filter, setFilter] = useState<EventFilter>('all')
  const [buildCommit, setBuildCommit] = useState<string | null>(null)
  const [probe, setProbe] = useState<HealthProbeSummary>(INITIAL_PROBE)
  const [probing, setProbing] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'fallback'>('idle')
  const [fallbackReport, setFallbackReport] = useState<string | null>(null)

  const apiInfo = useMemo(() => extractApiHostLabel(API_BASE), [])
  const currentRoute = readCurrentRoute()
  const viewport = readViewportLabel()
  const theme = readThemeMode()

  // Lazily fetch build-info.json only after the user opens the dialog.
  useEffect(() => {
    if (!isOpen || buildCommit !== null) return
    let cancelled = false
    const baseUrl = import.meta.env.BASE_URL || '/'
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}build-info.json`
    void fetch(url, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { commitSha?: unknown } | null) => {
        if (cancelled) return
        const sha = typeof data?.commitSha === 'string' && /^[0-9a-f]{7,40}$/i.test(data.commitSha)
          ? data.commitSha
          : null
        if (sha) setBuildCommit(sha)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [isOpen, buildCommit])

  const filteredEvents = useMemo(() => {
    if (filter === 'error') {
      return events.filter((ev) => ev.severity === 'error' || ev.kind === 'error' || ev.kind === 'rejection' || ev.kind === 'route-error')
    }
    if (filter === 'network') {
      return events.filter((ev) => ev.kind === 'network' || ev.kind === 'sync' || ev.kind === 'server-wake' || ev.kind === 'health-probe')
    }
    return events
  }, [events, filter])

  const snapshot: DiagnosticSnapshot = useMemo(
    () => ({
      appMode: apiInfo.appMode,
      apiHost: apiInfo.apiHost,
      online: !offline,
      route: currentRoute,
      viewport,
      theme,
      buildCommit,
      activeStatus: banner.kind,
      healthProbe: probe,
      events,
      capturedAtIso: new Date().toISOString(),
    }),
    [apiInfo.appMode, apiInfo.apiHost, offline, currentRoute, viewport, theme, buildCommit, banner.kind, probe, events],
  )

  const overallBadge = useMemo(() => {
    if (offline) return { label: 'Mode Offline', tone: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200' }
    if (banner.kind === 'waking') return { label: 'Server Sedang Bangun', tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200' }
    if (banner.kind === 'wake-timeout' || events.some((ev) => ev.severity === 'error')) {
      return { label: 'Gangguan Tercatat', tone: 'bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200' }
    }
    return { label: 'Sistem Siap', tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200' }
  }, [offline, banner.kind, events])

  const handleProbeServer = async () => {
    if (probing) return
    const checkedAtIso = new Date().toISOString()
    if (!API_BASE) {
      const localNote = 'Mode perangkat lokal (tanpa URL backend cloud)'
      setProbe({
        state: 'idle',
        httpStatus: null,
        latencyMs: null,
        storage: 'lokal',
        checkedAtIso,
        note: localNote,
      })
      onRecordEvent({
        kind: 'health-probe',
        severity: 'info',
        summary: localNote,
        route: currentRoute,
      })
      return
    }

    setProbing(true)
    setProbe((prev) => ({ ...prev, state: 'checking', note: 'Memeriksa /api/health…' }))
    const startedAt = performance.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_PROBE_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE.replace(/\/+$/, '')}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
      })
      const latencyMs = Math.max(1, Math.round(performance.now() - startedAt))
      const payload = (await response.json().catch(() => null)) as { ok?: unknown; penyimpanan?: unknown; storage?: unknown } | null
      const storageRaw = typeof payload?.penyimpanan === 'string'
        ? payload.penyimpanan
        : typeof payload?.storage === 'string'
          ? payload.storage
          : null
      const storage = storageRaw ? redactSensitiveText(storageRaw, 32) : null
      const ok = response.ok && payload?.ok !== false
      const summaryText = ok
        ? `Server merespons HTTP ${response.status} dalam ${latencyMs} ms`
        : `Server merespons HTTP ${response.status}`

      setProbe({
        state: ok ? 'ok' : 'degraded',
        httpStatus: response.status,
        latencyMs,
        storage,
        checkedAtIso,
        note: summaryText,
      })
      onRecordEvent({
        kind: 'health-probe',
        severity: ok ? 'info' : 'warn',
        summary: summaryText,
        route: currentRoute,
        requestId: response.headers.get('x-request-id'),
      })
    } catch (err) {
      const latencyMs = Math.max(1, Math.round(performance.now() - startedAt))
      const isAbort = err instanceof Error && err.name === 'AbortError'
      const safeErr = redactSensitiveText(err)
      const note = isAbort
        ? `Batas waktu pemeriksaan server tercapai (${Math.round(HEALTH_PROBE_TIMEOUT_MS / 1000)} dtk)`
        : safeErr || 'Server belum dapat dijangkau'

      setProbe({
        state: 'unreachable',
        httpStatus: null,
        latencyMs,
        storage: null,
        checkedAtIso,
        note,
      })
      onRecordEvent({
        kind: 'health-probe',
        severity: 'error',
        summary: note,
        route: currentRoute,
      })
    } finally {
      clearTimeout(timeoutId)
      setProbing(false)
    }
  }

  const handleCopyReport = async () => {
    const report = formatDiagnosticReport(snapshot)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report)
        setFallbackReport(null)
        setCopyStatus('copied')
        setTimeout(() => setCopyStatus('idle'), 3000)
        return
      }
    } catch {
      // Fallback below renders an inspectable read-only textarea safely.
    }
    setFallbackReport(report)
    setCopyStatus('fallback')
  }

  const handleGoHome = () => {
    if (typeof window !== 'undefined') window.location.hash = '#/'
    onClose()
  }

  const handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={() => void handleCopyReport()}
        data-variant="primary"
        className="min-h-[44px] rounded-full bg-brand px-4 py-2 text-xs font-bold text-white"
      >
        {copyStatus === 'copied' ? 'Laporan tersalin' : 'Salin Laporan (Tanpa PHI)'}
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleGoHome}
          className="min-h-[44px] rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-ink dark:border-white/15 dark:text-white"
        >
          Ke Beranda
        </button>
        <button
          type="button"
          onClick={handleReload}
          className="min-h-[44px] rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-ink dark:border-white/15 dark:text-white"
        >
          Muat Ulang
        </button>
      </div>
    </div>
  )

  return (
    <AdaptiveDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Diagnostik Sistem"
      subtitle="Status lintas halaman & pemulihan aman (tanpa PHI)"
      maxWidth="xl"
      footer={footer}
      ariaLabel="Diagnostik Sistem"
    >
      <div className="space-y-4 text-ink dark:text-neutral-100">
        {/* Status Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-neutral-50 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${overallBadge.tone}`}>
              {overallBadge.label}
            </span>
            {banner.kind !== 'none' && banner.label && (
              <span className="truncate text-xs text-neutral-600 dark:text-neutral-300">
                {banner.label}
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={probing}
            onClick={() => void handleProbeServer()}
            data-variant="primary"
            className="min-h-[44px] shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white"
          >
            {probing ? 'Memeriksa…' : 'Cek Server'}
          </button>
        </div>

        {probe.note && (
          <p className="rounded-xl border border-black/10 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
            {redactSensitiveText(probe.note)}
          </p>
        )}

        {/* 3-Tile Scannable Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-black/10 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Koneksi
            </p>
            <p className="mt-1 text-sm font-bold text-ink dark:text-white">
              {offline ? 'Offline' : 'Online'}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">
              {probe.latencyMs !== null ? `${probe.latencyMs} ms` : 'Belum diuji'}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-black/10 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Layanan API
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-ink dark:text-white">
              <span>{apiInfo.appMode === 'cloud' ? 'Cloud' : 'Lokal'}</span>
              {probe.storage && (
                <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase dark:bg-white/10">
                  {probe.storage}
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-neutral-600 dark:text-neutral-300" title={apiInfo.apiHost}>
              {apiInfo.apiHost}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-black/10 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Halaman &amp; Build
            </p>
            <p className="mt-1 truncate text-sm font-bold text-ink dark:text-white" title={currentRoute}>
              {currentRoute}
            </p>
            <p className="mt-0.5 truncate text-xs text-neutral-600 dark:text-neutral-300">
              {(buildCommit ? buildCommit.slice(0, 8) : 'Lokal / Dev')} · {viewport}
            </p>
          </div>
        </div>

        {/* Interactive Event Log */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div role="radiogroup" aria-label="Filter log sesi" className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'error', label: 'Galat' },
                  { id: 'network', label: 'Jaringan' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={filter === opt.id}
                  data-variant={filter === opt.id ? 'primary' : undefined}
                  onClick={() => setFilter(opt.id)}
                  className="min-h-[44px] rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-semibold"
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {events.length > 0 && (
              <button
                type="button"
                onClick={onClearEvents}
                className="min-h-[44px] rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-semibold"
              >
                Bersihkan
              </button>
            )}
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 px-4 py-5 text-center text-xs text-neutral-500 dark:border-white/15 dark:text-neutral-400">
              {events.length === 0
                ? 'Belum ada catatan gangguan pada sesi ini.'
                : 'Tidak ada catatan untuk filter yang dipilih.'}
            </div>
          ) : (
            <ul className="max-h-60 space-y-2 overflow-y-auto pr-0.5">
              {filteredEvents.map((ev) => {
                const dotColor =
                  ev.severity === 'error'
                    ? 'bg-rose-500'
                    : ev.severity === 'warn'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                return (
                  <li
                    key={ev.id}
                    className="min-w-0 rounded-2xl border border-black/10 bg-neutral-50 px-3 py-2.5 text-xs dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
                        <span className="rounded-md bg-black/5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-700 dark:bg-white/10 dark:text-neutral-200">
                          {ev.kind}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                        {formatEventTime(ev.atIso)}
                      </span>
                    </div>
                    <p className="mt-1.5 break-words font-medium text-ink dark:text-neutral-100">
                      {redactSensitiveText(ev.summary)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <span className="break-all">Rute: {sanitizeDiagnosticRoute(ev.route)}</span>
                      {ev.requestId && <span className="font-mono">Ref: {ev.requestId}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {copyStatus === 'fallback' && fallbackReport !== null && (
          <div className="space-y-1.5 rounded-2xl border border-black/10 bg-neutral-50 p-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              Clipboard tidak tersedia — salin laporan secara manual:
            </p>
            <textarea
              readOnly
              rows={6}
              value={fallbackReport}
              aria-label="Laporan diagnostik manual tanpa PHI"
              className="w-full rounded-xl border border-black/15 bg-white p-2 font-mono text-[11px] text-ink dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>
        )}
      </div>
    </AdaptiveDialog>
  )
}
