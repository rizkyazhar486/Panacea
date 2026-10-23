import assert from 'node:assert/strict'
import { analyzePhageCampaign, parsePhageCount, wilsonInterval95, PHAGE_RESEARCH_BOUNDARY, simulateVirtualPhage } from '../../src/lib/biology/phageResearchSandbox.ts'
for (const missing of ['', ' ', null, undefined]) assert.equal(parsePhageCount(missing), null)
for (const invalid of ['-1', '1.5', '1e3', 'NaN', 'Infinity', {}, [], true, NaN, Infinity, -Infinity, 1.5, -1, Number.MAX_SAFE_INTEGER + 1]) assert.equal(parsePhageCount(invalid), null)
for (const valid of ['0', ' 3 ', '003', '+3', 0, 3, Number.MAX_SAFE_INTEGER, String(Number.MAX_SAFE_INTEGER)]) assert.equal(parsePhageCount(valid), Number(valid))
const sample = { designed: 285, assembled: 285, viable: 16, offTargetHostsTested: 6, offTargetHostsWithGrowth: 0 }
const result = analyzePhageCampaign(sample)
assert.equal(result.assemblyRate, 1)
assert.equal(result.viabilityRate, 16 / 285)
assert.equal(result.overallYield, 16 / 285)
assert.equal(result.offTargetNoGrowthRate, 1)
for (const field of Object.keys(sample)) assert.throws(() => analyzePhageCampaign({ ...sample, [field]: Number.MAX_SAFE_INTEGER + 1 }), RangeError, 'unsafe precision must not be scientific evidence')
assert.throws(() => analyzePhageCampaign({ ...sample, assembled: 286 }), /assembled cannot exceed designed/)
assert.throws(() => analyzePhageCampaign({ ...sample, viable: 286 }), /viable cannot exceed assembled/)
assert.throws(() => analyzePhageCampaign({ ...sample, offTargetHostsWithGrowth: 7 }), /cannot exceed/)
// Exhaustive small-count property grid, including genuine zero numerators.
for (let n = 1; n <= 25; n++) for (let successes = 0; successes <= n; successes++) {
  const [lo, hi] = wilsonInterval95(successes, n)
  assert.ok(Number.isFinite(lo) && Number.isFinite(hi) && lo >= 0 && hi <= 1 && lo <= hi)
  assert.ok(lo <= successes / n + 1e-12 && hi >= successes / n - 1e-12)
  const x = analyzePhageCampaign({ designed: n, assembled: n, viable: successes, offTargetHostsTested: n, offTargetHostsWithGrowth: successes })
  assert.equal(x.overallYield, successes / n)
  assert.equal(x.offTargetGrowthRate, successes / n)
}
assert.throws(() => wilsonInterval95(0, Number.MAX_SAFE_INTEGER + 1), RangeError)
assert.equal(simulateVirtualPhage({ targetSelectivity: .8, evidenceCoverage: .7, environmentalRobustness: .5, noveltyPressure: .3 }).executable, false)
assert.ok(PHAGE_RESEARCH_BOUNDARY.blocked.includes('wet-lab construction protocol'))
console.log('Campaign input: missing/zero/precision/relationships/proportion properties and non-executable boundary PASS')
