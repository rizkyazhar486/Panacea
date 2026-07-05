// Parse health-app export files into the fields our Health Profile uses.
// Supports Apple Health (export.xml) and WHOOP (physiological_cycles.csv).
// Everything runs client-side — no file ever leaves the device during parsing.

export interface ImportResult {
  vo2max?: number
  restingHr?: number
  hrvMs?: number
  recoveryPct?: number
  strain?: number
  sleepH?: number
  weightKg?: number
  bodyFatPct?: number
  source?: string
}

// Apple Health export.xml — records are written chronologically, so the LAST
// match of each type is the most recent value. We regex instead of DOM-parsing
// so multi-MB exports don't blow up memory.
export function parseAppleHealth(xml: string): ImportResult {
  // Pick the record with the greatest startDate rather than trusting file order —
  // Apple exports interleave sources and aren't reliably chronological. Falls back
  // to the last match when a record has no parseable date.
  const latest = (type: string): number | undefined => {
    const re = new RegExp(`type="${type}"[^>]*?(?:startDate="([^"]*)"[^>]*?)?value="([\\d.]+)"`, 'g')
    let m: RegExpExecArray | null
    let v: number | undefined
    let best = -Infinity
    while ((m = re.exec(xml))) {
      const t = m[1] ? Date.parse(m[1]) : NaN
      const key = Number.isNaN(t) ? best : t // undated records: keep last-seen ordering
      if (key >= best) { best = key; v = parseFloat(m[2]) }
    }
    return Number.isFinite(v) ? v : undefined
  }
  const out: ImportResult = { source: 'Apple Watch' }
  out.vo2max = latest('HKQuantityTypeIdentifierVO2Max')
  out.restingHr = round(latest('HKQuantityTypeIdentifierRestingHeartRate'))
  out.hrvMs = round(latest('HKQuantityTypeIdentifierHeartRateVariabilitySDNN'))
  out.weightKg = latest('HKQuantityTypeIdentifierBodyMass')
  out.bodyFatPct = pct(latest('HKQuantityTypeIdentifierBodyFatPercentage'))
  return prune(out)
}

// WHOOP export CSV (physiological_cycles.csv). Header names vary slightly by
// export version, so we match on fragments and read the most recent complete row.
export function parseWhoopCsv(text: string): ImportResult {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/)
  if (lines.length < 2) return {}
  const header = splitCsv(lines[0]).map((h) => h.toLowerCase())
  // last non-empty row
  let row: string[] = []
  for (let i = lines.length - 1; i >= 1; i--) {
    const r = splitCsv(lines[i])
    if (r.some((c) => c.trim() !== '')) { row = r; break }
  }
  const val = (frag: string): number | undefined => {
    const i = header.findIndex((h) => h.includes(frag))
    if (i < 0) return undefined
    const n = parseFloat((row[i] || '').replace(',', '.'))
    return Number.isFinite(n) ? n : undefined
  }
  const out: ImportResult = { source: 'WHOOP' }
  out.recoveryPct = round(val('recovery score'))
  out.restingHr = round(val('resting heart rate'))
  out.hrvMs = round(val('heart rate variability'))
  out.strain = val('day strain') ?? val('strain')
  const asleepMin = val('asleep duration') ?? val('in bed duration')
  if (asleepMin) out.sleepH = +(asleepMin / 60).toFixed(1)
  return prune(out)
}

// Dispatch by file name / content sniffing.
export function parseHealthFile(name: string, text: string): ImportResult {
  const lower = name.toLowerCase()
  if (lower.endsWith('.xml') || text.includes('<HealthData')) return parseAppleHealth(text)
  if (lower.endsWith('.csv') || text.includes(',')) return parseWhoopCsv(text)
  return {}
}

function splitCsv(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (c === ',' && !q) { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

function round(n?: number) { return n == null ? undefined : Math.round(n) }
// Apple stores body-fat as a fraction (0.18); normalize to percent.
function pct(n?: number) { return n == null ? undefined : n <= 1 ? +(n * 100).toFixed(1) : +n.toFixed(1) }
function prune(o: ImportResult): ImportResult {
  const out = { ...o }
  ;(Object.keys(out) as (keyof ImportResult)[]).forEach((k) => {
    const v = out[k]
    if (v === undefined || (typeof v === 'number' && (!Number.isFinite(v) || v <= 0))) delete out[k]
  })
  return out
}
