// Drug information via openFDA — the free FDA drug-label API (no key; an
// optional OPENFDA_KEY only raises limits). Powers a "look up a medicine" /
// pill-info feature: what it's for, warnings, dosage, mechanism of action and
// adverse reactions, sourced from official structured product labels.

const BASE = 'https://api.fda.gov/drug/label.json'
const KEY = process.env.OPENFDA_KEY || ''
const TIMEOUT_MS = 8000
const MAX_QUERY_LENGTH = 160

export interface DrugInfo {
  brand: string
  generic: string
  purpose: string
  usage: string
  mechanism: string
  warnings: string
  dosage: string
  adverse: string
  manufacturer: string
  /** Stable source identity when openFDA supplies a SPL set_id or record id. */
  labelId?: string
  /** Exact openFDA source query for the SPL set_id; never contains an API key. */
  sourceUrl?: string
}

interface FdaResult {
  id?: string
  set_id?: string
  openfda?: { brand_name?: string[]; generic_name?: string[]; manufacturer_name?: string[] }
  purpose?: string[]
  indications_and_usage?: string[]
  mechanism_of_action?: string[]
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

function sourceUrlForSetId(setId: string | undefined): string | undefined {
  const clean = setId?.trim()
  if (!clean) return undefined
  const params = new URLSearchParams({ search: `set_id:"${clean}"`, limit: '1' })
  return `${BASE}?${params.toString()}`
}

async function fetchLabel(search: string): Promise<FdaResult | null> {
  const params = new URLSearchParams({ search, limit: '1' })
  if (KEY) params.set('api_key', KEY)
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`openfda_${res.status}`)
  const json = (await res.json()) as FdaResp
  return json.results?.[0] ?? null
}

export async function lookupDrug(name: string): Promise<DrugInfo | null> {
  const q = cleanQuery(name)
  if (!q) return null

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

  const setId = r.set_id?.trim() || undefined
  const recordId = r.id?.trim() || undefined

  return {
    brand: first(r.openfda?.brand_name) || q,
    generic: first(r.openfda?.generic_name),
    purpose: clip(first(r.purpose)),
    usage: clip(first(r.indications_and_usage)),
    mechanism: clip(first(r.mechanism_of_action)),
    warnings: clip(first(r.warnings)),
    dosage: clip(first(r.dosage_and_administration)),
    adverse: clip(first(r.adverse_reactions)),
    manufacturer: first(r.openfda?.manufacturer_name),
    labelId: setId || recordId,
    sourceUrl: sourceUrlForSetId(setId),
  }
}
