// Biometri janin terhadap acuan terbit (WHO Fetal Growth Charts 2017; INTERGROWTH-21st 2014). Murni & deterministik; tabel disuntikkan dan divalidasi.
// Fail closed: usia kehamilan di luar 14+0 sampai 40+0 minggu, ukuran yang tidak diterbitkan oleh acuan itu (mis. EFW pada INTERGROWTH-21st), nilai tidak sah, atau tabel rusak
// menghasilkan keadaan "tidak tersedia" dengan alasan; tidak ada nilai yang diekstrapolasi atau ditebak. Keluaran adalah posisi terhadap acuan, BUKAN interpretasi klinis.

export type ReferenceId = 'who_2017' | 'intergrowth_2014'
export type MeasureId = 'bpd' | 'hc' | 'ac' | 'fl' | 'efw' | 'efw_female' | 'efw_male'
export const GA_MIN_WEEKS = 14
export const GA_MAX_WEEKS = 40

interface WhoMeasure { label: string; unit: string; percentiles: number[]; table: Record<string, number[]> }
interface IgMeasure { label: string; unit: string; centile_table: Record<string, number[]>; z_table: Record<string, number[]> }
export interface FetalTables {
  schema: 1; kind: 'fetal_reference_tables'; retrieved: string
  references: {
    who_2017: { name: string; citation: string; licence: string; population: string; method: string; efw_note: string; measures: Record<string, WhoMeasure> }
    intergrowth_2014: { name: string; citation: string; licence: string; population: string; method: string; measurement_note: string; centiles: number[]; z_values: number[]; measures: Record<string, IgMeasure> }
  }
}
export type ParseTables = { ok: true; tables: FetalTables } | { ok: false; error: string }

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const sortedRow = (r: unknown, n: number): r is number[] => Array.isArray(r) && r.length === n && r.every(isNum) && r.every((x, i) => i === 0 || x >= r[i - 1])

export function parseFetalTables(raw: unknown): ParseTables {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'tables must be an object' }
  const t = raw as FetalTables
  if (t.schema !== 1 || t.kind !== 'fetal_reference_tables') return { ok: false, error: 'unsupported schema or kind' }
  const refs = t.references
  if (!refs?.who_2017 || !refs?.intergrowth_2014) return { ok: false, error: 'both references are required' }
  for (const id of ['who_2017', 'intergrowth_2014'] as const) for (const k of ['citation', 'licence', 'population', 'method'] as const) if (typeof refs[id][k] !== 'string' || !refs[id][k].trim()) return { ok: false, error: `${id}: ${k} missing` }
  const weeks = Array.from({ length: GA_MAX_WEEKS - GA_MIN_WEEKS + 1 }, (_, i) => String(GA_MIN_WEEKS + i))
  for (const [k, m] of Object.entries(refs.who_2017.measures)) {
    if (!Array.isArray(m.percentiles) || !m.percentiles.includes(50)) return { ok: false, error: `who ${k}: percentiles must include the 50th` }
    for (const w of weeks) if (!sortedRow(m.table[w], m.percentiles.length)) return { ok: false, error: `who ${k}: week ${w} missing, not numeric or not increasing` }
  }
  for (const [k, m] of Object.entries(refs.intergrowth_2014.measures)) for (const w of weeks) {
    if (!sortedRow(m.centile_table[w], refs.intergrowth_2014.centiles.length) || !sortedRow(m.z_table[w], refs.intergrowth_2014.z_values.length)) return { ok: false, error: `intergrowth ${k}: week ${w} missing, not numeric or not increasing` }
  }
  return { ok: true, tables: t }
}

export type UnavailableReason = 'ga_invalid' | 'ga_out_of_range' | 'measure_not_in_reference' | 'value_invalid'
export interface AssessInput { reference: ReferenceId; measure: MeasureId; weeks: number; days: number; value: number }
export interface Assessment {
  status: 'ok'
  reference: ReferenceId; measure: MeasureId; unit: string; label: string
  gestationalAgeWeeks: number
  /** true bila usia bukan minggu penuh: baris tabel diinterpolasi linear antar minggu terbit */
  gaInterpolated: boolean
  value: number
  referenceMedian: number
  /** persentil jika berada di dalam rentang terbit; null bila di luar */
  percentile: number | null
  band: 'within' | 'below_lowest' | 'above_highest'
  lowestPercentile: number; highestPercentile: number
  zScore: number | null
  source: { name: string; citation: string; licence: string; population: string; method: string }
  caveat: string
}
export type AssessResult = Assessment | { status: 'unavailable'; reason: UnavailableReason; message: string }
const CAVEAT = 'Position against a published reference only. Interpretation needs a qualified clinician; this is not a diagnosis.'

/** Fungsi sebaran normal baku (Abramowitz-Stegun 7.1.26, galat < 1,5e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x)
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y)
}

function rowAt(table: Record<string, number[]>, weeks: number): { row: number[]; interpolated: boolean } {
  const w0 = Math.floor(weeks), f = weeks - w0
  const a = table[String(w0)]
  if (f === 0 || w0 >= GA_MAX_WEEKS) return { row: a, interpolated: false }
  const b = table[String(w0 + 1)]
  return { row: a.map((v, i) => v + (b[i] - v) * f), interpolated: true }
}
/** Interpolasi linear nilai → posisi pada deret (x naik); null bila di luar. */
function locate(row: number[], pos: number[], v: number): { p: number | null; band: Assessment['band'] } {
  if (v < row[0]) return { p: null, band: 'below_lowest' }
  if (v > row[row.length - 1]) return { p: null, band: 'above_highest' }
  for (let i = 0; i < row.length - 1; i++) if (v >= row[i] && v <= row[i + 1]) return { p: row[i + 1] === row[i] ? pos[i] : pos[i] + ((v - row[i]) / (row[i + 1] - row[i])) * (pos[i + 1] - pos[i]), band: 'within' }
  return { p: pos[pos.length - 1], band: 'within' }
}

export function assessMeasurement(tables: FetalTables, input: AssessInput): AssessResult {
  const un = (reason: UnavailableReason, message: string): AssessResult => ({ status: 'unavailable', reason, message })
  const { reference, measure, weeks, days, value } = input
  if (!Number.isInteger(weeks) || !Number.isInteger(days) || days < 0 || days > 6) return un('ga_invalid', 'Gestational age must be whole weeks plus 0 to 6 days.')
  const ga = weeks + days / 7
  if (ga < GA_MIN_WEEKS || ga > GA_MAX_WEEKS) return un('ga_out_of_range', `Both references cover ${GA_MIN_WEEKS}+0 to ${GA_MAX_WEEKS}+0 weeks; ${weeks}+${days} weeks is outside that range and no value is extrapolated.`)
  if (!isNum(value) || value <= 0) return un('value_invalid', 'The measurement must be a positive number.')
  if (reference === 'who_2017') {
    const m = tables.references.who_2017.measures[measure]
    if (!m) return un('measure_not_in_reference', 'This measurement is not in the WHO charts used here.')
    const { row, interpolated } = rowAt(m.table, ga)
    const loc = locate(row, m.percentiles, value)
    const r = tables.references.who_2017
    return { status: 'ok', reference, measure, unit: m.unit, label: m.label, gestationalAgeWeeks: ga, gaInterpolated: interpolated, value, referenceMedian: row[m.percentiles.indexOf(50)], percentile: loc.p, band: loc.band,
      lowestPercentile: m.percentiles[0], highestPercentile: m.percentiles[m.percentiles.length - 1], zScore: null, source: { name: r.name, citation: r.citation, licence: r.licence, population: r.population, method: r.method }, caveat: CAVEAT }
  }
  const m = tables.references.intergrowth_2014.measures[measure]
  if (!m) return un('measure_not_in_reference', measure.startsWith('efw') ? 'INTERGROWTH-21st publishes no estimated fetal weight standard in the tables used here; choose the WHO charts for EFW.' : 'This measurement is not in the INTERGROWTH-21st tables used here.')
  const r = tables.references.intergrowth_2014
  const { row: zrow, interpolated } = rowAt(m.z_table, ga)
  const loc = locate(zrow, r.z_values, value)
  const med = zrow[r.z_values.indexOf(0)]
  return { status: 'ok', reference, measure, unit: m.unit, label: m.label, gestationalAgeWeeks: ga, gaInterpolated: interpolated, value, referenceMedian: med,
    percentile: loc.p === null ? null : normalCdf(loc.p) * 100, band: loc.band, lowestPercentile: normalCdf(r.z_values[0]) * 100, highestPercentile: normalCdf(r.z_values[r.z_values.length - 1]) * 100,
    zScore: loc.p, source: { name: r.name, citation: r.citation, licence: r.licence, population: r.population, method: r.method }, caveat: CAVEAT }
}
