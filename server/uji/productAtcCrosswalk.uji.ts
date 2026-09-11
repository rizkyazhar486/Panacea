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

for (const evidence of [
  { productSource: 'openfda-spl', productId: 'different-set', ingredientName: 'metformin hydrochloride', atcCode: 'A10BA02', provenance: 'source row' },
  { productSource: 'openfda-spl', productId: 'spl-set-123', ingredientName: 'aspirin', atcCode: 'A10BA02', provenance: 'source row' },
  { productSource: 'openfda-spl', productId: 'spl-set-123', ingredientName: 'metformin hydrochloride', atcCode: '../not-atc', provenance: 'source row' },
  { productSource: 'openfda-spl', productId: 'spl-set-123', ingredientName: 'metformin hydrochloride', atcCode: 'A10BA02', provenance: '   ' },
]) {
  const mapped = joinProductToVerifiedAtc(product, evidence)
  ok('mismatch/invalid evidence gagal tertutup', mapped.status === 'unmapped' && !mapped.atcCode)
}

const noEvidence = joinProductToVerifiedAtc(product, null)
ok('tanpa evidence tetap unmapped', noEvidence.status === 'unmapped')

console.log(`\nProduct ATC crosswalk: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exitCode = 1
