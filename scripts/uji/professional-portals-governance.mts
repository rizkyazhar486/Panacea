import assert from 'node:assert/strict'
import {
  applyVerificationDecision,
  assertRoleDataBoundary,
  detectContradictionsAndDiff,
  runAutomatedContributionChecks,
  type ContributionSubmission,
} from '../../src/domains/human-review/knowledgeGovernanceEngine.ts'

// 1. Strict role isolation: contributor CANNOT access patient records
const contribReadPatient = assertRoleDataBoundary('kontributor', 'patient_record')
assert.equal(contribReadPatient.allowed, false)
assert.equal(contribReadPatient.statusCode, 403)

const contribWriteKnowledge = assertRoleDataBoundary('kontributor', 'knowledge_submission')
assert.equal(contribWriteKnowledge.allowed, true)

const docVerify = assertRoleDataBoundary('dokter', 'verification_decision')
assert.equal(docVerify.allowed, true)
const contribVerify = assertRoleDataBoundary('kontributor', 'verification_decision')
assert.equal(contribVerify.allowed, false)

// 2. Automated checks catch PHI leak, missing citations/COI/license, and unsafe auto-prescribe claims
const baseSub: ContributionSubmission = {
  id: 'sub-1',
  kind: 'medication_formulary',
  title: 'Dosis Aman Furosemide',
  bodySummary: 'Furosemide 20–40 mg IV dengan pemantauan K+.',
  structuredFields: { dose: '20-40 mg IV', monitoring: 'Kalium serum' },
  citation: 'FORNAS & PPK Jantung PERKI',
  conflictOfInterest: 'Tidak ada',
  license: 'CC-BY-4.0',
  authorName: 'Kontributor A',
  authorRole: 'kontributor',
  stage: 'Submitted',
  verificationStatus: 'Unverified',
}
const cleanCheck = runAutomatedContributionChecks(baseSub)
assert.equal(cleanCheck.passedAll, true)

const phiLeaked = runAutomatedContributionChecks({
  ...baseSub,
  bodySummary: 'Pasien NIK 3273010101900001 RM-991122 telepon 081234567890 datang berobat',
})
assert.equal(phiLeaked.passedAll, false)
assert.equal(phiLeaked.phiLeakDetected, true)

const unsafeClaim = runAutomatedContributionChecks({
  ...baseSub,
  bodySummary: 'Sistem auto-prescribe dan 100% sembuh tanpa perlu dokter',
})
assert.equal(unsafeClaim.passedAll, false)
assert.equal(unsafeClaim.unsafeClaimDetected, true)

// 3. Hard invariant: AI CANNOT grant `Clinically reviewed`
const aiAttempt = applyVerificationDecision(baseSub, {
  actorKind: 'ai',
  actorName: 'Panacea AI',
  targetStatus: 'Clinically reviewed',
  note: 'AI approval attempt',
  checksReport: cleanCheck,
})
assert.equal(aiAttempt.ok, false)
if (!aiAttempt.ok) assert.equal(aiAttempt.code, 'AI_CANNOT_GRANT_CLINICAL_REVIEW')

// Human specialist without credential fails
const missingCred = applyVerificationDecision(baseSub, {
  actorKind: 'human_specialist',
  actorName: 'dr. S, Sp.PD',
  targetStatus: 'Clinically reviewed',
  note: 'Reviewed',
  checksReport: cleanCheck,
})
assert.equal(missingCred.ok, false)

// Human specialist WITH credential succeeds
const validHuman = applyVerificationDecision(baseSub, {
  actorKind: 'human_specialist',
  actorName: 'dr. S, Sp.PD',
  credentialId: 'STR-SPPD-991',
  targetStatus: 'Clinically reviewed',
  note: 'Sesuai FORNAS & PPK',
  checksReport: cleanCheck,
})
assert.equal(validHuman.ok, true)
if (validHuman.ok) {
  assert.equal(validHuman.updated.verificationStatus, 'Clinically reviewed')
  assert.equal(validHuman.updated.stage, 'Published')
}

// 4. Side-by-side diff & dose contradiction detection
const diff = detectContradictionsAndDiff(
  { dose: '60 mg IV bolus', note: 'Tambahan' },
  { dose: '30 mg IV bolus' },
)
assert.equal(diff.contradictions.length, 1)
assert.match(diff.contradictions[0], /dose/)

console.log('professional-portals-governance: all deterministic assertions PASSED.')
