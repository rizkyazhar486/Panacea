import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'kulit'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'skin atlas module must be generated')
assert.ok(parts.length >= 1, 'skin module must preserve source-backed surface geometry')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every skin structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'skin module must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'skin geometry must retain BodyParts3D provenance')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Systemic.*\['imunologi', 'kulit'\]/, 'skin module must remain reachable from Systemic')
assert.match(specialty, /kulit: 'Skin is a single surface mesh/, 'skin module must state the current source-resolution boundary')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'skin acceptance must not depend on synthetic primitive anatomy')

// Resolution boundary: this atlas is gross reference surface anatomy only. The
// test deliberately does not assert epidermal/dermal layers, appendages,
// histology, lesion depth, imaging, diagnosis, treatment, patient-specific
// anatomy, or human review that the registered source does not establish.
console.log(`skin source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
