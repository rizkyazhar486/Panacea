import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PANACEA_MOTION, panaceaMotionStyle } from '../../src/lib/panaceaMotionLanguage'

const reveal = await readFile(new URL('../../src/components/Reveal.tsx', import.meta.url), 'utf8')
const landing = await readFile(new URL('../../src/pages/Landing.tsx', import.meta.url), 'utf8')

assert.deepEqual(Object.keys(PANACEA_MOTION).sort(), ['explode', 'glass', 'kinetic', 'rise', 'soft'])
for (const [name, preset] of Object.entries(PANACEA_MOTION)) {
  assert.ok(preset.durationMs >= 300 && preset.durationMs <= 900, `${name} duration must stay bounded`)
  assert.match(preset.easing, /cubic-bezier|ease/, `${name} must use a bounded CSS easing`)
  assert.ok(preset.hiddenOpacity >= 0 && preset.hiddenOpacity <= 1, `${name} opacity must be normalized`)
}

const hidden = panaceaMotionStyle('glass', false, false)
const shown = panaceaMotionStyle('glass', true, false)
const reduced = panaceaMotionStyle('explode', false, true)
assert.equal(hidden.opacity, 0)
assert.equal(shown.opacity, 1)
assert.equal(shown.transform, 'translate3d(0, 0, 0) scale(1)')
assert.equal(reduced.opacity, 1)
assert.equal(reduced.transform, 'none')
assert.equal(reduced.filter, 'none')
assert.equal(reduced.transition, 'none')

assert.match(reveal, /prefers-reduced-motion: reduce/, 'Reveal must honor the OS reduced-motion preference')
assert.match(reveal, /data-motion=/, 'Reveal must expose motion identity for deterministic browser QA')
assert.match(reveal, /IntersectionObserver/, 'Reveal must stay viewport-bounded')
assert.match(reveal, /cancelAnimationFrame/, 'CountUp must clean up animation frames')
assert.match(landing, /Reveal, CountUp/, 'the production Landing page must consume the shared Reveal primitive')

const combined = `${reveal}\n${JSON.stringify(PANACEA_MOTION)}`
assert.doesNotMatch(combined, /Higgsfield|Marketing Studio|source-prompts|d2ol7oe51mr4n9/, 'runtime motion primitives must not copy external prompt/media material')

console.log('Panacea motion language acceptance passed')
