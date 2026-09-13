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

assert.ok(info, 'spinal cord atlas module must be generated')
assert.equal(parts.length, 29, 'spinal cord atlas must preserve its twenty-nine source-backed segments')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every spinal cord segment must have positive indexed source geometry')
assert.ok(triangles > 0, 'spinal cord module must expose positive triangle geometry')
assert.deepEqual(sources, ['hra-female'], 'spinal cord geometry must retain HuBMAP HRA female provenance')

assert.equal(names.filter((name) => name.includes('cervical spinal cord segment')).length, 8, 'spinal cord atlas must preserve C1-C8 source segments')
assert.equal(names.filter((name) => name.includes('thoracic spinal cord segment')).length, 12, 'spinal cord atlas must preserve twelve thoracic source segments')
assert.equal(names.filter((name) => name.includes('lumbar spinal cord segment')).length, 5, 'spinal cord atlas must preserve five lumbar source segments')
assert.equal(names.filter((name) => name.includes('sacral spinal cord segment')).length, 4, 'spinal cord atlas must preserve four sacral source segments')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep the specialty navigation entry reachable')
assert.match(specialty, /Neuro & senses.*\['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/, 'spinal cord module must stay reachable from Neuro & senses')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata for selectable geometry')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(specialty, /Every cord segment from C1 to S4 as its own/, 'spinal atlas must disclose its bounded segment scope')

assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while the document is hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'spinal acceptance must not depend on synthetic primitive anatomy')

console.log(`spinal cord source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
