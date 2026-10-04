import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const matrix = JSON.parse(read('governance/UNIVERSAL_HUMAN_ACCEPTANCE.json'))

const expected = [
  'accessibility',
  'language-localization',
  'health-digital-literacy',
  'cultural-worldview-respect',
  'life-stage-suitability',
  'ability-inclusion',
  'affordability-low-resource',
  'offline-low-bandwidth',
  'device-independence',
  'role-adaptability',
  'jurisdiction-adaptability',
  'agency-consent',
  'dignity-non-stigmatization',
]

test('universal human acceptance standard is wired into core authority', () => {
  for (const path of [
    'PANACEA_SYSTEM_10_STANDARD.md',
    'PANACEA_PRODUCT_MATURITY_OS.md',
    'PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md',
    'PANACEA_INDEPENDENT_REVIEW_DOSSIER.md',
    'AGENTS.md',
  ]) {
    assert.match(read(path), /PANACEA_UNIVERSAL_HUMAN_ACCEPTANCE_STANDARD\.md/)
  }
})

test('universal acceptance matrix covers every required weakest-link dimension', () => {
  assert.deepEqual(matrix.dimensions.map((row) => row.id), expected)
})

test('unmeasured universality dimensions cannot self-award 10/10', () => {
  for (const row of matrix.dimensions) {
    assert.equal(row.score, null, row.id + ' must remain unscored until measured')
    assert.ok(typeof row.blocker === 'string' && row.blocker.length > 10)
    assert.ok(typeof row.next_experiment === 'string' && row.next_experiment.length > 10)
  }
})

test('standard rejects rigid one-size-fits-all universality and preserves compactness', () => {
  const standard = read('PANACEA_UNIVERSAL_HUMAN_ACCEPTANCE_STANDARD.md')
  assert.match(standard, /Universal does not mean identical/)
  assert.match(standard, /Maximum orchestration depth, minimum visible complexity/)
  assert.match(standard, /Any human\. Any care setting\. One trusted longitudinal care flow/)
  assert.match(standard, /no unnecessary exclusion/)
})
