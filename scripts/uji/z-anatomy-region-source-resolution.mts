import assert from 'node:assert/strict'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import {
  filterAnatomySourceBundlesForAtlasRegion,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
} from '../../src/lib/anatomySourceNodeRegistry.ts'
import { WHOLE_BODY_REGIONS } from '../../src/lib/wholeBodyAtlasBlueprint.ts'

const thoracicAorta = INDEKS_TUBUH.find((s) =>
  s.l === 'cardiovascular' && s.w === 'toraks' && s.b.toLowerCase().includes('aorta'))
const abdominalAorta = INDEKS_TUBUH.find((s) =>
  s.l === 'cardiovascular' && s.w === 'abdomen' && s.b.toLowerCase().includes('aorta'))

assert.ok(thoracicAorta, 'fixture requires an aortic source node classified in the thorax')
assert.ok(abdominalAorta, 'fixture requires an aortic source node classified in the abdomen')

const mixedBundle = [{
  file: 'cardiovascular.glb',
  names: [thoracicAorta.n, abdominalAorta.n, 'Runtime-only unknown aorta'],
}]

const thoraxOnly = filterAnatomySourceBundlesForAtlasRegion(mixedBundle, 'thorax')
assert.deepEqual(
  thoraxOnly.flatMap((bundle) => bundle.names),
  [thoracicAorta.n],
  'thorax filtering must reject abdominal and unclassified runtime names',
)

const abdomenOnly = filterAnatomySourceBundlesForAtlasRegion(mixedBundle, 'abdomen')
assert.deepEqual(
  abdomenOnly.flatMap((bundle) => bundle.names),
  [abdominalAorta.n],
  'abdomen filtering must reject thoracic and unclassified runtime names',
)

const heartTarget = WHOLE_BODY_REGIONS
  .find((region) => region.key === 'thorax')
  ?.structures.find((structure) => structure.id === 'heart-great-vessels')
assert.ok(heartTarget, 'reviewed thoracic heart/great-vessels target must remain available')

const cardiovascular = getEffectiveAnatomySourceNodeSnapshot()
  .filter((bundle) => bundle.file === 'cardiovascular.glb')
const resolved = resolveAllAnatomySourceNodes(heartTarget.nodeHints, cardiovascular, 64)
const resolvedNames = resolved.flatMap((match) => match.names)
assert.ok(resolvedNames.length > 0, 'reviewed thoracic target should still resolve represented source nodes')

for (const name of resolvedNames) {
  const sourceRows = INDEKS_TUBUH.filter((row) => row.n === name)
  assert.ok(sourceRows.length > 0, `resolved node ${name} must retain generated geometry metadata`)
  assert.ok(
    sourceRows.some((row) => row.w === 'toraks'),
    `reviewed thoracic target must not resolve ${name} exclusively from another body region`,
  )
}

assert.ok(
  !resolvedNames.includes(abdominalAorta.n),
  'reviewed Heart & great vessels must not pull an abdominal aortic node through the generic aorta hint',
)

console.log('Z-Anatomy reviewed source-node resolution is constrained by body region and fails closed for unclassified runtime names.')
