import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const dataPath = 'src/pages/bodyhub/anatomyAtlasPlusData.ts'
const uiPath = 'src/pages/bodyhub/AnatomyAtlasPlus.tsx'
const viewportPath = 'src/pages/bodyhub/AnatomyAtlasPlusStandalone.tsx'
const physiologyPath = 'src/pages/bodyhub/PhysiologySection.tsx'
const breathPath = 'src/pages/bodyhub/BreathAtlasLab.tsx'
const referencePath = 'data/source-registry/anatomy/thebuggeddev-anatomy-breath-atlas.json'

const [dataSource, uiSource, viewportSource, physiologySource, breathSource, referenceSource] = await Promise.all([
  readFile(dataPath, 'utf8'),
  readFile(uiPath, 'utf8'),
  readFile(viewportPath, 'utf8'),
  readFile(physiologyPath, 'utf8'),
  readFile(breathPath, 'utf8'),
  readFile(referencePath, 'utf8'),
])

const benchmarkReference = JSON.parse(referenceSource)

test('Atlas Plus keeps a curated registry larger than the 17-organ benchmark with stable unique Panacea ids', () => {
  const ids = [...dataSource.matchAll(/id:\s*'(pan-anat-[^']+)'/g)].map((match) => match[1])
  assert.ok(ids.length >= 24, `expected at least 24 curated identities, found ${ids.length}`)
  assert.equal(new Set(ids).size, ids.length, 'curated atlas ids must be unique')
  assert.ok(ids.every((id) => id.startsWith('pan-anat-')))
})

test('unverified terminology never invents a TA2 mapping', () => {
  const ids = [...dataSource.matchAll(/id:\s*'pan-anat-[^']+'/g)]
  const nullMappings = [...dataSource.matchAll(/ta2:\s*null/g)]
  assert.equal(nullMappings.length, ids.length, 'every curated identity must explicitly fail closed on TA2 until verified')
  assert.doesNotMatch(dataSource, /ta2:\s*['"][^'"]+['"]/, 'no unverified TA2 code may be embedded')
})

test('every declared Atlas Plus evidence source resolves to the repository source registry', async () => {
  const registryFiles = [
    'data/source-registry/anatomy/z-anatomy.json',
    'data/source-registry/anatomy/hubmap-hra.json',
    'data/source-registry/anatomy/nih-3d.json',
    'data/source-registry/anatomy/wikimedia-commons.json',
  ]
  const registryIds = new Set()
  for (const path of registryFiles) {
    const value = JSON.parse(await readFile(path, 'utf8'))
    registryIds.add(value.id)
  }
  for (const expected of ['z_anatomy', 'hubmap_hra', 'nih_3d', 'wikimedia_commons']) {
    assert.ok(registryIds.has(expected), `missing source-registry identity ${expected}`)
    assert.match(dataSource, new RegExp(`['\"]${expected}['\"]`))
  }
})

test('Atlas Plus exposes the missing benchmark workflow without becoming a second respiratory truth source', () => {
  for (const required of [
    'data-anatomy-atlas-plus="reference-only"',
    'Search Atlas Plus',
    'Show both in Body3D',
    'Structure challenge',
    'Share this atlas state',
    'Focus in 3D',
    'Isolate layer',
    'CT cross-section',
    'Microscopic',
    'Relations',
  ]) {
    assert.ok(uiSource.includes(required), `missing Atlas Plus capability: ${required}`)
  }
  assert.ok(uiSource.includes('human review pending'))
  assert.ok(uiSource.includes('not patient-specific anatomy'))
  assert.doesNotMatch(uiSource, /const BREATH_PHASES|function BreathAtlas\(/, 'Atlas Plus must not fork the canonical Breath Atlas implementation')
})

test('canonical Breath Atlas resolves real runtime source nodes and fails closed below whole-body mesh scale', () => {
  for (const required of [
    'resolveAllAnatomySourceNodes',
    'anatomySourceNodeOrigin',
    "id: 'central-airway'",
    "id: 'lungs'",
    "id: 'diaphragm'",
    "id: 'intercostals'",
    "id: 'pulmonary-vessels'",
    "id: 'alveolar-capillary'",
    "provenance: 'not-represented'",
    'source mesh is not deformed to fake breathing',
    'no patient-specific ventilation map',
    'Microscopic alveolar geometry is disclosed as unavailable at this scale',
  ]) {
    assert.ok(breathSource.toLowerCase().includes(required.toLowerCase()), `missing canonical Breath Atlas boundary/capability: ${required}`)
  }
  assert.ok(breathSource.includes('Highlight only exact source nodes'))
  assert.ok(breathSource.includes('they never become substitute geometry'))
})

test('thebuggeddev anatomy and Breath Atlas remain a design reference only until licensing is explicit', () => {
  assert.equal(benchmarkReference.id, 'thebuggeddev_anatomy_breath_atlas')
  assert.equal(benchmarkReference.usage.runtime, false)
  assert.equal(benchmarkReference.usage.buildTime, false)
  assert.equal(benchmarkReference.usage.networkRequired, false)
  assert.equal(benchmarkReference.license.status, 'CHECK_REQUIRED')
  assert.equal(benchmarkReference.license.commercialUse, 'UNKNOWN')
  assert.equal(benchmarkReference.validation.clinicalDecisionUse, 'NO')
  assert.match(benchmarkReference.repository, /github\.com\/thebuggeddev\/anatomy/)
  assert.match(benchmarkReference.homepage, /breath-atlas\.thebuggeddev\.chatgpt\.site/)
  assert.match(benchmarkReference.usage.notes, /does not embed, fetch, copy or redistribute/i)
})

test('one lazy Atlas Plus viewport reuses Body3D for focus, isolate, compare, CT and canonical Breath Atlas', () => {
  assert.ok(viewportSource.includes("import BreathAtlasLab from './BreathAtlasLab'"))
  assert.ok(viewportSource.includes('<Body3D'))
  assert.ok(viewportSource.includes('highlighted={highlighted}'))
  assert.ok(viewportSource.includes('function focus(entry: AtlasPlusEntry)'))
  assert.ok(viewportSource.includes('function isolate(entry: AtlasPlusEntry)'))
  assert.ok(viewportSource.includes('function compare(entries: AtlasPlusEntry[])'))
  assert.ok(viewportSource.includes('function crossSection(entry: AtlasPlusEntry)'))
  assert.ok(viewportSource.includes("setRenderMode('ct')"))
  assert.ok(viewportSource.includes("setSlicePlane('axial')"))
  assert.ok(viewportSource.includes('MOTION_OFF'))
  assert.ok(viewportSource.includes('<BreathAtlasLab'))
  assert.ok(viewportSource.includes('onHighlight={handleBreathHighlight}'))
  assert.ok(viewportSource.includes('onFocusRegion={handleBreathFocus}'))
})

test('Body Exposure physiology surface lazy-loads Atlas Plus so the extra viewport is not paid for until opened', () => {
  assert.ok(physiologySource.includes("lazy(() => import('./AnatomyAtlasPlusStandalone'))"))
  assert.ok(physiologySource.includes('Open Atlas+'))
  assert.ok(physiologySource.includes('<AnatomyAtlasPlusStandalone />'))
  assert.ok(physiologySource.includes('atlasOpen'))
})
