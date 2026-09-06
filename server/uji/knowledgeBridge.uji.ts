import {
  KNOWLEDGE_BRIDGE_MODULES,
  KNOWLEDGE_BRIDGE_TRUTH_RULES,
  compareRisks,
  evidenceWeight,
  estimatedPathwayCost,
  estimatedPathwayHours,
  sortEvidence,
  type CarePathwayStep,
  type EvidenceClaim,
} from '../../src/lib/knowledgeBridge'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('delapan modul knowledge bridge tersedia', KNOWLEDGE_BRIDGE_MODULES.length === 8)
ok('kunci modul unik', new Set(KNOWLEDGE_BRIDGE_MODULES.map((x) => x.key)).size === KNOWLEDGE_BRIDGE_MODULES.length)
ok('setiap modul punya truth boundary', KNOWLEDGE_BRIDGE_MODULES.every((x) => x.truthBoundary.length > 30))
ok('truth rules tidak kosong', KNOWLEDGE_BRIDGE_TRUTH_RULES.length >= 8)

{
  const r = compareRisks(0.20, 0.15)
  ok('ARR 20% ke 15% = 5 poin persentase', Math.abs(r.absoluteRiskReduction - 0.05) < 1e-12)
  ok('RRR 20% ke 15% = 25%', Math.abs((r.relativeRiskReduction ?? 0) - 0.25) < 1e-12)
  ok('NNT 20% ke 15% = 20', Math.abs((r.nnt ?? 0) - 20) < 1e-9)
  ok('natural frequency control = 200/1000', r.controlPer1000 === 200)
  ok('natural frequency treatment = 150/1000', r.treatmentPer1000 === 150)
  ok('50 kejadian dicegah per 1000', r.preventedPer1000 === 50)
}

{
  const noBenefit = compareRisks(0.10, 0.12)
  ok('harm/negative ARR tetap ditampilkan, tidak dibalik diam-diam', noBenefit.absoluteRiskReduction < 0)
  ok('NNT tidak diciptakan ketika tidak ada benefit absolut', noBenefit.nnt === null)
}

{
  const zeroBaseline = compareRisks(0, 0)
  ok('RRR undefined ketika baseline risk nol', zeroBaseline.relativeRiskReduction === null)
}

ok('measurement diberi bobot di atas guideline', evidenceWeight('measurement') > evidenceWeight('guideline'))
ok('trial di atas observational', evidenceWeight('trial') > evidenceWeight('observational'))
ok('uncertain paling rendah', evidenceWeight('uncertain') < evidenceWeight('expert'))

{
  const claims: EvidenceClaim[] = [
    { id: 'u', claim: 'uncertain', level: 'uncertain', sourceLabel: 'unknown' },
    { id: 'm', claim: 'measured', level: 'measurement', sourceLabel: 'lab' },
    { id: 't', claim: 'trial', level: 'trial', sourceLabel: 'trial' },
  ]
  const sorted = sortEvidence(claims)
  ok('evidence sorting menempatkan measurement paling atas', sorted[0].id === 'm')
  ok('evidence sorting menempatkan uncertain paling bawah', sorted.at(-1)?.id === 'u')
}

{
  const steps: CarePathwayStep[] = [
    { id: 'a', label: 'visit', actor: 'primary-care', purpose: 'assessment', estimatedCost: 100000, currency: 'IDR', waitingTimeHours: 4, prerequisites: [], alternatives: [] },
    { id: 'b', label: 'lab', actor: 'lab', purpose: 'testing', estimatedCost: 250000, currency: 'IDR', waitingTimeHours: 8, prerequisites: ['a'], alternatives: [] },
    { id: 'c', label: 'other currency', actor: 'specialist', purpose: 'example', estimatedCost: 30, currency: 'USD', waitingTimeHours: 12, prerequisites: ['b'], alternatives: [] },
  ]
  ok('pathway cost hanya menjumlah currency yang diminta', estimatedPathwayCost(steps, 'IDR') === 350000)
  ok('pathway wait menjumlah seluruh waktu', estimatedPathwayHours(steps) === 24)
}

console.log(`\nKnowledge Bridge: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
