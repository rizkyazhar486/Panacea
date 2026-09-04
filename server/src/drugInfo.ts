// Pencarian obat: mekanisme kerja, organ sasaran, efek samping — diambil dari
// openFDA (api.fda.gov), API publik gratis milik FDA AS, tanpa API key untuk
// volume rendah. Label obat yang diindeksnya adalah dokumen resmi pemerintah
// AS (Structured Product Labeling), bukan materi berhak cipta pihak ketiga.
// Ini murni retrieval — potongan ringkas dari label resminya — bukan saran
// dosis; lapisan AI di atasnya (lihat explainDrug di src/lib/ai.ts) yang
// merangkainya jadi bahasa awam dan WAJIB mengutip sumbernya.
const OPENFDA_BASE = 'https://api.fda.gov/drug/label.json'

export interface DrugLabelInfo {
  brandName: string
  genericName: string
  purpose: string
  mechanismOfAction: string
  adverseReactions: string
  warnings: string
}

function firstSentences(text: string | undefined, max = 3): string {
  if (!text) return ''
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.;])\s+/)
  return sentences.slice(0, max).join(' ').trim()
}

export async function lookupDrugLabel(name: string): Promise<DrugLabelInfo | null> {
  const q = encodeURIComponent(`openfda.brand_name:"${name}" openfda.generic_name:"${name}"`)
  const url = `${OPENFDA_BASE}?search=${q}&limit=1`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (res.status === 404) return null // openFDA returns 404 when nothing matches
  if (!res.ok) throw new Error(`openFDA lookup failed: ${res.status}`)
  const data = (await res.json()) as {
    results?: {
      openfda?: { brand_name?: string[]; generic_name?: string[] }
      purpose?: string[]
      mechanism_of_action?: string[]
      adverse_reactions?: string[]
      warnings?: string[]
      warnings_and_cautions?: string[]
    }[]
  }
  const r = data.results?.[0]
  if (!r) return null
  return {
    brandName: r.openfda?.brand_name?.[0] ?? name,
    genericName: r.openfda?.generic_name?.[0] ?? '',
    purpose: firstSentences(r.purpose?.[0], 2),
    mechanismOfAction: firstSentences(r.mechanism_of_action?.[0], 3),
    adverseReactions: firstSentences(r.adverse_reactions?.[0], 4),
    warnings: firstSentences(r.warnings?.[0] ?? r.warnings_and_cautions?.[0], 3),
  }
}
