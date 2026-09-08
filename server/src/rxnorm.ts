// Drug name normalization via RxNorm (NIH/NLM RxNav — free, no key). Used to
// normalize a typed drug name and surface related brand/generic equivalents
// and dose forms. NOTE: RxNav's separate drug-interaction API was retired by
// NLM in January 2024; this module intentionally does NOT attempt interaction
// checking, only terminology/name lookup.

const BASE = 'https://rxnav.nlm.nih.gov/REST'
const TIMEOUT_MS = 8000
const MAX_QUERY_LENGTH = 160
const MAX_NORMALIZED_NAME_LENGTH = 240

export interface RelatedDrug { name: string; tty: string }

interface RxcuiResp { idGroup?: { rxnormId?: string[] } }
interface ApproximateResp {
  approximateGroup?: { candidate?: { rxcui?: string }[] }
}
interface PropertyResp {
  propConceptGroup?: { propConcept?: { propValue?: string }[] }
}
interface RelatedResp {
  relatedGroup?: {
    conceptGroup?: { tty?: string; conceptProperties?: { name: string; synonym?: string }[] }[]
  }
}

function cleanQuery(value: string): string {
  return value
    .replace(/[<>\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
}

function upstreamInit(): RequestInit {
  return {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }
}

function firstNumericRxcui(ids: Array<string | undefined>): string | undefined {
  return ids.find((id): id is string => typeof id === 'string' && /^\d+$/.test(id))
}

/** Resolve misspellings/local brand-like terms to the canonical RxNorm name.
 * This is terminology normalization only; it is not a drug-interaction or
 * therapeutic-equivalence decision. */
export async function normalizeDrugName(name: string): Promise<string | null> {
  const q = cleanQuery(name)
  if (!q) return null

  const approximateUrl = new URL(`${BASE}/approximateTerm.json`)
  approximateUrl.searchParams.set('term', q)
  approximateUrl.searchParams.set('maxEntries', '5')
  const approximateRes = await fetch(approximateUrl, upstreamInit())
  if (!approximateRes.ok) throw new Error(`rxnorm_approximate_${approximateRes.status}`)
  const approximateJson = (await approximateRes.json()) as ApproximateResp
  const rxcui = firstNumericRxcui((approximateJson.approximateGroup?.candidate ?? []).map((candidate) => candidate.rxcui))
  if (!rxcui) return null

  const propertyUrl = new URL(`${BASE}/rxcui/${rxcui}/property.json`)
  propertyUrl.searchParams.set('propName', 'RxNorm Name')
  const propertyRes = await fetch(propertyUrl, upstreamInit())
  if (!propertyRes.ok) throw new Error(`rxnorm_property_${propertyRes.status}`)
  const propertyJson = (await propertyRes.json()) as PropertyResp
  const rawName = propertyJson.propConceptGroup?.propConcept?.find((prop) => typeof prop.propValue === 'string' && prop.propValue.trim())?.propValue
  if (!rawName) return null
  return rawName.replace(/\s+/g, ' ').trim().slice(0, MAX_NORMALIZED_NAME_LENGTH)
}

export async function findRelatedDrugs(name: string): Promise<RelatedDrug[]> {
  const q = cleanQuery(name)
  if (!q) return []

  // Step 1: resolve the drug name to an RxCUI (RxNorm's canonical concept ID).
  const rxcuiUrl = new URL(`${BASE}/rxcui.json`)
  rxcuiUrl.searchParams.set('name', q)
  rxcuiUrl.searchParams.set('search', '1')
  const rxcuiRes = await fetch(rxcuiUrl, upstreamInit())
  if (!rxcuiRes.ok) throw new Error(`rxnorm_rxcui_${rxcuiRes.status}`)
  const rxcuiJson = (await rxcuiRes.json()) as RxcuiResp

  // RxCUI is numeric. Reject malformed upstream identifiers rather than
  // interpolating arbitrary text into the second request path.
  const rxcui = firstNumericRxcui(rxcuiJson.idGroup?.rxnormId ?? [])
  if (!rxcui) return []

  // Step 2: fetch related concepts — SCD (clinical/generic drug) and SBD
  // (branded drug) term types, i.e. other formulations/brands of the same
  // active ingredient.
  const relatedUrl = new URL(`${BASE}/rxcui/${rxcui}/related.json`)
  relatedUrl.searchParams.set('tty', 'SCD SBD')
  const relRes = await fetch(relatedUrl, upstreamInit())
  if (!relRes.ok) throw new Error(`rxnorm_related_${relRes.status}`)
  const relJson = (await relRes.json()) as RelatedResp

  const out: RelatedDrug[] = []
  for (const group of relJson.relatedGroup?.conceptGroup ?? []) {
    for (const prop of group.conceptProperties ?? []) {
      const normalizedName = prop.name?.replace(/\s+/g, ' ').trim()
      if (normalizedName) out.push({ name: normalizedName, tty: group.tty ?? '' })
    }
  }

  // De-dupe case-insensitively and cap the list to a sane size for display.
  const seen = new Set<string>()
  return out.filter((drug) => {
    const key = drug.name.toLocaleLowerCase('en-US')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 15)
}
