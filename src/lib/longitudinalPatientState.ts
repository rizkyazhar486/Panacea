export type LongitudinalDomain =
  | 'vitals'
  | 'activity'
  | 'sleep'
  | 'recovery'
  | 'fitness'
  | 'nutrition'
  | 'mind'
  | 'clinical'

export type ProvenanceKind = 'device' | 'user' | 'clinical' | 'derived' | 'simulated'

export type LongitudinalSignal = {
  id: string
  domain: LongitudinalDomain
  metric: string
  value: number | string
  unit?: string
  measuredAt: string
  receivedAt: string
  source: string
  provenance: {
    kind: ProvenanceKind
    sourceId?: string
    evidence?: string
  }
  confidence: number
  consent: {
    granted: boolean
    scope?: string
  }
  tags?: string[]
}

export type LongitudinalStateSummary = {
  signalCount: number
  domainCount: number
  sourceCount: number
  consentedCount: number
  recentCount: number
  meanConfidence: number
  lastMeasuredAt: string | null
  domains: Array<{
    domain: LongitudinalDomain
    count: number
    latestAt: string
    confidence: number
  }>
}

const STORAGE_KEY = 'panacea.longitudinal.patient-state.v1'
export const LONGITUDINAL_EVENT = 'panacea:longitudinal-state'
const MAX_SIGNALS = 600
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000

const ALL_DOMAINS: LongitudinalDomain[] = [
  'vitals',
  'activity',
  'sleep',
  'recovery',
  'fitness',
  'nutrition',
  'mind',
  'clinical',
]

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function safeDate(value: string) {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

function isLongitudinalDomain(value: unknown): value is LongitudinalDomain {
  return typeof value === 'string' && ALL_DOMAINS.includes(value as LongitudinalDomain)
}

function isSignal(value: unknown): value is LongitudinalSignal {
  if (!value || typeof value !== 'object') return false
  const signal = value as Partial<LongitudinalSignal>
  return Boolean(
    typeof signal.id === 'string' &&
    isLongitudinalDomain(signal.domain) &&
    typeof signal.metric === 'string' &&
    (typeof signal.value === 'number' || typeof signal.value === 'string') &&
    typeof signal.measuredAt === 'string' &&
    typeof signal.receivedAt === 'string' &&
    typeof signal.source === 'string' &&
    signal.provenance &&
    typeof signal.provenance.kind === 'string' &&
    typeof signal.confidence === 'number' &&
    signal.consent &&
    typeof signal.consent.granted === 'boolean',
  )
}

export function readLongitudinalSignals(): LongitudinalSignal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(isSignal)
      .map((signal) => ({ ...signal, confidence: clamp01(signal.confidence) }))
      .sort((a, b) => safeDate(b.measuredAt) - safeDate(a.measuredAt))
      .slice(0, MAX_SIGNALS)
  } catch {
    return []
  }
}

function emitLongitudinalState() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LONGITUDINAL_EVENT))
}

export function writeLongitudinalSignals(signals: LongitudinalSignal[]) {
  if (typeof window === 'undefined') return
  const normalized = signals
    .filter(isSignal)
    .map((signal) => ({ ...signal, confidence: clamp01(signal.confidence) }))
    .sort((a, b) => safeDate(b.measuredAt) - safeDate(a.measuredAt))
    .slice(0, MAX_SIGNALS)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  emitLongitudinalState()
}

export function appendLongitudinalSignal(signal: LongitudinalSignal) {
  const next = [
    { ...signal, confidence: clamp01(signal.confidence) },
    ...readLongitudinalSignals().filter((item) => item.id !== signal.id),
  ]
  writeLongitudinalSignals(next)
}

export function createLongitudinalSignal(input: Omit<LongitudinalSignal, 'id' | 'receivedAt'> & { id?: string; receivedAt?: string }): LongitudinalSignal {
  const receivedAt = input.receivedAt || new Date().toISOString()
  const id = input.id || `${input.domain}:${input.metric}:${input.source}:${input.measuredAt}`
  return {
    ...input,
    id,
    receivedAt,
    confidence: clamp01(input.confidence),
  }
}

export function summarizeLongitudinalState(signals: LongitudinalSignal[]): LongitudinalStateSummary {
  const now = Date.now()
  const sourceSet = new Set<string>()
  const byDomain = new Map<LongitudinalDomain, LongitudinalSignal[]>()
  let confidenceTotal = 0
  let consentedCount = 0
  let recentCount = 0

  signals.forEach((signal) => {
    sourceSet.add(signal.source)
    confidenceTotal += clamp01(signal.confidence)
    if (signal.consent.granted) consentedCount += 1
    if (now - safeDate(signal.measuredAt) <= RECENT_WINDOW_MS) recentCount += 1
    const list = byDomain.get(signal.domain) || []
    list.push(signal)
    byDomain.set(signal.domain, list)
  })

  const domains = ALL_DOMAINS.flatMap((domain) => {
    const list = byDomain.get(domain)
    if (!list?.length) return []
    const latest = [...list].sort((a, b) => safeDate(b.measuredAt) - safeDate(a.measuredAt))[0]
    return [{
      domain,
      count: list.length,
      latestAt: latest.measuredAt,
      confidence: list.reduce((sum, item) => sum + clamp01(item.confidence), 0) / list.length,
    }]
  })

  return {
    signalCount: signals.length,
    domainCount: domains.length,
    sourceCount: sourceSet.size,
    consentedCount,
    recentCount,
    meanConfidence: signals.length ? confidenceTotal / signals.length : 0,
    lastMeasuredAt: signals[0]?.measuredAt || null,
    domains,
  }
}

export function createLongitudinalHandoff(signals = readLongitudinalSignals()) {
  const summary = summarizeLongitudinalState(signals)
  const consentedSignals = signals.filter((signal) => signal.consent.granted)
  const recent = consentedSignals.slice(0, 24).map((signal) => ({
    domain: signal.domain,
    metric: signal.metric,
    value: signal.value,
    unit: signal.unit,
    measuredAt: signal.measuredAt,
    source: signal.source,
    provenance: signal.provenance,
    confidence: clamp01(signal.confidence),
    consent: signal.consent,
  }))

  return {
    schema: 'panacea.longitudinal-handoff.v1',
    generatedAt: new Date().toISOString(),
    summary,
    eligibleSignalCount: consentedSignals.length,
    recent,
    boundary: 'Context only. Only consent-granted signals are attached. Preserve provenance, uncertainty, temporal context and clinician oversight.',
  }
}

export function persistLongitudinalHandoff(target: 'chatbot' | 'emr' | 'care') {
  if (typeof window === 'undefined') return
  const handoff = createLongitudinalHandoff()
  window.sessionStorage.setItem('pm_longitudinal_context', JSON.stringify({ ...handoff, target }))
}

export function subscribeLongitudinalState(listener: () => void) {
  if (typeof window === 'undefined') return () => undefined
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(LONGITUDINAL_EVENT, listener)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(LONGITUDINAL_EVENT, listener)
  }
}

export const longitudinalPatientStateContract = {
  storageKey: STORAGE_KEY,
  event: LONGITUDINAL_EVENT,
  domains: ALL_DOMAINS,
  maxSignals: MAX_SIGNALS,
  recentWindowMs: RECENT_WINDOW_MS,
} as const
