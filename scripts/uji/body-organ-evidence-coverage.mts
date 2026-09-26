import assert from 'node:assert/strict'
import { BODY_ORGAN_EVIDENCE_COVERAGE, getBodyOrganEvidenceCoverage } from '../../src/lib/bodyOrganEvidenceCoverage.ts'
import { BODY_SYSTEM_SOURCE_WAVE } from '../../src/lib/bodySystemSourceWave.ts'

const expected = BODY_SYSTEM_SOURCE_WAVE.map((system) => system.id).sort()
const actual = BODY_ORGAN_EVIDENCE_COVERAGE.map((row) => row.systemId).sort()
assert.deepEqual(actual, expected, 'every approved body system must appear exactly once')

for (const row of BODY_ORGAN_EVIDENCE_COVERAGE) {
  assert.equal(row.anatomy.kind, 'source-registry')
  assert.notEqual(row.physiology.kind, 'evidence-gap')
  assert.equal(row.imaging.kind, 'shared-workbench')
  assert.ok(row.education.boundary.length > 40)
}

assert.equal(getBodyOrganEvidenceCoverage('reproductive').pathophysiology.kind, 'evidence-gap')
assert.equal(getBodyOrganEvidenceCoverage('reproductive').pharmacology.kind, 'evidence-gap')
assert.equal(getBodyOrganEvidenceCoverage('integumentary-surface').pathophysiology.kind, 'evidence-gap')
assert.ok(getBodyOrganEvidenceCoverage('respiratory').pathophysiology.ids.includes('heart-failure'))
assert.ok(getBodyOrganEvidenceCoverage('respiratory').pathophysiology.ids.includes('venous-thromboembolism'))

console.log(`body organ evidence coverage: ${BODY_ORGAN_EVIDENCE_COVERAGE.length} systems checked`)
