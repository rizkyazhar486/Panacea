import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateOneOsCareProof } from '../../src/domains/clinical-operations/model/oneOsCareProof.ts'

const at = '2026-10-04T10:00:00.000Z'

const fragment = (overrides = {}) => ({
  id: 'f-1',
  patientId: 'patient-1',
  sourceId: 'wearable-1',
  dataClass: 'vitals',
  recordedAt: '2026-10-04T09:59:00.000Z',
  provenancePresent: true,
  normalized: true,
  requiresClinicalReview: false,
  reviewState: 'not-required',
  ...overrides,
})

test('reconciles heterogeneous trusted fragments into measurable coverage', () => {
  const result = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: ['history', 'vitals', 'laboratory', 'emr'],
    fragments: [
      fragment({ id: 'h', sourceId: 'patient-history', dataClass: 'history' }),
      fragment({ id: 'v', sourceId: 'bedside-monitor', dataClass: 'vitals' }),
      fragment({ id: 'l', sourceId: 'lab-lis', dataClass: 'laboratory', requiresClinicalReview: true, reviewState: 'verified' }),
      fragment({ id: 'e', sourceId: 'emr', dataClass: 'emr', requiresClinicalReview: true, reviewState: 'signed' }),
    ],
  })
  assert.equal(result.sourceCount, 4)
  assert.equal(result.fragmentCount, 4)
  assert.equal(result.trustworthyFragmentCount, 4)
  assert.equal(result.unresolvedFragmentCount, 0)
  assert.equal(result.trustCoverage, 1)
  assert.equal(result.completenessCoverage, 1)
  assert.deepEqual(result.missingRequiredDataClasses, [])
  assert.equal(result.claimState.speed, 'unmeasured')
  assert.equal(result.claimState.understanding, 'unmeasured')
})

test('pending review and absent provenance fail closed instead of inflating trust or completeness', () => {
  const result = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: ['vitals', 'laboratory'],
    fragments: [
      fragment(),
      fragment({
        id: 'lab',
        sourceId: 'lab-lis',
        dataClass: 'laboratory',
        provenancePresent: false,
        requiresClinicalReview: true,
        reviewState: 'pending',
      }),
    ],
  })
  assert.equal(result.trustworthyFragmentCount, 1)
  assert.equal(result.unresolvedFragmentCount, 1)
  assert.equal(result.trustCoverage, 0.5)
  assert.equal(result.completenessCoverage, 0.5)
  assert.deepEqual(result.missingRequiredDataClasses, ['laboratory'])
})

test('blank or duplicate fragment ids fail closed instead of inflating trust coverage', () => {
  const duplicate = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: ['vitals'],
    fragments: [
      fragment({ id: 'dup', sourceId: 'wearable-a' }),
      fragment({ id: 'dup', sourceId: 'wearable-b' }),
    ],
  })

  assert.deepEqual(duplicate.duplicateFragmentIds, ['dup'])
  assert.equal(duplicate.trustworthyFragmentCount, 0)
  assert.equal(duplicate.unresolvedFragmentCount, 2)
  assert.equal(duplicate.trustCoverage, 0)
  assert.equal(duplicate.completenessCoverage, 0)

  const blank = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: ['vitals'],
    fragments: [fragment({ id: '   ' })],
  })

  assert.deepEqual(blank.duplicateFragmentIds, [])
  assert.equal(blank.trustworthyFragmentCount, 0)
  assert.equal(blank.unresolvedFragmentCount, 1)
  assert.equal(blank.trustCoverage, 0)
  assert.equal(blank.completenessCoverage, 0)
})

test('imported truthy evidence cannot inflate One OS trust coverage', () => {
  for (const key of ['provenancePresent', 'normalized']) {
    for (const value of [false, 'false', 'true', 1, {}, null, undefined]) {
      const input = {
        targetPatientId: 'patient-1', evaluatedAt: at, requiredDataClasses: ['vitals'],
        fragments: [fragment({ [key]: value })],
      }
      const before = structuredClone(input)
      const result = evaluateOneOsCareProof(input)
      assert.equal(result.trustCoverage, 0, key)
      assert.equal(result.completenessCoverage, 0, key)
      assert.equal(result.unresolvedFragmentCount, 1, key)
      assert.deepEqual(input, before)
    }
  }
})

test('review requirements and states must be explicitly supported', () => {
  for (const requiresClinicalReview of [false, true, 'false', 'true', 0, 1, null, undefined]) {
    for (const reviewState of ['not-required', 'pending', 'verified', 'signed', 'rejected', 'unsupported', null, undefined]) {
      const result = evaluateOneOsCareProof({
        targetPatientId: 'patient-1', evaluatedAt: at, requiredDataClasses: ['vitals'],
        fragments: [fragment({ requiresClinicalReview, reviewState })],
      })
      const supported = ['not-required', 'pending', 'verified', 'signed'].includes(reviewState)
      const trusted = supported && (requiresClinicalReview === false ||
        (requiresClinicalReview === true && ['verified', 'signed'].includes(reviewState)))
      assert.equal(result.trustCoverage, trusted ? 1 : 0)
      assert.equal(result.completenessCoverage, trusted ? 1 : 0)
    }
  }
})

test('malformed imported fragment identities and timestamps fail closed without throwing', () => {
  const invalid = [null, undefined, true, 1, 'fragment']
  for (const key of ['id', 'patientId', 'sourceId', 'dataClass', 'recordedAt']) {
    for (const value of [null, undefined, true, 1, {}, []]) invalid.push(fragment({ [key]: value }))
  }
  for (const value of invalid) {
    const result = evaluateOneOsCareProof({
      targetPatientId: 'patient-1', evaluatedAt: at, requiredDataClasses: ['vitals'], fragments: [value],
    })
    assert.equal(result.trustCoverage, 0)
    assert.equal(result.completenessCoverage, 0)
    assert.equal(result.unresolvedFragmentCount, 1)
    assert.deepEqual(result.duplicateFragmentIds, [])
  }
})

test('rejected review state never enters trusted context even when review is not otherwise required', () => {
  const result = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: ['vitals'],
    fragments: [fragment({ reviewState: 'rejected' })],
  })
  assert.equal(result.trustCoverage, 0)
  assert.equal(result.completenessCoverage, 0)
  assert.equal(result.unresolvedFragmentCount, 1)
})

test('wrong patient identity and future timestamps do not enter the trusted patient context', () => {
  const result = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: ['vitals'],
    fragments: [
      fragment({ id: 'wrong-person', patientId: 'patient-2' }),
      fragment({ id: 'future', recordedAt: '2026-10-04T10:01:00.000Z' }),
    ],
  })
  assert.equal(result.trustCoverage, 0)
  assert.equal(result.completenessCoverage, 0)
  assert.equal(result.unresolvedFragmentCount, 2)
})

test('speed claim is computed only from an explicit comparative workflow benchmark', () => {
  const result = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: [],
    fragments: [],
    workflow: {
      baselineSeconds: 300,
      oneOsSeconds: 120,
      baselineSteps: 10,
      oneOsSteps: 4,
    },
  })
  assert.equal(result.workflowTimeReductionPct, 60)
  assert.equal(result.workflowStepReductionPct, 60)
  assert.equal(result.claimState.speed, 'measured')
  assert.equal(result.trustCoverage, null)
  assert.equal(result.completenessCoverage, null)
})

test('understanding claim uses measured comprehension and reports percentage-point gain', () => {
  const result = evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: [],
    fragments: [],
    understanding: {
      baselineCorrect: 6,
      baselineTotal: 10,
      oneOsCorrect: 9,
      oneOsTotal: 10,
    },
  })
  assert.equal(result.understandingBaselinePct, 60)
  assert.equal(result.understandingOneOsPct, 90)
  assert.equal(result.understandingGainPercentagePoints, 30)
  assert.equal(result.claimState.understanding, 'measured')
})

test('invalid benchmark inputs are rejected rather than converted into favorable claims', () => {
  assert.throws(() => evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: [],
    fragments: [],
    workflow: { baselineSeconds: 0, oneOsSeconds: 10 },
  }), /baselineSeconds/)

  assert.throws(() => evaluateOneOsCareProof({
    targetPatientId: 'patient-1',
    evaluatedAt: at,
    requiredDataClasses: [],
    fragments: [],
    understanding: { baselineCorrect: 11, baselineTotal: 10, oneOsCorrect: 9, oneOsTotal: 10 },
  }), /baseline understanding/)
})
