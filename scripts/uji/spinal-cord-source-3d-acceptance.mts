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

assert.ok(info, 'spinal-cord atlas module must be generated')
assert.ok(parts.length >= 20, 'spinal-cord module must preserve broad source-backed segment coverage')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every spinal-cord source segment must have positive indexed geometry')
assert.ok(triangles > 0, 'spinal-cord module must expose positive indexed geometry')
assert.deepEqual(sources, ['hra-female'], 'spinal-cord geometry must retain HuBMAP HRA female provenance')
assert.ok(names.some((name) => /c1|cervical/.test(name)), 'spinal-cord atlas must preserve cervical segment coverage')
assert.ok(names.some((name) => /t1|thoracic/.test(name)), 'spinal-cord atlas must preserve thoracic segment coverage')
assert.ok(names.some((name) => /l1|lumbar/.test(name)), 'spinal-cord atlas must preserve lumbar segment coverage')
assert.ok(names.some((name) => /s1|sacral/.test(name)), 'spinal-cord atlas must preserve sacral segment coverage')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Neuro & senses.*\['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/, 'spinal-cord module must remain reachable from Neuro & senses')
assert.match(specialty, /Every cord segment from C1 to S4 as its own/, 'UI must preserve bounded spinal segment disclosure')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'spinal-cord acceptance must not depend on synthetic primitive anatomy')

console.log(`spinal-cord source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
