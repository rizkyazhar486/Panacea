import assert from 'node:assert/strict'
import { AtlasBvh, rayAabbInterval } from '../../src/lib/anatomy/atlasBvh.ts'
import { createAtlasSectionPlane } from '../../src/lib/anatomy/atlasCrossSection.ts'
import { PANACEA_ANATOMY_ATLAS } from '../../src/lib/anatomy/atlasRegistry.ts'

const template = PANACEA_ANATOMY_ATLAS.get('cardiovascular-heart')!
const nodes = Array.from({ length: 32 }, (_, index) => {
  const x = index * 2
  return {
    ...template,
    id: `fixture-${String(index).padStart(2, '0')}`,
    canonicalName: `Fixture ${index}`,
    parentId: undefined,
    spatialBounds: {
      min: { x: x - 0.4, y: -0.4, z: -0.4 },
      max: { x: x + 0.4, y: 0.4, z: 0.4 },
    },
  }
})

const bvh = new AtlasBvh(nodes, 4)
assert.equal(bvh.stats.boundedNodes, 32)
assert.equal(bvh.stats.maxLeafSize, 4)
assert.ok(bvh.stats.treeNodes > bvh.stats.leafNodes)
assert.ok(bvh.stats.maxDepth >= 3)

const localQuery = bvh.queryAabb({
  min: { x: 9.5, y: -1, z: -1 },
  max: { x: 10.5, y: 1, z: 1 },
})
assert.deepEqual(localQuery.map((node) => node.id), ['fixture-05'])

const rayHits = bvh.raycast({
  origin: { x: -1, y: 0, z: 0 },
  direction: { x: 1, y: 0, z: 0 },
}, 100)
assert.equal(rayHits.length, 32)
assert.equal(rayHits[0].node.id, 'fixture-00')
assert.equal(rayHits.at(-1)?.node.id, 'fixture-31')
for (let index = 1; index < rayHits.length; index += 1) {
  assert.ok(rayHits[index].distance >= rayHits[index - 1].distance)
}

const missedRay = bvh.raycast({
  origin: { x: -1, y: 5, z: 0 },
  direction: { x: 1, y: 0, z: 0 },
})
assert.deepEqual(missedRay, [])

const sagittalAt20 = createAtlasSectionPlane('sagittal', 20)
assert.deepEqual(bvh.querySection(sagittalAt20).map((node) => node.id), ['fixture-10'])
assert.equal(bvh.nearest({ x: 13.7, y: 0, z: 0 })?.node.id, 'fixture-07')
assert.equal(bvh.nearest({ x: 13.7, y: 0, z: 0 }, 0.1), undefined)

const interval = rayAabbInterval(
  { origin: { x: -2, y: 0, z: 0 }, direction: { x: 2, y: 0, z: 0 } },
  nodes[0].spatialBounds!,
)
assert.ok(interval)
assert.ok(interval!.entry < interval!.exit)
assert.throws(() => rayAabbInterval(
  { origin: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: 0 } },
  nodes[0].spatialBounds!,
), /zero-length atlas vector/)

const bvhAgain = new AtlasBvh([...nodes].reverse(), 4)
assert.deepEqual(bvhAgain.stats, bvh.stats, 'BVH shape statistics must be deterministic regardless of input ordering.')
assert.deepEqual(
  bvhAgain.raycast({ origin: { x: -1, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } }, 100).map((hit) => hit.node.id),
  rayHits.map((hit) => hit.node.id),
)

const empty = new AtlasBvh([])
assert.equal(empty.stats.boundedNodes, 0)
assert.deepEqual(empty.queryAabb({ min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } }), [])
assert.deepEqual(empty.raycast({ origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 0, z: 0 } }), [])
assert.equal(empty.nearest({ x: 0, y: 0, z: 0 }), undefined)

console.log('High-end atlas BVH: deterministic median hierarchy, AABB pruning, ray picking, section slicing, nearest-node search, and empty/fail-closed behavior verified.')
