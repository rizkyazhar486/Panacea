import { FRONTIER_CATEGORIES, FRONTIER_FEATURES, frontierByCategory, frontierFeature, readinessPercent } from '../../src/lib/frontierHealthOS'

let lulus = 0
let gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

ok('frontier feature ids unique', new Set(FRONTIER_FEATURES.map((f) => f.id)).size === FRONTIER_FEATURES.length)
ok('all frontier categories represented', FRONTIER_CATEGORIES.every((c) => frontierByCategory(c.key).length > 0))
ok('every feature has safety boundary', FRONTIER_FEATURES.every((f) => f.safetyBoundary.trim().length > 30))
ok('every feature declares inputs and outputs', FRONTIER_FEATURES.every((f) => f.inputs.length > 0 && f.outputs.length > 0))
ok('every feature declares Panacea integrations', FRONTIER_FEATURES.every((f) => f.integrations.length > 0))
ok('every feature declares a visual target for Astra', FRONTIER_FEATURES.every((f) => f.visualTarget.length > 30))
ok('readiness stays within percentage bounds', FRONTIER_FEATURES.every((f) => readinessPercent(f) >= 0 && readinessPercent(f) <= 100))
ok('clinical trial matcher exists', Boolean(frontierFeature('clinical-trial-match')))
ok('causal counterfactual lab is research-only', frontierFeature('causal-counterfactual-lab')?.status === 'research-only')
ok('synthetic cohort sandbox requires governance', frontierFeature('privacy-synthetic-sandbox')?.humanGate === 'research-governance')
ok('verifiable health wallet requires patient consent', frontierFeature('verifiable-health-wallet')?.humanGate === 'patient-consent')
ok('care orchestration cannot silently invent clinical actions', frontierFeature('care-agent-orchestrator')?.safetyBoundary.toLowerCase().includes('does not invent') === true)
ok('digital phenotype stream states it is not automatically diagnostic', frontierFeature('digital-phenotype-stream')?.safetyBoundary.toLowerCase().includes('not diagnoses') === true)
ok('federated system warns federated learning is not itself sufficient for privacy', frontierFeature('federated-health-network')?.safetyBoundary.toLowerCase().includes('does not itself guarantee privacy') === true)

console.log(`\nFrontier Health OS: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
