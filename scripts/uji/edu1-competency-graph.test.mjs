import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CANONICAL_MEDSTUDY_CURRICULUM_NODES,
  evaluateMedStudyCompetencyPath,
} from '../../src/domains/medstudyhub/engine/medStudyCompetencyGraphEngine.ts'

test('EDU-1 1. Golden case: topological order resolves L5 sarcomere -> L7 CICR -> L2 Frank-Starling -> L1 Acute HFrEF', () => {
  const res = evaluateMedStudyCompetencyPath({
    targetConceptId: 'med-cv-04-acute-hfref-management',
    learnerRecords: [
      { conceptId: 'med-cv-01-sarcomere-ultrastructure', highestScoreFraction: 0.85, verifiedAtIso: '2026-10-30T10:00:00Z' },
      { conceptId: 'med-cv-02-excitation-contraction-cicr', highestScoreFraction: 0.90, verifiedAtIso: '2026-10-30T11:00:00Z' },
    ],
  })
  assert.strictEqual(res.ok, true)
  assert.deepStrictEqual(res.topologicalStudyOrder, [
    'med-cv-01-sarcomere-ultrastructure',
    'med-cv-02-excitation-contraction-cicr',
    'med-cv-03-frank-starling-pv-loop',
    'med-cv-04-acute-hfref-management',
  ])
  assert.deepStrictEqual(res.masteredConceptIds, [
    'med-cv-01-sarcomere-ultrastructure',
    'med-cv-02-excitation-contraction-cicr',
  ])
  assert.strictEqual(res.isTargetUnlocked, false)
  assert.deepStrictEqual(res.blockedPrerequisiteIds, ['med-cv-03-frank-starling-pv-loop'])
  assert.strictEqual(res.remainingStudyMinutes, 65)
})

test('EDU-1 2. Paired test: mastering med-cv-03 unlocks med-cv-04 (SKDI 3B)', () => {
  const unlocked = evaluateMedStudyCompetencyPath({
    targetConceptId: 'med-cv-04-acute-hfref-management',
    learnerRecords: [
      { conceptId: 'med-cv-01-sarcomere-ultrastructure', highestScoreFraction: 0.85, verifiedAtIso: '2026-10-30T10:00:00Z' },
      { conceptId: 'med-cv-02-excitation-contraction-cicr', highestScoreFraction: 0.90, verifiedAtIso: '2026-10-30T11:00:00Z' },
      { conceptId: 'med-cv-03-frank-starling-pv-loop', highestScoreFraction: 0.80, verifiedAtIso: '2026-10-30T12:00:00Z' },
    ],
  })
  assert.strictEqual(unlocked.ok, true)
  assert.strictEqual(unlocked.isTargetUnlocked, true)
  assert.strictEqual(unlocked.remainingStudyMinutes, 35)
})

test('EDU-1 3. Adversarial cycle detection & boundary +-epsilon on masteryThresholdScore fail closed', () => {
  const cyclicCatalog = {
    ...CANONICAL_MEDSTUDY_CURRICULUM_NODES,
    'med-cv-01-sarcomere-ultrastructure': {
      ...CANONICAL_MEDSTUDY_CURRICULUM_NODES['med-cv-01-sarcomere-ultrastructure'],
      prerequisiteIds: ['med-cv-03-frank-starling-pv-loop'],
    },
  }
  const cycleRes = evaluateMedStudyCompetencyPath({
    targetConceptId: 'med-cv-03-frank-starling-pv-loop',
    learnerRecords: [],
    catalogOverride: cyclicCatalog,
  })
  assert.strictEqual(cycleRes.ok, false)
  assert.strictEqual(cycleRes.reason, 'cyclic-prerequisite-graph')

  const badScore = evaluateMedStudyCompetencyPath({
    targetConceptId: 'med-cv-01-sarcomere-ultrastructure',
    learnerRecords: [{ conceptId: 'med-cv-01-sarcomere-ultrastructure', highestScoreFraction: 1 + 1e-6, verifiedAtIso: '2026-10-30T10:00:00Z' }],
  })
  assert.strictEqual(badScore.ok, false)
  assert.strictEqual(badScore.reason, 'invalid-input')
})
