import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseNumberField, sirirajStrokeScore } from '../../src/domains/clinical-calculators/index.ts'

const base = { consciousness: 0, vomiting: 0, headache: 0, diastolicMmHg: 90, atheroma: 0 }
const run = (o: Partial<typeof base>) => sirirajStrokeScore({ ...base, ...o })
const data = (o: Partial<typeof base>) => { const r = run(o); assert.ok(r.ok, JSON.stringify(o)); return r.ok ? r.data : (undefined as never) }

// Nilai tangan: semua nol, TD 90 → 0.1×90 − 12 = −3 → iskemik.
assert.deepEqual(data({}), { score: 0.1 * 90 - 12, rounded: -3, diastolicMmHg: 90, label: 'Suggests ISCHAEMIC stroke', tone: 'low' })
// 2.5×2 + 2 + 2 + 0.1×110 − 0 − 12 = 8 → hemoragik.
assert.deepEqual(data({ consciousness: 2, vomiting: 1, headache: 1, diastolicMmHg: 110 }), { score: 5 + 2 + 2 + 0.1 * 110 - 12, rounded: 8, diastolicMmHg: 110, label: 'Suggests HAEMORRHAGIC stroke', tone: 'critical' })
assert.equal(data({ atheroma: 1, diastolicMmHg: 100 }).rounded, 0.1 * 100 - 3 - 12) // −5
// Ambang tepat di batas, dengan aritmetika bulat eksak sebagai penjaga float: > +1 hemoragik, < −1 iskemik, di antaranya tidak tentu.
const tenths = (o: typeof base) => 25 * o.consciousness + 20 * o.vomiting + 20 * o.headache + o.diastolicMmHg - 30 * o.atheroma - 120
const kelas = (t: number) => (t > 10 ? 'Suggests HAEMORRHAGIC stroke' : t < -10 ? 'Suggests ISCHAEMIC stroke' : 'Indeterminate — imaging required')
// DBP yang membuat skor tepat +1 (130 dengan semua nol → 0.1×130−12 = 1) dan tepat −1 (110 → −1).
assert.equal(data({ diastolicMmHg: 130 }).score, 1); assert.equal(data({ diastolicMmHg: 130 }).label, 'Indeterminate — imaging required', 'tepat +1 tidak tentu')
assert.equal(data({ diastolicMmHg: 131 }).label, 'Suggests HAEMORRHAGIC stroke', 'sedikit di atas +1')
assert.equal(data({ diastolicMmHg: 110 }).score, -1); assert.equal(data({ diastolicMmHg: 110 }).label, 'Indeterminate — imaging required', 'tepat −1 tidak tentu')
assert.equal(data({ diastolicMmHg: 109 }).label, 'Suggests ISCHAEMIC stroke', 'sedikit di bawah −1')
assert.equal(data({ diastolicMmHg: 120 }).label, 'Indeterminate — imaging required')
// Regresi: identik dengan formula halaman lama DAN dengan aritmetika bulat eksak di seluruh grid (termasuk langkah 0,5 mmHg).
let n = 0
for (const C of [0, 1, 2]) for (const V of [0, 1]) for (const H of [0, 1]) for (const A of [0, 1]) for (let d = 20; d <= 200; d += 0.5) {
  const o = { consciousness: C, vomiting: V, headache: H, diastolicMmHg: d, atheroma: A }
  const lama = 2.5 * C + 2 * V + 2 * H + 0.1 * d - 3 * A - 12
  const r = data(o)
  assert.equal(r.score, lama); assert.equal(r.rounded, Math.round(lama * 100) / 100)
  assert.equal(r.label, kelas(tenths(o)), `float vs eksak: ${JSON.stringify(o)}`)
  n++
}
assert.equal(n, 3 * 2 * 2 * 2 * 361)
// Penolakan: tiap kolom, hanya yang rusak yang menolak (pasangan), dengan alasan eksplisit dan tanpa data.
const GD = { ok: false, reason: 'Diastolic pressure must be 20–200 mmHg' }
for (const d of [19.99, 0, -90, 200.01, 900, NaN, Infinity, -Infinity, parseNumberField('')]) assert.deepEqual(run({ diastolicMmHg: d }), GD, `TD ${d}`)
for (const d of [20, 200]) assert.equal(run({ diastolicMmHg: d }).ok, true, `TD ${d}`)
for (const [kolom, buruk, pesan] of [
  ['consciousness', [3, -1, 0.5, NaN, '1'], 'Consciousness must be alert (0), drowsy/stupor (1) or semicoma/coma (2)'],
  ['vomiting', [2, -1, 0.5, NaN, true], 'Vomiting must be no (0) or yes (1)'],
  ['headache', [2, -1, 0.5, NaN, null], 'Headache must be no (0) or yes (1)'],
  ['atheroma', [2, -1, 0.5, NaN, undefined], 'Atheroma markers must be none (0) or one or more (1)'],
] as const) for (const v of buruk) assert.deepEqual(run({ [kolom]: v } as Partial<typeof base>), { ok: false, reason: pesan }, `${kolom}=${String(v)}`)
assert.equal('data' in (run({ diastolicMmHg: NaN }) as object), false)
assert.equal(sirirajStrokeScore(undefined as unknown as typeof base).ok, false)
// Jebakan nyata halaman lama: TD kosong → Number('') || 0 → 0 → skor −12 (selisih −9 poin) → "ISCHAEMIC" untuk pasien yang sebenarnya TD 90.
assert.equal(Number('') || 0, 0); assert.equal(2.5 * 0 + 0.1 * (Number('') || 0) - 12, -12)
assert.deepEqual(run({ diastolicMmHg: parseNumberField('') }), GD)
assert.deepEqual(run({}), run({}), 'deterministik')

// Halaman memakai fungsi kanonik, tanpa menghitung ulang, dan isi klinis tidak berubah.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
const baris = halaman.split('\n').map((l) => l.trim())
assert.ok(baris.includes("const siriraj = sirirajStrokeScore({ consciousness: conscious, vomiting, headache, diastolicMmHg: parseNumberField(dbp), atheroma })"))
assert.match(halaman, /const \[dbp, setDbp\] = useState\('90'\)/); assert.match(halaman, /onChange=\{\(e\) => setDbp\(e\.target\.value\)\}/)
assert.match(halaman, /siriraj\.ok \? \(/); assert.match(halaman, /\{siriraj\.reason\}/)
assert.doesNotMatch(halaman, /Number\(e\.target\.value\) \|\| 0/, 'pola "|| 0" yang membaca kosong sebagai 0 tidak boleh kembali')
assert.doesNotMatch(halaman, /const score = 2\.5 \* conscious/, 'formula Siriraj tidak boleh dihitung ulang di halaman')
assert.ok(baris.includes('Source: Poungvarin N, Viriyavejakul A, Komontri C. Siriraj stroke score and validation study to'), 'sumber tidak berubah')
assert.ok(halaman.includes('This does not replace a CT scan.'), 'peringatan CT tidak boleh hilang')
console.log('siriraj-stroke-score: golden, thresholds at ±1 pinned against exact integer arithmetic over 8664 combinations, empty diastolic pressure never read as 0')
