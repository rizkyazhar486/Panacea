import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  LONGEVITY_PROGRAMS,
  LONGEVITY_RESEARCH_BOUNDARY,
  LONGEVITY_TRANSLATION_BOTTLENECKS,
  listLongevityLevers,
  simulateLongevityStrategy,
} from '../../src/lib/longevityProblemSolver.ts'

const coreIds = [
  'epigenetic-reprogramming',
  'senescence-immunity',
  'ecm-crosslinking',
  'mitochondrial-genome',
]

assert.equal(LONGEVITY_PROGRAMS.length, 8)
assert.deepEqual(LONGEVITY_PROGRAMS.slice(0, 4).map((program) => program.id), coreIds)
assert.ok(LONGEVITY_PROGRAMS.every((program) => program.levers.length >= 4))
assert.equal(listLongevityLevers().length, 32)
assert.equal(new Set(listLongevityLevers().map((lever) => lever.id)).size, 32)
assert.ok(LONGEVITY_TRANSLATION_BOTTLENECKS.length >= 5)

const zero = Object.fromEntries(listLongevityLevers().map((lever) => [lever.id, 0]))
const baseline = simulateLongevityStrategy({ intensities: zero, deliverySpecificity: 50, reversibility: 50, validationStrength: 30 })
const stress = simulateLongevityStrategy({
  intensities: { ...zero, 'epi-pulse': 85, 'sen-cell': 80, 'ecm-cleave': 80, 'mito-editor': 80, 'stem-expand': 80 },
  deliverySpecificity: 35,
  reversibility: 30,
  validationStrength: 25,
})

for (const value of Object.values(baseline).filter((value) => typeof value === 'number')) {
  assert.ok(value >= 0 && value <= 100)
}
for (const value of Object.values(stress).filter((value) => typeof value === 'number')) {
  assert.ok(value >= 0 && value <= 100)
}
assert.ok(stress.dominantRisks.length >= 4)
assert.ok(stress.dominantRisks.some((risk) => /identity/i.test(risk)))
assert.ok(stress.dominantRisks.some((risk) => /immune/i.test(risk)))
assert.ok(stress.dominantRisks.some((risk) => /matrix/i.test(risk)))
assert.ok(stress.dominantRisks.some((risk) => /mtDNA|heteroplasmy/i.test(risk)))

assert.match(LONGEVITY_RESEARCH_BOUNDARY, /research-frontier/i)
assert.match(LONGEVITY_RESEARCH_BOUNDARY, /synthetic visualization heuristics/i)
assert.match(LONGEVITY_RESEARCH_BOUNDARY, /not measured biology/i)

const navigator = await readFile(new URL('../../src/pages/bodyhub/MultisystemScaleNavigator.tsx', import.meta.url), 'utf8')
const component = await readFile(new URL('../../src/pages/bodyhub/LongevityProblemSolver.tsx', import.meta.url), 'utf8')
assert.match(navigator, /LongevityProblemSolver/)
assert.match(navigator, /selected\.scale === 'aging-longevity'/)
assert.match(component, /data-longevity-problem-solver="v1"/)
assert.match(component, /Systems map/)
assert.match(component, /Problem solver/)
assert.match(component, /Translation/)
assert.match(component, /Evidence debt/)
assert.match(component, /High-perturbation stress test/)
assert.match(component, /Commercialization bottlenecks/)
assert.match(component, /Synthetic systems readout/)

console.log('body-longevity-problem-solver: 8 programs, 32 research levers and four workbench views locked')
