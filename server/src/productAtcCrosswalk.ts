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
 * No ATC inference is performed from brands, RxNorm names, SPL free text, or AI output.
 */
export function joinProductToVerifiedAtc(
  product: ProductRegistryRecord,
  evidence: ProductAtcEvidence | null | undefined,
): AtcProductCrosswalk {
  const ingredientName = (product.normalizedName ?? product.label?.genericName ?? product.query).trim()
  const productId = product.label?.labelId?.trim() ?? ''
  const productSource = product.label?.labelId ? 'openfda-spl' : 'rxnorm'

  if (!evidence) return unmappedAtcProductCrosswalk({ productSource, productId, ingredientName })

  const sourceMatches = norm(evidence.productSource) === norm(productSource)
  const idMatches = productId ? norm(evidence.productId) === norm(productId) : !evidence.productId.trim()
  const ingredientMatches = norm(evidence.ingredientName) === norm(ingredientName)

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
