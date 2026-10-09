import assert from 'node:assert/strict'
import { referenceChangeValue, judgeSerialChange, RCV_Z } from '../../src/domains/clinical-calculators/index.ts'

const near = (a: number, b: number, t = 1e-9) => assert.ok(Math.abs(a - b) < t, `${a} ≉ ${b}`)

// Nilai tangan: CVa=3, CVi=4 → √(9+16)=5; RCV = 1.4142136×1.96×5 = 13.8591...
const r = referenceChangeValue({ cvaPercent: 3, cviPercent: 4 })
assert.ok(r.ok)
if (r.ok) {
  near(r.data.rcvPercent, Math.SQRT2 * 1.96 * 5)
  assert.ok(r.data.lognormalUpPercent > r.data.rcvPercent) // asimetri log-normal: sisi naik lebih besar
  assert.ok(Math.abs(r.data.lognormalDownPercent) < r.data.rcvPercent)
}
// Pasangan: hanya Z satu-sisi → RCV lebih kecil.
const uni = referenceChangeValue({ cvaPercent: 3, cviPercent: 4, z: RCV_Z.unidirectional95 })
assert.ok(r.ok && uni.ok && uni.data.rcvPercent < r.data.rcvPercent)
// Batas: CV 0 dan 100 diterima (salah satu >0); -0.01 dan 100.01 ditolak.
assert.ok(referenceChangeValue({ cvaPercent: 0, cviPercent: 5 }).ok)
assert.ok(referenceChangeValue({ cvaPercent: 100, cviPercent: 0 }).ok)
for (const bad of [-0.01, 100.01, Number.NaN, Infinity, '3' as unknown as number]) {
  const x = referenceChangeValue({ cvaPercent: bad, cviPercent: 4 })
  assert.equal(x.ok, false)
  if (!x.ok) assert.match(x.reason, /Analytical CV/)
  const y = referenceChangeValue({ cvaPercent: 3, cviPercent: bad })
  assert.equal(y.ok, false)
  if (!y.ok) assert.match(y.reason, /Within-subject CV/)
}
const nol = referenceChangeValue({ cvaPercent: 0, cviPercent: 0 })
assert.ok(!nol.ok && /above 0/.test(nol.reason))
for (const z of [0, -1, Number.NaN]) assert.equal(referenceChangeValue({ cvaPercent: 3, cviPercent: 4, z }).ok, false)

// Penilaian serial: batas atas tepat tidak melebihi; sedikit di atasnya melebihi.
const cv = { cvaPercent: 3, cviPercent: 4 }
const up = r.ok ? r.data.lognormalUpPercent : 0
const down = r.ok ? r.data.lognormalDownPercent : 0
const at = judgeSerialChange(100, 100 * (1 + up / 100), cv)
assert.ok(at.ok && at.data.direction !== 'down')
const over = judgeSerialChange(100, 100 * (1 + up / 100) + 0.01, cv)
assert.ok(over.ok && over.data.exceedsRcv && over.data.direction === 'up')
const under = judgeSerialChange(100, 100 * (1 + down / 100) - 0.01, cv)
assert.ok(under.ok && under.data.exceedsRcv && under.data.direction === 'down')
const kecil = judgeSerialChange(100, 105, cv)
assert.ok(kecil.ok && !kecil.data.exceedsRcv && kecil.data.direction === 'none')
// Negatif: hasil nol/negatif/NaN ditolak, tanpa efek samping (fungsi murni → hasil identik).
for (const [p, c] of [[0, 5], [-1, 5], [5, 0], [5, Number.NaN], [Infinity, 5]] as const) assert.equal(judgeSerialChange(p, c, cv).ok, false)
assert.equal(judgeSerialChange(100, 105, { cvaPercent: -1, cviPercent: 4 }).ok, false)
// Determinisme.
assert.deepEqual(judgeSerialChange(100, 130, cv), judgeSerialChange(100, 130, cv))
console.log('reference-change-value: ok')
