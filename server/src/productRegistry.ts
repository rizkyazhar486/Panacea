import { lookupDrugLabel, type DrugLabelInfo } from './drugInfo.js'
import { findRelatedDrugs, normalizeDrugName, type RelatedDrug } from './rxnorm.js'

/**
 * Product-registry federation boundary for Body Exposure.
 *
 * This layer normalizes a user-entered medicinal product name against RxNorm,
 * surfaces bounded SCD/SBD related products, and attaches the canonical
 * Structured Product Label when openFDA can resolve one. It deliberately does
 * not treat a brand name as an ATC concept and does not infer an ATC code from
 * free text. ATC linkage remains a separate provenance-gated crosswalk.
 */

export interface ProductRegistrySource {
  id: 'rxnorm' | 'openfda-spl'
  label: string
}

export interface ProductRegistryRecord {
  query: string
  normalizedName: string | null
  relatedProducts: RelatedDrug[]
  label: DrugLabelInfo | null
  sources: ProductRegistrySource[]
  atcStatus: 'unmapped'
  atcCode: null
}

const MAX_RELATED_PRODUCTS = 15
const MAX_QUERY_LENGTH = 160

export function cleanProductQuery(value: string): string {
  return value
    .replace(/[<>\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
}

export async function resolveProductRegistry(rawQuery: string): Promise<ProductRegistryRecord> {
  const query = cleanProductQuery(rawQuery)
  if (!query) {
    return {
      query: '',
      normalizedName: null,
      relatedProducts: [],
      label: null,
      sources: [],
      atcStatus: 'unmapped',
      atcCode: null,
    }
  }

  let normalizedName: string | null = null
  let relatedProducts: RelatedDrug[] = []

  try {
    normalizedName = await normalizeDrugName(query)
  } catch {
    normalizedName = null
  }

  try {
    relatedProducts = (await findRelatedDrugs(normalizedName ?? query)).slice(0, MAX_RELATED_PRODUCTS)
  } catch {
    relatedProducts = []
  }

  let label: DrugLabelInfo | null = null
  try {
    label = await lookupDrugLabel(normalizedName ?? query)
  } catch {
    label = null
  }

  const sources: ProductRegistrySource[] = [{ id: 'rxnorm', label: 'NLM RxNorm terminology' }]
  if (label) sources.push({ id: 'openfda-spl', label: 'openFDA Structured Product Label' })

  return {
    query,
    normalizedName,
    relatedProducts,
    label,
    sources,
    atcStatus: 'unmapped',
    atcCode: null,
  }
}
