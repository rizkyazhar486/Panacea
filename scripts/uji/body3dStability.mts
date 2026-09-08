import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/components/Body3D.tsx', 'utf8')

assert.match(
  source,
  /body3dPixelRatio\(w, h, window\.devicePixelRatio \|\| 1, smallViewport\)/,
  'Body3D must use the deterministic adaptive DPR budget.',
)
assert.match(
  source,
  /window\.matchMedia\('\(max-width: 640px\)'\)\.matches/,
  'Body3D must retain the conservative mobile quality gate.',
)
assert.match(
  source,
  /new IntersectionObserver\(/,
  'Body3D must avoid scheduling WebGL work while it is off-screen.',
)
assert.match(
  source,
  /document\.addEventListener\('visibilitychange', onVisibilityChange\)/,
  'Body3D must pause rendering while the document is hidden.',
)
assert.match(
  source,
  /webglcontextrestored/,
  'Body3D must attempt local recovery when the browser restores the WebGL context.',
)
assert.match(
  source,
  /controls\.addEventListener\('change', requestRender\)/,
  'Static anatomy must render on interaction/state change instead of a permanent 60-fps loop.',
)
assert.doesNotMatch(
  source,
  /requestAnimationFrame\(renderFrame\)/,
  'Static anatomy must not keep a self-sustaining render loop while idle.',
)
assert.match(
  source,
  /Body3dLayerLoadGeneration/,
  'Late GLB promises must be guarded by a load generation token.',
)
assert.match(
  source,
  /renderer\.forceContextLoss\(\)/,
  'Unmount must release the WebGL context after local GPU resources are disposed.',
)
assert.ok(
  source.includes('Source anatomy is') && source.includes('evidence-bearing geometry'),
  'Body3D must document the source-geometry invariant.',
)

const forbidden = [
  'o.scale.set(dasar.x * k',
  'g.obj.scale.set(dasar.x * k',
  'a.obj.scale.set(dasar.x * k',
  'mesh.scale.set(dasar.x * k',
]

for (const pattern of forbidden) {
  assert.equal(
    source.includes(pattern),
    false,
    `Body3D must not deform source anatomy during physiology teaching (${pattern}).`,
  )
}

assert.doesNotMatch(
  source,
  /new THREE\.(?:SphereGeometry|CapsuleGeometry|LatheGeometry)/,
  'Macro anatomy must stay on evidence-bearing GLB geometry, never primitive stand-ins.',
)

assert.match(
  source,
  /const hasLoadedLayer = ANATOMY_LAYERS\.some/,
  'Body3D must distinguish initial loading from progressive layer loading.',
)
assert.ok(
  source.includes('Adding anatomy layer…') && source.includes("left-2 right-2 top-2 z-10 flex justify-center"),
  'Additional anatomy layers must use a compact non-blocking progress surface.',
)
assert.match(
  source,
  /role="status"[\s\S]*aria-live="polite"/,
  'Anatomy loading progress must remain announced to assistive technology.',
)

console.log('Body3D stability invariants verified.')
