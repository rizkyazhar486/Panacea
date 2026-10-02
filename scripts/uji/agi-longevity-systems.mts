import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { AGI_LONGEVITY_BOUNDARY, AGI_LONGEVITY_DOMAINS, evaluateAgiResearchReadiness } from '../../src/lib/agiLongevitySystems.ts'

assert.deepEqual(
  AGI_LONGEVITY_DOMAINS.map((item) => item.id),
  ['whole-cell-digital-twin', 'generative-macromolecules', 'autonomous-wet-lab', 'adaptive-biomarker-control'],
)

for (const domain of AGI_LONGEVITY_DOMAINS) {
  assert.ok(domain.problem.length > 80, `${domain.id}: problem statement too thin`)
  assert.ok(domain.hardBottlenecks.length >= 5, `${domain.id}: bottleneck coverage too thin`)
  assert.ok(domain.falsificationChecks.length >= 4, `${domain.id}: must expose falsification checks`)
  assert.ok(domain.evidenceAnchors.length >= 1, `${domain.id}: missing evidence anchor`)
  for (const anchor of domain.evidenceAnchors) assert.match(anchor.pmid, /^\d{8}$/)
}

const blocked = evaluateAgiResearchReadiness({ modelFidelity: 100, experimentalGrounding: 100, actuationControl: 40, prospectiveValidation: 100 })
assert.equal(blocked.researchGate, false, 'a weak actuation/safety link must block the research gate')
assert.equal(blocked.weakestLink, 40)

const stillBlocked = evaluateAgiResearchReadiness({ modelFidelity: 90, experimentalGrounding: 90, actuationControl: 90, prospectiveValidation: 80 })
assert.equal(stillBlocked.researchGate, false, 'prospective validation below 85 must remain blocked')

const pass = evaluateAgiResearchReadiness({ modelFidelity: 90, experimentalGrounding: 90, actuationControl: 90, prospectiveValidation: 90 })
assert.equal(pass.researchGate, true)

for (const guard of [
  'does not claim AGI',
  'atomistic digital twin',
  'replacement of human clinical trials',
  'autonomous wet-lab authority',
  'autonomous dosing',
  'biological immortality',
]) assert.match(AGI_LONGEVITY_BOUNDARY, new RegExp(guard, 'i'))

const lab = await readFile(new URL('../../src/pages/bodyhub/AGILongevitySystemsLab.tsx', import.meta.url), 'utf8')
for (const ui of ['AGI Systems Engineering', 'CONCEPTUAL · NOT CLINICAL', 'Research translation gate', 'weakest link', 'What would falsify the model?']) {
  assert.ok(lab.includes(ui), `missing UI contract: ${ui}`)
}
assert.ok(lab.includes('overflow-x-auto'), 'frontier selector must remain mobile reachable')
assert.ok(lab.includes('PMID {anchor.pmid}'), 'evidence provenance must be visible in the UI')

console.log('agi-longevity-systems: four frontier domains, weakest-link research gate, evidence provenance and fail-closed boundaries PASS')
