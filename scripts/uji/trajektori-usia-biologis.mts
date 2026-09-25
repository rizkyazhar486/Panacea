import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { phenoAge } from '../../src/lib/longevity.ts'
import { titikDariHasil, gabungTitik, hitungTrajektori, AMBANG_DATAR_TAHUN } from '../../src/lib/bioAgeTrajectory.ts'

// Masukan yang sama, orang yang sama, satu tahun kemudian: PhenoAge naik
// tepat karena usianya naik, tetapi AgeGap tidak boleh bergerak. Inilah
// alasan trajektori memakai AgeGap, bukan PhenoAge mentah.
const darah = { albuminGL: 45, kreatininUmolL: 80, glukosaMmolL: 5, crpMgdL: 0.1, limfositPersen: 30, mcvFL: 90, rdwPersen: 13, alpUL: 70, wbcRibu: 6 }
const h50 = phenoAge({ usia: 50, ...darah }), h51 = phenoAge({ usia: 51, ...darah })
assert.ok(h50.ok && h51.ok)
const a = titikDariHasil('2025-01-01', 50, h50.data)!
const b = titikDariHasil('2026-01-01', 51, h51.data)!
assert.ok(b.phenoAge > a.phenoAge, 'PhenoAge seharusnya naik bersama usia pada darah yang sama')
{
  const t = hitungTrajektori([a, b])
  assert.ok(Math.abs(t.deltaAgeGap!) < AMBANG_DATAR_TAHUN, `ΔAgeGap ${t.deltaAgeGap} bergerak hanya karena bertambah tua`)
  assert.equal(t.arah, 'datar')
}

// Hitungan tangan: AgeGap +4 lalu +1 dengan selang 2 tahun -> Δ −3, laju −1,5/tahun, membaik.
const t0 = { tanggal: '2024-01-01', usia: 50, phenoAge: 54, ageGap: 4, metode: 'phenoage-levine-2018' as const }
const t1 = { tanggal: '2026-01-01', usia: 52, phenoAge: 53, ageGap: 1, metode: 'phenoage-levine-2018' as const }
{
  const t = hitungTrajektori([t1, t0])
  assert.equal(t.deltaAgeGap, -3, `ΔAgeGap ${t.deltaAgeGap}, bukan −3`)
  assert.ok(Math.abs(t.lajuPerTahun! - (-3 / (731 / 365.25))) < 0.01, `laju ${t.lajuPerTahun} salah`)
  assert.equal(t.arah, 'membaik')
}
{
  const t = hitungTrajektori([t1, { ...t0, tanggal: '2027-01-01', usia: 53, ageGap: 5, phenoAge: 58 }])
  assert.equal(t.arah, 'memburuk', `AgeGap melebar 4 tahun dinilai ${t.arah}`)
}

// Satu titik: belum ada trajektori.
assert.equal(hitungTrajektori([t0]).arah, 'belum-cukup-data')

// Tanggal yang sama menggantikan, bukan menggandakan.
{
  const g = gabungTitik([t0, t1], { ...t1, ageGap: 0.5 })
  assert.equal(g.length, 2, 'menyimpan ulang pada tanggal yang sama menggandakan titik')
  assert.equal(g[1].ageGap, 0.5)
}

// Tanggal tidak sah atau usia nol ditolak, tidak disimpan sebagai titik.
assert.equal(titikDariHasil('kemarin', 50, h50.data), null)
assert.equal(titikDariHasil('2025-01-01', 0, h50.data), null)

// Terpasang di panel PhenoAge.
const panel = readFileSync(new URL('../../src/components/LongevityPanel.tsx', import.meta.url), 'utf8')
assert.match(panel, /<TrajektoriUsia titik=\{trajektori\} \/>/, 'trajektori tidak lagi dirender di panel PhenoAge')
assert.match(panel, /Save to trajectory/, 'tombol menyimpan titik trajektori hilang')

console.log('trajektori-usia-biologis: AgeGap tak bergerak karena bertambah tua, ΔAgeGap/laju sesuai hitungan tangan, tanggal sama menggantikan')
