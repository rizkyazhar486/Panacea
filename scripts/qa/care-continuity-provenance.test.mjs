import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveCareContinuityState } from '../../src/domains/clinical-operations/model/careContinuityProjection.ts'

const syntheticEncounter = {
  patientId: 'synthetic-patient-provenance',
  evaluatedAt: '2026-10-25T12:00:00.000Z',
}

test('vital with explicit source is trusted and counts toward completeness', () => {
  const projection = deriveCareContinuityState({
    ...syntheticEncounter,
    vitals: [{
      takenAt: '2026-10-25T08:00:00.000Z',
      verifiedById: 'synthetic-nurse-1',
      source: '  bedside-monitor-7  ',
    }],
  })

  assert.equal(projection.oneOsProof.fragmentCount, 1)
  assert.equal(projection.oneOsProof.trustworthyFragmentCount, 1)
  assert.equal(projection.oneOsProof.trustCoverage, 1)
  assert.equal(projection.oneOsProof.sourceCount, 1)
  assert.equal(projection.oneOsProof.unresolvedFragmentCount, 0)
  assert.equal(projection.oneOsProof.presentRequiredDataClassCount, 1)
  assert.equal(projection.oneOsProof.completenessCoverage, 0.2)
  assert.deepEqual(projection.oneOsProof.missingRequiredDataClasses, [
    'anamnesis',
    'physical-exam',
    'diagnosis',
    'plan',
  ])
})

test('vital without source stays unresolved and cannot fabricate completeness', () => {
  const projection = deriveCareContinuityState({
    ...syntheticEncounter,
    vitals: [{
      takenAt: '2026-10-25T08:00:00.000Z',
      verifiedById: 'synthetic-nurse-1',
    }],
  })

  assert.equal(projection.oneOsProof.fragmentCount, 1)
  assert.equal(projection.oneOsProof.trustworthyFragmentCount, 0)
  assert.equal(projection.oneOsProof.trustCoverage, 0)
  assert.equal(projection.oneOsProof.sourceCount, 0)
  assert.equal(projection.oneOsProof.unresolvedFragmentCount, 1)
  assert.equal(projection.oneOsProof.presentRequiredDataClassCount, 0)
  assert.equal(projection.oneOsProof.completenessCoverage, 0)
  assert.ok(projection.oneOsProof.missingRequiredDataClasses.includes('vital-signs'))
})

test('blank vital source remains unresolved instead of becoming a named device', () => {
  const projection = deriveCareContinuityState({
    ...syntheticEncounter,
    vitals: [{
      takenAt: '2026-10-25T08:00:00.000Z',
      verifiedById: 'synthetic-nurse-1',
      source: '   ',
    }],
  })

  assert.equal(projection.oneOsProof.trustworthyFragmentCount, 0)
  assert.equal(projection.oneOsProof.trustCoverage, 0)
  assert.equal(projection.oneOsProof.sourceCount, 0)
  assert.equal(projection.oneOsProof.unresolvedFragmentCount, 1)
  assert.ok(projection.oneOsProof.missingRequiredDataClasses.includes('vital-signs'))
})
