import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')
const viewer = await readFile(new URL('../../src/components/AtlasViewer3D.tsx', import.meta.url), 'utf8')

const moduleId = 'bilier'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'biliary/pancreatic module must be shipped')
assert.ok(parts.length >= 8, 'biliary/pancreatic module must expose ductal and organ context breadth')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every biliary/pancreatic source structure must carry positive indexed triangles')
assert.ok(triangles > 0, 'biliary/pancreatic module must contain indexed source geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'biliary/pancreatic geometry must retain BodyParts3D source identity')

assert.ok(names.some((name) => name.includes('hepatic') && name.includes('duct')), 'hepatic duct source geometry must be present')
assert.ok(names.some((name) => name.includes('cystic') && name.includes('duct')), 'cystic duct source geometry must be present')
assert.ok(names.some((name) => name.includes('common bile duct')), 'common bile duct source geometry must be present')
assert.ok(names.some((name) => name.includes('ampulla')), 'hepatopancreatic ampulla source geometry must be present')
assert.ok(names.some((name) => name.includes('pancreatic') && name.includes('duct')), 'pancreatic duct source geometry must be present')
assert.ok(names.some((name) => name.includes('gallbladder')), 'gallbladder source geometry must be present')
assert.ok(names.some((name) => name.includes('pancreas')), 'pancreas source geometry must be present')
assert.ok(names.some((name) => name.includes('liver')), 'liver source geometry must be present')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'specialty atlas must remain reachable from Body Exposure')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'specialty atlas tab must remain user-reachable')
assert.match(specialty, /Abdomen.*\['gastro', 'bilier', 'nefrologi'\]/, 'biliary module must remain reachable from Abdomen selector')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'selected specialty module must load its shipped GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'viewer metadata must come from generated shipped-atlas metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'source provenance must remain visible beside the rendered module')
assert.match(specialty, /Hepatic ducts, cystic duct, common bile duct/, 'UI must retain explicit biliary/pancreatic disclosure')
assert.match(viewer, /body3dPixelRatio/, 'shared specialty renderer must bound mobile pixel ratio')
assert.match(viewer, /IntersectionObserver/, 'shared specialty renderer must pause offscreen')
assert.match(viewer, /visibilitychange/, 'shared specialty renderer must pause in background tabs')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'picking must remain restricted to verified source metadata')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'specialty atlas must not synthesize substitute biliary/pancreatic geometry')

console.log(`Biliary/pancreatic source 3D gate: ${parts.length} exact structures, ${triangles.toLocaleString()} indexed triangles, source=${sources.join(',')}, ducts + organ context, reachable GLB WebGL and mobile lifecycle locked.`)
