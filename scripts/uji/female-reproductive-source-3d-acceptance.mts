import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'obgin'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'female pelvis/reproductive module must be shipped')
assert.ok(parts.length >= 8, 'female reproductive module must expose canonical organ and pelvic context breadth')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every represented female reproductive structure must have positive indexed geometry')
assert.ok(triangles > 0, 'female reproductive module must contain indexed source geometry')
assert.deepEqual(sources, ['hra-female'], 'female reproductive geometry must retain HuBMAP HRA female source identity')

assert.ok(names.some((name) => name.includes('uterus')), 'uterus source geometry must be present')
assert.ok(names.some((name) => name.includes('ovary')), 'ovarian source geometry must be present')
assert.ok(names.some((name) => name.includes('uterine tube') || name.includes('fallopian')), 'uterine tube source geometry must be present')
assert.ok(names.some((name) => name.includes('vagina')), 'vaginal source geometry must be present')
assert.ok(names.some((name) => name.includes('bladder')), 'bladder context geometry must remain available without substituting for reproductive structures')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Women’s health.*\['obstetri', 'obgin', 'payudara'\]/, 'female reproductive module must remain reachable from Women’s health selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'viewer metadata must come from generated shipped-atlas metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside the rendered module')
assert.match(specialty, /Uterus, ovaries, uterine/, 'UI must retain explicit female-organ disclosure')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must pause offscreen')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must pause in background tabs')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain restricted to verified source metadata')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize substitute female reproductive geometry')

console.log(`Female reproductive source 3D gate: ${parts.length} exact structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}, reachable shipped GLB WebGL and mobile lifecycle locked.`)
