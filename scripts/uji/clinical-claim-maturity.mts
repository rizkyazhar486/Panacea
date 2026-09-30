import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  clinicalClaimDisclosure,
  clinicalClaimLabel,
  clinicalClaimMaturity,
} from '../../src/lib/clinicalClaimMaturity.ts'

assert.equal(
  clinicalClaimMaturity(),
  'technically-working',
  'technical output must remain the default when no review/validation evidence is present',
)
assert.equal(
  clinicalClaimMaturity({ clinicianReviewed: true }),
  'clinician-reviewed',
  'human review must not be mislabeled as clinical validation',
)
assert.equal(
  clinicalClaimMaturity({
    clinicianReviewed: true,
    externalValidation: true,
    validationEvidenceIds: ['   '],
  }),
  'clinician-reviewed',
  'blank validation evidence must fail closed',
)
assert.equal(
  clinicalClaimMaturity({
    clinicianReviewed: true,
    externalValidation: true,
    validationEvidenceIds: ['external-validation:site-b'],
  }),
  'clinically-validated',
  'clinical validation requires explicit human review, external validation and linked evidence',
)
assert.equal(
  clinicalClaimMaturity({
    externalValidation: true,
    validationEvidenceIds: ['external-validation:site-b'],
  }),
  'technically-working',
  'external evidence cannot silently substitute for required human review in this claim contract',
)

assert.equal(clinicalClaimLabel('clinician-reviewed'), 'Clinician-reviewed')
assert.match(
  clinicalClaimDisclosure('clinician-reviewed'),
  /clinical validation is a separate capability-level claim/i,
)
assert.match(
  clinicalClaimDisclosure('technically-working'),
  /not clinician-reviewed or clinically validated/i,
)

const emrSource = readFileSync(new URL('../../src/pages/EMR.tsx', import.meta.url), 'utf8')
assert.doesNotMatch(
  emrSource,
  /Certified by \{draft\.signedBy\}/,
  'a server-confirmed clinician signature must not be presented as clinical certification',
)
assert.doesNotMatch(
  emrSource,
  /AI-assisted, clinician-verified\./,
  'AI-generated patient education must not claim clinician verification without review evidence',
)
assert.match(
  emrSource,
  /data-clinical-claim-maturity=\{maturity\}/,
  'EMR must expose machine-readable claim maturity for rendered review/validation status',
)
assert.match(
  emrSource,
  /Server-confirmed signature by/,
  'signed records should describe the actual server-confirmed event rather than imply validation',
)
assert.match(
  emrSource,
  /AI-generated draft/,
  'generated education must remain visibly draft-level until review evidence exists',
)

console.log('clinical claim maturity: review and clinical validation remain distinct, evidence-gated states')
