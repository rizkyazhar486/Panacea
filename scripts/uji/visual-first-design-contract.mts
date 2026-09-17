import assert from 'node:assert/strict'
import {
  panaceaVisualFirstBaseline,
  validateVisualFirstSurface,
} from '../../src/lib/visualFirstDesignContract.ts'

const baseline = validateVisualFirstSurface(panaceaVisualFirstBaseline('home'))
assert.equal(baseline.pass, true)
assert.equal(baseline.scores.hierarchy, 1)
assert.equal(baseline.scores.restraint, 1)
assert.equal(baseline.scores.disclosure, 1)
assert.equal(baseline.scores.responsiveness, 1)
assert.equal(baseline.scores.overall, 1)

const noisy = validateVisualFirstSurface({
  id: 'anti-pattern',
  focalObjectCount: 4,
  primaryMetricCount: 4,
  mainScrollingTextMaxLines: 3,
  interpretationMode: 'on-demand',
  sectionGapPx: 12,
  semanticAccents: ['information'],
  arbitraryDecorativeGradientCount: 5,
  alwaysFloatingShadowCount: 8,
  equalWeightMetricTileGroups: 2,
  contextualControlsOnly: false,
  progressiveDisclosure: false,
  supportsFluidWidth: false,
})
assert.equal(noisy.pass, false)
assert.ok(noisy.issues.some((issue) => /focal object/.test(issue)))
assert.ok(noisy.issues.some((issue) => /gradient/.test(issue)))
assert.ok(noisy.issues.some((issue) => /shadow/.test(issue)))
assert.ok(noisy.issues.some((issue) => /24px/.test(issue)))
assert.ok(noisy.scores.overall < 0.5)

console.log('Visual-first design contract verified: one focal object/metric, one-line scrolling text, wide spacing, semantic restraint, contextual controls, progressive disclosure, and fluid width.')
