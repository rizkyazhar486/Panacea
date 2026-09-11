import {
  ATC_DDD_SOURCE,
  ATC_DDD_VERSION,
  isPlausibleAtcCode,
  normalizeAtcQuery,
  verifiedAtcProductCrosswalk,
  unmappedAtcProductCrosswalk,
} from '../src/atcDdd.js'

let pass = 0
let fail = 0
const ok = (name: string, condition: boolean) => {
  if (condition) { pass++; console.log('ok    ', name) }
  else { fail++; console.error('GAGAL ', name) }
}

ok('ATC source is pinned to 2026', ATC_DDD_VERSION === '2026' && ATC_DDD_SOURCE.version === '2026')
ok('official custodian is explicit', ATC_DDD_SOURCE.custodian.includes('WHO Collaborating Centre'))
ok('level-5 ATC code accepted', isPlausibleAtcCode('C09AA03'))
ok('level-4 ATC code accepted', isPlausibleAtcCode('C09AA'))
ok('level-3 ATC code accepted', isPlausibleAtcCode('C09A'))
ok('level-2 ATC code accepted', isPlausibleAtcCode('C09'))
ok('level-1 ATC code accepted', isPlausibleAtcCode('N'))
ok('invalid first-level groups rejected', !isPlausibleAtcCode('E') && !isPlausibleAtcCode('Q01AA01'))
ok('skipped ATC hierarchy rejected', !isPlausibleAtcCode('A10B02') && !isPlausibleAtcCode('C09A03'))
ok('malformed ATC code rejected', !isPlausibleAtcCode('aspirin') && !isPlausibleAtcCode('../C09AA03'))
ok('query normalization is bounded', normalizeAtcQuery('<script> aspirin   '.repeat(30)).length <= 160)

const mapped = verifiedAtcProductCrosswalk({
  productSource: 'test-registry',
  productId: '123',
  ingredientName: 'example',
  atcCode: 'C09AA03',
  provenance: 'test fixture: authoritative crosswalk record',
})
ok('verified mapping preserves ATC and provenance', mapped.status === 'verified' && mapped.atcCode === 'C09AA03' && Boolean(mapped.provenance))

const noProvenance = verifiedAtcProductCrosswalk({
  productSource: 'test-registry',
  productId: '123',
  ingredientName: 'example',
  atcCode: 'C09AA03',
  provenance: '   ',
})
ok('mapping without provenance fails closed', noProvenance.status === 'unmapped' && noProvenance.atcCode === undefined)

const invalidCode = verifiedAtcProductCrosswalk({
  productSource: 'test-registry',
  productId: '123',
  ingredientName: 'example',
  atcCode: 'NOT-ATC',
  provenance: 'test',
})
ok('invalid ATC code fails closed', invalidCode.status === 'unmapped')

const missingProductIdentity = verifiedAtcProductCrosswalk({
  productSource: '   ',
  productId: '123',
  ingredientName: 'example',
  atcCode: 'C09AA03',
  provenance: 'test fixture',
})
ok('verified crosswalk requires product source identity', missingProductIdentity.status === 'unmapped' && missingProductIdentity.atcCode === undefined)

const missingProductId = verifiedAtcProductCrosswalk({
  productSource: 'test-registry',
  productId: '   ',
  ingredientName: 'example',
  atcCode: 'C09AA03',
  provenance: 'test fixture',
})
ok('verified crosswalk requires product id', missingProductId.status === 'unmapped' && missingProductId.atcCode === undefined)

const missingIngredient = verifiedAtcProductCrosswalk({
  productSource: 'test-registry',
  productId: '123',
  ingredientName: '   ',
  atcCode: 'C09AA03',
  provenance: 'test fixture',
})
ok('verified crosswalk requires ingredient identity', missingIngredient.status === 'unmapped' && missingIngredient.atcCode === undefined)

const unmapped = unmappedAtcProductCrosswalk({ productSource: 'rxnorm', productId: '1', ingredientName: 'unknown' })
ok('explicit unmapped crosswalk contains no fabricated code', unmapped.status === 'unmapped' && unmapped.atcCode === undefined)

console.log(`\n${pass} lulus, ${fail} gagal`)
if (fail) process.exit(1)
