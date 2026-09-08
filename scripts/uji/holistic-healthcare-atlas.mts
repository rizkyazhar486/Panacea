import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [atlas, precision, anatomyRefText, breathRefText] = await Promise.all([
  readFile('src/pages/bodyhub/HolisticHealthcareAtlas.tsx', 'utf8'),
  readFile('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8'),
  readFile('data/source-registry/anatomy/thebuggeddev-anatomy.json', 'utf8'),
  readFile('data/source-registry/physiology/thebuggeddev-breath-atlas.json', 'utf8'),
])
const anatomyRef = JSON.parse(anatomyRefText)
const breathRef = JSON.parse(breathRefText)

// The holistic workspace must be a real default mode inside the existing shared
// Whole-body precision surface, not an orphan page or second anatomy renderer.
assert.match(precision, /import HolisticHealthcareAtlas from '\.\/HolisticHealthcareAtlas'/)
assert.match(precision, /type Mode = 'holistic' \| 'z-anatomy' \| 'unfolded' \| 'specialty' \| 'movement'/)
assert.match(precision, /useState<Mode>\('holistic'\)/)
assert.match(precision, /\['holistic', 'Holistic healthcare'\]/)
assert.match(precision, /mode === 'holistic'[\s\S]*<HolisticHealthcareAtlas/)

// Holistic means connected context with explicit epistemic separation, not a
// hidden all-in-one health score or unsupported cross-domain inference.
for (const label of ['Anatomy', 'Physiology', 'Breathing', 'Circulation', 'Measurements', 'Cell & metabolism', 'Imaging', 'Disease context', 'Therapeutics & surgery', 'Movement & recovery']) {
  assert.ok(atlas.includes(label), `holistic continuum must include ${label}`)
}
for (const state of ['reference', 'measured', 'simulated', 'derived', 'review-required']) {
  assert.ok(atlas.includes(state), `holistic atlas must expose ${state} state`)
}
assert.match(atlas, /does not collapse every domain into one score/i)
assert.match(atlas, /does not infer disease, physiology, treatment need or patient-specific anatomy/i)

// The two user-required references are mandatory and visible, while their
// current source-registry records remain fail-closed for reuse/runtime loading.
assert.ok(atlas.includes('https://github.com/thebuggeddev/anatomy'))
assert.ok(atlas.includes('https://breath-atlas.thebuggeddev.chatgpt.site/'))
assert.equal(anatomyRef.homepage, 'https://github.com/thebuggeddev/anatomy')
assert.equal(breathRef.homepage, 'https://breath-atlas.thebuggeddev.chatgpt.site/')
for (const ref of [anatomyRef, breathRef]) {
  assert.equal(ref.usage.runtime, false)
  assert.equal(ref.usage.buildTime, false)
  assert.equal(ref.license.status, 'UNKNOWN')
  assert.equal(ref.license.commercialUse, 'UNKNOWN')
  assert.equal(ref.validation.level, 'REFERENCE')
  assert.equal(ref.validation.clinicalDecisionUse, 'NO')
}

// No remote viewer, scrape, page-level API, external model path or iframe is
// introduced by this UI. It coordinates Panacea-controlled existing surfaces.
assert.doesNotMatch(atlas, /\bfetch\s*\(/)
assert.doesNotMatch(atlas, /axios\./)
assert.doesNotMatch(atlas, /<iframe\b/i)
assert.doesNotMatch(atlas, /\.glb["']/i)
assert.doesNotMatch(atlas, /threejs|three\.js/i)

console.log('Holistic healthcare atlas: mounted, mandatory references visible, healthcare continuum explicit, and external reuse remains fail-closed.')
