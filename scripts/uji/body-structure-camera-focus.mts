import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const moduleUrl = new URL('../../src/lib/bodyStructureCameraFocus.ts', import.meta.url)
const modulePath = fileURLToPath(moduleUrl)
assert.equal(existsSync(modulePath), true, 'source-backed structure focus must have a deterministic camera-pose calculator')

if (!existsSync(modulePath)) process.exit(1)

const { bodyStructureCameraFocus } = await import(moduleUrl.href)

const focus = bodyStructureCameraFocus(
  { min: { x: 2, y: 4, z: 6 }, max: { x: 6, y: 10, z: 14 } },
  { x: 10, y: 7, z: 10 },
)

assert.deepEqual(focus.target, { x: 4, y: 7, z: 10 }, 'focus target must be the exact source-mesh bounds center')
assert.equal(focus.span, 8, 'focus distance must use the largest source-mesh dimension')
assert.ok(Math.abs(focus.position.x - 22) < 1e-9, 'current view direction must be preserved while framing')
assert.deepEqual(
  bodyStructureCameraFocus(
    { min: { x: 1, y: 1, z: 1 }, max: { x: 1, y: 1, z: 1 } },
    { x: 1, y: 1, z: 1 },
  ).target,
  { x: 1, y: 1, z: 1 },
  'degenerate source bounds must remain finite and centered',
)

const renderer = readFileSync(new URL('../../src/components/BodyAllSystems3D.tsx', import.meta.url), 'utf8')
assert.match(renderer, /bodyStructureCameraFocus/, 'shared renderer must use the deterministic source-bounds focus pose')
assert.match(renderer, /dblclick/, 'focus must be reachable through an explicit double-activation gesture')
assert.match(renderer, /panaceaContext !== true/, 'context envelope must never become a focus target')

console.log('body structure camera focus: exact source bounds are centered with deterministic finite framing')
