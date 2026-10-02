import assert from 'node:assert/strict'
import {
  ARTICULAR_SOURCE_BOUNDARY,
  ARTICULAR_SOURCE_CANDIDATE,
  articularSourceAdmissionStatus,
  articularSourceMayPromoteSystem,
} from '../../src/lib/anatomy/articularSourceCandidate.ts'

assert.equal(ARTICULAR_SOURCE_CANDIDATE.upstreamRepository, 'LluisV/Z-Anatomy')
assert.equal(ARTICULAR_SOURCE_CANDIDATE.upstreamCommit, '6c7f9016bd5899ac8edafd31b9900c151df42ed6')
assert.equal(ARTICULAR_SOURCE_CANDIDATE.upstreamPath, 'Resources/Models/FBX/Joints100.fbx')
assert.equal(ARTICULAR_SOURCE_CANDIDATE.upstreamBlobSha, '9db06d20217f4f42999dcfdf31b1f6af78dc7794')
assert.equal(ARTICULAR_SOURCE_CANDIDATE.upstreamBytes, 9_804_796)
assert.equal(ARTICULAR_SOURCE_CANDIDATE.currentStatus, 'candidate-unimported')
assert.equal(ARTICULAR_SOURCE_CANDIDATE.patientSpecific, false)
assert.equal(ARTICULAR_SOURCE_CANDIDATE.clinicalInferenceAllowed, false)
assert.deepEqual(ARTICULAR_SOURCE_CANDIDATE.attribution, [
  'BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan',
  'Z-Anatomy - The open source atlas of anatomy - CC-BY-SA 4.0',
])

const absent = {
  sourceNodeCount: 0,
  objectNamesPreserved: false,
  referenceFrameVerified: false,
  licenseScopeVerified: false,
  academicReviewComplete: false,
}
assert.equal(articularSourceAdmissionStatus(absent), 'candidate-unimported')
assert.equal(articularSourceMayPromoteSystem(absent), false)

const convertedOnly = {
  convertedArtifactSha256: 'sha256-placeholder-for-test',
  sourceNodeCount: 1,
  objectNamesPreserved: true,
  referenceFrameVerified: false,
  licenseScopeVerified: true,
  academicReviewComplete: false,
}
assert.equal(articularSourceAdmissionStatus(convertedOnly), 'converted-unverified')
assert.equal(articularSourceMayPromoteSystem(convertedOnly), false)

const fullyVerified = {
  ...convertedOnly,
  referenceFrameVerified: true,
  academicReviewComplete: true,
}
assert.equal(articularSourceAdmissionStatus(fullyVerified), 'source-verified')
assert.equal(articularSourceMayPromoteSystem(fullyVerified), true)
assert.match(ARTICULAR_SOURCE_BOUNDARY, /Do not mark articular anatomy shipped/)

console.log('body-articular-source-candidate: ok')
