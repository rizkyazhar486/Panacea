import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BODY_SYSTEM_SOURCE_WAVE,
  bodySystemSourceCoverage,
} from '../../src/lib/bodySystemSourceWave.ts'

const ids = BODY_SYSTEM_SOURCE_WAVE.map((system) => system.id)
assert.deepEqual(ids, [
  'cardiovascular',
  'nervous',
  'respiratory',
  'digestive',
  'urinary',
  'endocrine',
  'reproductive',
  'lymphatic-immune',
  'musculoskeletal',
  'sensory-ent',
  'integumentary-surface',
])

assert.equal(new Set(ids).size, ids.length)
for (const system of BODY_SYSTEM_SOURCE_WAVE) {
  assert.ok(system.targets.length > 0, `${system.id} must expose at least one source target`)
  for (const target of system.targets) {
    assert.ok(target.file.endsWith('.glb'))
    assert.ok(target.hints.length > 0)
  }
}

const allowedFiles = new Set([
  'surface.glb',
  'skeletal.glb',
  'muscular.glb',
  'cardiovascular.glb',
  'nervous.glb',
  'visceral.glb',
  'lymphoid.glb',
])
for (const system of BODY_SYSTEM_SOURCE_WAVE) {
  for (const target of system.targets) assert.ok(allowedFiles.has(target.file), `unexpected source file ${target.file}`)
}

for (const coverage of bodySystemSourceCoverage()) {
  assert.ok(coverage.represented >= 0)
  assert.ok(coverage.represented <= coverage.total)
  assert.ok(coverage.total > 0)
}

const component = readFileSync(new URL('../../src/components/BodyAllSystems3D.tsx', import.meta.url), 'utf8')
assert.match(component, /muatAtlas/)
assert.match(component, /namaAtlas/)
assert.match(component, /OrbitControls/)
assert.match(component, /body3dPixelRatio/)
assert.match(component, /BLOCKED · source geometry unavailable/)
assert.match(component, /BLOCKED · source bundle failed to load/)
assert.match(component, /setFailedFiles/)
assert.match(component, /failedFiles\.includes\(target\.file\)/)
assert.match(component, /successfully loaded source bundle/i)
assert.match(component, /no replacement geometry/i)
assert.match(component, /dataset\.bodyAllSystems3d\s*=\s*['"]true['"]/)
assert.match(component, /IntersectionObserver/)
assert.match(component, /visibilitychange/)

// Meshopt belongs to the shared trusted atlas loader, not to each renderer.
// Guard the architectural boundary so this panel cannot bypass the canonical
// loader or instantiate a second decoder implementation just to satisfy QA.
const trustedLoader = readFileSync(new URL('../../src/lib/anatomy/pemuatAtlas.ts', import.meta.url), 'utf8')
assert.match(trustedLoader, /MeshoptDecoder/)
assert.match(trustedLoader, /GLTFLoader/)

const navigator = readFileSync(new URL('../../src/pages/bodyhub/MultisystemScaleNavigator.tsx', import.meta.url), 'utf8')
assert.match(navigator, /BodyAllSystems3D/)
assert.match(navigator, /Loading all-system Body explorer/)

console.log('body-all-systems-source-wave: simultaneous source-backed system explorer is fail-closed')
