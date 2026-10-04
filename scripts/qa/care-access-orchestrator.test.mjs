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
  assert.equal(result.diagnosticContinuity.state, 'intact')
  assert.equal(result.financialWorkflow.claimSubmissionReady, true)
  assert.equal(result.financialWorkflow.state, 'ready')
  assert.equal(result.financialWorkflow.nextAdministrativeAction, 'Claim packet is ready for authorized submission')
})

test('diagnostic continuity gap does not masquerade as a clinical-care block', () => {
  const result = evaluateCareAccessOrchestration({
    payer,
    diagnostics: [{ ...remoteLab, destinationConfigured: false, chainOfCustodyComplete: false }],
  })
  assert.equal(result.diagnosticContinuity.state, 'gap')
  assert.deepEqual(result.diagnosticContinuity.blockedDiagnosticIds, ['lab-route-1'])
  assert.equal(result.clinicalCare.authority, 'outside-orchestrator')
  assert.equal(result.clinicalCare.financialStateMayDenyCare, false)
  assert.equal(result.clinicalCare.diagnosticStateMayAuthorizeTreatment, false)
  assert.equal(result.financialWorkflow.state, 'ready')
})

test('result returned from referral lab must be linked back to the same patient state', () => {
  const result = evaluateCareAccessOrchestration({
    payer,
    diagnostics: [{ ...remoteLab, state: 'result-returned', resultLinkedToPatientState: false }],
  })
  assert.equal(result.diagnosticContinuity.state, 'gap')
})

test('active coverage without a payer adapter blocks only the financial workflow', () => {
  const result = evaluateCareAccessOrchestration({
    payer: { ...payer, payerAdapterConfigured: false },
    diagnostics: [],
  })
  assert.equal(result.financialWorkflow.state, 'blocked')
  assert.equal(result.financialWorkflow.claimSubmissionReady, false)
  assert.equal(result.financialWorkflow.nextAdministrativeAction, 'Configure the jurisdiction/payer reimbursement adapter')
  assert.equal(result.clinicalCare.financialStateMayDenyCare, false)
  assert.ok(result.warnings.includes('Payer adapter is not configured'))
})

test('preauthorization requirement prevents claim submission until approved', () => {
  const result = evaluateCareAccessOrchestration({
    payer: { ...payer, preauthorization: 'required' },
    diagnostics: [],
  })
  assert.equal(result.financialWorkflow.state, 'attention')
  assert.equal(result.financialWorkflow.claimSubmissionReady, false)
  assert.equal(result.financialWorkflow.preauthorizationReady, false)
  assert.equal(result.financialWorkflow.nextAdministrativeAction, 'Resolve coverage eligibility and preauthorization state')
})

test('missing signed record or provenance never becomes a clean claim', () => {
  const result = evaluateCareAccessOrchestration({
    payer: {
      ...payer,
      evidence: { ...evidence, clinicalRecordSigned: false, provenanceComplete: false },
    },
    diagnostics: [],
  })
  assert.equal(result.financialWorkflow.state, 'attention')
  assert.equal(result.financialWorkflow.claimEvidenceReady, false)
  assert.equal(result.financialWorkflow.claimSubmissionReady, false)
  assert.deepEqual(result.financialWorkflow.missingClaimEvidence, ['signed clinical record', 'provenance'])
})

test('self-pay path is explicit and never masquerades as insurer claim readiness', () => {
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
  assert.equal(result.financialWorkflow.state, 'ready')
  assert.equal(result.financialWorkflow.claimSubmissionReady, false)
  assert.equal(result.financialWorkflow.nextAdministrativeAction, 'Proceed with transparent self-pay estimate and settlement workflow')
  assert.equal(result.clinicalCare.financialStateMayDenyCare, false)
})

test('inactive coverage cannot be interpreted as denial of clinically indicated care', () => {
  const result = evaluateCareAccessOrchestration({
    payer: { ...payer, coverage: 'inactive' },
    diagnostics: [],
  })
  assert.equal(result.financialWorkflow.state, 'blocked')
  assert.equal(result.clinicalCare.authority, 'outside-orchestrator')
  assert.equal(result.clinicalCare.financialStateMayDenyCare, false)
})

test('payment denial is an administrative attention state, not clinical authority', () => {
  const result = evaluateCareAccessOrchestration({
    payer: { ...payer, payment: 'denied' },
    diagnostics: [],
  })
  assert.equal(result.financialWorkflow.state, 'attention')
  assert.equal(result.financialWorkflow.claimSubmissionReady, false)
  assert.match(result.financialWorkflow.nextAdministrativeAction, /resubmission or appeal/)
  assert.equal(result.clinicalCare.financialStateMayDenyCare, false)
})

test('legacy top-level blocked/ready fields are absent to prevent semantic misuse', () => {
  const result = evaluateCareAccessOrchestration({ payer, diagnostics: [] })
  assert.equal('priority' in result, false)
  assert.equal('claimReady' in result, false)
  assert.equal('diagnosticContinuityReady' in result, false)
})
