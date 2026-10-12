// Owner Analytics: entrada de texto → números validados. Tudo puro e determinístico.
// Faixas = sanidade da entrada (não limiares de negócio nem clínicos). Campo vazio,
// NaN, Infinity ou fora da faixa é recusado com motivo — nunca vira 0 em silêncio.

export type Parsed = { ok: true; value: number } | { ok: false; problem: string }

interface Bounds { min: number; max: number; integer?: boolean }

function parse(text: unknown, label: string, b: Bounds): Parsed {
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, problem: `${label}: enter a number` }
  const v = Number(text)
  if (!Number.isFinite(v)) return { ok: false, problem: `${label}: not a number` }
  if (b.integer && !Number.isInteger(v)) return { ok: false, problem: `${label}: whole numbers only` }
  if (v < b.min || v > b.max) return { ok: false, problem: `${label}: must be ${b.min}–${b.max}` }
  return { ok: true, value: v }
}

export type Result<T> = { ok: true; value: T } | { ok: false; problems: string[] }

// Resolve vários campos de uma vez para mostrar todos os problemas juntos, sem `value` parcial.
function collect<T extends object>(fields: { [K in keyof T]: Parsed }): Result<T> {
  const problems: string[] = []
  const value = {} as T
  for (const k of Object.keys(fields) as (keyof T)[]) {
    const f = fields[k]
    if (f.ok) value[k] = f.value as T[keyof T]
    else problems.push(f.problem)
  }
  return problems.length ? { ok: false, problems } : { ok: true, value }
}

export interface AbText { controlVisitors: string; controlConversions: string; variantVisitors: string; variantConversions: string; plannedPerArm: string }
export interface AbNumbers { controlVisitors: number; controlConversions: number; variantVisitors: number; variantConversions: number; plannedPerArm: number }

export function validateAbInput(t: AbText): Result<AbNumbers> {
  const n = (s: string, label: string, min = 0) => parse(s, label, { min, max: 1_000_000_000, integer: true })
  const r = collect<AbNumbers>({
    controlVisitors: n(t?.controlVisitors, 'Control visitors', 1),
    controlConversions: n(t?.controlConversions, 'Control conversions'),
    variantVisitors: n(t?.variantVisitors, 'Variant visitors', 1),
    variantConversions: n(t?.variantConversions, 'Variant conversions'),
    plannedPerArm: n(t?.plannedPerArm, 'Planned sample per group', 1),
  })
  if (!r.ok) return r
  const problems: string[] = []
  if (r.value.controlConversions > r.value.controlVisitors) problems.push('Control conversions: cannot exceed control visitors')
  if (r.value.variantConversions > r.value.variantVisitors) problems.push('Variant conversions: cannot exceed variant visitors')
  return problems.length ? { ok: false, problems } : r
}

export interface SampleSizeNumbers { baselinePct: number; mdePp: number }

export function validateSampleSizeInput(baseline: string, mde: string): Result<SampleSizeNumbers> {
  const r = collect<SampleSizeNumbers>({
    baselinePct: parse(baseline, 'Current conversion (%)', { min: 0.01, max: 99.99 }),
    mdePp: parse(mde, 'Smallest meaningful difference (pp)', { min: 0.01, max: 99.99 }),
  })
  if (!r.ok) return r
  // requiredSampleSize devolve 0 quando p+d ≥ 1; 0 não é um tamanho de amostra, então recusamos.
  if (r.value.baselinePct + r.value.mdePp >= 100) return { ok: false, problems: ['Current conversion plus difference must stay below 100%'] }
  return r
}

export interface SeoText { h1Count: string; wordCount: string; imagesTotal: string; imagesWithAlt: string; loadSeconds: string; internalLinks: string }
export interface SeoNumbers { h1Count: number; wordCount: number; imagesTotal: number; imagesWithAlt: number; loadSeconds: number; internalLinks: number }

export function validateSeoNumbers(t: SeoText): Result<SeoNumbers> {
  const c = (s: string, label: string, max: number) => parse(s, label, { min: 0, max, integer: true })
  const r = collect<SeoNumbers>({
    h1Count: c(t?.h1Count, 'H1 count', 1000),
    wordCount: c(t?.wordCount, 'Word count', 10_000_000),
    imagesTotal: c(t?.imagesTotal, 'Total images', 100_000),
    imagesWithAlt: c(t?.imagesWithAlt, 'Images with alt', 100_000),
    loadSeconds: parse(t?.loadSeconds, 'Load time (seconds)', { min: 0, max: 600 }),
    internalLinks: c(t?.internalLinks, 'Internal links', 100_000),
  })
  if (!r.ok) return r
  if (r.value.imagesWithAlt > r.value.imagesTotal) return { ok: false, problems: ['Images with alt: cannot exceed total images'] }
  return r
}

export interface CustomerText { name: string; daysSinceLastUse: string; usesLast90Days: string; totalSpend: string }
export interface CustomerEntry { name: string; daysSinceLastUse: number; usesLast90Days: number; totalSpend: number }

export function validateCustomerEntry(t: CustomerText): Result<CustomerEntry> {
  const name = typeof t?.name === 'string' ? t.name.trim() : ''
  const r = collect<{ daysSinceLastUse: number; usesLast90Days: number; totalSpend: number }>({
    daysSinceLastUse: parse(t?.daysSinceLastUse, 'Days since last use', { min: 0, max: 36_500, integer: true }),
    usesLast90Days: parse(t?.usesLast90Days, 'Uses in 90 days', { min: 0, max: 100_000, integer: true }),
    totalSpend: parse(t?.totalSpend, 'Total spend', { min: 0, max: 1e12 }),
  })
  const problems = r.ok ? [] : [...r.problems]
  if (name === '') problems.unshift('User name: required')
  if (name.length > 80) problems.unshift('User name: at most 80 characters')
  return problems.length || !r.ok ? { ok: false, problems } : { ok: true, value: { name, ...r.value } }
}
