export const PRODUCTION_API_ORIGIN = 'https://panaceamed-backend.onrender.com'

export const MIN_COLD_START_TIMEOUT_MS = 30_000
export const COLD_START_TIMEOUT_MS = 65_000
export const MAX_COLD_START_TIMEOUT_MS = 120_000
export const WAKE_NOTICE_THRESHOLD_MS = 4_000
export const COLD_START_RETRY_DELAYS_MS = [1_500, 3_000] as const

export const SERVER_WAKING_MESSAGE =
  'Server sedang bangun dari mode tidur (cold start 30–60 detik). Mohon tunggu sebentar…'
export const SERVER_WAKE_TIMEOUT_MESSAGE =
  'Server masih bangun (cold start >65 detik). Silakan coba lagi dalam beberapa detik.'

export type ServerWakeState = 'idle' | 'waking' | 'ready' | 'timeout'

export type ServerWakeStatus = {
  readonly state: ServerWakeState
  readonly message: string | null
}

const PRODUCTION_HOSTS = new Set([
  'panaceamed.id',
  'www.panaceamed.id',
])

const COLD_START_RETRY_METHODS = new Set(['GET', 'HEAD'])
const COLD_START_RETRY_STATUSES = new Set([502, 503, 504])

/** Menentukan origin backend online: pakai VITE_API_URL bila disetel, atau otomatis ke Render saat berjalan di panaceamed.id. */
export function resolveApiBaseUrl(
  envUrl: string | undefined,
  hostname: string | undefined,
): string {
  const explicit = typeof envUrl === 'string' ? envUrl.trim().replace(/\/+$/, '') : ''
  if (explicit) return explicit
  const host = typeof hostname === 'string' ? hostname.trim().toLowerCase() : ''
  if (!host) return ''
  if (PRODUCTION_HOSTS.has(host) || host.endsWith('.panaceamed.id')) {
    return PRODUCTION_API_ORIGIN
  }
  return ''
}

/** Menyelaraskan timeout permintaan dengan cold start Render (minimal 30 detik, default 65 detik, maks 120 detik). */
export function normalizeColdStartTimeoutMs(timeoutMs?: number): number {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs < MIN_COLD_START_TIMEOUT_MS) {
    return COLD_START_TIMEOUT_MS
  }
  if (timeoutMs > MAX_COLD_START_TIMEOUT_MS) {
    return MAX_COLD_START_TIMEOUT_MS
  }
  return Math.floor(timeoutMs)
}

/** Mengizinkan retry otomatis hanya untuk GET/HEAD saat timeout atau status 502/503/504 selama percobaan masih tersisa. */
export function shouldRetryColdStart(input: {
  readonly method?: string
  readonly attempt: number
  readonly maxAttempts: number
  readonly status?: number | null
  readonly isTimeout?: boolean
}): boolean {
  const method = (input.method || 'GET').trim().toUpperCase()
  if (!COLD_START_RETRY_METHODS.has(method)) return false
  if (!Number.isInteger(input.maxAttempts) || input.maxAttempts < 1) return false
  if (!Number.isInteger(input.attempt) || input.attempt < 1 || input.attempt >= input.maxAttempts) return false
  if (input.isTimeout === true) return true
  return typeof input.status === 'number' && COLD_START_RETRY_STATUSES.has(input.status)
}

/** Memetakan status bangun server menjadi pesan UI yang jelas tanpa mengarang kondisi server. */
export function describeServerWakeStatus(state: ServerWakeState): ServerWakeStatus {
  if (state === 'waking') return { state, message: SERVER_WAKING_MESSAGE }
  if (state === 'timeout') return { state, message: SERVER_WAKE_TIMEOUT_MESSAGE }
  return { state, message: null }
}
