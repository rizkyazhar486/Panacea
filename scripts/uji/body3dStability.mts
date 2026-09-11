import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/components/Body3D.tsx', 'utf8')

assert.match(
  source,
  /const pixelRatioCap = window\.matchMedia\('\(max-width: 640px\)'\)\.matches \? 1\.5 : 2/,
  'Body3D must keep the mobile DPR cap to reduce GPU/memory pressure.',
)
assert.match(
  source,
  /new IntersectionObserver\(/,
  'Body3D must suspend expensive rendering when it is off-screen.',
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
  /Source anatomy is evidence-bearing geometry/,
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

console.log('Body3D stability invariants verified.')
