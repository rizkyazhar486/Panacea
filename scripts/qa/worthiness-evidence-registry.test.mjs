import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const registry = JSON.parse(readFileSync(new URL('../../governance/WORTHINESS_EVIDENCE.json', import.meta.url), 'utf8'))

const expected = [
  'problem-reality',
  'clinical-human-utility',
  'workflow-advantage',
  'trustworthiness',
  'architecture-coherence',
  'interoperability',
  'resilience-survivability',
  'economic-purchasing-value',
  'differentiation',
  'compactness',
  'defensibility',
  'global-adaptability',
  'universal-human-acceptance',
  'validated-vertical-depth',
  'evidence-maturity',
]

test('worthiness registry contains every required independent-review dimension', () => {
  assert.deepEqual(registry.dimensions.map((row) => row.id), expected)
})

test('unmeasured repository evidence cannot self-award a 10/10 score', () => {
  for (const row of registry.dimensions) {
    if (row.evidence_level === 'E0' || row.evidence_level === 'E1') {
      assert.equal(row.score, null, row.id + ' must remain unscored at E0/E1')
    }
  }
})

test('every dimension exposes evidence, a blocker and a next experiment', () => {
  for (const row of registry.dimensions) {
    assert.ok(Array.isArray(row.evidence) && row.evidence.length > 0, row.id + ' missing evidence pointers')
    assert.ok(typeof row.blocker === 'string' && row.blocker.length > 10, row.id + ' missing blocker')
    assert.ok(typeof row.next_experiment === 'string' && row.next_experiment.length > 10, row.id + ' missing next experiment')
  }
})
