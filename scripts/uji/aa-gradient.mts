import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { aaGradient, AA_RANGES, parseNumberField } from '../../src/domains/clinical-calculators/index.ts'

const base = { fio2: 21, pao2: 90, paco2: 40, age: 40, patm: 760 }
const run = (o: Partial<typeof base>) => aaGradient({ ...base, ...o })

// Nilai tangan: PAO2 = 0.21×713 − 40/0.8 = 149.73 − 50 = 99.73; gradien = 9.73; harapan = 40/4 + 4 = 14 → normal.
const normal = run({})
assert.ok(normal.ok)
if (normal.ok) {
  assert.ok(Math.abs(normal.data.alveolar - 99.73) < 1e-9)
  assert.ok(Math.abs(normal.data.gradient - 9.73) < 1e-9)
  assert.equal(normal.data.expectedForAge, 14)
  assert.equal(normal.data.elevated, false)
  assert.equal(normal.data.supplementalOxygen, false)
}
// Pasangan: hanya PaO2 turun ke 70 → gradien 29.73 > 14 → meningkat.
const tinggi = run({ pao2: 70 })
assert.ok(tinggi.ok && tinggi.data.elevated)
// Batas: gradien tepat sama dengan harapan → TIDAK meningkat (operator ">" ). PaO2 = 99.73 − 14 = 85.73.
const tepat = aaGradient({ ...base, pao2: 85.73 })
assert.ok(tepat.ok)
if (tepat.ok) assert.equal(tepat.data.elevated, Math.abs(tepat.data.gradient - 14) > 1e-9 ? tepat.data.gradient > 14 : false)
assert.equal(run({ pao2: 85.7 }).ok && (run({ pao2: 85.7 }) as { data: { elevated: boolean } }).data.elevated, true)
assert.equal(run({ pao2: 85.8 }).ok && (run({ pao2: 85.8 }) as { data: { elevated: boolean } }).data.elevated, false)
// Persis di batas: FiO2 100% → PAO2 = 713 − 50 = 663 (aritmetika bulat, tanpa galat float); PaO2 649 → gradien 14 = harapan 14.
const sama = aaGradient({ fio2: 100, pao2: 649, paco2: 40, age: 40, patm: 760 })
assert.ok(sama.ok && sama.data.gradient === 14 && sama.data.expectedForAge === 14)
if (sama.ok) assert.equal(sama.data.elevated, false)
const diatas = aaGradient({ fio2: 100, pao2: 648, paco2: 40, age: 40, patm: 760 })
assert.ok(diatas.ok && diatas.data.elevated)
// Oksigen tambahan: batas 30 tepat → belum; 31 → ya.
assert.equal((run({ fio2: 30 }) as { data: { supplementalOxygen: boolean } }).data.supplementalOxygen, false)
assert.equal((run({ fio2: 31 }) as { data: { supplementalOxygen: boolean } }).data.supplementalOxygen, true)
// Ketinggian: patm 630 mengubah PAO2 (0.21×583 − 50 = 72.43).
const alt = run({ patm: 630 })
assert.ok(alt.ok && Math.abs(alt.data.alveolar - 72.43) < 1e-9)
// Determinisme.
assert.deepEqual(run({}), run({}))

// Rentang dipatok literal agar mutasi pada tabel rentang tidak ikut menggeser tesnya sendiri.
assert.deepEqual(JSON.parse(JSON.stringify(AA_RANGES)), {
  fio2: { min: 21, max: 100, unit: ' %' }, pao2: { min: 1, max: 700, unit: ' mmHg' }, paco2: { min: 5, max: 150, unit: ' mmHg' },
  age: { min: 0, max: 120, unit: ' years' }, patm: { min: 400, max: 800, unit: ' mmHg' },
})
// Batas masukan: tepat di batas diterima, di luar ditolak dengan alasan eksplisit dan tanpa data.
const NAMA = { fio2: 'FiO2', pao2: 'PaO2', paco2: 'PaCO2', age: 'Age', patm: 'Atmospheric pressure' } as const
for (const k of Object.keys(AA_RANGES) as (keyof typeof AA_RANGES)[]) {
  const { min, max, unit } = AA_RANGES[k]
  assert.equal(run({ [k]: min }).ok, true, `${k} min`)
  assert.equal(run({ [k]: max }).ok, true, `${k} max`)
  for (const buruk of [min - 0.001, max + 0.001, Number.NaN, Infinity, -Infinity, -1]) {
    if (buruk >= min && buruk <= max) continue
    const r = run({ [k]: buruk })
    assert.deepEqual(r, { ok: false, reason: `${NAMA[k]} must be ${min}–${max}${unit}` }, `${k}=${buruk}`)
    assert.equal('data' in r, false)
  }
  for (const salah of [undefined, null, '5', {}] as unknown as number[]) assert.equal(run({ [k]: salah }).ok, false, `${k} tipe`)
}
// Regresi: PaO2 kosong dulu terbaca 0 → gradien = PAO2 > harapan → "Elevated gradient" palsu. Kini ditolak.
const lama = ((0.21 * (760 - 47)) - 40 / 0.8) - 0
assert.ok(lama > 40 / 4 + 4)
assert.deepEqual(aaGradient({ ...base, pao2: parseNumberField('') }), { ok: false, reason: 'PaO2 must be 1–700 mmHg' })
assert.equal(aaGradient({ ...base, paco2: parseNumberField('  ') }).ok, false)
// Urutan pemeriksaan terdokumentasi: FiO2 lebih dulu dari PaO2.
assert.deepEqual(run({ fio2: 5, pao2: -1 }), { ok: false, reason: 'FiO2 must be 21–100 %' })

// Halaman: raw-text, memakai fungsi domain, tidak ada rumus/parse lama.
const src = readFileSync('src/pages/clinical/scores/AaGradient.tsx', 'utf8')
const lines = src.split('\n').map((l) => l.trim())
assert.ok(lines.includes("import { aaGradient, parseNumberField } from '../../../domains/clinical-calculators'"))
assert.equal(src.match(/parseNumberField\(/g)?.length, 5)
assert.ok(!/\|\|\s*0\)/.test(src), 'tidak boleh ada || 0 pada parsing')
assert.ok(!/paco2\s*\/\s*0\.8/.test(src), 'rumus tidak boleh disalin ke halaman')
assert.ok(lines.includes('{!res.ok ? ('), 'halaman harus bercabang pada hasil tervalidasi')
assert.ok(lines.some((l) => l.includes('{res.reason}')))
assert.equal(lines.filter((l) => l.includes('res.data.')).length >= 6, true)

// Regresi: umur bawaan (45/40) tidak boleh disulihkan; hanya umur tersimpan.
assert.ok(!/\bgetDemo\(\)/.test(src) && src.includes('getDemoTersimpan()'), 'halaman tidak boleh memakai getDemo()')

console.log('aa-gradient: hand values, boundaries, fail-closed input ranges, empty PaO2 no longer reads as elevated')
