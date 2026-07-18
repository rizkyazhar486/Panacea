// Parse health-app export files into the fields our Health Profile uses.
// Supports Apple Health (export.xml), WHOOP (physiological_cycles.csv or a
// JSON export), and Garmin Connect (JSON export — "Export Your Data" from
// Garmin Connect, or any third-party Garmin JSON dump). Garmin and WHOOP
// don't offer a live auto-sync webhook the way Apple's Health Auto Export
// app does, so for those two the flow is: export from the app, upload the
// file here. Everything runs client-side — no file ever leaves the device
// during parsing.

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

// Generic JSON export parser — used for both WHOOP and Garmin Connect JSON
// exports, whose exact schema varies by app version / export tool. Rather
// than hard-coding one schema, we flatten the whole JSON tree and match keys
// by a flexible pattern per field, so most real-world exports fill in
// *something* even if the shape isn't exactly what we tested against. The UI
// always shows exactly which fields were found ("Review, then press Save"),
// so a partial or unusual match is never silently wrong.
// Keys are normalized by stripping separators (_ - space) so "resting_heart_rate",
// "restingHeartRate", and "resting-heart-rate" all become "restingheartrate" and
// match one pattern — separator style varies a lot between export tools.
function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[_\-\s]/g, '')
}
function flattenJson(v: unknown, out: Record<string, number> = {}): Record<string, number> {
  if (v == null) return out
  if (typeof v === 'number' && Number.isFinite(v)) return out // bare numbers have no key context
  if (Array.isArray(v)) { for (const item of v) flattenJson(item, out); return out }
  if (typeof v === 'object') {
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val)) {
        out[normalizeKey(k)] = val // last occurrence wins — exports are usually chronological
      } else {
        flattenJson(val, out)
      }
    }
  }
  return out
}
function findKey(flat: Record<string, number>, patterns: RegExp[]): number | undefined {
  for (const [k, v] of Object.entries(flat)) {
    if (patterns.some((p) => p.test(k))) return v
  }
  return undefined
}
export function parseWearableJson(text: string, sourceHint?: 'WHOOP' | 'Garmin'): ImportResult {
  let data: unknown
  try { data = JSON.parse(text) } catch { return {} }
  const flat = flattenJson(data)
  const source = sourceHint
    ?? (/whoop/i.test(text) ? 'WHOOP' : /garmin|connectiq|summaryid|bodybattery/i.test(text) ? 'Garmin' : 'Other')
  const out: ImportResult = { source }
  out.vo2max = findKey(flat, [/vo2max/])
  out.restingHr = round(findKey(flat, [/restingheartrate/, /restinghr/]))
  out.hrvMs = round(findKey(flat, [/hrvrmssd/, /heartratevariability/, /hrvms/, /^hrv$/]))
  out.recoveryPct = round(findKey(flat, [/recoveryscore/, /bodybattery/]))
  out.strain = findKey(flat, [/daystrain/, /^strain$/])
  // Sleep duration units vary a lot by export — check the most specific
  // (unambiguous unit) patterns first so e.g. seconds and minutes never mix up.
  const sleepSec = findKey(flat, [/sleepdurationinseconds/, /totalsleepseconds/, /sleeptimeseconds/])
  const sleepMilli = findKey(flat, [/sleepdurationinmilli/, /sleeptimemilli/, /totalsleepmilli/])
  const sleepMin = findKey(flat, [/asleepduration/, /inbedduration/, /sleepminutes/, /sleepdurationminutes/])
  const sleepHrs = findKey(flat, [/^sleephours?$/, /^sleeph$/])
  if (typeof sleepSec === 'number') out.sleepH = +(sleepSec / 3600).toFixed(1)
  else if (typeof sleepMilli === 'number') out.sleepH = +(sleepMilli / 3600000).toFixed(1)
  else if (typeof sleepMin === 'number') out.sleepH = +(sleepMin / 60).toFixed(1)
  else if (typeof sleepHrs === 'number') out.sleepH = sleepHrs
  out.weightKg = findKey(flat, [/weightkg/, /weightinkilograms/, /^weight$/])
  out.bodyFatPct = pct(findKey(flat, [/bodyfatpercentage/, /bodyfat/]))
  return prune(out)
}

// Dispatch by file name / content sniffing.
export function parseHealthFile(name: string, text: string): ImportResult {
  const lower = name.toLowerCase()
  if (lower.endsWith('.xml') || text.includes('<HealthData')) return parseAppleHealth(text)
  if (lower.endsWith('.json') || /^\s*[[{]/.test(text)) return parseWearableJson(text)
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
