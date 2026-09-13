import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'tht'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'upper ENT atlas module must be generated')
assert.ok(parts.length >= 25, 'upper ENT module must preserve broad source-backed nose, pharynx and larynx context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every upper ENT source structure must have positive indexed geometry')
assert.ok(triangles > 0, 'upper ENT module must expose positive indexed source geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'upper ENT geometry must retain BodyParts3D provenance')
for (const structure of ['trachea','tongue','epiglottis','cricoid cartilage','thyroid cartilage','septal nasal cartilage','left inferior nasal concha','right inferior nasal concha','left nasal bone','right nasal bone','vomer','mandible','left sublingual gland','right sublingual gland','left submandibular gland','right submandibular gland','external ear']) assert.ok(names.includes(structure), `upper ENT atlas must expose ${structure}`)
assert.ok(names.some((name) => name.includes('pharyngeal constrictor')), 'upper ENT atlas must preserve source-backed pharyngeal constrictor geometry')
assert.ok(names.some((name) => name.includes('vocal ligament')), 'upper ENT atlas must preserve source-backed vocal-ligament context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Neuro & senses.*\['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/, 'upper ENT module must remain reachable from Neuro & senses')
assert.match(specialty, /The nose, pharynx and larynx/, 'UI must preserve bounded upper-ENT scope disclosure')
assert.match(specialty, /middle and inner ear are in their own module/, 'UI must not fabricate middle/inner-ear structures inside the upper ENT source space')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped upper ENT GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'upper ENT acceptance must not depend on synthetic primitive anatomy')

console.log(`upper ENT source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
