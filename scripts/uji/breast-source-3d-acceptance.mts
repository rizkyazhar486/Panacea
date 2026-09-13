import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'payudara'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'breast module must be shipped')
assert.ok(parts.length >= 6, 'breast module must expose glandular, ductal and surface anatomy breadth')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every breast-module structure must carry positive indexed triangles')
assert.ok(triangles > 0, 'breast module must contain indexed source geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'breast geometry must retain BodyParts3D source identity')

assert.ok(names.some((name) => name.includes('nipple')), 'nipple source geometry must be present')
assert.ok(names.some((name) => name.includes('areola')), 'areolar source geometry must be present')
assert.ok(names.some((name) => name.includes('mammary') && name.includes('lobe')), 'mammary lobe source geometry must be present')
assert.ok(names.some((name) => name.includes('lactiferous') && name.includes('duct')), 'lactiferous duct source geometry must be present')
assert.ok(names.some((name) => name.includes('lactiferous') && name.includes('sinus')), 'lactiferous sinus source geometry must be present')
assert.ok(names.some((name) => name.includes('suspensory') || name.includes('cooper')), 'suspensory ligament source geometry must be present')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Women’s health.*\['obstetri', 'obgin', 'payudara'\]/, 'breast module must remain reachable from Women’s health selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'viewer metadata must come from generated shipped-atlas metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside the rendered module')
assert.match(specialty, /Nipple, areola, mammary lobes/, 'UI must retain explicit breast structure disclosure')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must pause offscreen')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must pause in background tabs')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain restricted to verified source metadata')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize substitute breast geometry')

console.log(`Breast source 3D gate: ${parts.length} exact structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}, glandular/ductal/surface anatomy, reachable GLB WebGL and mobile lifecycle locked.`)
