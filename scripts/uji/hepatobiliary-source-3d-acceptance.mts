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

assert.ok(info, 'hepatobiliary/pancreas atlas module must be generated')
assert.ok(parts.length >= 25, 'hepatobiliary module must retain broad source-backed duct, liver and pancreas coverage')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every hepatobiliary structure must have positive indexed source geometry')
assert.ok(triangles > 0, 'hepatobiliary module must expose positive indexed geometry')
assert.deepEqual(sources, ['hra-female'], 'hepatobiliary geometry must retain HuBMAP HRA female provenance')

for (const structure of [
  'right hepatic duct', 'left hepatic duct', 'common hepatic duct', 'common bile duct', 'cystic duct',
  'gallbladder', 'hepatopancreatic ampulla', 'dorsal pancreatic duct', 'ventral pancreatic duct',
  'head of pancreas', 'neck of pancreas', 'body of pancreas', 'tail of pancreas', 'uncinate process',
  'porta hepatis', 'capsule of the liver', 'bare area of liver', 'diaphragmatic surface of liver',
  'caudate lobe', 'falciform ligament', 'coronary ligament of liver',
]) assert.ok(names.includes(structure), `hepatobiliary atlas must expose ${structure}`)

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Abdomen.*\['gastro', 'bilier', 'nefrologi'\]/, 'hepatobiliary module must remain reachable from Abdomen')
assert.match(specialty, /Hepatic ducts, cystic duct, common bile duct/, 'UI must preserve bounded hepatobiliary scope disclosure')
assert.match(specialty, /hepatopancreatic ampulla and both pancreatic ducts/, 'UI must preserve pancreatic duct context disclosure')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.match(viewer, /body3dPixelRatio/, 'viewer must keep bounded mobile pixel-ratio behavior')
assert.match(viewer, /IntersectionObserver/, 'viewer must suspend rendering when offscreen')
assert.match(viewer, /visibilitychange/, 'viewer must suspend rendering while hidden')
assert.match(viewer, /Hanya mesh dengan metadata terverifikasi/, 'viewer must limit picking to verified metadata-backed meshes')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'hepatobiliary acceptance must not depend on synthetic primitive anatomy')

// Structural geometry does not establish bile flow, secretion, pressure, obstruction or patient-specific disease.
assert.doesNotMatch(specialty, /patient-specific bile|bile flow prediction|pancreatic secretion prediction/i, 'static geometry must not claim patient-specific hepatobiliary physiology')

console.log(`hepatobiliary source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
