import assert from 'node:assert/strict'
import { buildExplodedLayout, interpolateExplodedOffset, type ExplodeItem, type ExplodeVec3 } from '../../src/domains/body-exposure/engine/explodedLayout.ts'

function lcg(seed: number) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000 }
}
const rnd = lcg(5551212)
const between = (lo: number, hi: number) => lo + (hi - lo) * rnd()

const box = (id: string, c: ExplodeVec3, h: number, parentId?: string): ExplodeItem =>
  ({ id, min: [c[0] - h, c[1] - h, c[2] - h], max: [c[0] + h, c[1] + h, c[2] + h], ...(parentId ? { parentId } : {}) })
const len = (v: ExplodeVec3) => Math.hypot(v[0], v[1], v[2])
const rejects = (fn: () => unknown, pattern: RegExp, why: string) =>
  assert.throws(fn, (e: unknown) => e instanceof RangeError && pattern.test(e.message), why)
const tf = (layout: ReturnType<typeof buildExplodedLayout>, id: string) => layout.transforms.find((t) => t.id === id)!

/** Referensi O(n²): jumlah pasangan yang masih bertabrakan setelah padding (kecuali pasangan dikecualikan). */
function bruteUnresolved(items: readonly ExplodeItem[], layout: ReturnType<typeof buildExplodedLayout>, pad: number, skip: (a: string, b: string) => boolean = () => false) {
  let n = 0
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (skip(items[i].id, items[j].id)) continue
      const a = tf(layout, items[i].id).offset
      const b = tf(layout, items[j].id).offset
      const hit = [0, 1, 2].every((k) => {
        const amin = items[i].min[k] + a[k], amax = items[i].max[k] + a[k], bmin = items[j].min[k] + b[k], bmax = items[j].max[k] + b[k]
        return Math.min(amax, bmax) + pad - (Math.max(amin, bmin) - pad) > 0
      })
      if (hit) n += 1
    }
  }
  return n
}

// ── Positif: tanpa tabrakan, geser radial persis spacing ─────────────────────
{
  const items = [box('left', [-10, 0, 0], 1), box('right', [10, 0, 0], 1)]
  const out = buildExplodedLayout(items, { spacing: 3 })
  assert.deepEqual([...tf(out, 'left').offset], [-3, 0, 0], 'a left item moves radially left by spacing')
  assert.deepEqual([...tf(out, 'right').offset], [3, 0, 0], 'a right item moves radially right by spacing')
  assert.equal(out.iterations, 0, 'no collisions means no relaxation iterations')
  assert.equal(out.unresolvedCollisions, 0, 'no collisions reported')
  assert.deepEqual(out.sourceBounds, { min: [-11, -1, -1], max: [11, 1, 1] }, 'source bounds are the union of the inputs')
}
// Kedalaman hierarki menambah geser: spacing × (1 + kedalaman × bobot)
{
  const items = [box('root', [-10, 0, 0], 1), box('kid', [10, 0, 0], 1, 'root'), box('grand', [0, 20, 0], 1, 'kid')]
  const out = buildExplodedLayout(items, { spacing: 2, hierarchyWeight: 0.5, maxRelaxationIterations: 0 })
  assert.deepEqual([tf(out, 'root').hierarchyDepth, tf(out, 'kid').hierarchyDepth, tf(out, 'grand').hierarchyDepth], [0, 1, 2], 'depth follows parentId chain')
  assert.ok(Math.abs(len(tf(out, 'root').offset) - 2) < 1e-9, 'depth 0 moves by spacing')
  assert.ok(Math.abs(len(tf(out, 'kid').offset) - 3) < 1e-9, 'depth 1 moves by spacing × (1 + weight)')
  assert.ok(Math.abs(len(tf(out, 'grand').offset) - 4) < 1e-9, 'depth 2 moves by spacing × (1 + 2 × weight)')
}
// Item di pusat gabungan memakai arah deterministik (dari id) dengan panjang tepat spacing
{
  const one = buildExplodedLayout([box('only', [0, 0, 0], 1)], { spacing: 5 })
  assert.ok(Math.abs(len(tf(one, 'only').offset) - 5) < 1e-9, 'a lone item still moves by spacing along a deterministic direction')
  assert.deepEqual(buildExplodedLayout([box('only', [0, 0, 0], 1)], { spacing: 5 }), one, 'the hash direction is deterministic')
}

// ── Relaksasi: tabrakan dipisahkan; metrik jujur sama dengan referensi brute force ─
{
  const items = Array.from({ length: 6 }, (_, i) => box(`stack-${i}`, [0, 0, 0], 1))
  const out = buildExplodedLayout(items, { spacing: 0, collisionPadding: 0.25, maxRelaxationIterations: 200 })
  assert.equal(out.unresolvedCollisions, 0, 'identical overlapping boxes must be separated given enough iterations')
  assert.equal(bruteUnresolved(items, out, 0.25), 0, 'brute force confirms no padded overlap remains')
  assert.ok(out.iterations > 0, 'separating collisions takes at least one iteration')
}
{
  const cloud = Array.from({ length: 70 }, (_, i) => box(`c-${String(i).padStart(2, '0')}`, [between(-6, 6), between(-6, 6), between(-6, 6)], between(0.4, 1.5)))
  for (const iters of [0, 3, 400]) {
    const out = buildExplodedLayout(cloud, { spacing: 0.5, collisionPadding: 0.1, maxRelaxationIterations: iters })
    assert.equal(out.unresolvedCollisions, bruteUnresolved(cloud, out, 0.1), `reported unresolved count must equal brute force at ${iters} iterations`)
    assert.ok(out.iterations <= iters, 'iterations never exceed the cap')
  }
  const done = buildExplodedLayout(cloud, { spacing: 0.5, collisionPadding: 0.1, maxRelaxationIterations: 400 })
  assert.equal(done.unresolvedCollisions, 0, 'a generous cap resolves a seeded 70-box cloud')
  const none = buildExplodedLayout(cloud, { spacing: 0.5, collisionPadding: 0.1, maxRelaxationIterations: 0 })
  assert.ok(none.unresolvedCollisions > 0, 'with zero iterations a dense cloud keeps collisions and says so')
  // Determinisme: urutan masukan tidak mengubah hasil.
  assert.deepEqual(buildExplodedLayout([...cloud].reverse(), { spacing: 0.5, collisionPadding: 0.1, maxRelaxationIterations: 400 }), done, 'layout must not depend on input order')
}

// ── Struktur bersarang: induk–anak tidak dipisahkan secara default ───────────
{
  const nested = [box('lung', [0, 0, 0], 5), box('lobe', [0, 0, 0], 1, 'lung'), box('far', [30, 0, 0], 1)]
  const kept = buildExplodedLayout(nested, { spacing: 0, hierarchyWeight: 0, maxRelaxationIterations: 50 })
  assert.equal(kept.unresolvedCollisions, 0, 'ancestor/descendant overlap is not a collision')
  assert.deepEqual([...tf(kept, 'lobe').offset], [0, 0, 0], 'a nested child is not pushed out of its parent')
  const split = buildExplodedLayout(nested, { spacing: 0, hierarchyWeight: 0, maxRelaxationIterations: 50, ignoreAncestorPairs: false })
  assert.notDeepEqual([...tf(split, 'lobe').offset], [0, 0, 0], 'with ignoreAncestorPairs false the nested pair is separated')
}
// Ciklus dan induk tak dikenal tidak membuat loop tak berujung
{
  const odd = [box('a', [0, 0, 0], 1, 'b'), box('b', [10, 0, 0], 1, 'a'), box('c', [20, 0, 0], 1, 'ghost')]
  const out = buildExplodedLayout(odd)
  assert.ok(odd.every((i) => Number.isFinite(tf(out, i.id).hierarchyDepth)), 'a parent cycle must yield finite depths')
  assert.equal(tf(out, 'c').hierarchyDepth, 0, 'an unknown parent id is treated as a root')
}

// ── Batas ────────────────────────────────────────────────────────────────────
assert.deepEqual(buildExplodedLayout([]), { transforms: [], sourceBounds: null, iterations: 0, unresolvedCollisions: 0 }, 'empty input yields an empty layout, not an error')
assert.deepEqual([...tf(buildExplodedLayout([box('a', [-5, 0, 0], 1), box('b', [5, 0, 0], 1)], { spacing: 0 }), 'a').offset], [-0, 0, 0].map((n) => n + 0), 'zero spacing keeps separated items in place')
{
  const t = tf(buildExplodedLayout([box('a', [-5, 0, 0], 1), box('b', [5, 0, 0], 1)], { spacing: 4 }), 'b')
  assert.deepEqual([...interpolateExplodedOffset(t, 0)], [0, 0, 0], 'progress 0 is the assembled position')
  assert.deepEqual([...interpolateExplodedOffset(t, 1)], [...t.offset], 'progress 1 is the full offset')
  assert.deepEqual([...interpolateExplodedOffset(t, 0.5)], [t.offset[0] / 2, 0, 0], 'progress 0.5 is half the offset')
  assert.deepEqual([...interpolateExplodedOffset(t, -3)], [0, 0, 0], 'progress below 0 clamps to 0')
  assert.deepEqual([...interpolateExplodedOffset(t, 9)], [...t.offset], 'progress above 1 clamps to 1')
  rejects(() => interpolateExplodedOffset(t, NaN), /progress must be a finite number/, 'NaN progress must be rejected, not propagated')
  rejects(() => interpolateExplodedOffset(t, Infinity), /progress must be a finite number/, 'infinite progress must be rejected')
}
// Padding tepat pada ambang: jarak sama dengan 2 × padding bukan tabrakan; sedikit kurang adalah tabrakan
{
  const touching = [box('p', [0, 0, 0], 1), box('q', [2.5, 0, 0], 1)] // celah 0,5 = 2 × 0,25
  assert.equal(buildExplodedLayout(touching, { spacing: 0, collisionPadding: 0.25 }).unresolvedCollisions, 0, 'a gap exactly 2×padding is not a collision')
  const tight = [box('p', [0, 0, 0], 1), box('q', [2.49, 0, 0], 1)]
  assert.equal(buildExplodedLayout(tight, { spacing: 0, collisionPadding: 0.25, maxRelaxationIterations: 0 }).unresolvedCollisions, 1, 'a gap just under 2×padding is a collision')
}

// ── Negatif ──────────────────────────────────────────────────────────────────
const ok = box('a', [0, 0, 0], 1)
rejects(() => buildExplodedLayout([{ ...ok, min: [NaN, 0, 0] }]), /finite bounds/, 'NaN bounds must be rejected')
rejects(() => buildExplodedLayout([{ ...ok, max: [Infinity, 1, 1] }]), /finite bounds/, 'infinite bounds must be rejected')
rejects(() => buildExplodedLayout([{ ...ok, min: [2, 0, 0], max: [1, 1, 1] }]), /min greater than max/, 'inverted bounds must be rejected')
rejects(() => buildExplodedLayout([{ ...ok, id: ' ' }]), /blank id/, 'a blank id must be rejected')
rejects(() => buildExplodedLayout([ok, { ...ok }]), /duplicate item id/, 'duplicate ids must be rejected')
rejects(() => buildExplodedLayout([ok], { spacing: -1 }), /spacing/, 'negative spacing must be rejected')
rejects(() => buildExplodedLayout([ok], { spacing: NaN }), /spacing/, 'NaN spacing must be rejected')
rejects(() => buildExplodedLayout([ok], { hierarchyWeight: Infinity }), /hierarchyWeight/, 'infinite hierarchyWeight must be rejected')
rejects(() => buildExplodedLayout([ok], { collisionPadding: -0.1 }), /collisionPadding/, 'negative collisionPadding must be rejected')
rejects(() => buildExplodedLayout([ok], { maxRelaxationIterations: 2.5 }), /maxRelaxationIterations/, 'fractional iteration cap must be rejected')
rejects(() => buildExplodedLayout([ok], { maxRelaxationIterations: -1 }), /maxRelaxationIterations/, 'negative iteration cap must be rejected')
{
  const frozen = Object.freeze([Object.freeze({ ...ok, min: Object.freeze([-1, -1, -1]) as ExplodeVec3, max: Object.freeze([1, 1, 1]) as ExplodeVec3 })])
  const before = JSON.stringify(frozen)
  buildExplodedLayout(frozen)
  assert.equal(JSON.stringify(frozen), before, 'layout must not mutate its input')
}

console.log('exploded layout: radial offsets, depth, brute-force collision metric, nesting, determinism, boundaries and 11 rejection rules ok')
