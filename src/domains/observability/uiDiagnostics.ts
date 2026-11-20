// Pure cross-page ambient status, error summary, PHI-redaction & recovery contracts.
// Side-effect free: no DOM, window, Date.now, new Date(), Math.random, or fetch.

export const DIAGNOSTIC_EVENTS_MAX = 12
export const DIAGNOSTIC_MESSAGE_MAX = 220
export const DIAGNOSTIC_ROUTE_MAX = 120
export const DIAGNOSTICS_OPEN_EVENT = 'panacea:open-diagnostics'
export const SERVER_WAKE_EVENT = 'panacea:server-wake'
export const ROUTE_ERROR_EVENT = 'panacea:route-error'
export const HEALTH_PROBE_TIMEOUT_MS = 45_000

export type DiagnosticSeverity = 'info' | 'warn' | 'error'

export type DiagnosticEventKind =
  | 'error'
  | 'rejection'
  | 'route-error'
  | 'network'
  | 'sync'
  | 'server-wake'
  | 'health-probe'

export interface DiagnosticEvent {
  id: string
  atIso: string
  kind: DiagnosticEventKind
  severity: DiagnosticSeverity
  summary: string
  route: string
  requestId: string | null
}

export interface ServerWakeNotice {
  phase: 'idle' | 'waking' | 'timeout'
  attempt: number
  maxAttempts: number
  message: string
}

export type AmbientStatusKind =
  | 'none'
  | 'offline'
  | 'reconnected'
  | 'waking'
  | 'wake-timeout'
  | 'sync-pending'
  | 'update-available'

export interface AmbientStatusBanner {
  kind: AmbientStatusKind
  tone: 'neutral' | 'amber' | 'emerald' | 'brand'
  label: string
  detailHint: string
  showDiagnosticsAction: boolean
}

export interface HealthProbeSummary {
  state: 'idle' | 'checking' | 'ok' | 'degraded' | 'unreachable'
  httpStatus: number | null
  latencyMs: number | null
  storage: string | null
  checkedAtIso: string | null
  note: string | null
}

export interface DiagnosticSnapshot {
  appMode: 'cloud' | 'local'
  apiHost: string
  online: boolean
  route: string
  viewport: string
  theme: 'light' | 'dark'
  buildCommit: string | null
  activeStatus: AmbientStatusKind
  healthProbe: HealthProbeSummary
  events: readonly DiagnosticEvent[]
  capturedAtIso: string
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,64}$/
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const BEARER_PATTERN = /\bBearer\s+(?!\[REDACTED_TOKEN\])[A-Za-z0-9._~+/-]+=*/gi
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g
const SECRET_KV_PATTERN = /\b(token|access_token|refresh_token|apikey|api_key|secret|password|authorization)\s*([:=])\s*(?!Bearer\s+\[REDACTED_TOKEN\]|\[REDACTED_TOKEN\])[^\s,&;]+/gi
const LONG_DIGIT_ID_PATTERN = /(?<!\d)(?:\+?\d[\d\s-]{8,}\d)(?!\d)/g

function extractRawText(input: unknown): string {
  try {
    if (input instanceof Error) {
      const name = typeof input.name === 'string' && input.name ? input.name : 'Error'
      const msg = typeof input.message === 'string' ? input.message : ''
      return msg ? `${name}: ${msg}` : name
    }
    if (typeof input === 'string') return input
    if (input === null || input === undefined) return ''
    return String(input)
  } catch {
    return ''
  }
}

/**
 * Collapses control characters and strips common secrets / PHI identifiers
 * before display in diagnostic drawers or clipboard exports. Never throws.
 */
export function redactSensitiveText(input: unknown, maxLen = DIAGNOSTIC_MESSAGE_MAX): string {
  const safeMax = Number.isFinite(maxLen) && maxLen > 0 ? Math.floor(maxLen) : DIAGNOSTIC_MESSAGE_MAX
  const raw = extractRawText(input)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!raw) return ''

  const sanitized = raw
    .replace(BEARER_PATTERN, 'Bearer [REDACTED_TOKEN]')
    .replace(SECRET_KV_PATTERN, (_full, key: string, sep: string) => `${key}${sep}[REDACTED_TOKEN]`)
    .replace(JWT_PATTERN, '[REDACTED_TOKEN]')
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(LONG_DIGIT_ID_PATTERN, (match) => {
      const digitCount = match.replace(/\D/g, '').length
      return digitCount >= 9 ? '[REDACTED_ID]' : match
    })

  return sanitized.slice(0, safeMax).trim()
}

export function sanitizeDiagnosticRoute(rawRoute: unknown): string {
  let raw = ''
  try {
    raw = typeof rawRoute === 'string' ? rawRoute : ''
  } catch {
    raw = ''
  }
  const withoutHashAndQuery = raw.replace(/^#/, '').split('?')[0].split('#')[0]
  const clean = redactSensitiveText(withoutHashAndQuery, DIAGNOSTIC_ROUTE_MAX).replace(/\s+/g, '')
  if (!clean) return '/'
  return clean.startsWith('/') ? clean : `/${clean}`
}

export function extractApiHostLabel(apiBase: string): { appMode: 'cloud' | 'local'; apiHost: string } {
  const trimmed = typeof apiBase === 'string' ? apiBase.trim() : ''
  if (!trimmed) {
    return { appMode: 'local', apiHost: 'Perangkat (Lokal)' }
  }
  try {
    const parsed = new URL(trimmed)
    const hostname = parsed.hostname.toLowerCase()
    const hostWithPort = parsed.host
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]'
    return {
      appMode: isLocalHost ? 'local' : 'cloud',
      apiHost: hostWithPort || trimmed,
    }
  } catch {
    const cleanHost = redactSensitiveText(trimmed.replace(/^https?:\/\//i, '').split(/[/?#]/)[0], 80)
    return {
      appMode: /^(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?$/i.test(cleanHost) ? 'local' : 'cloud',
      apiHost: cleanHost || 'Tidak diketahui',
    }
  }
}

export function appendDiagnosticEvent(
  events: readonly DiagnosticEvent[],
  next: Omit<DiagnosticEvent, 'summary' | 'route' | 'requestId'> & {
    summary: unknown
    route: unknown
    requestId?: string | null
  },
  max = DIAGNOSTIC_EVENTS_MAX,
): DiagnosticEvent[] {
  const limit = Number.isFinite(max) && max >= 1 ? Math.floor(max) : 1
  const cleanRequestId =
    typeof next.requestId === 'string' && REQUEST_ID_PATTERN.test(next.requestId)
      ? next.requestId
      : null
  const entry: DiagnosticEvent = {
    id: next.id,
    atIso: next.atIso,
    kind: next.kind,
    severity: next.severity,
    summary: redactSensitiveText(next.summary) || 'Event tercatat',
    route: sanitizeDiagnosticRoute(next.route),
    requestId: cleanRequestId,
  }
  return [entry, ...events].slice(0, limit)
}

export function resolveAmbientStatus(input: {
  offline: boolean
  justReconnected: boolean
  wake: ServerWakeNotice | null
  syncPending: boolean
  syncDismissed: boolean
  updateAvailable: boolean
}): AmbientStatusBanner {
  if (input.offline) {
    return {
      kind: 'offline',
      tone: 'amber',
      label: 'Mode Offline — data lokal tetap aman',
      detailHint: 'Periksa koneksi atau buka diagnostik',
      showDiagnosticsAction: true,
    }
  }
  if (input.wake?.phase === 'waking') {
    return {
      kind: 'waking',
      tone: 'brand',
      label: 'Server sedang bangun (30–60 dtk)…',
      detailHint: redactSensitiveText(input.wake.message) || 'Menunggu layanan cloud siap',
      showDiagnosticsAction: true,
    }
  }
  if (input.wake?.phase === 'timeout') {
    return {
      kind: 'wake-timeout',
      tone: 'amber',
      label: 'Server belum merespons',
      detailHint: redactSensitiveText(input.wake.message) || 'Coba muat ulang atau cek server',
      showDiagnosticsAction: true,
    }
  }
  if (input.updateAvailable) {
    return {
      kind: 'update-available',
      tone: 'brand',
      label: 'Versi baru tersedia',
      detailHint: 'Muat ulang untuk pembaruan terbaru',
      showDiagnosticsAction: false,
    }
  }
  if (input.syncPending && !input.syncDismissed) {
    return {
      kind: 'sync-pending',
      tone: 'amber',
      label: 'Sinkronisasi tertunda',
      detailHint: 'Data tersimpan aman di perangkat',
      showDiagnosticsAction: true,
    }
  }
  if (input.justReconnected) {
    return {
      kind: 'reconnected',
      tone: 'emerald',
      label: 'Kembali online',
      detailHint: 'Koneksi pulih',
      showDiagnosticsAction: false,
    }
  }
  return {
    kind: 'none',
    tone: 'neutral',
    label: '',
    detailHint: '',
    showDiagnosticsAction: false,
  }
}

export function isDiagnosticsShortcut(e: {
  altKey: boolean
  shiftKey: boolean
  ctrlKey?: boolean
  metaKey?: boolean
  key: string
  targetTagName?: string | null
  isContentEditable?: boolean
}): boolean {
  if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return false
  if (e.isContentEditable) return false
  const tag = (e.targetTagName ?? '').toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false
  return typeof e.key === 'string' && e.key.toLowerCase() === 'd'
}

export function formatDiagnosticReport(snapshot: DiagnosticSnapshot): string {
  const safeEvents = snapshot.events.slice(0, DIAGNOSTIC_EVENTS_MAX).map((ev) => ({
    at: ev.atIso,
    kind: ev.kind,
    severity: ev.severity,
    route: sanitizeDiagnosticRoute(ev.route),
    summary: redactSensitiveText(ev.summary) || 'Event tercatat',
    requestId: ev.requestId && REQUEST_ID_PATTERN.test(ev.requestId) ? ev.requestId : null,
  }))
  const payload = {
    schema: 'panacea-ui-diagnostics/v1',
    capturedAt: snapshot.capturedAtIso,
    route: sanitizeDiagnosticRoute(snapshot.route),
    online: snapshot.online,
    appMode: snapshot.appMode,
    apiHost: redactSensitiveText(snapshot.apiHost, 80) || 'Tidak diketahui',
    viewport: redactSensitiveText(snapshot.viewport, 32) || 'unknown',
    theme: snapshot.theme,
    buildCommit: snapshot.buildCommit ? redactSensitiveText(snapshot.buildCommit, 40) : 'belum diketahui',
    activeStatus: snapshot.activeStatus,
    healthProbe: {
      state: snapshot.healthProbe.state,
      httpStatus: snapshot.healthProbe.httpStatus,
      latencyMs: snapshot.healthProbe.latencyMs,
      storage: snapshot.healthProbe.storage ? redactSensitiveText(snapshot.healthProbe.storage, 32) : null,
      checkedAtIso: snapshot.healthProbe.checkedAtIso,
      note: snapshot.healthProbe.note ? redactSensitiveText(snapshot.healthProbe.note) : null,
    },
    events: safeEvents,
  }

  return [
    'Panaceamed Diagnostics (No PHI)',
    `Route: ${payload.route} | Online: ${payload.online ? 'yes' : 'no'} | API: ${payload.appMode} (${payload.apiHost})`,
    `Viewport: ${payload.viewport} | Theme: ${payload.theme} | Build: ${payload.buildCommit} | Status: ${payload.activeStatus}`,
    `Health Probe: ${payload.healthProbe.state}${payload.healthProbe.httpStatus !== null ? ` (HTTP ${payload.healthProbe.httpStatus})` : ''}${payload.healthProbe.latencyMs !== null ? ` ${payload.healthProbe.latencyMs}ms` : ''}`,
    `Events (${safeEvents.length}):`,
    JSON.stringify(payload, null, 2),
  ].join('\n')
}
