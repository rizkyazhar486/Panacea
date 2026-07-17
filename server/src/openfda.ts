// Drug information via openFDA — the free FDA drug-label API (no key; an
// optional OPENFDA_KEY only raises limits). Powers a "look up a medicine" /
// pill-info feature: what it's for, warnings, and adverse reactions, sourced
// from official structured product labels. Not testable from the sandbox
// (outbound blocked) — verify the JSON shape on first deploy.

const BASE = 'https://api.fda.gov/drug/label.json'
const KEY = process.env.OPENFDA_KEY || ''

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

export async function lookupDrug(name: string): Promise<DrugInfo | null> {
  const q = name.trim()
  if (!q) return null
  // Search brand OR generic name; fall back gracefully.
  const term = encodeURIComponent(`openfda.brand_name:"${q}" openfda.generic_name:"${q}"`)
  const url = `${BASE}?search=${term}&limit=1${KEY ? `&api_key=${KEY}` : ''}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (res.status === 404) return null // openFDA returns 404 for no matches
  if (!res.ok) throw new Error(`openfda_${res.status}`)
  const json = (await res.json()) as FdaResp
  const r = json.results?.[0]
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
