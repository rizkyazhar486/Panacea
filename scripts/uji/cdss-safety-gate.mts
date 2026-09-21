import assert from 'node:assert/strict'
import * as cdss from '../../src/lib/cdss.ts'
import type { Patient, PlanItem } from '../../src/lib/types.ts'

const patient: Patient = {
  id: 'p-safety',
  name: 'Safety fixture',
  sex: 'L',
  dob: '1980-01-01',
  mrn: 'TEST',
  heightCm: 170,
  weightKg: 70,
  allergies: [],
  chronicConditions: [],
  riskFlags: [],
  avatarColor: '#000000',
}

const proposed = (text: string, extra: Partial<PlanItem> = {}): PlanItem => ({
  id: 'plan-1',
  category: 'Definitif',
  text,
  source: 'AI',
  status: 'usulan',
  ...extra,
})

type SafetyResult = {
  blocked: boolean
  canVerify: boolean
  overrideApplied: boolean
  blockers: Array<{ id: string; code: string; message: string }>
  warnings: Array<{ id: string; code: string; message: string }>
}

type EvaluatePlanSafety = (
  item: PlanItem,
  patient: Patient,
  medicationContext?: string[],
) => SafetyResult

assert.equal(
  typeof (cdss as Record<string, unknown>).evaluatePlanSafety,
  'function',
  'CDSS must expose a deterministic verification safety gate, not only a heuristic score',
)

const evaluatePlanSafety = (cdss as unknown as { evaluatePlanSafety: EvaluatePlanSafety }).evaluatePlanSafety

const directAllergy = evaluatePlanSafety(
  proposed('Penicillin V 500 mg PO every 6 hours'),
  { ...patient, allergies: ['penicillin'] },
)
assert.equal(directAllergy.blocked, true, 'an explicit documented allergy conflict must hard-block verification')
assert.ok(directAllergy.blockers.some((finding) => finding.code === 'documented-allergy-conflict'))

const majorDdi = evaluatePlanSafety(
  proposed('Warfarin 5 mg PO daily'),
  patient,
  ['Aspirin 81 mg daily'],
)
assert.equal(majorDdi.blocked, true, 'a known major DDI involving the proposed item must hard-block verification')
assert.ok(majorDdi.blockers.some((finding) => finding.code === 'major-ddi'))

const highAlertMissingDose = evaluatePlanSafety(proposed('Start insulin glargine'), patient)
assert.equal(highAlertMissingDose.blocked, true, 'a high-alert medication without an explicit dose must fail closed')
assert.ok(highAlertMissingDose.blockers.some((finding) => finding.code === 'high-alert-dose-unverified'))

const highAlertWithDose = evaluatePlanSafety(proposed('Insulin glargine 10 units SC nightly'), patient)
assert.equal(highAlertWithDose.blocked, false, 'high-alert status alone must not masquerade as a contraindication')
assert.equal(highAlertWithDose.canVerify, true)
assert.ok(highAlertWithDose.warnings.some((finding) => finding.code === 'high-alert-independent-check'))

const unrelatedContext = evaluatePlanSafety(
  proposed('Explain oral rehydration and return precautions', { category: 'Edukasi' }),
  patient,
  ['Warfarin 5 mg daily', 'Aspirin 81 mg daily'],
)
assert.equal(
  unrelatedContext.blocked,
  false,
  'an interaction elsewhere in the medication context must not block an unrelated plan item',
)

const allergyBlockerIds = directAllergy.blockers.map((finding) => finding.id)
const justifiedOverride = evaluatePlanSafety(
  proposed('Penicillin V 500 mg PO every 6 hours', {
    safetyOverride: {
      reason: 'Allergy record reviewed with patient and corrected by clinician before verification.',
      by: 'doctor-001',
      at: '2026-09-21T04:45:00.000Z',
      findingIds: allergyBlockerIds,
    },
  } as Partial<PlanItem>),
  { ...patient, allergies: ['penicillin'] },
)
assert.equal(justifiedOverride.overrideApplied, true)
assert.equal(justifiedOverride.blocked, false)
assert.equal(justifiedOverride.canVerify, true)

const staleOverride = evaluatePlanSafety(
  proposed('Warfarin 5 mg PO daily', {
    safetyOverride: {
      reason: 'Old override for a different finding.',
      by: 'doctor-001',
      at: '2026-09-21T04:45:00.000Z',
      findingIds: ['allergy:penicillin'],
    },
  } as Partial<PlanItem>),
  patient,
  ['Aspirin 81 mg daily'],
)
assert.equal(staleOverride.overrideApplied, false, 'an override must be bound to the current blocker identities')
assert.equal(staleOverride.blocked, true, 'a stale/mismatched override must fail closed')

console.log('cdss-safety-gate: ok')
