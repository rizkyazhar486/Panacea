import { verifiedAtcProductCrosswalk, unmappedAtcProductCrosswalk, type AtcProductCrosswalk } from './atcDdd.js'
import type { ProductRegistryRecord } from './productRegistry.js'

export interface ProductAtcEvidence {
  productSource: string
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
 *
 * This function does not infer ATC from a brand, RxNorm name, SPL label text, or
 * free text. It only accepts a supplied evidence record when identity is
 * consistent with the resolved product record and the ATC constructor validates
 * both code shape and provenance. Otherwise it fails closed as `unmapped`.
 */
export function joinProductToVerifiedAtc(
  product: ProductRegistryRecord,
  evidence: ProductAtcEvidence | null | undefined,
): AtcProductCrosswalk {
  const ingredientName = (product.normalizedName ?? product.label?.genericName ?? product.query).trim()
  const productId = product.label?.labelId?.trim() ?? ''
  const productSource = product.label?.labelId ? 'openfda-spl' : 'rxnorm'

  if (!evidence) {
    return unmappedAtcProductCrosswalk({ productSource, productId, ingredientName })
  }

  const evidenceSource = evidence.productSource.trim()
  const evidenceId = evidence.productId.trim()
  const evidenceIngredient = evidence.ingredientName.trim()

  const sourceMatches = norm(evidenceSource) === norm(productSource)
  const idMatches = productId ? norm(evidenceId) === norm(productId) : !evidenceId
  const ingredientMatches = norm(evidenceIngredient) === norm(ingredientName)

  if (!sourceMatches || !idMatches || !ingredientMatches) {
    return unmappedAtcProductCrosswalk({ productSource, productId, ingredientName })
  }

  return verifiedAtcProductCrosswalk({
    productSource,
    productId,
    ingredientName,
    atcCode: evidence.atcCode,
    provenance: evidence.provenance,
  })
}
