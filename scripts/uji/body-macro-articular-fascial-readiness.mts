import assert from 'node:assert/strict'
import {
  MACRO_ARTICULAR_FASCIAL_TARGETS,
  auditMacroArticularFascialReadiness,
} from '../../src/lib/anatomy/macroArticularFascialReadiness.ts'

assert.equal(MACRO_ARTICULAR_FASCIAL_TARGETS.length, 13)
assert.equal(MACRO_ARTICULAR_FASCIAL_TARGETS.filter((target) => target.domain === 'articular').length, 9)
assert.equal(MACRO_ARTICULAR_FASCIAL_TARGETS.filter((target) => target.domain === 'fascial').length, 4)

for (const target of MACRO_ARTICULAR_FASCIAL_TARGETS) {
  assert.equal(target.geometryStatus, 'verification-required')
  assert.equal(target.academicReviewStatus, 'pending')
  assert.ok(target.evidence.length >= 1)
  assert.ok(target.nodeHints.length >= 1)
  assert.ok(target.sourceFiles.length >= 1)
}

const audit = auditMacroArticularFascialReadiness()
assert.equal(audit.length, MACRO_ARTICULAR_FASCIAL_TARGETS.length)
for (const record of audit) {
  assert.equal(record.verifiedGeometryAllowed, false)
  assert.ok(
    record.status === 'source-candidate-missing' || record.status === 'blocked-provenance-review',
    `${record.target.id} must remain fail-closed`,
  )
  if (record.matchedSourceNames.length) {
    assert.equal(record.status, 'blocked-provenance-review')
  } else {
    assert.equal(record.status, 'source-candidate-missing')
  }
}

const synthetic = auditMacroArticularFascialReadiness([
  {
    file: 'skeletal.glb',
    names: ['Knee joint', 'Hip joint'],
  },
  {
    file: 'muscular.glb',
    names: ['Deep fascia'],
  },
])

assert.equal(synthetic.find((record) => record.target.id === 'articular:knee')?.status, 'blocked-provenance-review')
assert.equal(synthetic.find((record) => record.target.id === 'articular:hip')?.status, 'blocked-provenance-review')
assert.equal(synthetic.find((record) => record.target.id === 'fascial:deep-msk')?.status, 'blocked-provenance-review')
assert.equal(synthetic.find((record) => record.target.id === 'fascial:visceral')?.status, 'source-candidate-missing')

console.log(JSON.stringify({
  targets: audit.length,
  sourceCandidates: audit.filter((record) => record.matchedSourceNames.length > 0).length,
  blockedByProvenance: audit.filter((record) => record.status === 'blocked-provenance-review').length,
  missingSourceCandidates: audit.filter((record) => record.status === 'source-candidate-missing').length,
}, null, 2))
