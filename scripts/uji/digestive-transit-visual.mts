import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DIGESTIVE_SEQUENCE, digestiveTransitVisualState } from '../../src/lib/digestiveTransitVisual.ts'

assert.deepEqual(DIGESTIVE_SEQUENCE, [
  'esophagus',
  'stomach',
  'duodenum',
  'small-bowel',
  'colon',
  'rectum',
])

const start = digestiveTransitVisualState(0)
assert.equal(start.progress, 0)
assert.equal(start.routeIndex, 0)
assert.equal(start.activeStage, 'esophagus')
assert.equal(start.nextStage, 'stomach')

const wrapped = digestiveTransitVisualState(12)
assert.equal(wrapped.progress, 0)
assert.equal(wrapped.activeStage, 'esophagus')

const faster = digestiveTransitVisualState(3, 2)
assert.ok(faster.progress > 0.45 && faster.progress < 0.55)

const invalid = digestiveTransitVisualState(Number.NaN, Number.POSITIVE_INFINITY)
assert.equal(invalid.progress, 0)
assert.equal(invalid.routeIndex, 0)

for (let i = 0; i < 100; i += 1) {
  const state = digestiveTransitVisualState(i * 0.37, 1.3)
  assert.ok(state.progress >= 0 && state.progress < 1)
  assert.ok(state.routeIndex >= 0 && state.routeIndex < DIGESTIVE_SEQUENCE.length - 1)
  assert.ok(state.localProgress >= 0 && state.localProgress < 1)
}

const component = readFileSync(new URL('../../src/components/DigestiveTransit3D.tsx', import.meta.url), 'utf8')
assert.match(component, /anatomy\/visceral\.glb/)
assert.match(component, /MeshoptDecoder/)
assert.match(component, /data\.digestiveTransit3d/)
assert.match(component, /Missing source structures are not fabricated/)
assert.match(component, /not a reconstructed lumen/)

const panel = readFileSync(new URL('../../src/pages/bodyhub/WilayahAbdomenPanel.tsx', import.meta.url), 'utf8')
assert.match(panel, /DigestiveTransit3D/)
assert.match(panel, /Digestive organ source render/)
assert.match(panel, /Run orientation cue/)

console.log('digestive-transit-visual: source-backed digestive render and normalized visual state are fail-closed')
