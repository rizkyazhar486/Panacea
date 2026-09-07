// Drug information via openFDA — the free FDA drug-label API (no key; an
// optional OPENFDA_KEY only raises limits). Powers a "look up a medicine" /
// pill-info feature: what it's for, warnings, and adverse reactions, sourced
// from official structured product labels.

const BASE = 'https://api.fda.gov/drug/label.json'
const KEY = process.env.OPENFDA_KEY || ''
const TIMEOUT_MS = 8000
const MAX_QUERY_LENGTH = 160

export interface DrugInfo {
  brand: string
  generic: string
  purpose: string
  usage: string
  warnings: string
  dosage: string
  adverse: string
  manufacturer: string
}

interface FdaResult {
  openfda?: { brand_name?: string[]; generic_name?: string[]; manufacturer_name?: string[] }
  purpose?: string[]
  indications_and_usage?: string[]
  warnings?: string[]
  dosage_and_administration?: string[]
  adverse_reactions?: string[]
}
interface FdaResp { results?: FdaResult[] }

const first = (a?: string[]) => (a && a.length ? a[0] : '')
const clip = (s: string, n = 1200) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s)

function cleanQuery(value: string): string {
  return value
    .replace(/[<>\\":]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
}

async function fetchLabel(search: string): Promise<FdaResult | null> {
  const params = new URLSearchParams({ search, limit: '1' })
  if (KEY) params.set('api_key', KEY)
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 404) return null // openFDA returns 404 when a search has no matches.
  if (!res.ok) throw new Error(`openfda_${res.status}`)
  const json = (await res.json()) as FdaResp
  return json.results?.[0] ?? null
}

export async function lookupDrug(name: string): Promise<DrugInfo | null> {
  const q = cleanQuery(name)
  if (!q) return null

  // Resolve brand first, then generic name. Keeping the queries separate is
  // deliberate: an implicit multi-field query can behave like an AND and miss
  // valid labels that carry only one of the two searchable fields.
  const searches = [
    `openfda.brand_name:"${q}"`,
    `openfda.generic_name:"${q}"`,
  ]

  let r: FdaResult | null = null
  for (const search of searches) {
    r = await fetchLabel(search)
    if (r) break
  }
  if (!r) return null

  return {
    brand: first(r.openfda?.brand_name) || q,
    generic: first(r.openfda?.generic_name),
    purpose: clip(first(r.purpose)),
    usage: clip(first(r.indications_and_usage)),
    warnings: clip(first(r.warnings)),
    dosage: clip(first(r.dosage_and_administration)),
    adverse: clip(first(r.adverse_reactions)),
    manufacturer: first(r.openfda?.manufacturer_name),
  }
}
