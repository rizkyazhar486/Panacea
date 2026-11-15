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

    // Verify file exists on disk in public/anatomy/
    const filePath = path.join(process.cwd(), 'public', 'anatomy', layer.file)
    assert.ok(fs.existsSync(filePath), `Physical GLB file must exist at ${filePath}`)
    // The home no longer carries its own opacity per layer (the shared viewer keeps source materials), so the
    // old "opacity in (0, 1]" check has nothing to read. What the home does show is the download size, and
    // that must be the real one — exact bytes, not a range.
    assert.equal(layer.sizeBytes, fs.statSync(filePath).size, `Layer ${id} sizeBytes must equal the shipped file size`)
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

  // Regions used to be a fixed targetY/distance pair tuned for a body centred on the origin. The shipped atlas
  // stands on the floor (y 0 .. 1.743 m), so "Head & Neck" (targetY 0.72) pointed at the thigh and the default
  // view showed only the legs (measured in a real browser). A region is now a height window in the atlas's
  // own metres; the camera distance is derived from it per screen shape. scripts/uji/atlas-stage-assets.mts
  // re-measures the GLB and checks each window against real landmarks.
  for (const reg of ANATOMICAL_REGIONS) {
    assert.ok(Number.isFinite(reg.y[0]) && Number.isFinite(reg.y[1]), `Region ${reg.id} height window must be finite`)
    assert.ok(reg.y[1] > reg.y[0], `Region ${reg.id} height window must have positive height`)
    assert.ok(reg.y[0] >= 0 && reg.y[1] <= 1.76, `Region ${reg.id} must lie within the standing body (0 .. 1.76 m)`)
    assert.ok(reg.halfWidthX > 0 && reg.halfWidthX <= 0.4, `Region ${reg.id} half-width must be positive and within the arm span`)
  }
  const centre = (id) => { const r = ANATOMICAL_REGIONS.find((x) => x.id === id); return (r.y[0] + r.y[1]) / 2 }
  assert.ok(centre('head-neck') > centre('thorax'), 'Head & neck must be framed above the thorax')
  assert.ok(centre('thorax') > centre('abdomen'), 'Thorax must be framed above the abdomen')
  assert.ok(centre('abdomen') > centre('pelvis'), 'Abdomen must be framed above the pelvis')
  assert.ok(centre('pelvis') > centre('lower-limb'), 'Pelvis must be framed above the lower limbs')
})

test('AtlasHome: Stage 3 Clinical Suite & Progressive Disclosure Integration', () => {
  const homePath = path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'BodyExposureAtlasHome.tsx')
  assert.ok(fs.existsSync(homePath), 'BodyExposureAtlasHome.tsx must exist')
  const content = fs.readFileSync(homePath, 'utf8')

  // Check 3-Stage workflow presence
  assert.ok(content.includes('1. Anatomy'), 'Must include Stage 1 label')
  assert.ok(content.includes('2. Living Physiology'), 'Must include Stage 2 label')
  assert.ok(content.includes('3. Clinical Relevance'), 'Must include Stage 3 label')

  // Check interactive clinical suite components integrated into Stage 3
  assert.ok(content.includes('<CoronaryTerritoryPanel'), 'Must embed CoronaryTerritoryPanel in Stage 3')
  assert.ok(content.includes('<ReferredPainDermatomeStudio'), 'Must embed ReferredPainDermatomeStudio in Stage 3')
  assert.ok(content.includes('<NeuroFascicularReflexDeck initialTab="syndromes"'), 'Must embed NeuroFascicularReflexDeck with syndromes in Stage 3')
  assert.ok(content.includes('<KaloLumenVolumetricStudio'), 'Must embed KaloLumenVolumetricStudio in Stage 3')
  assert.ok(content.includes('Diagnostic Imaging'), 'Must include Diagnostic Imaging clinical tool')

  // Check 3 living physiology simulation decks integrated into Stage 2
  assert.ok(content.includes('<CardiopulmonaryCouplingDeck'), 'Must embed CardiopulmonaryCouplingDeck in Stage 2')
  assert.ok(content.includes('<SoftTissueBiomechanicsDeck'), 'Must embed SoftTissueBiomechanicsDeck in Stage 2')
  assert.ok(content.includes('<NeuroFascicularReflexDeck initialTab="reflexes"'), 'Must embed NeuroFascicularReflexDeck with reflexes in Stage 2')

  // Check Truth Classes & Clinical Boundaries
  assert.ok(content.includes('ATLAS_REFERENCE_LABEL'), 'Must display ATLAS_REFERENCE_LABEL truth class')
  assert.ok(content.includes('mechanistic_simulation_proxy'), 'Must display mechanistic_simulation_proxy truth class')
  assert.ok(content.includes('Clinical Gate:'), 'Must display fail-closed clinical gate disclaimer')

  // Check Side Panel collapsible and dual-mode support (whole-body vs focused structure)
  assert.ok(content.includes('isSidePanelOpen'), 'Must support side panel toggle')
  assert.ok(content.includes('Whole-Body Exploration'), 'Must support whole-body mode exploration')

  // Check Oculomotor motility simulator integration in NeuroFascicularReflexDeck
  const neuroDeckPath = path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'NeuroFascicularReflexDeck.tsx')
  assert.ok(fs.existsSync(neuroDeckPath), 'NeuroFascicularReflexDeck.tsx must exist')
  const neuroContent = fs.readFileSync(neuroDeckPath, 'utf8')
  assert.ok(neuroContent.includes('<OculomotorLesionLab'), 'Must embed OculomotorLesionLab in NeuroFascicularReflexDeck')
})

test('AtlasHome: Stage 2 opens on every body system, loaded on demand', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'BodyExposureAtlasHome.tsx'), 'utf8')
  // The catalog carries the text of every education graph (~20 kB gzip): it must stay out of the stage chunk.
  assert.ok(content.includes("lazy(() => import('./system-physiology/SystemPhysiologyExplorer'))"), 'Systems view must be lazy-loaded')
  assert.ok(!/from '\.\.\/engine\/system-physiology\/physiologyCatalog/.test(content), 'the stage must not import the catalog statically')
  assert.ok(content.includes("useState<PhysiologyView>('systems')"), 'Stage 2 must open on the body systems')
  assert.ok(content.includes('<SystemPhysiologyExplorer'), 'Stage 2 must render the body-system explorer')
})

test('AtlasHome: every short segment label is contained in its accessible name (WCAG 2.5.3)', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'BodyExposureAtlasHome.tsx'), 'utf8')
  const options = [...content.matchAll(/\{ id: '([^']+)', label: '([^']+)'(?:, short: '([^']+)')? \}/g)]
    .filter(([, id]) => ['systems', 'cardiopulmonary', 'soft_tissue', 'neuro', 'vascular', 'referred_pain', 'neuro_localizer', 'diagnostic_imaging'].includes(id))
  assert.equal(options.length, 8, 'the four physiology views and the four clinical tools')
  for (const [, id, label, short] of options) {
    const visible = short ?? label
    assert.ok(label.toLowerCase().includes(visible.toLowerCase()), `${id}: visible "${visible}" is not part of its name "${label}"`)
    // About 80 px per button with four on a phone panel, and the stage's buttons do not wrap: measured at 390 px,
    // "Referred Pain" (13) was clipped while "Soft Tissue" (11) fit.
    assert.ok(visible.length <= 11, `${id}: "${visible}" is too long for a quarter of the phone panel`)
  }
})

test('AtlasHome: a pick no deck models claims no deck and no clinical target', () => {
  const content = fs.readFileSync(path.join(process.cwd(), 'src', 'domains', 'body-exposure', 'ui', 'BodyExposureAtlasHome.tsx'), 'utf8')
  // The routing is the pure routePick (scripts/uji/atlas-pick-route.mts); the stage only applies it.
  assert.ok(content.includes('const route = routePick(info)'), 'a pick must be routed by routePick')
  assert.ok(!/decksFor\(info\)/.test(content), 'the stage must not route a pick around routePick')
  assert.ok(content.includes('if (route.clinicalTool) setClinicalTool(route.clinicalTool)'), 'no clinical tool is forced when nothing targets the structure')
  // The badges say how the pick is coupled; "Clinical target" only when a deck models the structure.
  assert.ok(content.includes("prefix={pickRoute?.basis === 'deck' ? 'Clinical target:' : 'No clinical tool for:'}"), 'clinical badge must not claim a target without a deck')
  assert.ok(content.includes("prefix={pickRoute?.basis === 'unmapped' ? 'Not yet mapped:' : 'Coupled to:'}"), 'physiology badge must say when a structure is not mapped')
  // The green "coupled" tone follows the same basis as the words.
  assert.ok(content.includes("coupled={pickRoute?.basis === 'deck'}"), 'clinical badge must be green only for a deck target')
  assert.ok(content.includes("coupled={pickRoute?.basis !== 'unmapped'}"), 'physiology badge must be green only when coupled')
})
