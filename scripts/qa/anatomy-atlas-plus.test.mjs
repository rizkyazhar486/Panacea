import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const dataPath = 'src/pages/bodyhub/anatomyAtlasPlusData.ts'
const uiPath = 'src/pages/bodyhub/AnatomyAtlasPlus.tsx'
const viewportPath = 'src/pages/bodyhub/AnatomyAtlasPlusStandalone.tsx'
const physiologyPath = 'src/pages/bodyhub/PhysiologySection.tsx'

const [dataSource, uiSource, viewportSource, physiologySource] = await Promise.all([
  readFile(dataPath, 'utf8'),
  readFile(uiPath, 'utf8'),
  readFile(viewportPath, 'utf8'),
  readFile(physiologyPath, 'utf8'),
])

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

test('every declared Atlas Plus source id resolves to the repository source registry', async () => {
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

test('Atlas Plus exposes search, compare, quiz, share state and Breath Atlas without patient-specific claims', () => {
  for (const required of [
    'data-anatomy-atlas-plus="reference-only"',
    'Search Atlas Plus',
    'Show both in Body3D',
    'Structure challenge',
    'Share this atlas state',
    'Breath Atlas',
    'Mechanics',
    'Airway path',
    'Alveolus',
    'Focus lungs in 3D',
    'Focus diaphragm',
  ]) {
    assert.ok(uiSource.includes(required), `missing Atlas Plus capability: ${required}`)
  }
  assert.ok(uiSource.includes('human review pending'))
  assert.ok(uiSource.includes('not patient-specific anatomy'))
  assert.ok(uiSource.includes('The source Body3D anatomy is not deformed'))
})

test('Atlas Plus study viewport reuses Body3D and implements focus, isolate, compare and CT section commands', () => {
  assert.ok(viewportSource.includes('<Body3D'))
  assert.ok(viewportSource.includes('function focus(entry: AtlasPlusEntry)'))
  assert.ok(viewportSource.includes('function isolate(entry: AtlasPlusEntry)'))
  assert.ok(viewportSource.includes('function compare(entries: AtlasPlusEntry[])'))
  assert.ok(viewportSource.includes('function crossSection(entry: AtlasPlusEntry)'))
  assert.ok(viewportSource.includes("setRenderMode('ct')"))
  assert.ok(viewportSource.includes("setSlicePlane('axial')"))
  assert.ok(viewportSource.includes('MOTION_OFF'))
})

test('Body Exposure physiology surface lazy-loads Atlas Plus so the extra viewport is not paid for until opened', () => {
  assert.ok(physiologySource.includes("lazy(() => import('./AnatomyAtlasPlusStandalone'))"))
  assert.ok(physiologySource.includes('Open Atlas+'))
  assert.ok(physiologySource.includes('<AnatomyAtlasPlusStandalone />'))
  assert.ok(physiologySource.includes('atlasOpen'))
})
