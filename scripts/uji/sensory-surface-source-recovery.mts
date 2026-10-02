import assert from 'node:assert/strict'
import { INDEKS_TUBUH } from '../../src/lib/bodyIndex.gen.ts'
import {
  SENSORY_ENT_RECOVERY,
  SENSORY_SURFACE_PROVENANCE,
  SENSORY_SURFACE_RECOVERY_SUMMARY,
  SHIPPED_SURFACE_MESHES,
  isRenderEligible,
} from '../../src/lib/anatomy/sensorySurfaceSourceRecovery.ts'

const byExactIdentity = (names: readonly string[]) => {
  const exact = new Set(names)
  return INDEKS_TUBUH.filter((node) => exact.has(node.n) || exact.has(node.b))
}

assert.equal(SENSORY_SURFACE_PROVENANCE.source, 'Z-Anatomy')
assert.equal(SENSORY_SURFACE_PROVENANCE.license, 'CC BY-SA 4.0')
assert.equal(SENSORY_SURFACE_PROVENANCE.creditsPath, 'public/anatomy/CREDITS.txt')
assert.equal(SENSORY_SURFACE_PROVENANCE.generatedIndexPath, 'src/lib/bodyIndex.gen.ts')

assert.ok(SENSORY_ENT_RECOVERY.length >= 12, 'recovery catalog must remain a real ENT/sensory blocker wave')
assert.ok(
  SENSORY_ENT_RECOVERY.some((target) => target.status === 'SOURCE_BACKED'),
  'blocker-removal wave must actually recover at least one exact shipped target',
)

for (const target of SENSORY_ENT_RECOVERY) {
  const exactSource = byExactIdentity(target.exactNames)

  if (target.status === 'SOURCE_GAP') {
    assert.equal(exactSource.length, 0, `${target.id}: SOURCE_GAP must be proved by zero exact source identities`)
    assert.equal(target.sourceNodes.length, 0)
    assert.equal(isRenderEligible(target), false)
    continue
  }

  if (target.status === 'ZERO_GEOMETRY') {
    assert.ok(exactSource.length > 0, `${target.id}: zero-geometry target must have an exact source identity`)
    assert.ok(exactSource.every((node) => node.t <= 0), `${target.id}: zero-geometry claim contradicted by positive triangles`)
    assert.equal(isRenderEligible(target), false)
    continue
  }

  assert.ok(exactSource.length > 0, `${target.id}: non-gap target must have an exact source identity`)

  for (const node of target.sourceNodes) {
    assert.ok(target.exactNames.includes(node.n) || target.exactNames.includes(node.b), `${target.id}: fuzzy source substitution detected`)
    assert.ok(target.allowedLayers.includes(node.l), `${target.id}: source layer ${node.l} is outside the target contract`)
    assert.ok(node.t > 0, `${target.id}: renderable source node must carry positive triangles`)
  }

  if (target.status === 'SOURCE_BACKED') {
    assert.ok(target.sourceNodes.length > 0, `${target.id}: SOURCE_BACKED requires geometry`)
    assert.equal(target.blocker, null)
    assert.equal(isRenderEligible(target), true)

    if (target.laterality === 'bilateral-or-midline') {
      const sides = new Set(target.sourceNodes.map((node) => node.s))
      assert.ok(
        sides.has('tengah') || (sides.has('kiri') && sides.has('kanan')),
        `${target.id}: bilateral/midline contract is incomplete`,
      )
    }
  } else {
    assert.equal(target.status, 'AMBIGUOUS')
    assert.equal(isRenderEligible(target), false)
    assert.ok(target.blocker)
  }
}

assert.ok(SHIPPED_SURFACE_MESHES.length > 0, 'shipped atlas must expose at least one indexed surface mesh')
for (const node of SHIPPED_SURFACE_MESHES) {
  assert.equal(node.l, 'surface')
  assert.ok(node.t > 0)
  assert.ok(INDEKS_TUBUH.some((candidate) => candidate.n === node.n && candidate.l === 'surface'))
}

assert.equal(SENSORY_SURFACE_RECOVERY_SUMMARY.sensoryTargets, SENSORY_ENT_RECOVERY.length)
assert.equal(
  SENSORY_SURFACE_RECOVERY_SUMMARY.sensorySourceBacked,
  SENSORY_ENT_RECOVERY.filter((target) => target.status === 'SOURCE_BACKED').length,
)
assert.equal(
  SENSORY_SURFACE_RECOVERY_SUMMARY.sensoryBlocked,
  SENSORY_ENT_RECOVERY.filter((target) => target.status !== 'SOURCE_BACKED').length,
)
assert.equal(SENSORY_SURFACE_RECOVERY_SUMMARY.shippedSurfaceMeshes, SHIPPED_SURFACE_MESHES.length)
assert.equal(
  SENSORY_SURFACE_RECOVERY_SUMMARY.shippedSurfaceTriangles,
  SHIPPED_SURFACE_MESHES.reduce((sum, node) => sum + node.t, 0),
)

const claimedNodes = new Map<string, string[]>()
for (const target of SENSORY_ENT_RECOVERY.filter((candidate) => candidate.status === 'SOURCE_BACKED')) {
  for (const node of target.sourceNodes) {
    const key = `${node.l}:${node.n}`
    claimedNodes.set(key, [...(claimedNodes.get(key) ?? []), target.id])
  }
}
for (const [node, targetIds] of claimedNodes) {
  assert.equal(targetIds.length, 1, `${node}: exact source geometry claimed by multiple recovery targets: ${targetIds.join(', ')}`)
}

console.log(
  `sensory/surface recovery gate: ${SENSORY_SURFACE_RECOVERY_SUMMARY.sensorySourceBacked}/${SENSORY_SURFACE_RECOVERY_SUMMARY.sensoryTargets} sensory targets source-backed; ${SENSORY_SURFACE_RECOVERY_SUMMARY.shippedSurfaceMeshes} surface meshes recovered`,
)
