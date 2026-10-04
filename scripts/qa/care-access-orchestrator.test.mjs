import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateCareAccessOrchestration } from '../../src/domains/clinical-operations/model/careAccessOrchestrator.ts'

const evidence = {
  patientIdentityResolved: true,
  coverageIdentityResolved: true,
  encounterLinked: true,
  clinicalRecordSigned: true,
  diagnosisCoded: true,
  serviceItemsCoded: true,
  supportingEvidenceLinked: true,
  provenanceComplete: true,
}

const remoteLab = {
  id: 'lab-route-1',
  orderRecorded: true,
  localCapabilityAvailable: false,
  destinationConfigured: true,
  specimenOrStudyIdentityResolved: true,
  chainOfCustodyComplete: true,
  resultLinkedToPatientState: false,
  state: 'in-transit',
}

const payer = {
  coverage: 'active',
  payerAdapterConfigured: true,
  preauthorization: 'not-required',
  payment: 'not-submitted',
  evidence,
}

test('remote diagnostic route can remain continuous while specimen is in transit', () => {
  const result = evaluateCareAccessOrchestration({ payer, diagnostics: [remoteLab] })
  assert.equal(result.diagnosticContinuityReady, true)
  assert.equal(result.claimReady, true)
  assert.equal(result.priority, 'ready')
  assert.equal(result.nextOperationalAction, 'Claim packet is ready for authorized submission')
})

test('missing remote destination or custody blocks operational continuity', () => {
  const result = evaluateCareAccessOrchestration({
    payer,
    diagnostics: [{ ...remoteLab, destinationConfigured: false, chainOfCustodyComplete: false }],
  })
  assert.equal(result.priority, 'blocked')
  assert.equal(result.diagnosticContinuityReady, false)
  assert.deepEqual(result.blockedDiagnosticIds, ['lab-route-1'])
})

test('result returned from referral lab must be linked back to the same patient state', () => {
  const result = evaluateCareAccessOrchestration({
    payer,
    diagnostics: [{ ...remoteLab, state: 'result-returned', resultLinkedToPatientState: false }],
  })
  assert.equal(result.priority, 'blocked')
  assert.equal(result.diagnosticContinuityReady, false)
})

test('active coverage without a payer adapter fails closed instead of pretending universal reimbursement', () => {
  const result = evaluateCareAccessOrchestration({
    payer: { ...payer, payerAdapterConfigured: false },
    diagnostics: [],
  })
  assert.equal(result.priority, 'blocked')
  assert.equal(result.claimReady, false)
  assert.equal(result.nextOperationalAction, 'Configure the jurisdiction/payer reimbursement adapter')
  assert.ok(result.warnings.includes('Payer adapter is not configured'))
})

test('preauthorization requirement prevents claim-ready state until approved', () => {
  const result = evaluateCareAccessOrchestration({
    payer: { ...payer, preauthorization: 'required' },
    diagnostics: [],
  })
  assert.equal(result.priority, 'attention')
  assert.equal(result.claimReady, false)
  assert.equal(result.nextOperationalAction, 'Resolve coverage eligibility and preauthorization state')
})

test('missing signed record or provenance never becomes a clean claim', () => {
  const result = evaluateCareAccessOrchestration({
    payer: {
      ...payer,
      evidence: { ...evidence, clinicalRecordSigned: false, provenanceComplete: false },
    },
    diagnostics: [],
  })
  assert.equal(result.priority, 'attention')
  assert.equal(result.claimReady, false)
  assert.deepEqual(result.missingClaimEvidence, ['signed clinical record', 'provenance'])
})

test('self-pay path is explicit and does not masquerade as insurance claim readiness', () => {
  const result = evaluateCareAccessOrchestration({
    payer: {
      ...payer,
      coverage: 'self-pay',
      payerAdapterConfigured: false,
      evidence: {
        ...evidence,
        coverageIdentityResolved: false,
      },
    },
    diagnostics: [],
  })
  assert.equal(result.priority, 'ready')
  assert.equal(result.claimReady, false)
  assert.equal(result.nextOperationalAction, 'Proceed with transparent self-pay estimate and settlement workflow')
})
