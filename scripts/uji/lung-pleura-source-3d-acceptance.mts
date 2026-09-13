import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'paru'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'lung and pleura module must be generated')
assert.ok(parts.length >= 8, 'lung and pleura module must preserve source-backed lobar, pleural and proximal-airway context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every lung/pleura source structure must have positive indexed geometry')
assert.ok(triangles > 0, 'lung and pleura module must expose positive indexed geometry')
assert.deepEqual(sources, ['z-anatomy'], 'lung and pleura geometry must retain Z-Anatomy provenance')
assert.ok(names.filter((name) => name.includes('lobe of') && name.includes('lung')).length >= 5, 'lung module must expose five source-backed lung lobes')
assert.ok(names.some((name) => name === 'pleura'), 'lung module must expose source-backed pleura')
assert.ok(names.includes('trachea'), 'lung module must retain tracheal context')
assert.ok(names.includes('left main bronchus') && names.includes('right main bronchus'), 'lung module must retain bilateral main-bronchus context')
assert.ok(names.some((name) => name.includes('lobar bronchus')), 'lung module must retain lobar-bronchus context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Chest.*\['jantung-ruang', 'respirasi', 'paru'\]/, 'lung and pleura module must remain reachable from Chest')
assert.match(specialty, /The same source as the full-body figure — five lobes, the pleural/, 'UI must preserve bounded lung/pleura disclosure')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'lung/pleura acceptance must not depend on synthetic primitive anatomy')

console.log(`lung/pleura source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
