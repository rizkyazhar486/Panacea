import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'neurologi'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'neurologic atlas module must be generated')
assert.ok(parts.length >= 80, 'neurologic module must preserve broad source-backed brain, cranial-nerve and neurovascular context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every neurologic source structure must have positive indexed geometry')
assert.ok(triangles > 0, 'neurologic module must expose positive indexed source geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'neurologic geometry must retain BodyParts3D provenance')
for (const structure of ['corpus callosum','cerebellum','pons','medulla oblongata','midbrain','third ventricle','fourth ventricle','left lateral ventricle','right lateral ventricle','left hippocampus','right hippocampus','left amygdala','right amygdala','left thalamus','right thalamus','optic chiasm','left optic nerve','right optic nerve','basilar artery','left internal carotid artery','right internal carotid artery']) assert.ok(names.includes(structure), `neurologic atlas must expose ${structure}`)
assert.ok(names.some((name) => name.includes('middle cerebral artery')), 'neurologic atlas must preserve source-backed middle-cerebral arterial context')
assert.ok(names.some((name) => name.includes('oculomotor nerve')), 'neurologic atlas must preserve source-backed cranial-nerve context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Neuro & senses.*\['neurologi', 'medula-spinalis', 'mata', 'tht', 'telinga'\]/, 'neurologic module must remain reachable from Neuro & senses')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped neurologic GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'neurologic acceptance must not depend on synthetic primitive anatomy')

console.log(`neurologic source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
