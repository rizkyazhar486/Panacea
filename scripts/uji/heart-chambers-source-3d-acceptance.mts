import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'jantung-ruang'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'heart chamber atlas module must be generated')
assert.equal(parts.length, 14, 'heart chamber atlas must preserve its fourteen source-backed structures')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every heart chamber structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'heart chamber module must expose positive triangle geometry')
assert.deepEqual(sources, ['hra-female'], 'heart chamber geometry must retain HuBMAP HRA female provenance')

for (const chamber of ['left cardiac atrium', 'right cardiac atrium', 'left ventricle', 'right ventricle']) {
  assert.ok(names.includes(chamber), `heart atlas must expose ${chamber}`)
}
assert.ok(names.includes('interventricular septum'), 'heart atlas must expose the interventricular septum')
for (const valve of ['aortic valve', 'pulmonary valve', 'mitral valve', 'tricuspid valve']) {
  assert.ok(names.includes(valve), `heart atlas must expose ${valve}`)
}
assert.equal(names.filter((name) => name.includes('papillary muscle')).length, 5, 'heart atlas must preserve five source-backed papillary muscles')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep the specialty navigation entry reachable')
assert.match(specialty, /Chest.*\['jantung-ruang', 'respirasi', 'paru'\]/, 'heart chamber module must stay reachable from the Chest atlas group')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata for selectable geometry')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose source provenance')
assert.match(specialty, /All four chambers, the interventricular septum/, 'heart atlas must disclose its bounded chamber/valve scope')

assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while the document is hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'heart acceptance must not depend on synthetic primitive anatomy')

console.log(`heart chamber source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
