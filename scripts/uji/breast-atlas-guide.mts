import assert from 'node:assert/strict'
import { BREAST_GUIDE_STAGES, breastGuideNames } from '../../src/lib/breastAtlasGuide.ts'
import { partsForModule } from '../../src/lib/systemAtlas.gen.ts'

const parts = partsForModule('payudara')
const names = new Set(parts.map((part) => part.name))

assert.equal(parts.length, 16, 'breast module should expose the 16 shipped HuBMAP structures')
assert.equal(names.size, 16, 'breast source names must remain unique')
assert.equal(BREAST_GUIDE_STAGES.length, 8, 'each side should traverse eight source-backed structures')
assert.ok(parts.every((part) => part.source === 'hra-female'), 'breast geometry must remain identified as HuBMAP female reference geometry')

for (const side of ['Left', 'Right'] as const) {
  const guided = breastGuideNames(side)
  assert.equal(guided.length, 8)
  assert.equal(new Set(guided).size, 8)
  for (const name of guided) {
    assert.ok(names.has(name), `guided structure must exist in the shipped payudara atlas: ${name}`)
  }
}

assert.deepEqual(
  new Set([...breastGuideNames('Left'), ...breastGuideNames('Right')]),
  names,
  'guided bilateral walkthrough should cover every shipped breast source structure exactly once',
)

console.log('breast-atlas-guide: bilateral walkthrough stays locked to all 16 shipped HuBMAP breast structures')
