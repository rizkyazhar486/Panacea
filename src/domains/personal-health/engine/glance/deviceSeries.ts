// Timestamped readings out of a device export, so a watch file becomes series over time instead of one latest number
// (src/lib/healthImport.ts keeps only the newest value per field). Pure: the text and the wearer's UTC offset are
// injected; no clock, locale, DOM or storage is read here.
//
// Fail closed: a reading with an unreadable time, a non-finite value, or a value outside the plausibility span is
// counted as rejected — never clamped, never guessed. The span says a value is a device error, not that it is
// unhealthy. A file with no readable reading is an error with a reason, not an empty success.

import type { DayValue } from './metricInsight.ts'

export type SeriesId = 'heartRate' | 'hrv' | 'spo2' | 'respRate' | 'steps' | 'activeKcal' | 'bodyTempC' | 'elevationM'

export interface SeriesSpec {
  label: string
  unit: string
  digits: number
  /** How readings fold into a day or an hour: counts add up, levels average. */
  aggregate: 'sum' | 'mean'
  plausible: { min: number; max: number }
}

export const SERIES: Readonly<Record<SeriesId, SeriesSpec>> = {
  heartRate: { label: 'Heart rate', unit: 'bpm', digits: 0, aggregate: 'mean', plausible: { min: 20, max: 250 } },
  hrv: { label: 'HRV', unit: 'ms', digits: 0, aggregate: 'mean', plausible: { min: 1, max: 400 } },
  spo2: { label: 'SpO₂', unit: '%', digits: 1, aggregate: 'mean', plausible: { min: 50, max: 100 } },
  respRate: { label: 'Breathing rate', unit: '/min', digits: 1, aggregate: 'mean', plausible: { min: 3, max: 80 } },
  steps: { label: 'Steps', unit: 'steps', digits: 0, aggregate: 'sum', plausible: { min: 0, max: 100_000 } },
  activeKcal: { label: 'Active energy', unit: 'kcal', digits: 0, aggregate: 'sum', plausible: { min: 0, max: 20_000 } },
  bodyTempC: { label: 'Body temperature', unit: '°C', digits: 1, aggregate: 'mean', plausible: { min: 30, max: 45 } },
  elevationM: { label: 'Elevation', unit: 'm', digits: 0, aggregate: 'mean', plausible: { min: -500, max: 9000 } },
}

export interface Reading {
  /** Epoch milliseconds (UTC). */
  t: number
  value: number
}

export type SeriesFormat = 'csv' | 'gpx' | 'apple-health' | 'json'

export type DeviceSeriesResult =
  | { ok: true; format: SeriesFormat; series: Partial<Record<SeriesId, Reading[]>>; accepted: number; rejected: number }
  | { ok: false; reason: string }

/** Larger text is refused rather than parsed slowly on a phone; a full Apple Health export should be zipped per type. */
export const MAX_TEXT_CHARS = 200_000_000
/** UTC offsets that exist on Earth (−12:00 … +14:00). */
export const OFFSET_MIN = -720
export const OFFSET_MAX = 840

const validOffset = (m: number) => Number.isInteger(m) && m >= OFFSET_MIN && m <= OFFSET_MAX

const ALIAS: ReadonlyArray<[SeriesId, RegExp]> = [
  ['spo2', /spo2|sp_o2|oxygen|o2.?sat|saturation/],
  ['hrv', /hrv|rmssd|sdnn/],
  ['heartRate', /^(hr|heart.?rate|bpm|pulse)/],
  ['respRate', /resp|breath/],
  ['steps', /step/],
  ['activeKcal', /kcal|calor|energy/],
  ['bodyTempC', /temp/],
  ['elevationM', /^(ele|elevation|altitude)/],
]
const seriesOfHeader = (h: string): SeriesId | null => ALIAS.find(([, re]) => re.test(h))?.[0] ?? null

const ZONED = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)(?::(\d\d)(?:\.\d+)?)?\s*(Z|[+-]\d\d:?\d\d)?$/

/**
 * A reading's instant. Epoch seconds or milliseconds, or an ISO-like date-time; one without a zone is wall-clock
 * time at `utcOffsetMin`. Null when the text is not one of those or names an impossible date.
 */
export function parseTimestamp(text: string, utcOffsetMin = 0): number | null {
  if (!validOffset(utcOffsetMin)) return null
  const s = String(text).trim()
  if (/^\d{9,13}$/.test(s)) {
    const n = Number(s)
    return n < 1e11 ? n * 1000 : n
  }
  const m = ZONED.exec(s)
  if (!m) return null
  const [, y, mo, d, h, mi, se = '0', zone] = m
  const local = Date.UTC(+y!, +mo! - 1, +d!, +h!, +mi!, +se)
  const back = new Date(local)
  if (back.getUTCMonth() !== +mo! - 1 || back.getUTCDate() !== +d! || +h! > 23 || +mi! > 59 || +se > 59) return null
  let offset = utcOffsetMin
  if (zone === 'Z') offset = 0
  else if (zone) {
    const z = zone.replace(':', '')
    offset = (z[0] === '-' ? -1 : 1) * (Number(z.slice(1, 3)) * 60 + Number(z.slice(3, 5)))
    if (!validOffset(offset)) return null
  }
  return local - offset * 60_000
}

class Collector {
  series: Partial<Record<SeriesId, Reading[]>> = {}
  accepted = 0
  rejected = 0
  add(id: SeriesId, t: number | null, value: number) {
    const { min, max } = SERIES[id].plausible
    if (t === null || !Number.isFinite(value) || value < min || value > max) { this.rejected++; return }
    ;(this.series[id] ??= []).push({ t, value })
    this.accepted++
  }
  finish(format: SeriesFormat, empty: string): DeviceSeriesResult {
    if (!this.accepted) return { ok: false, reason: this.rejected ? `No usable reading: all ${this.rejected} were unreadable or implausible.` : empty }
    for (const id of Object.keys(this.series) as SeriesId[]) {
      const sorted = this.series[id]!.sort((a, b) => a.t - b.t || a.value - b.value)
      // An identical repeat (same instant, same value) is one reading exported twice, not two readings.
      this.series[id] = sorted.filter((r, i) => !i || r.t !== sorted[i - 1]!.t || r.value !== sorted[i - 1]!.value)
    }
    return { ok: true, format, series: this.series, accepted: this.accepted, rejected: this.rejected }
  }
}

const num = (raw: unknown) => (typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw.trim().replace(',', '.')) : Number.NaN)

function fromRows(rows: ReadonlyArray<Record<string, unknown>>, offset: number, format: SeriesFormat): DeviceSeriesResult {
  const keys = rows.length ? Object.keys(rows[0]!) : []
  const timeKey = keys.find((k) => /time|date|stamp/i.test(k))
  if (!timeKey) return { ok: false, reason: 'No time column: a series needs a timestamp on every row.' }
  const columns = keys.filter((k) => k !== timeKey).map((k) => [k, seriesOfHeader(k.trim().toLowerCase())] as const).filter((c): c is readonly [string, SeriesId] => c[1] !== null)
  if (!columns.length) return { ok: false, reason: 'No column this reader knows (heart rate, HRV, SpO₂, breathing, steps, energy, temperature, elevation).' }
  const c = new Collector()
  for (const row of rows) {
    const t = parseTimestamp(String(row[timeKey] ?? ''), offset)
    for (const [key, id] of columns) {
      const raw = row[key]
      // An empty cell is no reading; a filled cell that is not a number is a rejected one.
      if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) continue
      c.add(id, t, num(raw))
    }
  }
  return c.finish(format, 'The file has rows but no filled value.')
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    // Quotes only guard separators inside a cell ("97,5"); an escaped quote ("") toggles twice and splits the same.
    if (ch === '"') quoted = !quoted
    else if (ch === sep && !quoted) { out.push(cur.trim()); cur = '' }
    else cur += ch
  }
  out.push(cur.trim())
  return out
}

function parseCsv(text: string, offset: number): DeviceSeriesResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { ok: false, reason: 'A series file needs a header row and at least one reading.' }
  const sep = [',', ';', '\t'].reduce((best, s) => (lines[0]!.split(s).length > lines[0]!.split(best).length ? s : best), ',')
  const header = splitLine(lines[0]!, sep)
  const rows = lines.slice(1).map((l) => { const cells = splitLine(l, sep); return Object.fromEntries(header.map((h, i) => [h, cells[i]])) })
  return fromRows(rows, offset, 'csv')
}

function parseJson(text: string, offset: number): DeviceSeriesResult {
  let data: unknown
  try { data = JSON.parse(text) } catch { return { ok: false, reason: 'The JSON could not be read.' } }
  const rows = Array.isArray(data) ? data : Array.isArray((data as { data?: unknown })?.data) ? (data as { data: unknown[] }).data : null
  if (!rows || !rows.length || rows.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) return { ok: false, reason: 'The JSON is not a list of timestamped rows.' }
  return fromRows(rows as Record<string, unknown>[], offset, 'json')
}

const tagText = (block: string, tag: string) => new RegExp(`<(?:\\w+:)?${tag}>\\s*([^<]*)<`, 'i').exec(block)?.[1] ?? null

function parseGpx(text: string, offset: number): DeviceSeriesResult {
  const c = new Collector()
  for (const m of text.matchAll(/<trkpt\b[\s\S]*?<\/trkpt>/g)) {
    const point = m[0]
    const time = tagText(point, 'time')
    const t = time === null ? null : parseTimestamp(time, offset)
    const ele = tagText(point, 'ele')
    const hr = tagText(point, 'hr')
    if (ele !== null) c.add('elevationM', t, num(ele))
    if (hr !== null) c.add('heartRate', t, num(hr))
  }
  return c.finish('gpx', 'The GPX has no track point with a value.')
}

const APPLE: Readonly<Record<string, SeriesId>> = {
  HeartRate: 'heartRate', RestingHeartRate: 'heartRate', HeartRateVariabilitySDNN: 'hrv', OxygenSaturation: 'spo2',
  RespiratoryRate: 'respRate', StepCount: 'steps', ActiveEnergyBurned: 'activeKcal', BodyTemperature: 'bodyTempC',
}

function parseAppleHealth(text: string, offset: number): DeviceSeriesResult {
  const c = new Collector()
  for (const m of text.matchAll(/<Record\b([^>]*?)\/?>/g)) {
    const attr = (k: string) => new RegExp(`\\b${k}="([^"]*)"`).exec(m[1]!)?.[1] ?? null
    const id = APPLE[(attr('type') ?? '').replace('HKQuantityTypeIdentifier', '')]
    if (!id) continue
    let value = num(attr('value'))
    const unit = attr('unit')
    // Apple stores saturation as a fraction and lets the user pick °F or kJ; the series is always %, °C, kcal.
    if (id === 'spo2' && unit === '%' && value <= 1) value *= 100
    if (unit === 'degF') value = ((value - 32) * 5) / 9
    if (unit === 'kJ') value /= 4.184
    const start = attr('startDate')
    c.add(id, start === null ? null : parseTimestamp(start, offset), value)
  }
  return c.finish('apple-health', 'The Health export has no record type this reader knows.')
}

/** Every reading a device export holds, by series. `utcOffsetMin` is the wearer's offset for times written without a zone. */
export function parseDeviceSeries(name: string, text: string, utcOffsetMin = 0): DeviceSeriesResult {
  if (typeof name !== 'string' || typeof text !== 'string') return { ok: false, reason: 'No file to read.' }
  if (!validOffset(utcOffsetMin)) return { ok: false, reason: 'The UTC offset must be a whole number of minutes between −12:00 and +14:00.' }
  if (!text.trim()) return { ok: false, reason: 'The file is empty.' }
  if (text.length > MAX_TEXT_CHARS) return { ok: false, reason: 'The file is too large to read here.' }
  const ext = name.toLowerCase().split('.').pop()
  if (ext === 'gpx' || /<gpx\b/i.test(text.slice(0, 2000))) return parseGpx(text, utcOffsetMin)
  if (ext === 'xml' || /<HealthData\b/.test(text.slice(0, 5000))) return /<Record\b/.test(text) ? parseAppleHealth(text, utcOffsetMin) : { ok: false, reason: 'The XML is neither a GPX track nor an Apple Health export.' }
  if (ext === 'json' || /^\s*[[{]/.test(text)) return parseJson(text, utcOffsetMin)
  return parseCsv(text, utcOffsetMin)
}

const pad = (n: number) => String(n).padStart(2, '0')
const wall = (t: number, offset: number) => new Date(t + offset * 60_000)
const dateKey = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`

/** One value per calendar day at the wearer's offset — the shape `metricInsight` reads. Oldest first. */
export function dailyValues(readings: readonly Reading[], aggregate: SeriesSpec['aggregate'], utcOffsetMin = 0): DayValue[] {
  if (!validOffset(utcOffsetMin)) return []
  const days = new Map<string, { sum: number; n: number }>()
  for (const { t, value } of readings) {
    if (!Number.isFinite(t) || !Number.isFinite(value)) continue
    const key = dateKey(wall(t, utcOffsetMin))
    const d = days.get(key) ?? { sum: 0, n: 0 }
    d.sum += value
    d.n++
    days.set(key, d)
  }
  return [...days].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, d]) => ({ date, value: aggregate === 'sum' ? d.sum : d.sum / d.n }))
}

/**
 * The typical day: 24 entries, hour 0 first, at the wearer's offset. A level averages every reading in that hour; a
 * count is the hour's total averaged over the days that have any reading. Null where the hour never had a reading —
 * an empty hour is unknown, not zero.
 */
export function hourProfile(readings: readonly Reading[], aggregate: SeriesSpec['aggregate'], utcOffsetMin = 0): (number | null)[] {
  if (!validOffset(utcOffsetMin)) return Array(24).fill(null)
  const hours = Array.from({ length: 24 }, () => ({ sum: 0, n: 0 }))
  const days = new Set<string>()
  for (const { t, value } of readings) {
    if (!Number.isFinite(t) || !Number.isFinite(value)) continue
    const d = wall(t, utcOffsetMin)
    days.add(dateKey(d))
    const h = hours[d.getUTCHours()]!
    h.sum += value
    h.n++
  }
  return hours.map((h) => (h.n ? (aggregate === 'sum' ? h.sum / days.size : h.sum / h.n) : null))
}
