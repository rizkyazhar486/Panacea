// Drug name normalization via RxNorm (NIH/NLM RxNav — free, no key). Used to
// surface related brand/generic equivalents and dose forms for a searched
// drug. NOTE: RxNav's separate drug-interaction API was retired by NLM in
// January 2024 (its DrugBank/ONCHigh data agreements ended) — this module
// intentionally does NOT attempt interaction checking, only name lookup.

const BASE = 'https://rxnav.nlm.nih.gov/REST'

export interface RelatedDrug { name: string; tty: string }

interface RxcuiResp { idGroup?: { rxnormId?: string[] } }
interface RelatedResp {
  relatedGroup?: {
    conceptGroup?: { tty?: string; conceptProperties?: { name: string; synonym?: string }[] }[]
  }
}

export async function findRelatedDrugs(name: string): Promise<RelatedDrug[]> {
  const q = name.trim()
  if (!q) return []

  // Step 1: resolve the drug name to an RxCUI (RxNorm's canonical concept ID).
  const rxcuiRes = await fetch(`${BASE}/rxcui.json?name=${encodeURIComponent(q)}&search=1`, { headers: { Accept: 'application/json' } })
  if (!rxcuiRes.ok) throw new Error(`rxnorm_rxcui_${rxcuiRes.status}`)
  const rxcuiJson = (await rxcuiRes.json()) as RxcuiResp
  const rxcui = rxcuiJson.idGroup?.rxnormId?.[0]
  if (!rxcui) return []

  // Step 2: fetch related concepts — SCD (clinical/generic drug) and SBD
  // (branded drug) term types, i.e. other formulations/brands of the same
  // active ingredient.
  const relRes = await fetch(`${BASE}/rxcui/${rxcui}/related.json?tty=SCD+SBD`, { headers: { Accept: 'application/json' } })
  if (!relRes.ok) throw new Error(`rxnorm_related_${relRes.status}`)
  const relJson = (await relRes.json()) as RelatedResp

  const out: RelatedDrug[] = []
  for (const group of relJson.relatedGroup?.conceptGroup ?? []) {
    for (const prop of group.conceptProperties ?? []) {
      out.push({ name: prop.name, tty: group.tty ?? '' })
    }
  }
  // De-dupe by name, cap the list to a sane size for display.
  const seen = new Set<string>()
  return out.filter((d) => (seen.has(d.name) ? false : (seen.add(d.name), true))).slice(0, 15)
}
