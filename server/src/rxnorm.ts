// Drug name normalization via RxNorm (NIH/NLM RxNav — free, no key). Used to
// surface related brand/generic equivalents and dose forms for a searched
// drug. NOTE: RxNav's separate drug-interaction API was retired by NLM in
// January 2024 (its DrugBank/ONCHigh data agreements ended) — this module
// intentionally does NOT attempt interaction checking, only name lookup.

const BASE = 'https://rxnav.nlm.nih.gov/REST'
const TIMEOUT_MS = 8000
const MAX_QUERY_LENGTH = 160

export interface RelatedDrug { name: string; tty: string }

interface RxcuiResp { idGroup?: { rxnormId?: string[] } }
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
  const rxcui = (rxcuiJson.idGroup?.rxnormId ?? []).find((id) => /^\d+$/.test(id))
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
