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

assert.ok(info, 'skin/integument atlas module must be generated')
assert.equal(info.label, 'Skin & integument', 'integument module label must remain explicit')
assert.equal(parts.length, 5, 'integument module must preserve its five exact source-backed surface structures')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every integument structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'integument module must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'integument geometry must retain BodyParts3D provenance')
for (const structure of ['skin', 'eyebrow', 'hair of head', 'lip', 'pubic hair']) {
  assert.ok(names.includes(structure), `integument atlas must expose ${structure}`)
}
assert.ok((parts.find((part) => part.name === 'Skin')?.triangles ?? 0) > 40000, 'whole-body skin surface must retain the shipped source mesh rather than a placeholder primitive')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Systemic.*\['imunologi', 'kulit'\]/, 'skin module must remain reachable from Systemic')
assert.match(specialty, /Skin is a single surface mesh/, 'UI must preserve the bounded skin-surface disclosure')
assert.match(specialty, /rather than by depth/, 'UI must not imply unrepresented epidermal\/dermal depth geometry')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'integument acceptance must not depend on synthetic primitive anatomy')

console.log(`integument source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
