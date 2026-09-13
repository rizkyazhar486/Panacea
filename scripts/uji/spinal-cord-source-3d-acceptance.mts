import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'medula-spinalis'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'spinal-cord specialty module must remain shipped')
assert.ok(parts.length >= 20, 'spinal-cord module must preserve segmental source breadth')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'each rendered cord segment must carry positive indexed triangles')
assert.ok(triangles > 0, 'spinal-cord module must contain indexed source geometry')
assert.deepEqual(sources, ['hra-female'], 'spinal-cord geometry must retain HuBMAP HRA female source identity')

for (const level of ['c1', 'c8', 't1', 't12', 'l1', 'l5', 's1', 's4']) {
  assert.ok(names.some((name) => new RegExp(`(^|[^a-z0-9])${level}([^a-z0-9]|$)`, 'i').test(name)), `${level.toUpperCase()} cord segment must remain represented by source geometry`)
}

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Neuro & senses.*\['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/, 'spinal-cord module must remain reachable from Neuro & senses selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside rendered anatomy')
assert.match(viewer, /body3dPixelRatio/, 'shared renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared renderer must suspend offscreen work')
assert.match(viewer, /visibilitychange/, 'shared renderer must suspend background work')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain source-metadata constrained')

console.log(`Spinal cord source 3D gate: ${parts.length} source structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}; cervical-through-sacral breadth locked without patient lesion inference.`)
