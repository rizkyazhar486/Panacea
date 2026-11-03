/**
 * @file body-exposure-atlas-home.test.mjs
 * @description Comprehensive verification for Body Exposure Atlas Home (BioDigital / e-Anatomy progressive disclosure).
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  ATLAS_LAYERS,
  ANATOMICAL_REGIONS,
} from '../../src/domains/body-exposure/engine/atlasHomeConfig.ts'

test('AtlasHome: All 7 Shipped Z-Anatomy Layers are fully indexed', () => {
  assert.equal(ATLAS_LAYERS.length, 7, 'Must index exactly 7 anatomical layers')

  const expectedIds = ['surface', 'muscular', 'skeletal', 'cardiovascular', 'visceral', 'nervous', 'lymphoid']
  for (const id of expectedIds) {
    const layer = ATLAS_LAYERS.find((l) => l.id === id)
    assert.ok(layer, `Layer ${id} must exist in ATLAS_LAYERS`)
    assert.ok(layer.file.endsWith('.glb'), `Layer ${id} must reference a .glb file`)
    assert.ok(layer.label.length > 0, `Layer ${id} must have a human-readable label`)
    assert.ok(layer.color.startsWith('#'), `Layer ${id} must have a hex color`)
    assert.ok(layer.defaultOpacity > 0 && layer.defaultOpacity <= 1, `Layer ${id} opacity must be in (0, 1]`)

    // Verify file exists on disk in public/anatomy/
    const filePath = path.join(process.cwd(), 'public', 'anatomy', layer.file)
    assert.ok(fs.existsSync(filePath), `Physical GLB file must exist at ${filePath}`)
  }
})

test('AtlasHome: Peel ranks follow anatomical depth progression (BioDigital pattern)', () => {
  // Rank 0 must be surface (skin), Rank 1 muscular, Rank 2 skeletal, etc.
  const surface = ATLAS_LAYERS.find((l) => l.id === 'surface')
  assert.equal(surface?.peelRank, 0, 'Surface (skin) must have peel rank 0')

  const ranks = ATLAS_LAYERS.map((l) => l.peelRank)
  const sorted = [...ranks].sort((a, b) => a - b)
  assert.deepEqual(ranks, sorted, 'Peel ranks must be strictly ordered from surface to deepest layer')
})

test('AtlasHome: Anatomical regions cover whole body and major somatic compartments', () => {
  assert.ok(ANATOMICAL_REGIONS.length >= 7, 'Must have at least 7 anatomical browsing regions')

  const regionIds = ANATOMICAL_REGIONS.map((r) => r.id)
  assert.ok(regionIds.includes('all'), 'Must include whole-body view')
  assert.ok(regionIds.includes('head-neck'), 'Must include head & neck')
  assert.ok(regionIds.includes('thorax'), 'Must include thorax')
  assert.ok(regionIds.includes('abdomen'), 'Must include abdomen')
  assert.ok(regionIds.includes('pelvis'), 'Must include pelvis')

  for (const reg of ANATOMICAL_REGIONS) {
    assert.ok(Number.isFinite(reg.targetY), `Region ${reg.id} targetY must be finite`)
    assert.ok(reg.distance > 0, `Region ${reg.id} camera distance must be positive`)
  }
})
