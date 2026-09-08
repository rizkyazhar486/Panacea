import { anatomyForCuratedDrugId } from '../../src/lib/bodyDrugAnatomyCrosswalk'
import { DRUG_TARGETS } from '../../src/lib/drugTargets'
import { ORGAN_FOCUS } from '../../src/lib/organFocus'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const organKeys = new Set(ORGAN_FOCUS.map((organ) => organ.key))

for (const drug of DRUG_TARGETS) {
  const mapped = anatomyForCuratedDrugId(drug.id)
  ok(`${drug.id}: status reference`, mapped.status === 'curated-reference', mapped.status)
  ok(`${drug.id}: bukan evidence publishable`, mapped.evidenceStatus === 'reference-only' && mapped.publishableAsEvidence === false)
  ok(`${drug.id}: provenance mengakui batas evidence`, /not source\/version\/citation-bearing evidence/i.test(mapped.provenance))
  ok(`${drug.id}: semua lokasi efek valid`, mapped.desiredEffectOrganKeys.every((key) => organKeys.has(key)))
  ok(`${drug.id}: semua lokasi efek samping valid`, mapped.adverseEffectOrganKeys.every((key) => organKeys.has(key)))
  ok(`${drug.id}: tidak kehilangan lokasi`, mapped.desiredEffectOrganKeys.length === drug.sites.length)
  ok(`${drug.id}: tidak kehilangan lokasi efek samping`, mapped.adverseEffectOrganKeys.length === drug.efekSamping.length)
}

const unknown = anatomyForCuratedDrugId('not-a-curated-drug')
ok('obat tak dikenal gagal tertutup',
  unknown.status === 'unmapped'
  && unknown.evidenceStatus === 'unmapped'
  && unknown.publishableAsEvidence === false
  && unknown.desiredEffectOrganKeys.length === 0
  && unknown.adverseEffectOrganKeys.length === 0)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
