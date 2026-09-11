import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { findUniqueExactAnatomySourceNode } from '../../src/lib/anatomyExactSourceSelection.ts'
import type { AnatomySourceNodeBundle } from '../../src/lib/anatomySourceNodeRegistry.ts'

const bundles: AnatomySourceNodeBundle[] = [
  { file: 'skeletal.glb', names: ['Femur.r', 'Tibia.r', 'Shared exact'] },
  { file: 'muscular.glb', names: ['Rectus femoris muscle.r', 'Shared exact'] },
  { file: 'cardiovascular.glb', names: ['Aorta', 'Heart'] },
]

assert.deepEqual(
  findUniqueExactAnatomySourceNode('Femur.r', bundles),
  { file: 'skeletal.glb', name: 'Femur.r' },
  'one exact source name in one bundle must resolve deterministically',
)
assert.deepEqual(
  findUniqueExactAnatomySourceNode('  Aorta  ', bundles),
  { file: 'cardiovascular.glb', name: 'Aorta' },
  'incidental outer whitespace may be removed before exact matching',
)
assert.equal(
  findUniqueExactAnatomySourceNode('Shared exact', bundles),
  null,
  'the same exact name in multiple bundles must remain ambiguous',
)
assert.equal(
  findUniqueExactAnatomySourceNode('femur.r', bundles),
  null,
  'exact source matching must remain case-sensitive',
)
assert.equal(
  findUniqueExactAnatomySourceNode('Femur', bundles),
  null,
  'prefixes and substrings must not be promoted to exact source selections',
)
assert.equal(findUniqueExactAnatomySourceNode('   ', bundles), null)

const precisionLab = readFileSync('src/pages/bodyhub/WholeBodyPrecisionLab.tsx', 'utf8')
assert.match(precisionLab, /function highlightZAnatomy\(nodes: string\[\]\)/)
assert.match(precisionLab, /findUniqueExactAnatomySourceNode\(/)
assert.match(precisionLab, /publishAnatomySourceSelection\(exact\.name, exact\.file\)/)
assert.equal(
  (precisionLab.match(/onHighlight=\{highlightZAnatomy\}/g) ?? []).length,
  3,
  'workbench, semantic system explorer and source mesh browser must share the same exact-selection synchronizer',
)

console.log('Exact Z-Anatomy source selection synchronization is unique-bundle, case-sensitive, non-fuzzy, and wired across all three atlas surfaces.')
