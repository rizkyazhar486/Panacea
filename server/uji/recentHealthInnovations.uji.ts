import {
  RECENT_HEALTH_INNOVATIONS,
  RECENT_INNOVATION_TRUTH_RULES,
  innovationById,
  innovationReadinessPercent,
  innovationsByDomain,
} from '../../src/lib/recentHealthInnovations'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('delapan innovation contracts tersedia', RECENT_HEALTH_INNOVATIONS.length === 8)
ok('semua id unik', new Set(RECENT_HEALTH_INNOVATIONS.map((x) => x.id)).size === RECENT_HEALTH_INNOVATIONS.length)
ok('semua punya mission', RECENT_HEALTH_INNOVATIONS.every((x) => x.mission.length > 40))
ok('semua punya human gate', RECENT_HEALTH_INNOVATIONS.every((x) => Boolean(x.humanGate)))
ok('semua punya safety boundary substantif', RECENT_HEALTH_INNOVATIONS.every((x) => x.safetyBoundary.length > 70))
ok('semua punya input dan output', RECENT_HEALTH_INNOVATIONS.every((x) => x.inputs.length > 0 && x.outputs.length > 0))
ok('semua punya integrasi Panacea', RECENT_HEALTH_INNOVATIONS.every((x) => x.integrations.length >= 3))
ok('semua punya evidence anchor', RECENT_HEALTH_INNOVATIONS.every((x) => x.evidenceAnchors.length > 0))
ok('truth rules memadai', RECENT_INNOVATION_TRUTH_RULES.length >= 8)

for (const feature of RECENT_HEALTH_INNOVATIONS) {
  const readiness = innovationReadinessPercent(feature)
  ok(`readiness ${feature.id} berada 0-100`, readiness >= 0 && readiness <= 100)
}

ok('N-of-1 studio tersedia', innovationById('n-of-1-studio')?.domain === 'personal-experiments')
ok('PGx passport membutuhkan clinician review', innovationById('pgx-actionability-passport')?.humanGate === 'clinician-review')
ok('target trial emulation research-only', innovationById('target-trial-emulation-workbench')?.status === 'research-only')
ok('genomic reanalysis tidak auto diagnosis', innovationById('genomic-reanalysis-watch')?.safetyBoundary.toLowerCase().includes('not itself a new diagnosis') === true)
ok('AI lifecycle punya governance gate', innovationById('ai-lifecycle-observatory')?.humanGate === 'research-governance')
ok('DHT validation integration-ready', innovationById('digital-biomarker-validation-lab')?.status === 'integration-ready')
ok('satu fitur patient reported data', innovationsByDomain('patient-reported-data').length === 1)
ok('satu fitur real-world evidence', innovationsByDomain('real-world-evidence').length === 1)

console.log(`\nRecent Health Innovations: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
