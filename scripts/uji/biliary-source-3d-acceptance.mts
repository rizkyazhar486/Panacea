import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ATLAS_MODULE_INFO, partsForModule } from '../../src/lib/systemAtlas.gen'

const specialty = await readFile(new URL('../../src/pages/bodyhub/SpecialtyLab.tsx', import.meta.url), 'utf8')
const bodyExplorer = await readFile(new URL('../../src/pages/BodyExplorer.tsx', import.meta.url), 'utf8')

const moduleId = 'bilier'
const info = ATLAS_MODULE_INFO[moduleId]
const parts = partsForModule(moduleId)
const names = parts.map((part) => part.name.toLowerCase())
const sources = [...new Set(parts.map((part) => part.source))]
const triangles = parts.reduce((sum, part) => sum + Math.max(0, part.triangles), 0)

assert.ok(info, 'biliary module must be generated')
assert.ok(parts.length >= 8, 'biliary module must preserve source-backed ductal and surrounding-organ context')
assert.ok(parts.every((part) => Number.isFinite(part.triangles) && part.triangles > 0), 'every biliary source structure must have positive indexed geometry')
assert.ok(triangles > 0, 'biliary module must expose positive indexed geometry')
assert.deepEqual(sources, ['bodyparts3d'], 'biliary geometry must retain BodyParts3D provenance')
assert.ok(names.some((name) => name.includes('gallbladder')), 'biliary module must expose the gallbladder')
assert.ok(names.some((name) => name.includes('cystic duct')), 'biliary module must expose the cystic duct')
assert.ok(names.some((name) => name.includes('common bile duct')), 'biliary module must expose the common bile duct')
assert.ok(names.some((name) => name.includes('hepatic duct')), 'biliary module must expose hepatic duct context')
assert.ok(names.some((name) => name.includes('pancreatic duct')), 'biliary module must expose pancreatic duct context')
assert.ok(names.some((name) => name.includes('liver')), 'biliary module must retain liver context')
assert.ok(names.some((name) => name.includes('pancreas')), 'biliary module must retain pancreatic context')

assert.match(bodyExplorer, /const SpecialtyLab = lazy/, 'Body Exposure must keep the specialty atlas reachable')
assert.match(bodyExplorer, /key: 'spesialisasi'/, 'Body Exposure must keep specialty navigation reachable')
assert.match(specialty, /Abdomen.*\['gastro', 'bilier', 'nefrologi'\]/, 'biliary module must remain reachable from Abdomen')
assert.match(specialty, /Hepatic ducts, cystic duct, common bile duct/, 'UI must preserve bounded biliary disclosure')
assert.match(specialty, /berkas=\{`atlas\/\$\{modul\}\.glb`\}/, 'specialty atlas must load the shipped module GLB')
assert.match(specialty, /partsForModule\(modul\)/, 'specialty atlas must use generated source metadata')
assert.match(specialty, /SUMBER\[asal\]/, 'specialty atlas must visibly expose provenance')
assert.doesNotMatch(specialty, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'biliary acceptance must not depend on synthetic primitive anatomy')

console.log(`biliary source 3D acceptance passed: ${parts.length} structures, ${triangles} triangles, source=${sources.join(',')}`)
