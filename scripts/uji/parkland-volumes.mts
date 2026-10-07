import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parklandVolumes } from '../../src/domains/clinical-calculators/index.ts'

// Positivo: valor referensi dihitung tangan dari 4 mL × kg × %TBSA (Baxter 1968).
assert.deepEqual(parklandVolumes(70, 20), { ok: true, data: { total24hMl: 5600, first8hMlPerHour: 350, next16hMlPerHour: 175 } })
assert.deepEqual(parklandVolumes(3, 100), { ok: true, data: { total24hMl: 1200, first8hMlPerHour: 75, next16hMlPerHour: 37.5 } })
// Separuh volume pada 8 jam pertama, separuh pada 16 jam berikutnya: laju total terpisah harus menjumlah ke total.
for (const [w, t] of [[55.5, 33.3], [90, 45], [12, 8]] as const) {
  const r = parklandVolumes(w, t)
  assert.ok(r.ok)
  if (r.ok) assert.ok(Math.abs(r.data.first8hMlPerHour * 8 + r.data.next16hMlPerHour * 16 - r.data.total24hMl) < 1e-9)
}
// Pasangan: hanya berat yang berbeda.
const a = parklandVolumes(70, 20), b = parklandVolumes(71, 20)
assert.ok(a.ok && b.ok && a.ok && b.ok && b.data.total24hMl - a.data.total24hMl === 4 * 20)

// Batas berat: tepat di batas diterima, satu langkah di luar ditolak.
for (const w of [0.5, 300]) assert.equal(parklandVolumes(w, 20).ok, true, `berat ${w}`)
const GALAT_BERAT = { ok: false, reason: 'Weight must be 0.5–300 kg' }
for (const w of [0.49, 0, -1, 300.01, 1000, NaN, Infinity, -Infinity, +'']) assert.deepEqual(parklandVolumes(w, 20), GALAT_BERAT, `berat ${w}`)
// Batas %TBSA: 0 ditolak (bukan luka bakar), 100 diterima, di atas 100 ditolak.
const GALAT_TBSA = { ok: false, reason: '%TBSA must be above 0 and at most 100' }
assert.equal(parklandVolumes(70, 100).ok, true)
assert.equal(parklandVolumes(70, 0.01).ok, true)
for (const t of [0, -5, 100.01, 250, NaN, Infinity, -Infinity, +'']) assert.deepEqual(parklandVolumes(70, t), GALAT_TBSA, `tbsa ${t}`)
for (const salah of [undefined, null, '70', {}] as unknown as number[]) {
  assert.equal(parklandVolumes(salah, 20).ok, false)
  assert.equal(parklandVolumes(70, salah).ok, false)
}
// Tidak ada efek samping/angka: hasil gagal tidak memuat data.
assert.equal('data' in (parklandVolumes(0, 20) as object), false)
// Determinisme.
assert.deepEqual(parklandVolumes(70, 20), parklandVolumes(70, 20))

// Jebakan nyata di rumus lama: kolom kosong menjadi 0 dan halaman menampilkan "0" mL seolah resep valid.
assert.equal(4 * +'' * 20, 0)

// Halaman memakai fungsi kanonik dan tidak menghitung ulang.
const halaman = readFileSync('src/pages/clinical/ClinicalCalculators.tsx', 'utf8')
assert.match(halaman, /from '\.\.\/\.\.\/domains\/clinical-calculators'/)
assert.match(halaman, /parklandVolumes\(weight, tbsa\)/)
assert.match(halaman, /parkland\.ok \?/)
assert.match(halaman, /\{parkland\.reason\}/)
assert.equal((halaman.match(/parklandVolumes\(/g) ?? []).length, 2, 'Parkland dan BurnCalc harus memakai fungsi yang sama')
assert.match(halaman, /parkland\?\.ok &&/, 'BurnCalc harus bercabang pada hasil tervalidasi')
assert.doesNotMatch(halaman, /4 \* weight \* tbsa/, 'rumus Parkland tidak boleh disalin ke halaman')
console.log('parkland-volumes: golden volumes, fail-closed weight and %TBSA ranges, single-source formula')
