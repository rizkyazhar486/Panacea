import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'kulit'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'skin/surface atlas module must be generated')
assert.ok(parts.length >= 1, 'skin/surface module must expose source-backed geometry')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every skin/surface structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'skin/surface module must expose positive triangle geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'skin/surface geometry must retain BodyParts3D provenance')
assert.ok(names.includes('skin'), 'skin/surface atlas must expose the source-backed skin mesh')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep the specialty navigation entry reachable')
assert.match(specialty, /Systemic.*\['imunologi', 'kulit'\]/, 'skin/surface module must stay reachable from the Systemic atlas group')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata for selectable geometry')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(specialty, /Skin is a single surface mesh; dermatological conditions are located by their pattern and distribution rather than by depth/, 'skin atlas must disclose that source geometry does not justify fabricated depth')

assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while the document is hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'skin acceptance must not depend on synthetic primitive anatomy')

console.log(`skin/surface source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
