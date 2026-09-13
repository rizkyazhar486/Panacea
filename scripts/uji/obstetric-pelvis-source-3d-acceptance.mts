import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'obstetri'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'obstetric pelvic context module must be generated')
assert.ok(parts.length >= 12, 'obstetric pelvic context must preserve broad source-backed bony, pelvic-floor and vascular context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every obstetric pelvic context structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'obstetric pelvic context must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'obstetric pelvic context must retain BodyParts3D provenance')
for (const structure of ['left hip bone','right hip bone','sacrum','coccyx','urinary bladder','rectum','urethra']) assert.ok(names.includes(structure), `obstetric pelvic context must expose ${structure}`)
assert.ok(names.some((name) => name.includes('levator ani')), 'obstetric pelvic context must preserve levator ani source geometry')
assert.ok(names.some((name) => name.includes('obturator internus')), 'obstetric pelvic context must preserve obturator internus source geometry')
assert.ok(names.some((name) => name.includes('internal iliac artery')), 'obstetric pelvic context must preserve internal iliac arterial context')
assert.ok(names.some((name) => name.includes('iliac vein')), 'obstetric pelvic context must preserve iliac venous context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Women's health.*\['obstetri', 'obgin', 'payudara'\]/, 'obstetric pelvic context must remain reachable from Women’s health')
assert.match(specialty, /This is the male reference pelvis/, 'UI must explicitly disclose that obstetric pelvic context uses the male reference pelvis')
assert.match(specialty, /For the female organs themselves, open the Female pelvis module/, 'UI must route female reproductive anatomy to the separate source-backed female pelvis module')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'obstetric acceptance must not depend on synthetic primitive anatomy')

console.log(`obstetric pelvic source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
