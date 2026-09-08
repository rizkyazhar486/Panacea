import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const atlas = readFileSync('src/pages/bodyhub/HolisticHealthcareAtlas.tsx', 'utf8')
const precision = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')

for (const label of [
  'Anatomy',
  'Physiology',
  'Breathing',
  'Circulation',
  'Measurements',
  'Cell & metabolism',
  'Imaging',
  'Disease context',
  'Therapeutics & surgery',
  'Movement & recovery',
]) {
  assert.match(atlas, new RegExp(label.replace(/[&]/g, '\\&'), 'i'), `Holistic continuum must retain ${label}.`)
}

for (const state of ['reference', 'measured', 'simulated', 'derived', 'review-required']) {
  assert.match(atlas, new RegExp(`['\"]${state}['\"]`), `Holistic atlas must expose ${state} provenance state.`)
}

assert.match(atlas, /https:\/\/github\.com\/thebuggeddev\/anatomy/, 'thebuggeddev/anatomy must remain a mandatory visible reference.')
assert.match(atlas, /https:\/\/breath-atlas\.thebuggeddev\.chatgpt\.site\//, 'Breath Atlas must remain a mandatory visible reference.')
assert.match(atlas, /Public repository visibility is not reuse permission/i, 'Anatomy reference must retain fail-closed reuse boundary.')
assert.match(atlas, /Do not embed, scrape or copy hosted content/i, 'Breath Atlas must retain fail-closed reuse boundary.')
assert.match(atlas, /source identity, unit and measurement timestamp/i, 'Measured-data provenance must remain explicit.')
assert.match(atlas, /does not infer disease, treatment need, physiology or patient-specific anatomy/i, 'Region selection must not imply clinical inference.')

assert.match(atlas, /id="holistic-domain-search"/, 'Holistic hub must keep a labelled local search control.')
assert.match(atlas, /Evidence state filter/, 'Holistic hub must keep an explicit evidence-state filter.')
assert.match(atlas, /No healthcare layer matches this local filter\. No content was synthesized\./, 'Empty search must fail closed without fabricated content.')
assert.doesNotMatch(atlas, /\bfetch\s*\(/, 'Holistic hub must not add a page-level network call.')
assert.doesNotMatch(atlas, /<iframe\b/i, 'Holistic hub must not embed external reference sites.')
assert.doesNotMatch(atlas, /\.glb["'`]/i, 'Holistic hub must not import external geometry directly.')

assert.match(precision, /import HolisticHealthcareAtlas from '\.\/HolisticHealthcareAtlas'/, 'Whole-body precision lab must mount the holistic hub.')
assert.match(precision, /type Mode = 'holistic' \| 'z-anatomy' \| 'breath-atlas' \| 'unfolded' \| 'specialty' \| 'movement'/, 'Holistic mode must be additive and preserve every existing precision mode.')
assert.match(precision, /useState<Mode>\('holistic'\)/, 'Holistic healthcare must be the default precision experience.')
assert.match(precision, /\['holistic', 'Holistic healthcare'\]/, 'Holistic healthcare needs an explicit tab.')
assert.match(precision, /\['z-anatomy', 'Z-Anatomy atlas'\]/, 'Z-Anatomy must remain directly reachable.')
assert.match(precision, /\['breath-atlas', 'Breath atlas'\]/, 'Breath Atlas must remain directly reachable.')
assert.match(precision, /onOpenZAnatomy=\{\(\) => setMode\('z-anatomy'\)\}/, 'Holistic hub must hand off to the existing anatomy atlas without a second renderer.')
assert.match(precision, /onOpenBreathAtlas=\{\(\) => setMode\('breath-atlas'\)\}/, 'Holistic hub must hand off to the existing Breath Atlas implementation.')

console.log('Holistic Healthcare Atlas preserves mandatory references, provenance states, local search/filtering, existing atlas modes and fail-closed external-reference boundaries.')
