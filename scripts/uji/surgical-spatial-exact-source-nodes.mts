import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import {
  filterAnatomySourceBundlesForAtlasRegion,
  getEffectiveAnatomySourceNodeSnapshot,
  resolveAllAnatomySourceNodes,
} from '../../src/lib/anatomySourceNodeRegistry.ts'
import { SURGICAL_SPATIAL_SCENARIOS } from '../../src/lib/surgicalSpatialTeaching.ts'
import type { AtlasLayerKey, AtlasRegionKey } from '../../src/lib/wholeBodyAtlasBlueprint.ts'

const sourceFileByLayer: Record<AtlasLayerKey, string> = {
  surface: 'surface.glb',
  skeletal: 'skeletal.glb',
  muscular: 'muscular.glb',
  cardiovascular: 'cardiovascular.glb',
  nervous: 'nervous.glb',
  visceral: 'visceral.glb',
  lymphoid: 'lymphoid.glb',
}

const atlasRegionBySurgicalRegion: Record<string, AtlasRegionKey> = {
  cardiac: 'thorax',
  abdomen: 'abdomen',
  hand: 'upper-limb',
  knee: 'lower-limb',
}

const bodyRegionsByAtlas: Record<AtlasRegionKey, readonly string[]> = {
  'head-neck': ['kepala', 'leher'],
  thorax: ['toraks'],
  abdomen: ['abdomen'],
  'pelvis-perineum': ['pelvis'],
  'upper-limb': ['bahu-lengan', 'tangan'],
  'lower-limb': ['paha', 'tungkai'],
  'spine-back': ['leher', 'toraks', 'abdomen', 'pelvis'],
}

const bundles = getEffectiveAnatomySourceNodeSnapshot()
let representedCheckpoints = 0

for (const scenario of SURGICAL_SPATIAL_SCENARIOS) {
  const atlasRegion = atlasRegionBySurgicalRegion[scenario.region]
  assert.ok(atlasRegion, `surgical region ${scenario.region} must have an explicit atlas-region mapping`)

  for (const checkpoint of scenario.checkpoints) {
    const allowedFiles = new Set(checkpoint.layerHints.map((layer) => sourceFileByLayer[layer]))
    const regionalBundles = filterAnatomySourceBundlesForAtlasRegion(
      bundles.filter((bundle) => allowedFiles.has(bundle.file)),
      atlasRegion,
    )
    const matches = resolveAllAnatomySourceNodes(checkpoint.nodeHints, regionalBundles, 64)
    const names = matches.flatMap((match) => match.names)
    if (names.length) representedCheckpoints += 1

    for (const match of matches) {
      assert.ok(allowedFiles.has(match.file), `${scenario.id}/${checkpoint.id} must not cross a checkpoint layer boundary`)
      for (const name of match.names) {
        const rows = INDEKS_TUBUH.filter((row) => row.n === name)
        assert.ok(rows.length > 0, `${name} must retain generated source metadata`)
        assert.ok(
          rows.some((row) => bodyRegionsByAtlas[atlasRegion].includes(row.w)),
          `${scenario.id}/${checkpoint.id} must not highlight ${name} from another body region`,
        )
      }
    }
  }
}

assert.ok(representedCheckpoints > 0, 'at least one surgical spatial checkpoint must resolve exact shipped source geometry')

const surgicalLabSource = readFileSync(new URL('../../src/pages/bodyhub/SurgicalLab.tsx', import.meta.url), 'utf8')
assert.match(surgicalLabSource, /onSorot\?\.\(exactNames\)/, 'surgical checkpoints must send exact resolved source names to the shared viewer')
assert.doesNotMatch(
  surgicalLabSource,
  /onSorot\?\.\(\[\.\.\.checkpoint\.nodeHints, \.\.\.checkpoint\.structuresAtRisk\]\)/,
  'surgical checkpoint highlighting must not fall back to fuzzy anatomy/risk prose',
)
assert.match(
  surgicalLabSource,
  /No exact regional source mesh · keep this checkpoint text-only/,
  'missing surgical geometry must remain explicitly text-only',
)

console.log('Spatial surgery highlights exact source nodes within its reviewed region/layers and leaves missing geometry text-only.')
