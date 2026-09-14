import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'
const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')
const moduleId = 'tiroid'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)
assert.ok(info, 'thyroid/parathyroid atlas module must be generated')
assert.equal(parts.length, 10, 'thyroid/parathyroid module must preserve its ten source-backed structures')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every thyroid/parathyroid structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'thyroid/parathyroid module must expose positive triangle geometry')
assert.deepEqual(sources, ['z-anatomy'], 'thyroid/parathyroid geometry must retain Z-Anatomy provenance')
for (const structure of ['thyroid gland','left inferior parathyroid gland','right inferior parathyroid gland','left superior parathyroid gland','right superior parathyroid gland','oesophagus','trachea','hyoid bone','cricoid cartilage','thyroid cartilage']) assert.ok(names.includes(structure), `thyroid/parathyroid atlas must expose ${structure}`)
assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep the specialty navigation entry reachable')
assert.match(specialty, /Endocrine.*\['endokrin', 'tiroid'\]/, 'thyroid/parathyroid module must stay reachable from Endocrine')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(specialty, /Thyroid gland, all four parathyroids/, 'thyroid atlas must disclose bounded gland and airway context')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'thyroid acceptance must not depend on synthetic primitive anatomy')
console.log(`thyroid/parathyroid source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
