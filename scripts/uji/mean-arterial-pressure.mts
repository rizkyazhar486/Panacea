import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { meanArterialPressure } from '../../src/domains/clinical-calculators/index.ts'

const map = (s: number, d: number) => {
  const r = meanArterialPressure(s, d)
  assert.ok(r.ok, `harus diterima: ${s}/${d}`)
  return r.ok ? r.data : (undefined as never)
}

// Positif: nilai referensi dihitung tangan, (S + 2D) / 3.
assert.equal(map(120, 80).map, 280 / 3)
assert.equal(map(120, 80).label, 'Normal')
assert.equal(map(90, 60).map, 70)
assert.equal(map(150, 90).map, 110)
assert.equal(map(150, 90).label, 'High')
assert.equal(map(70, 40).map, 50)
assert.equal(map(70, 40).label, 'Very low')
assert.equal(map(70, 40).tone, 'critical')

// Batas kategori: MAP tepat 60 dan 100 adalah Normal; satu langkah di luar pindah kategori.
assert.equal(map(90, 45).map, 60)
assert.equal(map(90, 45).label, 'Normal')
assert.equal(map(89, 45).label, 'Very low') // MAP 59.67
assert.equal(map(130, 85).map, 100)
assert.equal(map(130, 85).label, 'Normal')
assert.equal(map(131, 85).label, 'High') // MAP 100.33

// Batas rentang masukan: tepat di batas diterima, satu langkah di luar ditolak.
assert.equal(meanArterialPressure(40, 20).ok, true)
assert.equal(meanArterialPressure(300, 200).ok, true)
const GALAT_SIS = { ok: false, reason: 'Systolic must be 40–300 mmHg' }
for (const s of [39.9, 0, -120, 300.1, 1000, NaN, Infinity, -Infinity, +'']) assert.deepEqual(meanArterialPressure(s, 20), GALAT_SIS, `sistolik ${s}`)
const GALAT_DIA = { ok: false, reason: 'Diastolic must be 20–200 mmHg' }
for (const d of [19.9, 0, -80, 200.1, 5000, NaN, Infinity, -Infinity, +'']) assert.deepEqual(meanArterialPressure(250, d), GALAT_DIA, `diastolik ${d}`)

// Pasangan: hanya hubungan S dan D yang berbeda. Diastolik sama atau lebih tinggi dari sistolik ditolak.
assert.equal(meanArterialPressure(100, 99).ok, true)
const GALAT_URUTAN = { ok: false, reason: 'Diastolic must be lower than systolic' }
assert.deepEqual(meanArterialPressure(100, 100), GALAT_URUTAN)
assert.deepEqual(meanArterialPressure(80, 120), GALAT_URUTAN)

// Tipe salah ditolak, dan hasil gagal tidak memuat angka.
for (const salah of [undefined, null, '120', {}] as unknown as number[]) {
  assert.equal(meanArterialPressure(salah, 80).ok, false)
  assert.equal(meanArterialPressure(120, salah).ok, false)
}
assert.equal('data' in (meanArterialPressure(NaN, 80) as object), false)

// Determinisme.
assert.deepEqual(meanArterialPressure(120, 80), meanArterialPressure(120, 80))

// Jebakan nyata di halaman lama: kolom kosong menjadi 0 dan MAP "0 mmHg · Very low" tampil seolah valid.
assert.equal((+'' + 2 * 80) / 3 < 60, true)

// Halaman memakai fungsi kanonik dan tidak menghitung ulang.
const halaman = readFileSync('src/pages/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /meanArterialPressure\(sys, dia\)/)
assert.match(halaman, /mapResult\.ok \?/)
assert.match(halaman, /\{mapResult\.reason\}/)
assert.doesNotMatch(halaman, /\(sys \+ 2 \* dia\) \/ 3/, 'rumus MAP tidak boleh disalin ke halaman')
console.log('mean-arterial-pressure: golden MAP, category boundaries, fail-closed ranges, single-source formula')
