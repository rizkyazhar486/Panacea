import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  LONGEVITY_COMMERCIALIZATION_BOTTLENECKS,
  LONGEVITY_RESEARCH_BOUNDARY,
  LONGEVITY_RESEARCH_CHALLENGES,
} from '../../src/lib/anatomy/longevityResearchChallenges.ts'

assert.deepEqual(
  LONGEVITY_RESEARCH_CHALLENGES.map((item) => item.id),
  ['epigenetic-drift', 'senescence-immunosenescence', 'ecm-crosslinking', 'mitochondrial-decline'],
)

for (const challenge of LONGEVITY_RESEARCH_CHALLENGES) {
  assert.ok(challenge.problem.length > 40, `${challenge.id}: problem statement is too thin`)
  assert.ok(challenge.readouts.length >= 4, `${challenge.id}: requires multiple systems readouts`)
  assert.ok(challenge.levers.length >= 1, `${challenge.id}: requires at least one research lever`)
  for (const lever of challenge.levers) {
    assert.ok(lever.primaryTradeoff.includes(' vs '), `${lever.id}: tradeoff must expose competing objectives`)
    assert.ok(['conceptual', 'preclinical', 'translational-bottleneck'].includes(lever.readiness), `${lever.id}: unsupported readiness state`)
  }
}

assert.deepEqual(
  LONGEVITY_COMMERCIALIZATION_BOTTLENECKS.map((item) => item.dimension),
  ['Indication definition', 'Trial duration & biomarkers', 'Delivery vectors'],
)

assert.match(LONGEVITY_RESEARCH_BOUNDARY, /does not predict lifespan/i)
assert.match(LONGEVITY_RESEARCH_BOUNDARY, /biological immortality/i)
assert.match(LONGEVITY_RESEARCH_BOUNDARY, /patient-specific/i)

const [navigator, simulator] = await Promise.all([
  readFile(new URL('../../src/pages/bodyhub/MultisystemScaleNavigator.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../../src/pages/bodyhub/LongevityResearchSimulator.tsx', import.meta.url), 'utf8'),
])

assert.match(navigator, /selected\.scale === 'aging-longevity'/, 'simulator must be reachable only from the aging-longevity scale')
assert.match(navigator, /<LongevityResearchSimulator\s*\/>/, 'aging-longevity view must mount the simulator')
assert.match(simulator, /Values below are synthetic teaching signals, not biological predictions\./)
assert.match(simulator, /It is not a dose, protocol, clinical recommendation or quantitative biological forecast\./)
assert.match(simulator, /No immortality claim/)

console.log('longevity-research-simulator: four research puzzles, tradeoffs, commercialization constraints and fail-closed educational boundaries are wired into Body Exposure')
