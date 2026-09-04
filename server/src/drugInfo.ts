// Pencarian obat: mekanisme kerja, organ sasaran, efek samping — diambil dari
// openFDA (api.fda.gov), API publik gratis milik FDA AS, tanpa API key untuk
// volume rendah. Label obat yang diindeksnya adalah dokumen resmi pemerintah
// AS (Structured Product Labeling), bukan materi berhak cipta pihak ketiga.
// Ini murni retrieval — potongan ringkas dari label resminya — bukan saran
// dosis; lapisan AI di atasnya (lihat explainDrug di src/lib/ai.ts) yang
// merangkainya jadi bahasa awam dan WAJIB mengutip sumbernya.
//
// DUA API, bukan satu: pencarian openFDA cocok persis (exact match) pada
// brand_name/generic_name, jadi nama dagang lokal, singkatan, atau salah
// eja sedikit saja membuatnya kosong. RxNorm (juga NLM, gratis, tanpa API
// key) dipakai untuk menormalkan nama yang diketik ke nama generik baku
// SEBELUM mencoba lagi ke openFDA kalau percobaan pertama kosong — bukan
// menggantikan openFDA, hanya membuat pencariannya lebih toleran.
const OPENFDA_BASE = 'https://api.fda.gov/drug/label.json'
const RXNAV_BASE = 'https://rxnav.nlm.nih.gov/REST'

async function normalizeToGenericName(name: string): Promise<string | null> {
  try {
    const res = await fetch(`${RXNAV_BASE}/approximateTerm.json?term=${encodeURIComponent(name)}&maxEntries=1`, {
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { approximateGroup?: { candidate?: { rxcui?: string }[] } }
    const rxcui = data.approximateGroup?.candidate?.[0]?.rxcui
    if (!rxcui) return null
    const propRes = await fetch(`${RXNAV_BASE}/rxcui/${rxcui}/property.json?propName=RxNorm%20Name`, {
      signal: AbortSignal.timeout(6000),
    })
    if (!propRes.ok) return null
    const propData = (await propRes.json()) as { propConceptGroup?: { propConcept?: { propValue?: string }[] } }
    return propData.propConceptGroup?.propConcept?.[0]?.propValue ?? null
  } catch {
    return null
  }
}

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

async function queryOpenFda(name: string): Promise<DrugLabelInfo | null> {
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

export async function lookupDrugLabel(name: string): Promise<DrugLabelInfo | null> {
  const direct = await queryOpenFda(name)
  if (direct) return direct
  // Percobaan pertama kosong — coba lagi dengan nama generik baku dari
  // RxNorm (API kedua), bukan menyerah pada percobaan pertama. Menangkap
  // nama dagang lokal/salah eja yang tidak persis cocok dengan openFDA.
  const normalized = await normalizeToGenericName(name)
  if (!normalized || normalized.toLowerCase() === name.toLowerCase()) return null
  return queryOpenFda(normalized)
}
