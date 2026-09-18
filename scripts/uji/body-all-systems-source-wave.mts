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
  for (const target of system.targets) {
    assert.ok(allowedFiles.has(target.file), `unexpected source file ${target.file}`)
  }
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
assert.match(component, /BLOCKED · bundle load failed/)
assert.match(component, /setFailedFiles/)
assert.match(component, /failedFiles\.includes\(target\.file\)/)
assert.match(component, /no substitute geometry/i)
assert.match(component, /dataset\.bodyAllSystems3d\s*=\s*['"]true['"]/)
assert.match(component, /IntersectionObserver/)
assert.match(component, /visibilitychange/)
assert.match(component, /forceContextLoss/)
assert.match(component, /demand-loaded/i)

// Decoder setup remains centralized in the canonical atlas loader. The system
// atlas may project source meshes, but it must not own a second GLTF pipeline.
const trustedLoader = readFileSync(new URL('../../src/lib/anatomy/pemuatAtlas.ts', import.meta.url), 'utf8')
assert.match(trustedLoader, /MeshoptDecoder/)
assert.match(trustedLoader, /GLTFLoader/)

const bodyExposureOS = readFileSync(new URL('../../src/pages/BodyExposureOS.tsx', import.meta.url), 'utf8')
const projector = readFileSync(new URL('../../src/pages/bodyhub/UnifiedHumanSimulationProjector.tsx', import.meta.url), 'utf8')
assert.match(bodyExposureOS, /UnifiedHumanSimulationProjector/)
assert.match(bodyExposureOS, /Explore 11 systems/)
assert.match(bodyExposureOS, /one simulation projector/)
assert.match(projector, /BodyAllSystems3D/)
assert.match(projector, /data-unified-human-simulation-projector="v1"/)
assert.match(projector, /selectedSystemId=\{selectedSystemId\}/)
assert.match(projector, /onSystemChange=\{onSystemChange\}/)
assert.match(projector, /Suspense/)

console.log('body-all-systems-source-wave: the 11-system canonical source atlas remains fail-closed inside the unified simulation projector')
