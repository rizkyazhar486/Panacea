import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PANACEA_FUTURE_RESILIENCE_POLICY,
  PANACEA_RESILIENCE_SURFACES,
  assessTechnology,
  buildFutureResilienceAssessment,
  calculateAdoptionReadiness,
  calculateFreshnessPressure,
  calculateObsolescencePressure,
  calculateResearchUrgency,
  calculateResilienceIndex,
  listResiliencePolicyViolations,
} from '../../src/lib/futureResilienceOS.ts'

const perfectBaseline = {
  contractCoverage: 1,
  automatedTestCoverage: 1,
  providerAbstraction: 1,
  dataPortability: 1,
  observability: 1,
  rollbackReadiness: 1,
  evidenceFreshness: 1,
  teamContinuity: 1,
}

const candidate = {
  id: 'candidate-a',
  name: 'Candidate A',
  surface: 'ai-runtime',
  sourceRef: 'official-source',
  assessedAt: '2026-09-20',
  expectedUpside: 0.9,
  maturity: 0.9,
  compatibility: 0.9,
  portability: 0.9,
  reversibility: 0.9,
  security: 0.9,
  clinicalSafety: 0.9,
  migrationCost: 0.2,
  vendorLockIn: 0.2,
  evidenceAgeDays: 7,
  benchmarkValidated: true,
  shadowValidated: true,
  rollbackValidated: true,
}

test('future resilience policy keeps canonical product behavior replaceable at the edge', () => {
  assert.equal(listResiliencePolicyViolations().length, 0)
  assert.equal(PANACEA_FUTURE_RESILIENCE_POLICY.singleVendorMayNotOwnPatientTruth, true)
  assert.equal(PANACEA_FUTURE_RESILIENCE_POLICY.preserveHumanClinicalGate, true)
  assert.ok(PANACEA_RESILIENCE_SURFACES.length >= 10)
  assert.equal(new Set(PANACEA_RESILIENCE_SURFACES.map((surface) => surface.id)).size, PANACEA_RESILIENCE_SURFACES.length)
})

test('resilience index is normalized and reaches one only for a fully ready baseline', () => {
  assert.equal(calculateResilienceIndex(perfectBaseline), 1)
  assert.equal(
    calculateResilienceIndex({
      contractCoverage: 0,
      automatedTestCoverage: 0,
      providerAbstraction: 0,
      dataPortability: 0,
      observability: 0,
      rollbackReadiness: 0,
      evidenceFreshness: 0,
      teamContinuity: 0,
    }),
    0,
  )
})

test('research urgency and adoption readiness are deliberately separate', () => {
  const unsafeNovelty = {
    ...candidate,
    id: 'unsafe-novelty',
    expectedUpside: 1,
    maturity: 0.8,
    security: 0.35,
    clinicalSafety: 0.4,
    vendorLockIn: 0.8,
    migrationCost: 0.8,
    evidenceAgeDays: 220,
    benchmarkValidated: false,
    shadowValidated: false,
    rollbackValidated: false,
  }

  assert.ok(calculateResearchUrgency(unsafeNovelty) > 0.7)
  assert.ok(calculateAdoptionReadiness(unsafeNovelty) < 0.7)

  const assessment = assessTechnology(unsafeNovelty)
  assert.equal(assessment.replacementAllowed, false)
  assert.ok(assessment.blockers.includes('security-below-cutover-threshold'))
  assert.ok(assessment.blockers.includes('clinical-safety-below-cutover-threshold'))
})

test('high-quality reversible technology can become eligible after benchmark, shadow and rollback validation', () => {
  const assessment = assessTechnology(candidate)
  assert.ok(assessment.adoptionReadiness >= 0.8)
  assert.equal(assessment.replacementAllowed, true)
  assert.equal(assessment.blockers.length, 0)
})

test('lock-in and stale evidence increase research pressure without forcing migration', () => {
  const locked = {
    ...candidate,
    id: 'locked',
    portability: 0.2,
    reversibility: 0.2,
    vendorLockIn: 0.95,
    migrationCost: 0.9,
    evidenceAgeDays: 365,
    benchmarkValidated: false,
    shadowValidated: false,
    rollbackValidated: false,
  }

  assert.ok(calculateObsolescencePressure(locked) > 0.8)
  assert.equal(calculateFreshnessPressure(locked), 1)

  const assessment = assessTechnology(locked)
  assert.equal(assessment.replacementAllowed, false)
  assert.ok(['prototype', 'watch'].includes(assessment.disposition))
})

test('technology radar sorts by research urgency and exposes an overall resilience grade', () => {
  const lowUrgency = {
    ...candidate,
    id: 'low',
    expectedUpside: 0.1,
    evidenceAgeDays: 0,
    vendorLockIn: 0,
    migrationCost: 0,
  }

  const highUrgency = {
    ...candidate,
    id: 'high',
    expectedUpside: 1,
    evidenceAgeDays: 365,
    vendorLockIn: 0.9,
    migrationCost: 0.8,
    portability: 0.4,
    reversibility: 0.4,
    benchmarkValidated: false,
    shadowValidated: false,
    rollbackValidated: false,
  }

  const assessment = buildFutureResilienceAssessment(perfectBaseline, [lowUrgency, highUrgency])
  assert.equal(assessment.resilienceGrade, 'anti-fragile')
  assert.equal(assessment.technologyRadar[0].candidateId, 'high')
})
