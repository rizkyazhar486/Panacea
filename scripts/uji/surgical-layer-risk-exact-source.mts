import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import { INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT } from '../../src/lib/anatomySourceNodeRegistry.ts'
import { URUTAN } from '../../src/lib/dissection.ts'
import {
  canonicalSurgicalRiskLabel,
  exactSurgicalLayerRiskNodes,
  resolveSurgicalLayerRiskCoverage,
} from '../../src/lib/surgicalLayerRiskGeometry.ts'

assert.equal(
  canonicalSurgicalRiskLabel('Popliteal artery (posterior, at risk with retraction)'),
  'popliteal artery',
  'Trailing teaching annotation must not become part of an anatomy lookup key.',
)
assert.equal(
  canonicalSurgicalRiskLabel('Ilioinguinal nerve — lies immediately beneath'),
  'ilioinguinal nerve',
  'Teaching prose after an em dash must not become part of an anatomy lookup key.',
)

assert.deepEqual(
  exactSurgicalLayerRiskNodes(
    ['Definitely not a shipped anatomy source node'],
    'abdomen',
    INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
  ),
  [],
  'Unknown surgical-risk prose must fail closed instead of selecting a similar mesh.',
)

assert.deepEqual(
  exactSurgicalLayerRiskNodes(
    ['Median nerve'],
    'tangan',
    [],
  ),
  [],
  'A matching label cannot be highlighted unless its source node is present in the supplied source snapshot.',
)

const byNode = new Map(INDEKS_TUBUH.map((row) => [row.n, row]))
const availableNodes = new Set(INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT.flatMap((bundle) => bundle.names))
let representedRiskLabels = 0

for (const approach of URUTAN) {
  const labels = approach.lapis.flatMap((layer) => layer.bahaya ?? [])
  const coverage = resolveSurgicalLayerRiskCoverage(
    labels,
    approach.wilayah,
    INDEXED_ANATOMY_SOURCE_NODE_SNAPSHOT,
  )

  for (const risk of coverage) {
    if (risk.names.length) representedRiskLabels += 1
    for (const name of risk.names) {
      assert.ok(availableNodes.has(name), `${name} must be present in the shipped source-node snapshot.`)
      const row = byNode.get(name)
      assert.ok(row, `${name} must retain generated whole-body metadata.`)
      assert.equal(row!.w, approach.wilayah, `${risk.label} must not jump to a similarly named structure in another body region.`)
      assert.equal(
        canonicalSurgicalRiskLabel(row!.b),
        risk.canonical,
        `${risk.label} must resolve by exact normalized base name only.`,
      )
    }
  }
}

assert.ok(
  representedRiskLabels > 0,
  'The current surgical layer catalogue should retain at least one exact shipped source-node risk for an interactive positive path.',
)

const surgicalLabSource = readFileSync(new URL('../../src/pages/bodyhub/SurgicalLab.tsx', import.meta.url), 'utf8')
assert.match(
  surgicalLabSource,
  /onSorot\?\.\(exactLayerRiskNames\)/,
  'Layer-sequence highlighting must send exact resolved source names to Body3D.',
)
assert.doesNotMatch(
  surgicalLabSource,
  /onSorot\?\.\(lapis\.bahaya\s*\?\?\s*\[\]\)/,
  'Layer-sequence highlighting must never forward risk prose directly to the shared viewer.',
)
assert.match(
  surgicalLabSource,
  /No exact regional source node to highlight/,
  'Missing layer-risk geometry must be visible and non-interactive rather than silently guessed.',
)
assert.match(
  surgicalLabSource,
  /onSorot\?\.\(\[\]\)/,
  'Changing surgical context must clear stale highlights from the previous layer/scenario.',
)

console.log(`Surgical layer-risk exact-source routing verified; ${representedRiskLabels} risk labels currently have exact regional source nodes.`)
