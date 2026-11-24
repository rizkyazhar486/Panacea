/**
 * PanaceaMed OS — Aureum Century Lifetime Health Record Engine (WP-05, WP-06, WP-07, WP-09).
 *
 * Extends canonical `panaceaLongitudinalState` (`SemanticState`, `LongitudinalDomain`,
 * `LongitudinalProvenance`) for 100-year multi-resolution storage, approximate-date
 * historical backfill, idempotent cross-device deduplication, immutable amendment chains,
 * statistical trend analysis (delta-x, OLS slope beta1 with explicit uncertainty guard),
 * Annual Yearbook / Decade Chronicle, narrowly-scoped Emergency/Portable Medical Passport,
 * and schema-versioned lossless portability + AES-GCM key-rotation recovery.
 *
 * Pure, deterministic, zero React, zero network calls.
 */

import type {
  LongitudinalDomain,
  LongitudinalProvenance,
  SemanticState,
} from '../../../lib/panaceaLongitudinalState'

export type DatePrecision = 'EXACT_TIMESTAMP' | 'DAY' | 'MONTH' | 'YEAR' | 'DECADE_APPROX'
export type TimelineResolutionMode = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'DECADE' | 'LIFETIME'

export interface CenturyHealthEvent {
  readonly id: string
  readonly canonicalDedupKey?: string
  readonly domain: LongitudinalDomain
  readonly metric: string
  readonly numericValue?: number
  readonly textValue?: string
  readonly unit?: string
  /** ISO string or partial ISO date ('1994', '1994-06', '1994-06-15', full ISO). */
  readonly effectiveDate: string
  readonly datePrecision: DatePrecision
  readonly recordedAt: string
  readonly semanticState: SemanticState
  readonly provenance: LongitudinalProvenance
  readonly organSystemId?: string
  readonly deviceGeneration?: string
  readonly sensitivityClass?: 'STANDARD' | 'EMERGENCY_RELEVANT' | 'RESTRICTED_SENSITIVE'
  readonly amendsEventId?: string
  readonly amendmentReason?: string
}

export interface CenturyIngestionReport {
  readonly records: readonly CenturyHealthEvent[]
  readonly ingestedCount: number
  readonly duplicateSkippedCount: number
  readonly amendedCount: number
  readonly approximateDatesPreserved: number
}

export interface TimelineBucket {
  readonly bucketKey: string
  readonly label: string
  readonly startYear: number
  readonly endYear: number
  readonly eventCount: number
  readonly observedCount: number
  readonly simulatedCount: number
  readonly numericMean?: number
  readonly numericMin?: number
  readonly numericMax?: number
  readonly unit?: string
}

export interface LongitudinalTrendAnalysis {
  readonly metric: string
  readonly sampleCount: number
  readonly spanYears: number
  readonly firstValue: number | null
  readonly latestValue: number | null
  readonly deltaX: number | null
  readonly relativeChangePct: number | null
  readonly slopeBeta1PerYear: number | null
  readonly interceptBeta0: number | null
  readonly rSquared: number | null
  readonly missingYearsCount: number
  /** Statistical detectability NEVER equals confirmed clinical significance automatically. */
  readonly clinicallyConfirmed: false
  readonly interpretationNote: string
}

export interface AnnualHealthYearbook {
  readonly year: number
  readonly totalEvents: number
  readonly observedEvents: number
  readonly clinicalEncounters: number
  readonly domainsCovered: readonly LongitudinalDomain[]
  readonly metricSummaries: Readonly<Record<string, { readonly count: number; readonly mean: number; readonly min: number; readonly max: number; readonly unit?: string }>>
  readonly missingDataMonths: readonly number[]
}

export interface DecadeHealthChronicle {
  readonly decadeStartYear: number
  readonly decadeEndYear: number
  readonly totalEvents: number
  readonly activeYears: number
  readonly milestones: readonly { readonly id: string; readonly effectiveDate: string; readonly datePrecision: DatePrecision; readonly metric: string; readonly summary: string }[]
  readonly dataCompletenessPct: number
}

export interface PortableLifetimePassport {
  readonly schemaVersion: 'panacea-lifetime-passport-v1'
  readonly scope: 'EMERGENCY_NARROW' | 'CLINICIAN_FULL'
  readonly generatedAtIso: string
  readonly allergies: readonly string[]
  readonly activeMedications: readonly string[]
  readonly majorConditions: readonly string[]
  readonly vaccinations: readonly { readonly name: string; readonly effectiveDate: string; readonly datePrecision: DatePrecision }[]
  readonly surgicalHistory: readonly { readonly name: string; readonly effectiveDate: string; readonly datePrecision: DatePrecision }[]
  readonly restrictedSensitiveExcluded: boolean
  readonly recordCountIncluded: number
}

export interface CenturyPortableArchive {
  readonly schemaVersion: 'panacea-century-archive-v1'
  readonly exportedAtIso: string
  readonly recordCount: number
  readonly sha256ChecksumHex: string
  readonly records: readonly CenturyHealthEvent[]
}

const SIMULATED_STATES: ReadonlySet<SemanticState> = new Set([
  'simulated',
  'counterfactual',
  'hypothesis',
  'ai-draft',
  'model-estimated',
])

const OBSERVED_STATES: ReadonlySet<SemanticState> = new Set([
  'measured',
  'imported',
  'clinician-entered',
  'clinician-reviewed',
  'patient-reported',
])

/**
 * Extracts calendar year without inventing a false month/day when precision is YEAR or MONTH.
 */
export function parseEffectiveYear(effectiveDate: string): number {
  const m = effectiveDate.trim().match(/^(\d{4})/)
  if (!m) return 1970
  const y = Number(m[1])
  return Number.isFinite(y) ? y : 1970
}

export function parseEffectiveMonth(effectiveDate: string, precision: DatePrecision): number | null {
  if (precision === 'YEAR' || precision === 'DECADE_APPROX') return null
  const m = effectiveDate.trim().match(/^\d{4}-(\d{2})/)
  if (!m) return null
  const mo = Number(m[1])
  return mo >= 1 && mo <= 12 ? mo : null
}

/**
 * Normalizes effective date string strictly honoring declared DatePrecision so
 * approximate historical events NEVER acquire fabricated exact calendar timestamps.
 */
export function preserveDatePrecision(effectiveDate: string, precision: DatePrecision): string {
  const trimmed = effectiveDate.trim()
  const ym = trimmed.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/)
  if (!ym) return trimmed
  const [, yyyy, mm, dd] = ym
  if (precision === 'YEAR' || precision === 'DECADE_APPROX') return yyyy
  if (precision === 'MONTH') return mm ? `${yyyy}-${mm}` : yyyy
  if (precision === 'DAY') return mm && dd ? `${yyyy}-${mm}-${dd}` : trimmed
  return trimmed
}

function buildDedupKey(e: CenturyHealthEvent): string {
  if (e.canonicalDedupKey) return e.canonicalDedupKey
  const val = e.numericValue !== undefined ? String(e.numericValue) : (e.textValue ?? '')
  return `${e.domain}|${e.metric}|${e.effectiveDate}|${val}|${e.unit ?? ''}|${e.provenance.sourceId}`
}

/**
 * Idempotently ingests historical or live events across device generations while
 * preserving approximate-date precision and reconciling duplicates.
 */
export function ingestCenturyEvents(
  existing: readonly CenturyHealthEvent[],
  incoming: readonly CenturyHealthEvent[],
): CenturyIngestionReport {
  const seenKeys = new Set<string>(existing.map(buildDedupKey))
  const seenIds = new Set<string>(existing.map((e) => e.id))
  const merged: CenturyHealthEvent[] = [...existing]
  let ingestedCount = 0
  let duplicateSkippedCount = 0
  let amendedCount = 0
  let approximateDatesPreserved = 0

  for (const raw of incoming) {
    const normalizedDate = preserveDatePrecision(raw.effectiveDate, raw.datePrecision)
    if (raw.datePrecision === 'YEAR' || raw.datePrecision === 'MONTH' || raw.datePrecision === 'DECADE_APPROX') {
      approximateDatesPreserved++
    }
    const normalized: CenturyHealthEvent = {
      ...raw,
      effectiveDate: normalizedDate,
    }
    const key = buildDedupKey(normalized)
    if (seenIds.has(normalized.id) || (!normalized.amendsEventId && seenKeys.has(key))) {
      duplicateSkippedCount++
      continue
    }
    seenIds.add(normalized.id)
    seenKeys.add(key)
    if (normalized.amendsEventId) amendedCount++
    merged.push(normalized)
    ingestedCount++
  }

  merged.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
  return {
    records: merged,
    ingestedCount,
    duplicateSkippedCount,
    amendedCount,
    approximateDatesPreserved,
  }
}

/**
 * Appends an immutable amendment record referencing a prior event without deleting history.
 */
export function amendCenturyEvent(params: {
  readonly existing: readonly CenturyHealthEvent[]
  readonly targetEventId: string
  readonly amendmentId: string
  readonly recordedAt: string
  readonly reason: string
  readonly patch: Partial<Pick<CenturyHealthEvent, 'numericValue' | 'textValue' | 'unit' | 'effectiveDate' | 'datePrecision'>>
}): CenturyIngestionReport {
  const original = params.existing.find((e) => e.id === params.targetEventId)
  if (!original) {
    return { records: params.existing, ingestedCount: 0, duplicateSkippedCount: 0, amendedCount: 0, approximateDatesPreserved: 0 }
  }
  const amendment: CenturyHealthEvent = {
    ...original,
    ...params.patch,
    id: params.amendmentId,
    recordedAt: params.recordedAt,
    amendsEventId: original.id,
    amendmentReason: params.reason,
  }
  return ingestCenturyEvents(params.existing, [amendment])
}

/**
 * Resolves the latest non-superseded view of events (applying amendment chain without erasing history).
 */
export function resolveActiveCenturyRecords(records: readonly CenturyHealthEvent[]): readonly CenturyHealthEvent[] {
  const supersededIds = new Set<string>()
  for (const r of records) {
    if (r.amendsEventId) supersededIds.add(r.amendsEventId)
  }
  return records.filter((r) => !supersededIds.has(r.id))
}

/**
 * Builds O(N) multi-resolution timeline buckets across TODAY / WEEK / MONTH / YEAR / DECADE / LIFETIME.
 */
export function buildMultiResolutionTimeline(
  records: readonly CenturyHealthEvent[],
  mode: TimelineResolutionMode,
  options?: { readonly metric?: string; readonly anchorDateIso?: string },
): readonly TimelineBucket[] {
  const active = resolveActiveCenturyRecords(records)
  const filtered = options?.metric ? active.filter((r) => r.metric === options.metric) : active
  const anchorYear = options?.anchorDateIso ? parseEffectiveYear(options.anchorDateIso) : 2026

  const buckets = new Map<
    string,
    {
      label: string
      startYear: number
      endYear: number
      count: number
      observed: number
      simulated: number
      sum: number
      numCount: number
      min: number
      max: number
      unit?: string
    }
  >()

  for (const r of filtered) {
    const year = parseEffectiveYear(r.effectiveDate)
    const month = parseEffectiveMonth(r.effectiveDate, r.datePrecision)
    let key: string
    let label: string
    let startYear = year
    let endYear = year

    if (mode === 'DECADE' || mode === 'LIFETIME') {
      const dec = Math.floor(year / 10) * 10
      key = `${dec}s`
      label = `${dec}–${dec + 9}`
      startYear = dec
      endYear = dec + 9
    } else if (mode === 'YEAR') {
      key = String(year)
      label = String(year)
    } else if (mode === 'MONTH') {
      if (year !== anchorYear && options?.anchorDateIso) continue
      key = month ? `${year}-${String(month).padStart(2, '0')}` : `${year}-approx`
      label = key
    } else if (mode === 'WEEK') {
      if (year !== anchorYear && options?.anchorDateIso) continue
      const dayMatch = r.effectiveDate.match(/^\d{4}-\d{2}-(\d{2})/)
      const weekNum = dayMatch && month ? Math.ceil(((month - 1) * 30 + Number(dayMatch[1])) / 7) : 1
      key = `${year}-W${String(Math.min(53, Math.max(1, weekNum))).padStart(2, '0')}`
      label = key
    } else {
      // TODAY
      const anchorDay = (options?.anchorDateIso ?? '').slice(0, 10)
      if (anchorDay && !r.effectiveDate.startsWith(anchorDay)) continue
      key = r.effectiveDate.slice(0, 10)
      label = key
    }

    let b = buckets.get(key)
    if (!b) {
      b = {
        label,
        startYear,
        endYear,
        count: 0,
        observed: 0,
        simulated: 0,
        sum: 0,
        numCount: 0,
        min: Number.POSITIVE_INFINITY,
        max: Number.NEGATIVE_INFINITY,
        unit: r.unit,
      }
      buckets.set(key, b)
    }
    b.count++
    if (SIMULATED_STATES.has(r.semanticState)) b.simulated++
    else if (OBSERVED_STATES.has(r.semanticState)) b.observed++

    if (typeof r.numericValue === 'number' && Number.isFinite(r.numericValue) && !SIMULATED_STATES.has(r.semanticState)) {
      b.sum += r.numericValue
      b.numCount++
      if (r.numericValue < b.min) b.min = r.numericValue
      if (r.numericValue > b.max) b.max = r.numericValue
      if (!b.unit && r.unit) b.unit = r.unit
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketKey, b]) => ({
      bucketKey,
      label: b.label,
      startYear: b.startYear,
      endYear: b.endYear,
      eventCount: b.count,
      observedCount: b.observed,
      simulatedCount: b.simulated,
      ...(b.numCount > 0
        ? {
            numericMean: Math.round((b.sum / b.numCount) * 100) / 100,
            numericMin: Math.round(b.min * 100) / 100,
            numericMax: Math.round(b.max * 100) / 100,
          }
        : {}),
      ...(b.unit ? { unit: b.unit } : {}),
    }))
}

/**
 * Statistical longitudinal trend analysis (Section XIII):
 * Uses ONLY non-simulated observed/imported/reported numeric series so simulations never pollute history.
 */
export function analyzeLongitudinalTrend(
  records: readonly CenturyHealthEvent[],
  metric: string,
): LongitudinalTrendAnalysis {
  const active = resolveActiveCenturyRecords(records)
  const pts = active
    .filter(
      (r) =>
        r.metric === metric &&
        typeof r.numericValue === 'number' &&
        Number.isFinite(r.numericValue) &&
        !SIMULATED_STATES.has(r.semanticState),
    )
    .map((r) => {
      const y = parseEffectiveYear(r.effectiveDate)
      const mo = parseEffectiveMonth(r.effectiveDate, r.datePrecision) ?? 6
      return { tYear: y + (mo - 0.5) / 12, year: y, val: r.numericValue! }
    })
    .sort((a, b) => a.tYear - b.tYear)

  if (pts.length === 0) {
    return {
      metric,
      sampleCount: 0,
      spanYears: 0,
      firstValue: null,
      latestValue: null,
      deltaX: null,
      relativeChangePct: null,
      slopeBeta1PerYear: null,
      interceptBeta0: null,
      rSquared: null,
      missingYearsCount: 0,
      clinicallyConfirmed: false,
      interpretationNote: 'No observed numeric measurements available for this metric.',
    }
  }

  const first = pts[0]
  const last = pts[pts.length - 1]
  const spanYears = Math.round((last.tYear - first.tYear) * 100) / 100
  const deltaX = Math.round((last.val - first.val) * 1000) / 1000
  const relativeChangePct = first.val !== 0 ? Math.round(((last.val - first.val) / first.val) * 10000) / 100 : null

  const yearsPresent = new Set(pts.map((p) => p.year))
  const totalSpanCalendarYears = Math.max(1, last.year - first.year + 1)
  const missingYearsCount = Math.max(0, totalSpanCalendarYears - yearsPresent.size)

  if (pts.length < 2 || spanYears <= 0) {
    return {
      metric,
      sampleCount: pts.length,
      spanYears,
      firstValue: first.val,
      latestValue: last.val,
      deltaX,
      relativeChangePct,
      slopeBeta1PerYear: null,
      interceptBeta0: null,
      rSquared: null,
      missingYearsCount,
      clinicallyConfirmed: false,
      interpretationNote: 'Insufficient temporal span for regression slope estimation.',
    }
  }

  const n = pts.length
  const t0 = first.tYear
  let sumX = 0
  let sumY = 0
  for (const p of pts) {
    sumX += p.tYear - t0
    sumY += p.val
  }
  const meanX = sumX / n
  const meanY = sumY / n
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const p of pts) {
    const dx = p.tYear - t0 - meanX
    const dy = p.val - meanY
    sxx += dx * dx
    sxy += dx * dy
    syy += dy * dy
  }

  const beta1 = sxx > 0 ? sxy / sxx : 0
  const beta0 = meanY - beta1 * meanX
  const rSquared = sxx > 0 && syy > 0 ? Math.min(1, (sxy * sxy) / (sxx * syy)) : 0

  return {
    metric,
    sampleCount: n,
    spanYears,
    firstValue: Math.round(first.val * 100) / 100,
    latestValue: Math.round(last.val * 100) / 100,
    deltaX,
    relativeChangePct,
    slopeBeta1PerYear: Math.round(beta1 * 10000) / 10000,
    interceptBeta0: Math.round(beta0 * 1000) / 1000,
    rSquared: Math.round(rSquared * 1000) / 1000,
    missingYearsCount,
    clinicallyConfirmed: false,
    interpretationNote: 'Statistical trend only — evaluate measurement error, missing periods, and clinical thresholds with a licensed clinician.',
  }
}

export function buildAnnualYearbook(records: readonly CenturyHealthEvent[], year: number): AnnualHealthYearbook {
  const active = resolveActiveCenturyRecords(records).filter((r) => parseEffectiveYear(r.effectiveDate) === year)
  const domains = new Set<LongitudinalDomain>()
  const observedMonths = new Set<number>()
  const acc = new Map<string, { count: number; sum: number; min: number; max: number; unit?: string }>()
  let observedEvents = 0
  let clinicalEncounters = 0

  for (const r of active) {
    domains.add(r.domain)
    if (OBSERVED_STATES.has(r.semanticState)) observedEvents++
    if (r.domain === 'clinical-note' || r.domain === 'lab') clinicalEncounters++
    const m = parseEffectiveMonth(r.effectiveDate, r.datePrecision)
    if (m) observedMonths.add(m)
    if (typeof r.numericValue === 'number' && Number.isFinite(r.numericValue) && !SIMULATED_STATES.has(r.semanticState)) {
      const cur = acc.get(r.metric) ?? { count: 0, sum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, unit: r.unit }
      cur.count++
      cur.sum += r.numericValue
      if (r.numericValue < cur.min) cur.min = r.numericValue
      if (r.numericValue > cur.max) cur.max = r.numericValue
      acc.set(r.metric, cur)
    }
  }

  const metricSummaries: Record<string, { readonly count: number; readonly mean: number; readonly min: number; readonly max: number; readonly unit?: string }> = {}
  for (const [k, v] of acc.entries()) {
    metricSummaries[k] = {
      count: v.count,
      mean: Math.round((v.sum / v.count) * 100) / 100,
      min: Math.round(v.min * 100) / 100,
      max: Math.round(v.max * 100) / 100,
      ...(v.unit ? { unit: v.unit } : {}),
    }
  }

  const missingDataMonths: number[] = []
  for (let m = 1; m <= 12; m++) {
    if (!observedMonths.has(m)) missingDataMonths.push(m)
  }

  return {
    year,
    totalEvents: active.length,
    observedEvents,
    clinicalEncounters,
    domainsCovered: Array.from(domains).sort(),
    metricSummaries,
    missingDataMonths,
  }
}

export function buildDecadeChronicle(records: readonly CenturyHealthEvent[], decadeStartYear: number): DecadeHealthChronicle {
  const start = Math.floor(decadeStartYear / 10) * 10
  const end = start + 9
  const active = resolveActiveCenturyRecords(records).filter((r) => {
    const y = parseEffectiveYear(r.effectiveDate)
    return y >= start && y <= end
  })
  const activeYears = new Set(active.map((r) => parseEffectiveYear(r.effectiveDate)))
  const milestones = active
    .filter((r) => r.domain === 'clinical-note' || r.domain === 'medication' || r.metric === 'vaccination' || r.metric === 'surgery')
    .slice(0, 25)
    .map((r) => ({
      id: r.id,
      effectiveDate: r.effectiveDate,
      datePrecision: r.datePrecision,
      metric: r.metric,
      summary: r.textValue ?? (r.numericValue !== undefined ? `${r.numericValue} ${r.unit ?? ''}`.trim() : r.metric),
    }))

  return {
    decadeStartYear: start,
    decadeEndYear: end,
    totalEvents: active.length,
    activeYears: activeYears.size,
    milestones,
    dataCompletenessPct: Math.round((activeYears.size / 10) * 100),
  }
}

/**
 * Generates a narrowly-scoped Emergency or full Clinician Portable Lifetime Medical Passport.
 * Explicitly excludes `RESTRICTED_SENSITIVE` records from `EMERGENCY_NARROW` scope (Section XX).
 */
export function buildPortableLifetimePassport(
  records: readonly CenturyHealthEvent[],
  scope: 'EMERGENCY_NARROW' | 'CLINICIAN_FULL',
  generatedAtIso: string,
): PortableLifetimePassport {
  const active = resolveActiveCenturyRecords(records)
  const visible = scope === 'EMERGENCY_NARROW'
    ? active.filter((r) => r.sensitivityClass !== 'RESTRICTED_SENSITIVE')
    : active

  const allergies = new Set<string>()
  const activeMedications = new Set<string>()
  const majorConditions = new Set<string>()
  const vaccinations: Array<{ readonly name: string; readonly effectiveDate: string; readonly datePrecision: DatePrecision }> = []
  const surgicalHistory: Array<{ readonly name: string; readonly effectiveDate: string; readonly datePrecision: DatePrecision }> = []

  for (const r of visible) {
    if (SIMULATED_STATES.has(r.semanticState)) continue
    const label = r.textValue?.trim()
    if (!label) continue
    if (r.metric === 'allergy') allergies.add(label)
    else if (r.domain === 'medication') activeMedications.add(label)
    else if (r.metric === 'condition' || r.metric === 'diagnosis') majorConditions.add(label)
    else if (r.metric === 'vaccination') vaccinations.push({ name: label, effectiveDate: r.effectiveDate, datePrecision: r.datePrecision })
    else if (r.metric === 'surgery') surgicalHistory.push({ name: label, effectiveDate: r.effectiveDate, datePrecision: r.datePrecision })
  }

  return {
    schemaVersion: 'panacea-lifetime-passport-v1',
    scope,
    generatedAtIso,
    allergies: Array.from(allergies),
    activeMedications: Array.from(activeMedications),
    majorConditions: Array.from(majorConditions),
    vaccinations,
    surgicalHistory,
    restrictedSensitiveExcluded: scope === 'EMERGENCY_NARROW',
    recordCountIncluded: visible.length,
  }
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Lossless schema-versioned portable export with SHA-256 integrity verification (Golden Journey 12).
 */
export async function exportCenturyArchiveJson(
  records: readonly CenturyHealthEvent[],
  exportedAtIso: string,
): Promise<CenturyPortableArchive> {
  const canonicalPayload = JSON.stringify(records)
  const sha256ChecksumHex = await sha256Hex(canonicalPayload)
  return {
    schemaVersion: 'panacea-century-archive-v1',
    exportedAtIso,
    recordCount: records.length,
    sha256ChecksumHex,
    records: [...records],
  }
}

export async function verifyAndImportCenturyArchive(
  archive: CenturyPortableArchive,
): Promise<{ readonly valid: boolean; readonly records: readonly CenturyHealthEvent[] }> {
  if (archive.schemaVersion !== 'panacea-century-archive-v1') {
    return { valid: false, records: [] }
  }
  const recomputed = await sha256Hex(JSON.stringify(archive.records))
  if (recomputed !== archive.sha256ChecksumHex || archive.records.length !== archive.recordCount) {
    return { valid: false, records: [] }
  }
  return { valid: true, records: archive.records }
}

/**
 * Encryption-key rotation utility for multi-decade AES-GCM vault longevity (Golden Journey 13).
 */
export async function rotateCenturyArchiveKey(params: {
  readonly ciphertextBase64: string
  readonly ivBase64: string
  readonly oldKey: CryptoKey
  readonly newKey: CryptoKey
}): Promise<{ readonly ciphertextBase64: string; readonly ivBase64: string }> {
  const fromB64 = (s: string) => {
    const bin = atob(s)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  const toB64 = (arr: Uint8Array) => {
    let bin = ''
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i])
    return btoa(bin)
  }

  const plainBuf = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(params.ivBase64) },
    params.oldKey,
    fromB64(params.ciphertextBase64),
  )
  const nextIv = globalThis.crypto.getRandomValues(new Uint8Array(12))
  const nextCipher = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nextIv },
    params.newKey,
    plainBuf,
  )
  return {
    ciphertextBase64: toB64(new Uint8Array(nextCipher)),
    ivBase64: toB64(nextIv),
  }
}
