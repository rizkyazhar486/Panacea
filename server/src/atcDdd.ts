// WHO ATC/DDD boundary for Body Exposure pharmacology.
//
// IMPORTANT DATA-MODEL RULES:
// - ATC/DDD classifies medicinal substances and therapeutic/pharmacological groups.
// - It is NOT a trademark/product catalogue.
// - DDD is a drug-utilisation technical unit, not an individual prescribing dose.
// - Panacea therefore keeps ATC/DDD separate from product/brand labels (openFDA/RxNorm
//   and future national product registries) and joins them only through explicit,
//   source-preserving crosswalks.
//
// The complete 2026 ATC index with DDDs is available electronically from the WHO
// Collaborating Centre for Drug Statistics Methodology. Bulk Excel/XML access is
// obtained through its registered ordering portal. This module does not scrape the
// public HTML search page and does not redistribute the bulk catalogue.

export const ATC_DDD_VERSION = '2026'
export const ATC_DDD_SOURCE = {
  id: 'who-atc-ddd',
  custodian: 'WHO Collaborating Centre for Drug Statistics Methodology',
  version: ATC_DDD_VERSION,
  citation: 'WHO Collaborating Centre for Drug Statistics Methodology, ATC classification index with DDDs, 2026. Oslo, Norway 2026.',
  searchableIndex: 'https://atcddd.fhi.no/atc_ddd_index/',
} as const

export type AtcDddRoute = 'Implant' | 'Inhal' | 'Instill' | 'N' | 'O' | 'P' | 'R' | 'SL' | 'TD' | 'V' | string

export interface AtcDddEntry {
  atcCode: string
  name: string
  level: 1 | 2 | 3 | 4 | 5
  ddd?: {
    value: number
    unit: string
    route: AtcDddRoute
  }
  source: typeof ATC_DDD_SOURCE
}

export interface AtcProductCrosswalk {
  /** Product/ingredient identity from a separate registry, e.g. RxCUI or SPL set_id. */
  productSource: string
  productId: string
  ingredientName: string
  /** Official ATC code only when independently sourced/verified. */
  atcCode?: string
  status: 'verified' | 'unmapped'
  provenance?: string
}

// Official ATC hierarchy: 14 first-level groups, then 2 digits, 1 letter,
// 1 letter, and finally 2 digits for the chemical-substance level.
const ATC_MAIN_GROUP = '[ABCDGHJLMNPRSV]'
const ATC_CODE = new RegExp(`^(?:${ATC_MAIN_GROUP}|${ATC_MAIN_GROUP}\\d{2}|${ATC_MAIN_GROUP}\\d{2}[A-Z]|${ATC_MAIN_GROUP}\\d{2}[A-Z]{2}|${ATC_MAIN_GROUP}\\d{2}[A-Z]{2}\\d{2})$`)

export function isPlausibleAtcCode(value: string): boolean {
  return ATC_CODE.test(value.trim().toUpperCase())
}

export function normalizeAtcQuery(value: string): string {
  return value
    .replace(/[<>\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}

/**
 * Fail-closed crosswalk constructor. The caller must supply an ATC code from an
 * authoritative ATC dataset or a documented registry crosswalk. Free-text drug
 * names must never be converted to ATC codes heuristically.
 */
export function verifiedAtcProductCrosswalk(input: {
  productSource: string
  productId: string
  ingredientName: string
  atcCode: string
  provenance: string
}): AtcProductCrosswalk {
  const productSource = input.productSource.trim()
  const productId = input.productId.trim()
  const ingredientName = input.ingredientName.trim()
  const atcCode = input.atcCode.trim().toUpperCase()
  const provenance = input.provenance.trim()
  if (!productSource || !productId || !ingredientName || !isPlausibleAtcCode(atcCode) || !provenance) {
    return {
      productSource,
      productId,
      ingredientName,
      status: 'unmapped',
    }
  }
  return {
    productSource,
    productId,
    ingredientName,
    atcCode,
    status: 'verified',
    provenance,
  }
}

export function unmappedAtcProductCrosswalk(input: {
  productSource: string
  productId: string
  ingredientName: string
}): AtcProductCrosswalk {
  return {
    productSource: input.productSource.trim(),
    productId: input.productId.trim(),
    ingredientName: input.ingredientName.trim(),
    status: 'unmapped',
  }
}
