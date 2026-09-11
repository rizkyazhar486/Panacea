import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getEffectiveAnatomySourceNodeSnapshot } from '../../src/lib/anatomySourceNodeRegistry.ts'
import {
  buildZAnatomySpatialSourceMap,
  Z_ANATOMY_SPATIAL_LAYERS,
} from '../../src/lib/anatomySpatialSourceMap.ts'

const cells = buildZAnatomySpatialSourceMap(getEffectiveAnatomySourceNodeSnapshot())
assert.ok(cells.length > 0)
assert.equal(
  cells.length % Z_ANATOMY_SPATIAL_LAYERS.length,
  0,
  'every reviewed body region should be crossed with the same explicit anatomy-system columns',
)

const thoraxCardio = cells.find((cell) => cell.regionKey === 'thorax' && cell.layer === 'cardiovascular')
assert.ok(thoraxCardio, 'thorax × cardiovascular cell must exist')
assert.ok((thoraxCardio?.targets.length ?? 0) > 0, 'thorax cardiovascular cell should retain reviewed catalogue targets')
assert.equal(thoraxCardio?.state, 'resolved', 'shipped cardiovascular source names should resolve reviewed thoracic targets')
assert.ok((thoraxCardio?.sourceNames.length ?? 0) > 0, 'resolved thoracic cardiovascular cell must expose exact source-node names')
assert.equal(thoraxCardio?.file, 'cardiovascular.glb')

for (const cell of cells) {
  assert.equal(new Set(cell.sourceNames).size, cell.sourceNames.length, `${cell.key} source names must be deduplicated`)
  if (cell.state === 'empty') assert.equal(cell.targets.length, 0)
  if (cell.state === 'not-represented') {
    assert.equal(cell.representedTargetCount, 0, `${cell.key} must not promote an explicitly absent geometry target`)
    assert.equal(cell.sourceNames.length, 0, `${cell.key} must not synthesize source names for absent geometry`)
  }
}

const componentSource = readFileSync(new URL('../../src/pages/bodyhub/ZAnatomySpatialSourceMap.tsx', import.meta.url), 'utf8')
assert.match(componentSource, /Region × anatomy system/, 'visual map should expose the intended spatial matrix')
assert.match(componentSource, /loaded runtime/, 'runtime geometry state must stay visible')
assert.match(componentSource, /indexed source/, 'unloaded indexed source state must stay visible')
assert.match(componentSource, /not directly represented/, 'missing direct geometry must remain visible')
assert.match(componentSource, /not.*anatomical completeness/s, 'UI must explicitly reject completeness-score interpretation')
assert.doesNotMatch(componentSource, /coverage\s*%/i, 'spatial source map must not invent a coverage percentage')
assert.doesNotMatch(componentSource, /safe corridor/i, 'source-map visualization must not claim procedural safety')

console.log('Z-Anatomy spatial source map keeps region-system navigation tied to exact source names without turning source inventory into an anatomy completeness score.')
