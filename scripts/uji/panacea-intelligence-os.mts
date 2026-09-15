import assert from 'node:assert/strict'
import {
  EVIDENCE_TIERS,
  HEALTH_GRAPH_DOMAINS,
  REVENUE_LAYERS,
  VALUE_LOOP,
  deliveryGate,
  estimateCacPaybackMonths,
  estimateLtv,
  healthGraphCoverage,
  ltvCacRatio,
} from '../../src/lib/panaceaOperatingModel.ts'

assert.equal(HEALTH_GRAPH_DOMAINS.length, 10)
assert.equal(new Set(HEALTH_GRAPH_DOMAINS.map((domain) => domain.key)).size, HEALTH_GRAPH_DOMAINS.length)
assert.equal(VALUE_LOOP[0], 'Ingest')
assert.equal(VALUE_LOOP.at(-1), 'Learn')
assert.ok(REVENUE_LAYERS.length >= 8)

assert.deepEqual(EVIDENCE_TIERS.map((tier) => tier.tier), ['A', 'B', 'C', 'D', 'X'])
assert.equal(deliveryGate('A'), 'support-eligible')
assert.equal(deliveryGate('B', { patientSpecific: true, clinicianReviewed: false }), 'clinician-review-required')
assert.equal(deliveryGate('B', { patientSpecific: true, clinicianReviewed: true }), 'support-eligible')
assert.equal(deliveryGate('C'), 'clinician-review-required')
assert.equal(deliveryGate('D'), 'research-only')
assert.equal(deliveryGate('X'), 'blocked')

assert.equal(healthGraphCoverage(5), 50)
assert.equal(healthGraphCoverage(20), 100)
assert.equal(healthGraphCoverage(-2), 0)
assert.equal(healthGraphCoverage(1, 0), undefined)

const ltv = estimateLtv(29, 0.78, 0.03)
assert.ok(ltv !== undefined)
assert.ok(Math.abs(ltv - 754) < 0.001)
assert.equal(estimateLtv(29, 0.78, 0), undefined)
assert.equal(estimateLtv(29, 1.2, 0.03), undefined)

const payback = estimateCacPaybackMonths(70, 29, 0.78)
assert.ok(payback !== undefined)
assert.ok(Math.abs(payback - 3.0946) < 0.001)
assert.equal(estimateCacPaybackMonths(70, 0, 0.78), undefined)

const ratio = ltvCacRatio(ltv, 70)
assert.ok(ratio !== undefined)
assert.ok(ratio > 10)
assert.equal(ltvCacRatio(100, 0), undefined)

console.log('Panacea Intelligence OS: health graph, evidence gates, and business formulas validated')
