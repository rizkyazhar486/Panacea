import assert from 'node:assert/strict'
import test from 'node:test'

import { evaluateStructureReviewWorkflow } from '../../src/domains/body-exposure/engine/structureReviewWorkflowEngine.ts'

const VALID_SHA = 'a'.repeat(64)

test('BX-10 1. Golden case: verified SHA-256, FMA ontology ID, and independent reviewer approves asset', () => {
  const res = evaluateStructureReviewWorkflow({
    structureId: 'heart-left-ventricle',
    meshSha256: VALID_SHA,
    ontologyTermId: 'FMA:7101',
    licenceSpdx: 'CC-BY-SA-4.0',
    submitterId: 'author-1',
    reviewerId: 'anatomist-2',
    manifoldChecked: true,
    lateralityVerified: true,
    decision: 'approve',
    reviewNotes: 'Mesh topology and papillary muscle attachment verified.',
  })
  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.stage, 'anatomist-approved')
  assert.strictEqual(res.productionEligible, true)
})

test('BX-10 2. Paired & adversarial cases: self-approval, fake SHA-256, and unchecked laterality fail closed', () => {
  const selfApprove = evaluateStructureReviewWorkflow({
    structureId: 'heart-left-ventricle',
    meshSha256: VALID_SHA,
    ontologyTermId: 'FMA:7101',
    licenceSpdx: 'CC-BY-SA-4.0',
    submitterId: 'anatomist-2',
    reviewerId: 'anatomist-2',
    manifoldChecked: true,
    lateralityVerified: true,
    decision: 'approve',
    reviewNotes: 'Self check',
  })
  assert.strictEqual(selfApprove.ok, false)
  assert.strictEqual(selfApprove.reason, 'self-approval-prohibited')

  const badSha = evaluateStructureReviewWorkflow({
    structureId: 'heart-left-ventricle',
    meshSha256: 'not-a-sha256',
    ontologyTermId: 'FMA:7101',
    licenceSpdx: 'CC-BY-SA-4.0',
    submitterId: 'author-1',
    reviewerId: 'anatomist-2',
    manifoldChecked: true,
    lateralityVerified: true,
    decision: 'approve',
    reviewNotes: 'Bad hash',
  })
  assert.strictEqual(badSha.ok, false)
  assert.strictEqual(badSha.reason, 'invalid-sha256-digest')

  const uncheckedLaterality = evaluateStructureReviewWorkflow({
    structureId: 'heart-left-ventricle',
    meshSha256: VALID_SHA,
    ontologyTermId: 'FMA:7101',
    licenceSpdx: 'CC-BY-SA-4.0',
    submitterId: 'author-1',
    reviewerId: 'anatomist-2',
    manifoldChecked: true,
    lateralityVerified: false,
    decision: 'approve',
    reviewNotes: 'Unchecked laterality',
  })
  assert.strictEqual(uncheckedLaterality.ok, false)
  assert.strictEqual(uncheckedLaterality.reason, 'unverified-geometry-or-laterality')
})
