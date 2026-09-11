import assert from 'node:assert/strict'
import {
  FASCIAL_SOURCE_BOUNDARY,
  FASCIAL_SOURCE_CANDIDATES,
  FASCIAL_SOURCE_PROVENANCE,
  fascialSourceAdmissionStatus,
  fascialSourceMayPromoteSystem,
} from '../../src/lib/anatomy/fascialSourceCandidate.ts'

assert.equal(FASCIAL_SOURCE_PROVENANCE.upstreamRepository, 'LluisV/Z-Anatomy')
assert.equal(FASCIAL_SOURCE_PROVENANCE.upstreamCommit, '6c7f9016bd5899ac8edafd31b9900c151df42ed6')
assert.equal(FASCIAL_SOURCE_PROVENANCE.repositoryLicense, 'CC-BY-SA-4.0')
assert.equal(FASCIAL_SOURCE_PROVENANCE.currentStatus, 'candidate-unimported')
assert.equal(FASCIAL_SOURCE_PROVENANCE.patientSpecific, false)
assert.equal(FASCIAL_SOURCE_PROVENANCE.clinicalInferenceAllowed, false)

assert.deepEqual(
  FASCIAL_SOURCE_CANDIDATES.map((entry) => [entry.domain, entry.upstreamBlobSha, entry.upstreamBytes]),
  [
    ['deep-msk', '2477e1b6caf97d7174762b5eec6cf1c80db64eed', 37_343_180],
    ['visceral', '355770ae46123044c85deca03de3fb880b8f7301', 18_401_708],
    ['neural', '4ec6e3cb2a1ba821aca02c1d523ac614fdf41a02', 53_887_724],
  ],
)

const absent = {
  sourceNodeCount: 0,
  objectNamesPreserved: false,
  referenceFrameVerified: false,
  licenseScopeVerified: false,
  academicReviewComplete: false,
}
assert.equal(fascialSourceAdmissionStatus(absent), 'candidate-unimported')
assert.equal(fascialSourceMayPromoteSystem([absent, absent, absent]), false)

const convertedOnly = {
  convertedArtifactSha256: 'sha256-placeholder-for-test',
  sourceNodeCount: 1,
  objectNamesPreserved: true,
  referenceFrameVerified: false,
  licenseScopeVerified: true,
  academicReviewComplete: false,
}
assert.equal(fascialSourceAdmissionStatus(convertedOnly), 'converted-unverified')
assert.equal(fascialSourceMayPromoteSystem([convertedOnly, convertedOnly, convertedOnly]), false)

const verified = {
  ...convertedOnly,
  referenceFrameVerified: true,
  academicReviewComplete: true,
}
assert.equal(fascialSourceAdmissionStatus(verified), 'source-verified')
assert.equal(fascialSourceMayPromoteSystem([verified, verified, verified]), true)
assert.equal(fascialSourceMayPromoteSystem([verified, verified]), false)
assert.match(FASCIAL_SOURCE_BOUNDARY, /Do not mark fascial anatomy shipped/)

console.log('body-fascial-source-candidate: ok')
