import assert from 'node:assert/strict'
import {
  SUPERFICIAL_FASCIA_EVIDENCE_BOUNDARY,
  SUPERFICIAL_FASCIA_EVIDENCE_LADDER,
  SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS,
  SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES,
  SUPERFICIAL_FASCIA_TEXT_EVIDENCE,
  currentSuperficialFasciaEvidenceTier,
  superficialFasciaCandidateAdmissionReady,
  superficialFasciaEvidenceMayPromoteSystem,
} from '../../src/lib/anatomy/fascialSourceEvidenceLadder.ts'

assert.deepEqual(SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES, [
  'Superficial layer of temporal fascia.r',
  'Superficial layer of temporal fascia.l',
  'Superficial investing cervical fascia.r',
  'Superficial investing cervical fascia.l',
])

assert.deepEqual(
  SUPERFICIAL_FASCIA_TEXT_EVIDENCE.map((entry) => [entry.id, entry.upstreamBlobSha]),
  [
    ['layer-7', 'a622236baad28d662033fe6bd3a2c4eaf0b3a371'],
    ['collection-fasciae', 'e04b98afb00fc5967af4ae2b184589900268fd2f'],
    ['collection-csv', 'c33926393ae2e1834998048f4abdd2dcf0cd0cbe'],
    ['hierarchy', 'a45d444963d4d41b0c32d81e2b9ee2f7e92cbd89'],
    ['object-inventory', '269988a630788cb6ab052bef5fed23ed4eb2d72a'],
  ],
)
assert.equal(new Set(SUPERFICIAL_FASCIA_TEXT_EVIDENCE.map((entry) => entry.upstreamPath)).size, 5)

assert.equal(SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBlobSha, '2477e1b6caf97d7174762b5eec6cf1c80db64eed')
assert.equal(SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBytes, 37_343_180)
assert.equal(SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.importerMetadataBlobSha, '69274fff276fc408f1ce4787d1a3e28c572333e8')
assert.deepEqual(SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.observedMaterialClasses, ['Fascia', 'Superficial'])
assert.equal(SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.status, 'bundle-host-hypothesis-only')
assert.equal(SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.sourceNodeIdentityVerified, false)

assert.deepEqual(
  SUPERFICIAL_FASCIA_EVIDENCE_LADDER.map((entry) => [entry.tier, entry.satisfied]),
  [
    ['layer-manifest', true],
    ['cross-indexed-text', true],
    ['bundle-metadata-compatible', true],
    ['bundle-node-verified', false],
    ['converted-artifact-verified', false],
    ['same-frame-verified', false],
    ['license-scope-verified', false],
    ['academic-review-complete', false],
  ],
)
assert.equal(currentSuperficialFasciaEvidenceTier(), 'bundle-metadata-compatible')

const absent = {
  candidateBundleSha: SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBlobSha,
  verifiedSourceNodeNames: [],
  objectNamesPreserved: false,
  referenceFrameVerified: false,
  licenseScopeVerified: false,
  academicReviewComplete: false,
}
assert.equal(superficialFasciaCandidateAdmissionReady(absent), false)

const textOnly = {
  ...absent,
  verifiedSourceNodeNames: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES,
}
assert.equal(superficialFasciaCandidateAdmissionReady(textOnly), false, 'text labels alone must not admit a source candidate')

const wrongBundle = {
  ...textOnly,
  candidateBundleSha: 'not-the-pinned-bundle',
  convertedArtifactSha256: 'sha256-test-only',
  objectNamesPreserved: true,
  referenceFrameVerified: true,
  licenseScopeVerified: true,
  academicReviewComplete: true,
}
assert.equal(superficialFasciaCandidateAdmissionReady(wrongBundle), false)

const missingOneNode = {
  ...wrongBundle,
  candidateBundleSha: SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBlobSha,
  verifiedSourceNodeNames: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES.slice(0, -1),
}
assert.equal(superficialFasciaCandidateAdmissionReady(missingOneNode), false)

const futureFullyVerifiedCandidate = {
  ...wrongBundle,
  candidateBundleSha: SUPERFICIAL_FASCIA_HOST_BUNDLE_HYPOTHESIS.bundleBlobSha,
  verifiedSourceNodeNames: SUPERFICIAL_FASCIA_REQUIRED_SOURCE_NODES,
}
assert.equal(
  superficialFasciaCandidateAdmissionReady(futureFullyVerifiedCandidate),
  true,
  'only an explicitly verified future candidate may satisfy candidate-admission readiness',
)
assert.equal(
  superficialFasciaEvidenceMayPromoteSystem(),
  false,
  'candidate evidence must never bypass the canonical macro closure/system admission gates',
)

assert.match(SUPERFICIAL_FASCIA_EVIDENCE_BOUNDARY, /bundle-metadata compatibility only/i)
assert.match(SUPERFICIAL_FASCIA_EVIDENCE_BOUNDARY, /do not prove FBX source-node identity/i)
assert.match(SUPERFICIAL_FASCIA_EVIDENCE_BOUNDARY, /system:fascial fail-closed/i)

console.log('body-superficial-fascia-evidence-ladder: cross-indexed text + bundle metadata stop before node identity')
