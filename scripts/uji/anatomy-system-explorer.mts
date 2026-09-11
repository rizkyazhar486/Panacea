import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { RESPIRATORY_ATLAS_NODES } from '../../src/lib/anatomy/respiratoryAtlas.ts'
import { WHOLE_BODY_ATLAS } from '../../src/lib/anatomy/wholeBodyAtlas.ts'

const expectedSystems = [
  'surface',
  'skeletal',
  'articular',
  'muscular',
  'cardiovascular',
  'lymphatic',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
  'sensory',
  'fascial',
]

const roots = WHOLE_BODY_ATLAS.nodes.filter((node) => node.scale === 'organism' && node.id.startsWith('system:'))
assert.deepEqual(
  [...new Set(roots.map((node) => node.system))].sort(),
  [...expectedSystems].sort(),
  'whole-body manifest should expose the full system-level navigation contract',
)

const segments = RESPIRATORY_ATLAS_NODES.filter((node) => node.id.startsWith('resp:segment:'))
assert.ok(segments.length >= 18, 'respiratory extension should expose segmental anatomy, not only whole lungs')
assert.ok(segments.some((node) => node.id === 'resp:segment:r-s1' && node.label.includes('Right S1')))
assert.ok(segments.some((node) => node.id === 'resp:segment:l-s1-2' && node.label.includes('Left S1+2')))
assert.ok(segments.every((node) => node.geometryStatus === 'partial'), 'segmental airway mappings must remain explicitly partial unless reviewed source geometry supports more')

assert.ok(
  WHOLE_BODY_ATLAS.nodes.some((node) => node.geometryStatus === 'reference-only'),
  'manifest must retain explicit reference-only anatomy rather than pretending every semantic node has shipped geometry',
)

const explorerSource = readFileSync(new URL('../../src/pages/bodyhub/ZAnatomySystemExplorer.tsx', import.meta.url), 'utf8')
assert.match(explorerSource, /Z-Anatomy system map/)
assert.match(explorerSource, /WHOLE_BODY_ATLAS/)
assert.match(explorerSource, /RESPIRATORY_ATLAS_NODES/)
assert.match(explorerSource, /compileAtlasAgainstSource/)
assert.match(
  explorerSource,
  /node\.geometryStatus === 'reference-only' \|\| node\.geometryStatus === 'planned'/,
  'reference-only and planned nodes must use the fail-closed interaction path',
)
assert.match(
  explorerSource,
  /onHighlight\?\.\(\[\]\)/,
  'fail-closed semantic nodes must clear mesh highlighting instead of borrowing similar geometry',
)
assert.doesNotMatch(explorerSource, /shippedCoverageRatio/, 'system map must not surface compiler coverage ratios as anatomy quality scores')
assert.doesNotMatch(explorerSource, /educationalPriority/, 'internal render priority must not be shown as user-facing anatomy quality')
assert.match(explorerSource, /not anatomy-completeness percentages/i)
assert.match(explorerSource, /not establish patient-specific anatomy/i)

const precisionSource = readFileSync(new URL('../../src/pages/bodyhub/WholeBodyPrecisionLab.tsx', import.meta.url), 'utf8')
assert.match(precisionSource, /import ZAnatomySystemExplorer from '\.\/ZAnatomySystemExplorer'/)
assert.match(precisionSource, /<ZAnatomySystemExplorer onHighlight=/, 'system map must be mounted in the shared Z-Anatomy viewer flow')

console.log('Z-Anatomy system map exposes system-to-segment hierarchy while keeping reference-only geometry fail-closed and score-free.')
