// Pencarian label obat untuk Body Explorer / farmakologi.
//
// Modul ini TIDAK lagi membuat implementasi openFDA/RxNorm kedua. Semua
// network retrieval melewati adapter canonical:
//   openFDA -> server/src/openfda.ts
//   RxNorm  -> server/src/rxnorm.ts
// Dengan begitu sanitasi query, timeout, source identity, error semantics dan
// regression test hanya punya satu sumber kebenaran.
import { lookupDrug, type DrugInfo } from './openfda.js'
import { normalizeDrugName } from './rxnorm.js'

export interface DrugLabelInfo {
  brandName: string
  genericName: string
  purpose: string
  mechanismOfAction: string
  adverseReactions: string
  warnings: string
  /** Dosis & cara pakai, dikutip dari label. Kosong kalau labelnya tidak memuat. */
  dosage: string
  /** Untuk keadaan apa dan kapan dipakai, dikutip dari label. */
  indications: string
  /** Stable SPL set_id / openFDA record identity bila tersedia. */
  labelId?: string
  /** Exact openFDA source query untuk verifikasi provenance bila tersedia. */
  sourceUrl?: string
}

function firstSentences(text: string | undefined, max = 3): string {
  if (!text) return ''
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.;])\s+/)
  return sentences.slice(0, max).join(' ').trim()
}

function toDrugLabelInfo(drug: DrugInfo): DrugLabelInfo {
  return {
    brandName: drug.brand,
    genericName: drug.generic,
    purpose: firstSentences(drug.purpose, 2),
    mechanismOfAction: firstSentences(drug.mechanism, 3),
    adverseReactions: firstSentences(drug.adverse, 4),
    warnings: firstSentences(drug.warnings, 3),
    dosage: firstSentences(drug.dosage, 6),
    indications: firstSentences(drug.usage, 4),
    labelId: drug.labelId,
    sourceUrl: drug.sourceUrl,
  }
}

export async function lookupDrugLabel(name: string): Promise<DrugLabelInfo | null> {
  const direct = await lookupDrug(name)
  if (direct) return toDrugLabelInfo(direct)

  // openFDA belum menemukan label. RxNorm hanya dipakai untuk terminology
  // normalization; kegagalan normalization tidak boleh mengubah kegagalan
  // lookup menjadi error klinis palsu, jadi fallback ini boleh berakhir null.
  let normalized: string | null = null
  try {
    normalized = await normalizeDrugName(name)
  } catch {
    return null
  }

  const original = name.replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US')
  if (!normalized || normalized.toLocaleLowerCase('en-US') === original) return null

  const normalizedLabel = await lookupDrug(normalized)
  return normalizedLabel ? toDrugLabelInfo(normalizedLabel) : null
}
