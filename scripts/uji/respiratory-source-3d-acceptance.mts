import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'respirasi'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'respiratory atlas module must be generated')
assert.ok(parts.length >= 30, 'respiratory module must preserve broad source-backed airway/chest-wall context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every respiratory structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'respiratory module must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'respiratory geometry must retain BodyParts3D provenance')
for (const structure of ['trachea','diaphragm','epiglottis','left main bronchus','right main bronchus']) assert.ok(names.includes(structure), `respiratory atlas must expose ${structure}`)
assert.ok(names.some((name) => name.includes('bronchial tree')), 'respiratory atlas must preserve segmental/lobar bronchial tree geometry')
assert.ok(names.some((name) => name.includes('intercostal muscle')), 'respiratory atlas must preserve chest-wall muscle context')
assert.ok(names.some((name) => name.includes('rib')), 'respiratory atlas must preserve rib/chest-wall context')
assert.ok(names.some((name) => name.includes('cricoid cartilage')), 'respiratory atlas must preserve laryngeal cartilage context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Chest.*\['jantung-ruang', 'respirasi', 'paru'\]/, 'respiratory module must remain reachable from Chest')
assert.match(specialty, /This module holds the airway tree, diaphragm and chest wall/, 'UI must preserve bounded respiratory-module disclosure')
assert.match(specialty, /For the lobes themselves and the pleura, open/, 'UI must not misrepresent missing lung-lobe/pleural geometry as part of this module')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'respiratory acceptance must not depend on synthetic primitive anatomy')

console.log(`respiratory source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
