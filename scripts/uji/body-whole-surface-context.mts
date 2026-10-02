import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BODY_SYSTEM_SOURCE_WAVE,
  resolveBodySystemSourceWave,
} from '../../src/lib/bodySystemSourceWave.ts'

const systems = resolveBodySystemSourceWave()
const surface = systems.find((system) => system.id === 'integumentary-surface')
assert.ok(surface, 'integumentary surface system must exist')
const surfaceTarget = surface.targets.find((target) => target.file === 'surface.glb')
assert.ok(surfaceTarget?.available, 'whole-body surface bundle must resolve source nodes')
assert.ok(surfaceTarget.names.length > 0, 'surface context must retain exact source names')

const sensory = systems.find((system) => system.id === 'sensory-ent')
assert.ok(sensory?.targets.some((target) => target.id === 'eye-globe' && target.available), 'whole-body eye source must resolve')
assert.ok(sensory?.targets.some((target) => target.id === 'ocular-motor'), 'extraocular motor context must remain declared')

const reproductive = BODY_SYSTEM_SOURCE_WAVE.find((system) => system.id === 'reproductive')
assert.ok(reproductive)
for (const id of ['penis', 'erectile-tissue', 'testis', 'epididymis', 'deferent-duct', 'seminal-vesicle', 'prostate']) {
  assert.ok(reproductive.targets.some((target) => target.id === id), `missing whole-body male reproductive target: ${id}`)
}

const viewer = readFileSync(new URL('../../src/components/BodyAllSystems3D.tsx', import.meta.url), 'utf8')
assert.match(viewer, /contextNamesByFile/)
assert.match(viewer, /surfaceSystem/)
assert.match(viewer, /surface\.glb/)
assert.match(viewer, /panaceaContext/)
assert.match(viewer, /candidate\.userData\.panaceaContext !== true/)
assert.match(viewer, /Start from a source-backed whole-body surface/)
assert.doesNotMatch(viewer, /SphereGeometry|BoxGeometry|CylinderGeometry/, 'whole-body context must not be fabricated from primitives')

console.log('whole-body surface context: source-backed envelope, eye and reproductive continuity are locked without blocking exact structure picking')
