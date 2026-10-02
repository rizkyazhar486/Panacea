import assert from 'node:assert/strict'
import { layoutLabels, type LabelCandidate, type ScreenRect } from '../../src/domains/body-exposure/engine/labelLayout.ts'

function lcg(seed: number) {
  let s = seed >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000 }
}
const rnd = lcg(844390)
const between = (lo: number, hi: number) => lo + (hi - lo) * rnd()

const VP = { viewportWidth: 390, viewportHeight: 844 }
const label = (id: string, x: number, y: number, extra: Partial<LabelCandidate> = {}): LabelCandidate =>
  ({ id, text: `Label ${id}`, anchor: { x, y }, width: 80, height: 22, priority: 1, ...extra })
const area = (r: ScreenRect) => r.width * r.height
const overlap = (a: ScreenRect, b: ScreenRect) => {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}
const rejects = (fn: () => unknown, pattern: RegExp, why: string) =>
  assert.throws(fn, (e: unknown) => e instanceof RangeError && pattern.test(e.message), why)

// ── Positif ──────────────────────────────────────────────────────────────────
{
  const out = layoutLabels([label('a', 200, 400)], VP)
  assert.deepEqual([out.visibleCount, out.hiddenCount], [1, 0], 'a lone label must be visible')
  const r = out.placements[0].rect
  assert.ok(r.x >= 12 && r.y >= 12 && r.x + r.width <= 390 - 12 && r.y + r.height <= 844 - 12, 'a placed label must stay inside the safe inset')
  assert.equal(out.placements[0].overlapArea, 0, 'a lone label has no overlap')
}
{
  const out = layoutLabels([label('a', 200, 400), label('b', 200, 400)], VP)
  assert.equal(out.visibleCount, 2, 'two labels on the same anchor must both be placed apart')
  const [a, b] = out.placements
  assert.equal(overlap(a.rect, b.rect), 0, 'labels competing for one anchor must not overlap')
  assert.notDeepEqual(a.rect, b.rect, 'competing labels must take different positions')
}

// ── Sifat pada data acak berbenih: batas viewport, batas tumpang-tindih, kekekalan hitungan ──
{
  const many = Array.from({ length: 80 }, (_, i) => label(`m-${String(i).padStart(2, '0')}`, between(20, 370), between(40, 800), { priority: between(0, 10) }))
  const out = layoutLabels(many, VP)
  assert.equal(out.visibleCount + out.hiddenCount, 80, 'every candidate is either visible or hidden')
  const visible = out.placements.filter((p) => p.visible)
  for (const p of visible) {
    assert.ok(p.rect.x >= 12 - 1e-9 && p.rect.y >= 12 - 1e-9 && p.rect.x + p.rect.width <= 378 + 1e-9 && p.rect.y + p.rect.height <= 832 + 1e-9, `${p.id} must stay inside the safe inset`)
  }
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      const o = overlap(visible[i].rect, visible[j].rect)
      assert.ok(o <= 0.05 * Math.max(area(visible[i].rect), area(visible[j].rect)) + 1e-9, `visible labels ${visible[i].id}/${visible[j].id} overlap beyond the allowed ratio`)
    }
  }
  assert.ok(out.placements.filter((p) => !p.visible).every((p) => p.visible === false), 'hidden placements are marked invisible')
  // Determinisme: urutan masukan tidak mengubah hasil.
  const shuffled = [...many].sort(() => 0) .reverse()
  assert.deepEqual(layoutLabels(shuffled, VP), out, 'layout must not depend on input order')
}

// Seri prioritas: urutan masukan tidak boleh memengaruhi siapa yang menang (tie-break menurut id).
{
  const tie = [label('c', 200, 400), label('a', 200, 400), label('b', 200, 400)]
  assert.deepEqual(layoutLabels(tie, VP), layoutLabels([...tie].reverse(), VP), 'equal-priority labels must resolve identically in any input order')
  assert.deepEqual(layoutLabels(tie, { ...VP, maxVisibleLabels: 1 }).placements.map((p) => [p.id, p.visible]), [['a', true], ['b', false], ['c', false]], 'with equal priority the smallest id wins the single slot')
}

// ── Prioritas dan kapasitas ──────────────────────────────────────────────────
{
  const out = layoutLabels([label('hi', 200, 400, { priority: 9 }), label('lo', 200, 400, { priority: 1 })], { ...VP, maxVisibleLabels: 1 })
  const by = Object.fromEntries(out.placements.map((p) => [p.id, p.visible]))
  assert.deepEqual(by, { hi: true, lo: false }, 'with capacity 1 the higher priority label wins')
}
{
  const out = layoutLabels([label('sel', 200, 400, { priority: 0, selected: true }), label('top', 200, 400, { priority: 99 })], { ...VP, maxVisibleLabels: 1 })
  assert.equal(out.placements.find((p) => p.id === 'sel')!.visible, true, 'a selected label outranks any priority')
  assert.equal(out.placements.find((p) => p.id === 'top')!.visible, false, 'the unselected label yields at capacity')
}
{
  const out = layoutLabels([label('sel', 200, 400, { selected: true, priority: 99 }), label('pin', 200, 400, { pinned: true, priority: 0 })], { ...VP, maxVisibleLabels: 1 })
  assert.deepEqual(out.placements.map((p) => [p.id, p.visible]), [['pin', true], ['sel', true]], 'pinned and selected labels are forced visible even beyond capacity')
  assert.equal(out.visibleCount, 2, 'forced labels may exceed maxVisibleLabels')
}
{
  // Pinned entra lebih dulu daripada selected: yang kalah tempat harus tetap tampil (dipaksa), tetapi
  // pada kapasitas cukup, urutan penerimaan memengaruhi siapa yang mendapat posisi terdekat.
  const out = layoutLabels([label('sel', 200, 400, { selected: true }), label('pin', 200, 400, { pinned: true })], VP)
  const pin = out.placements.find((p) => p.id === 'pin')!
  assert.equal(pin.leaderLength <= 1e-9, true, 'the pinned label is admitted first and gets the unobstructed position')
}

// ── Batas ────────────────────────────────────────────────────────────────────
assert.equal(layoutLabels([], VP).visibleCount, 0, 'no candidates yields an empty layout')
rejects(() => layoutLabels([label('a', 100, 100)], { viewportWidth: 24, viewportHeight: 844 }), /larger than its safe insets/, 'a viewport exactly twice the inset is rejected')
assert.equal(layoutLabels([label('a', 100, 100)], { viewportWidth: 25, viewportHeight: 844 }).visibleCount, 1, 'a viewport one unit above twice the inset is accepted')
{
  const big = layoutLabels([{ ...label('big', 50, 50), width: 1000, height: 2000 }], VP)
  assert.equal(big.visibleCount, 1, 'a label larger than the viewport is still placed (clamped to the inset)')
  assert.equal(big.placements[0].rect.x, 12, 'an oversize label pins to the left inset')
}
assert.equal(layoutLabels([label('a', 100, 100), label('b', 100, 100)], { ...VP, maxOverlapRatio: 1 }).hiddenCount, 0, 'ratio 1 never hides for overlap')
assert.equal(layoutLabels([label('a', 100, 100)], { ...VP, maxRings: 0 }).visibleCount, 1, 'maxRings 0 still places at ring zero')

// ── Negatif ──────────────────────────────────────────────────────────────────
const base = label('a', 100, 100)
rejects(() => layoutLabels([{ ...base, width: Infinity }], VP), /finite positive dimensions/, 'infinite width must be rejected (it would hang the spatial hash)')
rejects(() => layoutLabels([{ ...base, height: Infinity }], VP), /finite positive dimensions/, 'infinite height must be rejected')
rejects(() => layoutLabels([{ ...base, width: NaN }], VP), /finite positive dimensions/, 'NaN width must be rejected')
rejects(() => layoutLabels([{ ...base, width: 0 }], VP), /finite positive dimensions/, 'zero width must be rejected')
rejects(() => layoutLabels([{ ...base, anchor: { x: NaN, y: 1 } }], VP), /non-finite anchor/, 'a NaN anchor must be rejected')
rejects(() => layoutLabels([{ ...base, priority: Infinity }], VP), /non-finite anchor or priority/, 'an infinite priority must be rejected')
rejects(() => layoutLabels([{ ...base, id: '  ' }], VP), /blank id/, 'a blank id must be rejected')
rejects(() => layoutLabels([{ ...base, text: '' }], VP), /blank text/, 'blank text must be rejected')
rejects(() => layoutLabels([base, { ...base }], VP), /duplicate label id/, 'duplicate ids must be rejected')
rejects(() => layoutLabels([base], { ...VP, candidateStep: NaN }), /candidateStep/, 'a NaN candidateStep must be rejected')
rejects(() => layoutLabels([base], { ...VP, safeInset: -1 }), /safeInset/, 'a negative safeInset must be rejected')
rejects(() => layoutLabels([base], { ...VP, anchorGap: Infinity }), /anchorGap/, 'an infinite anchorGap must be rejected')
rejects(() => layoutLabels([base], { ...VP, maxVisibleLabels: 0 }), /maxVisibleLabels/, 'maxVisibleLabels 0 must be rejected')
rejects(() => layoutLabels([base], { ...VP, maxRings: 1.5 }), /maxRings/, 'a fractional maxRings must be rejected')
rejects(() => layoutLabels([base], { ...VP, gridCellSize: 0 }), /gridCellSize/, 'gridCellSize 0 must be rejected')
rejects(() => layoutLabels([base], { ...VP, gridCellSize: Infinity }), /gridCellSize/, 'an infinite gridCellSize must be rejected')
rejects(() => layoutLabels([base], { ...VP, maxOverlapRatio: 1.1 }), /maxOverlapRatio/, 'maxOverlapRatio above 1 must be rejected')
rejects(() => layoutLabels([base], { ...VP, maxOverlapRatio: NaN }), /maxOverlapRatio/, 'a NaN maxOverlapRatio must be rejected')
rejects(() => layoutLabels([base], { viewportWidth: 0, viewportHeight: 844 }), /viewport/, 'a zero-width viewport must be rejected')
{
  const frozen = Object.freeze([Object.freeze({ ...base, anchor: Object.freeze({ x: 100, y: 100 }) })])
  const before = JSON.stringify(frozen)
  layoutLabels(frozen, VP)
  assert.equal(JSON.stringify(frozen), before, 'layout must not mutate its input')
}

console.log('label layout: bounds, overlap ratio, priority/forced rules, determinism, boundaries and 18 rejection rules ok')
