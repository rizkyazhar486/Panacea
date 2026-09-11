import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assertFeatureFactory,
  calculatePriority,
  generateFeatureCandidates,
} from '../lib/feature-factory.mjs'

const factory = await generateFeatureCandidates()

test('feature factory generates exactly the declared 1000 candidates', () => {
  assert.equal(factory.target, 1000)
  assert.equal(factory.candidates.length, factory.target)
  assert.equal(new Set(factory.candidates.map((candidate) => candidate.id)).size, factory.target)
})

test('every generated source reference resolves through the source registry', () => {
  for (const candidate of factory.candidates) {
    assert.ok(candidate.sourceIds.length > 0, `${candidate.id} must declare source candidates`)
    for (const sourceId of candidate.sourceIds) {
      assert.ok(factory.sourceRegistry.has(sourceId), `${candidate.id} references missing ${sourceId}`)
    }
  }
})

test('source registry resolves stable filename keys without replacing canonical provenance ids', () => {
  const healthkitAlias = factory.sourceRegistry.get('healthkit')
  const healthkitCanonical = factory.sourceRegistry.get('apple_healthkit')

  assert.ok(healthkitAlias, 'healthkit filename alias must resolve')
  assert.ok(healthkitCanonical, 'apple_healthkit canonical id must resolve')
  assert.equal(healthkitAlias, healthkitCanonical)
  assert.equal(healthkitAlias.id, 'apple_healthkit')
  assert.equal(healthkitAlias.registryKey, 'healthkit')
  assert.equal(healthkitAlias.registryPath, 'data/source-registry/wearable/healthkit.json')
})

test('high-risk and clinical candidates can never auto-promote', () => {
  for (const candidate of factory.candidates) {
    if (candidate.risk === 'high' || candidate.risk === 'clinical') {
      assert.equal(candidate.autoEligible, false, candidate.id)
      assert.ok(candidate.blockers.length > 0, `${candidate.id} must explain its gate`)
    }
  }
})

test('heavy performance candidates are gated from automatic promotion', () => {
  for (const candidate of factory.candidates.filter((item) => item.metrics.performance >= 5)) {
    assert.equal(candidate.autoEligible, false, candidate.id)
    assert.ok(candidate.blockers.includes('heavy-asset-performance-review'), candidate.id)
  }
})

test('factory-level semantic validator reports no errors', () => {
  assert.deepEqual(assertFeatureFactory(factory), [])
})

test('priority formula is bounded and rewards benefit while penalizing cost/risk', () => {
  const safe = calculatePriority({
    impact: 5,
    reach: 5,
    complexity: 1,
    performance: 1,
    risk: 'low',
    sourceReadiness: 1,
  })
  const expensiveClinical = calculatePriority({
    impact: 5,
    reach: 5,
    complexity: 5,
    performance: 5,
    risk: 'clinical',
    sourceReadiness: 1,
  })
  assert.ok(safe >= 0 && safe <= 100)
  assert.ok(expensiveClinical >= 0 && expensiveClinical <= 100)
  assert.ok(safe > expensiveClinical)
})
