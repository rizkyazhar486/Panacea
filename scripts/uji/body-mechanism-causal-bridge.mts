import assert from 'node:assert/strict'
import {
  BODY_MECHANISM_CAUSAL_BRIDGE,
  BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY,
  listCausalLinksForPharmacology,
  listCausalLinksForScenario,
} from '../../src/lib/bodyMechanismCausalBridge.ts'
import { getBodyPathophysiologyScenario } from '../../src/lib/bodyPathophysiologyNetwork.ts'
import { getBodyPharmacologyMechanism } from '../../src/lib/bodyPharmacologyMechanismNetwork.ts'

assert.equal(BODY_MECHANISM_CAUSAL_BRIDGE.length, 9, 'causal bridge wave must expose nine curated disease-pharmacology intersections')
assert.equal(new Set(BODY_MECHANISM_CAUSAL_BRIDGE.map((link) => link.id)).size, BODY_MECHANISM_CAUSAL_BRIDGE.length, 'causal bridge ids must be unique')

for (const link of BODY_MECHANISM_CAUSAL_BRIDGE) {
  const scenario = getBodyPathophysiologyScenario(link.scenarioId)
  const mechanism = getBodyPharmacologyMechanism(link.pharmacologyMechanismId)

  assert.ok(link.title.length >= 30, `${link.id} needs a descriptive intersection title`)
  assert.ok(link.explanation.length >= 120, `${link.id} needs a meaningful mechanistic explanation`)
  assert.ok(link.doesNotImply.length >= 100, `${link.id} must explicitly bound clinical inference`)
  assert.ok(['upstream-driver', 'propagation-node', 'downstream-modifier', 'systems-context'].includes(link.relation), `${link.id} uses unsupported relation type`)
  assert.ok(link.scenarioStepIds.length >= 1, `${link.id} must attach to a pathophysiology node`)

  for (const stepId of link.scenarioStepIds) {
    assert.ok(scenario.cascade.some((step) => step.id === stepId), `${link.id} references missing scenario step ${stepId}`)
  }

  assert.ok(mechanism.evidence.length >= 1, `${link.id} pharmacology mechanism must retain evidence provenance`)
  assert.match(link.doesNotImply, /does not|doesn't/i, `${link.id} must state a negative inference boundary`)
}

assert.ok(listCausalLinksForScenario('atherosclerosis').some((link) => link.pharmacologyMechanismId === 'statin-hmgcr'))
assert.ok(listCausalLinksForScenario('atherosclerosis').some((link) => link.pharmacologyMechanismId === 'aspirin-cox1'))
assert.ok(listCausalLinksForScenario('atherosclerosis').some((link) => link.pharmacologyMechanismId === 'pcsk9-inhibition'))
assert.ok(listCausalLinksForScenario('heart-failure').some((link) => link.pharmacologyMechanismId === 'ace-inhibition'))
assert.ok(listCausalLinksForScenario('heart-failure').some((link) => link.pharmacologyMechanismId === 'beta1-blockade'))
assert.ok(listCausalLinksForScenario('heart-failure').some((link) => link.pharmacologyMechanismId === 'sglt2-inhibition'))
assert.ok(listCausalLinksForScenario('ischemic-stroke').some((link) => link.pharmacologyMechanismId === 'aspirin-cox1'))
assert.ok(listCausalLinksForScenario('venous-thromboembolism').some((link) => link.pharmacologyMechanismId === 'factor-xa-inhibition'))

assert.equal(listCausalLinksForPharmacology('factor-xa-inhibition').length, 1, 'factor Xa inhibition should remain specifically mapped to the VTE coagulation branch in this wave')
assert.ok(listCausalLinksForPharmacology('statin-hmgcr').length >= 2, 'statin mechanism should surface upstream atherosclerosis and ischemic-stroke context')

assert.match(BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY, /educational disease ↔ pharmacology causal bridge/i)
assert.match(BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY, /does not establish indication/i)
assert.match(BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY, /dose/i)
assert.match(BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY, /patient-specific response/i)
assert.match(BODY_MECHANISM_CAUSAL_BRIDGE_BOUNDARY, /clinical outcome/i)

console.log('body mechanism causal bridge: 9 curated disease-pharmacology intersections validated against scenario nodes, evidence and non-prescribing boundaries')
