import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'ortopedi'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'orthopedic atlas module must be generated')
assert.ok(parts.length >= 120, 'orthopedic module must preserve broad whole-body musculoskeletal source coverage')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every orthopedic structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'orthopedic module must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'orthopedic geometry must retain BodyParts3D provenance')

for (const structure of [
  'left femur', 'right femur',
  'left tibia', 'right tibia',
  'left fibula', 'right fibula',
  'left humerus', 'right humerus',
  'left radius', 'right radius',
  'left ulna', 'right ulna',
  'left clavicle', 'right clavicle',
  'left scapula', 'right scapula',
  'left patella', 'right patella',
  'left hip bone', 'right hip bone',
  'atlas', 'axis', 'sacrum',
]) assert.ok(names.includes(structure), `orthopedic atlas must expose ${structure}`)

for (const structure of [
  'left calcaneal tendon', 'right calcaneal tendon',
  'left iliotibial tract', 'right iliotibial tract',
  'left gluteus maximus', 'right gluteus maximus',
  'left gluteus medius', 'right gluteus medius',
  'left rectus femoris', 'right rectus femoris',
  'left soleus', 'right soleus',
  'left tibialis anterior', 'right tibialis anterior',
  'left supraspinatus', 'right supraspinatus',
]) assert.ok(names.includes(structure), `orthopedic atlas must expose ${structure}`)

assert.ok(names.some((name) => name.includes('intervertebral disk')), 'orthopedic atlas must preserve source-backed intervertebral disc geometry')
assert.ok(names.some((name) => name.includes('intercostal') || name.includes('pectoral') || name.includes('deltoid')), 'orthopedic atlas must preserve source-backed axial/shoulder muscle context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Musculoskeletal.*\['ortopedi', 'lutut'\]/, 'orthopedic module must remain reachable from Musculoskeletal')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'orthopedic acceptance must not depend on synthetic primitive anatomy')

console.log(`orthopedic source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
