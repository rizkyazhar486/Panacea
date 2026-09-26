import assert from 'node:assert/strict'
import {
  PHAGE_RESEARCH_BOUNDARY,
  analyzePhageCampaign,
  isBlockedPhageCapability,
  simulateVirtualPhage,
  wilsonInterval95,
} from '../../src/lib/phageResearchSandbox.ts'

const scienceLike = analyzePhageCampaign({
  designed: 285,
  assembled: 285,
  viable: 16,
  offTargetHostsTested: 6,
  offTargetHostsWithGrowth: 0,
})

assert.ok(Math.abs(scienceLike.overallYield - 16 / 285) < 1e-12)
assert.ok(Math.abs(scienceLike.viabilityRate - 16 / 285) < 1e-12)
assert.equal(scienceLike.offTargetNoGrowthRate, 1)
assert.ok(scienceLike.viabilityWilson95[0] < scienceLike.viabilityRate)
assert.ok(scienceLike.viabilityWilson95[1] > scienceLike.viabilityRate)

assert.deepEqual(wilsonInterval95(0, 0), [0, 0])
assert.throws(() => analyzePhageCampaign({
  designed: 10,
  assembled: 11,
  viable: 1,
  offTargetHostsTested: 0,
  offTargetHostsWithGrowth: 0,
}), /assembled cannot exceed designed/)

const virtual = simulateVirtualPhage({
  targetSelectivity: 0.8,
  evidenceCoverage: 0.7,
  environmentalRobustness: 0.5,
  noveltyPressure: 0.3,
})

assert.equal(virtual.executable, false)
for (const key of ['specificityProxy', 'evidenceAdjustedConfidence', 'modelUncertainty', 'tradeoffPressure'] as const) {
  assert.ok(virtual[key] >= 0 && virtual[key] <= 1, `${key} must stay normalized`)
}
assert.equal('sequence' in virtual, false)
assert.ok(PHAGE_RESEARCH_BOUNDARY.blocked.includes('viral genome generation'))
assert.equal(isBlockedPhageCapability('viral genome generation request'), true)
assert.equal(isBlockedPhageCapability('published-campaign metrics'), false)

console.log('phage research sandbox: campaign math, abstract simulation, and non-executable safety boundary validated')
