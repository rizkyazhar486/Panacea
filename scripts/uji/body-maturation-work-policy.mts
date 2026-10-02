import assert from 'node:assert/strict'
import { COMPLETE_WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/completeAtlas.ts'
import { buildBodyMaturationReport } from '../../src/lib/anatomy/bodyMaturationGate.ts'
import {
  BODY_ENGINEERING_CONTINUITY_FORMULA,
  evaluateBodyEngineeringWork,
} from '../../src/lib/anatomy/bodyMaturationWorkPolicy.ts'

const report = buildBodyMaturationReport(COMPLETE_WHOLE_BODY_ATLAS)

assert.equal(
  BODY_ENGINEERING_CONTINUITY_FORMULA,
  'EngineeringWorkAllowed = BlockerRemediation OR (IndependentAuthoring AND NoBlockedSystemOverlap) OR (Promotion AND CompleteUpstreamPath AND NoBlockedSystemOverlap)',
)

const blockers = evaluateBodyEngineeringWork(report, {
  kind: 'blocker-remediation',
  systems: ['articular'],
})
assert.equal(blockers.allowed, true, 'a maturation gate must never prevent work that repairs its own blocker')
assert.ok(blockers.scopeBlockedSystems.includes('articular'))

const independentCardio = evaluateBodyEngineeringWork(report, {
  kind: 'independent-authoring',
  systems: ['cardiovascular'],
})
assert.equal(independentCardio.allowed, true, 'an unrelated blocked system must not freeze cardiovascular engineering')
assert.deepEqual(independentCardio.scopeBlockedSystems, [])

const independentRespiratory = evaluateBodyEngineeringWork(report, {
  kind: 'independent-authoring',
  systems: ['respiratory'],
})
assert.equal(independentRespiratory.allowed, true, 'an unrelated blocked system must not freeze respiratory engineering')

const blockedArticularAuthoring = evaluateBodyEngineeringWork(report, {
  kind: 'independent-authoring',
  systems: ['articular'],
})
assert.equal(blockedArticularAuthoring.allowed, false)
assert.ok(blockedArticularAuthoring.reasons.some((reason) => reason.includes('articular')))

const crossSystem = evaluateBodyEngineeringWork(report, {
  kind: 'independent-authoring',
  systems: ['cardiovascular', 'articular'],
})
assert.equal(crossSystem.allowed, false)
assert.deepEqual(crossSystem.scopeBlockedSystems, ['articular'])

const promotion = evaluateBodyEngineeringWork(report, {
  kind: 'promotion',
  systems: ['cardiovascular'],
  targetStage: 'organ',
})
assert.equal(promotion.allowed, false, 'publication/maturation promotion stays fail-closed while upstream stages are incomplete')
assert.ok(promotion.reasons.some((reason) => reason.includes('fail-closed')))

const missingStage = evaluateBodyEngineeringWork(report, {
  kind: 'promotion',
  systems: ['cardiovascular'],
})
assert.equal(missingStage.allowed, false)
assert.ok(missingStage.reasons.some((reason) => reason.includes('targetStage')))

console.log(JSON.stringify({
  activeStage: report.activeStage,
  blockedSystems: blockers.blockedSystems,
  independentCardiovascularAllowed: independentCardio.allowed,
  independentRespiratoryAllowed: independentRespiratory.allowed,
  articularBlockerRemediationAllowed: blockers.allowed,
  articularIndependentAuthoringAllowed: blockedArticularAuthoring.allowed,
  organPromotionAllowed: promotion.allowed,
}, null, 2))
