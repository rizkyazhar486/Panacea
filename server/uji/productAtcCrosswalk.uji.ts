import { joinProductToVerifiedAtc } from '../src/productAtcCrosswalk.ts'
import type { ProductRegistryRecord } from '../src/productRegistry.ts'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const product: ProductRegistryRecord = {
  query: 'Glucophage',
  normalizedName: 'metformin hydrochloride',
  relatedProducts: [],
  label: {
    brandName: 'Glucophage',
    genericName: 'metformin hydrochloride',
    purpose: '',
    mechanismOfAction: '',
    adverseReactions: '',
    warnings: '',
    dosage: '',
    indications: '',
    labelId: 'spl-set-123',
  },
  sources: [
    { id: 'rxnorm', label: 'NLM RxNorm terminology' },
    { id: 'openfda-spl', label: 'openFDA Structured Product Label' },
  ],
  atcStatus: 'unmapped',
  atcCode: null,
}

const verified = joinProductToVerifiedAtc(product, {
  productSource: 'openfda-spl',
  productId: 'spl-set-123',
  ingredientName: 'metformin hydrochloride',
  atcCode: 'A10BA02',
  provenance: 'licensed ATC dataset 2026 row linked to this ingredient/product identity',
})
ok('matching identity + provenance dapat verified', verified.status === 'verified')
ok('ATC code dipertahankan', verified.atcCode === 'A10BA02')
ok('provenance dipertahankan', Boolean(verified.provenance))

const wrongProduct = joinProductToVerifiedAtc(product, {
  productSource: 'openfda-spl',
  productId: 'different-set',
  ingredientName: 'metformin hydrochloride',
  atcCode: 'A10BA02',
  provenance: 'source row',
})
ok('product identity mismatch gagal tertutup', wrongProduct.status === 'unmapped' && !wrongProduct.atcCode)

const wrongIngredient = joinProductToVerifiedAtc(product, {
  productSource: 'openfda-spl',
  productId: 'spl-set-123',
  ingredientName: 'aspirin',
  atcCode: 'A10BA02',
  provenance: 'source row',
})
ok('ingredient mismatch gagal tertutup', wrongIngredient.status === 'unmapped' && !wrongIngredient.atcCode)

const badAtc = joinProductToVerifiedAtc(product, {
  productSource: 'openfda-spl',
  productId: 'spl-set-123',
  ingredientName: 'metformin hydrochloride',
  atcCode: '../not-atc',
  provenance: 'source row',
})
ok('ATC invalid gagal tertutup', badAtc.status === 'unmapped' && !badAtc.atcCode)

const noProvenance = joinProductToVerifiedAtc(product, {
  productSource: 'openfda-spl',
  productId: 'spl-set-123',
  ingredientName: 'metformin hydrochloride',
  atcCode: 'A10BA02',
  provenance: '   ',
})
ok('provenance kosong gagal tertutup', noProvenance.status === 'unmapped' && !noProvenance.atcCode)

const noEvidence = joinProductToVerifiedAtc(product, null)
ok('tanpa evidence tetap unmapped', noEvidence.status === 'unmapped')

console.log(`\nProduct ATC crosswalk: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
