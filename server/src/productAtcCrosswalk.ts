import { verifiedAtcProductCrosswalk, unmappedAtcProductCrosswalk, type AtcProductCrosswalk } from './atcDdd.js'
import type { ProductRegistryRecord } from './productRegistry.js'

export interface ProductAtcEvidence {
  productSource: string
  /** openFDA SPL set_id for openfda-spl, or numeric RxCUI for rxnorm. */
  productId: string
  ingredientName: string
  atcCode: string
  provenance: string
}

function norm(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('en-US')
}

/**
 * Join a resolved product-registry record to an externally verified ATC mapping.
 * No ATC inference is performed from brands, RxNorm names, SPL free text, or AI output.
 *
 * Identity matching is source-specific and fail-closed:
 * - openfda-spl evidence must match the SPL set_id retained by the label adapter;
 * - rxnorm evidence must match the canonical numeric RxCUI retained by RxNorm.
 * A normalized drug name alone is never sufficient to verify an ATC mapping.
 */
export function joinProductToVerifiedAtc(
  product: ProductRegistryRecord,
  evidence: ProductAtcEvidence | null | undefined,
): AtcProductCrosswalk {
  const ingredientName = (product.normalizedName ?? product.label?.genericName ?? product.query).trim()
  const hasSplIdentity = Boolean(product.label?.labelId?.trim())
  const productSource = hasSplIdentity ? 'openfda-spl' : 'rxnorm'
  const productId = hasSplIdentity
    ? product.label?.labelId?.trim() ?? ''
    : product.normalizedRxcui?.trim() ?? ''

  const unmapped = () => unmappedAtcProductCrosswalk({ productSource, productId, ingredientName })

  // Verified evidence must be anchored to a retained source identifier. If
  // normalization/label lookup did not yield one, do not fall back to matching
  // only on the ingredient name.
  if (!productId) return unmapped()
  if (!evidence) return unmapped()

  const sourceMatches = norm(evidence.productSource) === norm(productSource)
  const idMatches = norm(evidence.productId) === norm(productId)
  const ingredientMatches = norm(evidence.ingredientName) === norm(ingredientName)

  if (!sourceMatches || !idMatches || !ingredientMatches) return unmapped()

  return verifiedAtcProductCrosswalk({
    productSource,
    productId,
    ingredientName,
    atcCode: evidence.atcCode,
    provenance: evidence.provenance,
  })
}
