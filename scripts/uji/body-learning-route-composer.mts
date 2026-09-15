import assert from 'node:assert/strict'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'
import { BODY_EVIDENCE_SOURCE_LEDGER } from '../../src/lib/bodyEvidenceProvenance.ts'
import {
  BODY_LEARNING_ROUTE_BOUNDARY,
  buildBodyLearningRoute,
  listBodyLearningRouteTargets,
} from '../../src/lib/bodyLearningRouteComposer.ts'

const targets = listBodyLearningRouteTargets()
assert.ok(targets.length >= 11, 'learning route targets should include disease networks and pharmacology classes')
assert.ok(targets.every((target) => target.kind === 'pathophysiology-scenario' || target.kind === 'pharmacology-class'))
assert.equal(new Set(targets.map((target) => target.id)).size, targets.length, 'learning route targets must be unique')

for (const atlasSystem of BODY_SYSTEM_SOURCE_WAVE) {
  const diseaseRoute = buildBodyLearningRoute(atlasSystem.id, 'pathophysiology:atherosclerosis')
  assert.ok(diseaseRoute, `${atlasSystem.id} should connect through the curated whole-body graph to atherosclerosis`)
  assert.equal(diseaseRoute?.steps[0].nodeId, `atlas:${atlasSystem.id}`)
  assert.equal(diseaseRoute?.steps.at(-1)?.nodeId, 'pathophysiology:atherosclerosis')
  assert.equal(diseaseRoute?.targetLabel, 'Atherosclerosis')
}

const statinRoute = buildBodyLearningRoute('cardiovascular', 'pharmacology:statin-hmgcr')
assert.ok(statinRoute, 'cardiovascular atlas must have a graph-backed statin learning route')
assert.equal(statinRoute?.steps[0].nodeKind, 'atlas-system')
assert.equal(statinRoute?.steps.at(-1)?.nodeKind, 'pharmacology-class')
assert.equal(statinRoute?.steps.at(-1)?.nodeId, 'pharmacology:statin-hmgcr')
assert.ok(statinRoute?.steps.some((step) => step.nodeKind === 'physiology-system'), 'route should preserve physiology context')
assert.ok(statinRoute?.steps.some((step) => step.nodeKind === 'pathophysiology-scenario' || step.nodeKind === 'pathophysiology-step'), 'route should preserve disease-network context before pharmacology')
assert.ok((statinRoute?.biomedicalStepCount ?? 0) >= 2, 'statin route should contain biomedical learning steps')
assert.equal(statinRoute?.evidenceAnchoredBiomedicalStepCount, statinRoute?.biomedicalStepCount, 'all biomedical route steps must retain evidence anchors')
assert.equal(statinRoute?.evidenceCoverageFraction, 1, 'statin route biomedical provenance coverage should be complete')

const sourcePmids = new Set(BODY_EVIDENCE_SOURCE_LEDGER.map((source) => source.pmid))
for (const step of statinRoute?.steps ?? []) {
  assert.ok(step.objective.length >= 50, `${step.nodeId} needs a substantive learning objective`)
  assert.ok(step.context.length >= 8, `${step.nodeId} needs graph-derived context`)
  for (const pmid of step.referencePmids) assert.ok(sourcePmids.has(pmid), `${step.nodeId} references unknown PMID ${pmid}`)
}

const xaRoute = buildBodyLearningRoute('cardiovascular', 'pharmacology:factor-xa-inhibition')
assert.ok(xaRoute?.steps.some((step) => step.nodeId.includes('venous-thromboembolism')), 'factor Xa learning route should traverse VTE biology')
assert.equal(xaRoute?.evidenceCoverageFraction, 1)

const strokeRoute = buildBodyLearningRoute('nervous', 'pathophysiology:ischemic-stroke')
assert.ok(strokeRoute)
assert.equal(strokeRoute?.steps.at(-1)?.nodeId, 'pathophysiology:ischemic-stroke')
assert.equal(strokeRoute?.evidenceCoverageFraction, 1)

assert.throws(
  () => buildBodyLearningRoute('cardiovascular', 'physiology:cardiovascular'),
  /Learning-route target must be a disease network or pharmacology class/,
)
assert.throws(
  () => buildBodyLearningRoute('cardiovascular', 'invented:target'),
  /Unknown unified mechanism graph node/,
)

assert.match(BODY_LEARNING_ROUTE_BOUNDARY, /educational route composer only/i)
assert.match(BODY_LEARNING_ROUTE_BOUNDARY, /completion percentage/i)
assert.match(BODY_LEARNING_ROUTE_BOUNDARY, /not represent disease severity/i)
assert.match(BODY_LEARNING_ROUTE_BOUNDARY, /treatment ranking/i)
assert.match(BODY_LEARNING_ROUTE_BOUNDARY, /dose/i)
assert.match(BODY_LEARNING_ROUTE_BOUNDARY, /patient-specific clinical plan/i)

console.log(`body learning route composer: ${targets.length} disease/pharmacology targets validated with graph-derived sequencing and evidence-aware biomedical steps`)
