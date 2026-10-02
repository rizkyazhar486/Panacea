import assert from 'node:assert/strict'
import { BoundsBvh, type BvhItem, type BvhVec3 } from '../../src/domains/body-exposure/engine/boundsBvh.ts'

// ── Data uji deterministik (LCG berbenih; tanpa Math.random) ─────────────────
function lcg(seed: number) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000 }
}
const rnd = lcg(20261002)
const between = (lo: number, hi: number) => lo + (hi - lo) * rnd()

const box = (id: string, c: BvhVec3, h: number): BvhItem => ({ id, min: [c[0] - h, c[1] - h, c[2] - h], max: [c[0] + h, c[1] + h, c[2] + h] })

// Deret 32 kotak sepanjang x, sama seperti fixture asli.
const row = Array.from({ length: 32 }, (_, i) => box(`fx-${String(i).padStart(2, '0')}`, [i * 2, 0, 0], 0.4))
const bvh = new BoundsBvh(row, 4)

// ── Positif ──────────────────────────────────────────────────────────────────
assert.equal(bvh.stats.items, 32, 'stats must count all items')
assert.ok(bvh.stats.treeNodes > bvh.stats.leafNodes && bvh.stats.maxDepth >= 3, 'a 32-item tree with leaf size 4 must be hierarchical')
assert.deepEqual(bvh.queryBox([9.5, -1, -1], [10.5, 1, 1]).map((i) => i.id), ['fx-05'], 'box query must return only the overlapping item')
const hits = bvh.raycast([-1, 0, 0], [3, 0, 0], 100)
assert.equal(hits.length, 32, 'a ray down the row must hit every box (direction is normalised)')
assert.deepEqual([hits[0].item.id, hits.at(-1)!.item.id], ['fx-00', 'fx-31'], 'hits must be ordered by distance')
assert.ok(Math.abs(hits[0].distance - 0.6) < 1e-9, 'entry distance is in world units: origin -1 to face at -0.4')
assert.equal(bvh.nearest([13.7, 0, 0])?.item.id, 'fx-07', 'nearest must pick the closest box')

// ── Kesetaraan dengan brute force pada data acak berbenih ────────────────────
const cloud: BvhItem[] = Array.from({ length: 300 }, (_, i) => box(`c-${String(i).padStart(3, '0')}`, [between(-50, 50), between(-50, 50), between(-50, 50)], between(0.2, 3)))
const cb = new BoundsBvh(cloud, 6)
const brute = {
  box: (mn: BvhVec3, mx: BvhVec3) => cloud.filter((i) => [0, 1, 2].every((a) => i.min[a] <= mx[a] && i.max[a] >= mn[a])).map((i) => i.id).sort(),
  nearest: (p: BvhVec3) => {
    let best: { id: string; d: number } | undefined
    for (const i of cloud) {
      const d = Math.hypot(...[0, 1, 2].map((a) => (p[a] < i.min[a] ? i.min[a] - p[a] : p[a] > i.max[a] ? p[a] - i.max[a] : 0)))
      if (!best || d < best.d || (d === best.d && i.id < best.id)) best = { id: i.id, d }
    }
    return best!
  },
}
for (let k = 0; k < 60; k += 1) {
  const c: BvhVec3 = [between(-50, 50), between(-50, 50), between(-50, 50)]
  const h = between(1, 15)
  const mn: BvhVec3 = [c[0] - h, c[1] - h, c[2] - h]
  const mx: BvhVec3 = [c[0] + h, c[1] + h, c[2] + h]
  assert.deepEqual(cb.queryBox(mn, mx).map((i) => i.id), brute.box(mn, mx), `box query ${k} must equal brute force`)
  const p: BvhVec3 = [between(-60, 60), between(-60, 60), between(-60, 60)]
  const n = cb.nearest(p)!
  const bn = brute.nearest(p)
  assert.equal(n.item.id, bn.id, `nearest ${k} must equal brute force`)
  assert.ok(Math.abs(n.distance - bn.d) < 1e-9, `nearest distance ${k} must equal brute force`)
}
for (let k = 0; k < 60; k += 1) {
  const o: BvhVec3 = [between(-60, 60), between(-60, 60), between(-60, 60)]
  const d: BvhVec3 = [between(-1, 1), between(-1, 1), between(-1, 1)]
  const got = cb.raycast(o, d).map((h) => h.item.id)
  const none = new BoundsBvh(cloud, 1_000_000).raycast(o, d).map((h) => h.item.id) // folha tunggal = sapuan linear
  assert.deepEqual(got, none, `ray ${k} must equal the unpruned linear sweep`)
}

// ── Batas ────────────────────────────────────────────────────────────────────
const unit = new BoundsBvh([box('u', [0, 0, 0], 1)])
assert.equal(unit.raycast([0, 0, 0], [1, 0, 0])[0].distance, 0, 'a ray starting inside enters at distance 0')
assert.deepEqual(unit.raycast([0, 0, 0], [1, 0, 0]).map((h) => h.exitDistance), [1], 'inside-start exit is the far face')
assert.equal(unit.raycast([5, 0, 0], [1, 0, 0]).length, 0, 'a ray pointing away from the box must miss')
assert.equal(unit.raycast([-5, 0, 0], [1, 0, 0], 4).length, 1, 'maxDistance exactly at the entry face still hits')
assert.equal(unit.raycast([-5, 0, 0], [1, 0, 0], 3.999).length, 0, 'maxDistance just short of the entry face misses')
assert.equal(unit.raycast([-5, 1, 0], [1, 0, 0]).length, 1, 'a ray grazing a face (parallel, on the boundary) hits')
assert.equal(unit.raycast([-5, 1.0001, 0], [1, 0, 0]).length, 0, 'a parallel ray just outside the face misses')
{
  // 20 kotak identik di banyak daun: urutan traversal tidak sama dengan urutan id.
  const same = Array.from({ length: 20 }, (_, i) => box(`s-${String(i).padStart(2, '0')}`, [0, 0, 0], 1))
  const ids = new BoundsBvh(same, 2).raycast([-5, 0, 0], [1, 0, 0]).map((h) => h.item.id)
  assert.deepEqual(ids, same.map((i) => i.id), 'rays entering many boxes at the same distance must be ordered by id')
}
assert.equal(unit.queryBox([1, 1, 1], [2, 2, 2]).length, 1, 'boxes touching at a corner overlap (inclusive)')
assert.equal(unit.queryBox([1.0001, 1, 1], [2, 2, 2]).length, 0, 'boxes separated by a gap do not overlap')
assert.equal(unit.nearest([0.5, 0.5, 0.5])?.distance, 0, 'a point inside a box has distance 0')
assert.equal(unit.nearest([3, 0, 0], 2)?.item.id, 'u', 'nearest at maxDistance exactly equal to the distance is returned')
assert.equal(unit.nearest([3, 0, 0], 1.999), undefined, 'nearest beyond maxDistance is undefined')
assert.equal(new BoundsBvh([box('b', [0, 0, 0], 1), box('a', [0, 0, 0], 1)]).nearest([0, 0, 0])?.item.id, 'a', 'equal distances break ties by smallest id')

const empty = new BoundsBvh([])
assert.deepEqual([empty.stats.items, empty.queryBox([0, 0, 0], [1, 1, 1]).length, empty.raycast([0, 0, 0], [1, 0, 0]).length, empty.nearest([0, 0, 0])], [0, 0, 0, undefined], 'an empty index answers empty, never throws')

// ── Determinisme: urutan masukan tidak mengubah hasil ────────────────────────
const rev = new BoundsBvh([...cloud].reverse(), 6)
assert.deepEqual(rev.stats, cb.stats, 'tree shape must not depend on input order')
assert.deepEqual(rev.raycast([0, 0, -80], [0.1, 0.1, 1]).map((h) => h.item.id), cb.raycast([0, 0, -80], [0.1, 0.1, 1]).map((h) => h.item.id), 'ray results must not depend on input order')

// ── Negatif: ditolak dengan jenis galat yang jelas; indeks tetap utuh ────────
const before = JSON.stringify(bvh.raycast([-1, 0, 0], [1, 0, 0]).map((h) => h.item.id))
const rejects = (fn: () => unknown, pattern: RegExp, why: string) => assert.throws(fn, (e: unknown) => e instanceof RangeError && pattern.test(e.message), why)
rejects(() => new BoundsBvh([{ id: 'x', min: [1, 0, 0], max: [0, 1, 1] }]), /min greater than max/, 'inverted bounds must be rejected')
rejects(() => new BoundsBvh([{ id: 'x', min: [NaN, 0, 0], max: [1, 1, 1] }]), /finite/, 'NaN bounds must be rejected')
rejects(() => new BoundsBvh([{ id: 'x', min: [0, 0, 0], max: [Infinity, 1, 1] }]), /finite/, 'infinite bounds must be rejected')
rejects(() => new BoundsBvh([box('d', [0, 0, 0], 1), box('d', [5, 0, 0], 1)]), /duplicate item id/, 'duplicate ids must be rejected')
rejects(() => new BoundsBvh(row, 0), /positive integer/, 'maxLeafSize 0 must be rejected')
rejects(() => new BoundsBvh(row, 1.5), /positive integer/, 'non-integer maxLeafSize must be rejected')
rejects(() => bvh.raycast([0, 0, 0], [0, 0, 0]), /zero-length/, 'a zero-length direction must be rejected')
rejects(() => bvh.raycast([0, 0, 0], [NaN, 0, 1]), /direction must be finite/, 'a NaN direction must be rejected')
rejects(() => bvh.raycast([NaN, 0, 0], [1, 0, 0]), /origin must be finite/, 'a NaN origin must be rejected')
rejects(() => bvh.raycast([0, 0, 0], [1, 0, 0], NaN), /maxDistance/, 'a NaN maxDistance must be rejected')
rejects(() => bvh.raycast([0, 0, 0], [1, 0, 0], -1), /maxDistance/, 'a negative maxDistance must be rejected')
rejects(() => bvh.nearest([Infinity, 0, 0]), /point must be finite/, 'a non-finite query point must be rejected')
rejects(() => bvh.queryBox([1, 0, 0], [0, 1, 1]), /min greater than max/, 'an inverted query box must be rejected')
assert.equal(JSON.stringify(bvh.raycast([-1, 0, 0], [1, 0, 0]).map((h) => h.item.id)), before, 'rejected queries must not change the index')

console.log(`bounds BVH: ${cloud.length}-item brute-force equivalence (box/ray/nearest), boundaries, determinism and ${13} rejection rules ok`)
