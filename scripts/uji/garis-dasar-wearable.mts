import assert from 'node:assert/strict'
import { generateInsights } from '../../src/lib/healthInsights.ts'

// Garis dasar wearable memakai mesin tren pribadi yang sama dengan lab.
const hari = (i: number) => `2026-09-${String(i).padStart(2, '0')}`
const riwayat = (rhr: number[]) => rhr.map((v, i) => ({ date: hari(i + 1), restingHr: v }))
const ambil = (h: ReturnType<typeof riwayat>) => generateInsights(h).find((x) => x.id === 'personal-baseline-restingHr')!

// Stabil: 56,57,55,56 -> median 56.
{
  const r = ambil(riwayat([56, 57, 55, 56]))
  assert.match(r.title, /stable for you/, `detak istirahat stabil diberi judul "${r.title}"`)
  assert.equal(r.tone, 'neutral')
}
// Satu hari melonjak ke 70: hanya watch, tidak pernah kritis.
{
  const r = ambil(riwayat([56, 57, 55, 56, 70]))
  assert.match(r.title, /watch/, `satu lonjakan diberi judul "${r.title}"`)
  assert.notEqual(r.tone, 'critical', 'satu bacaan jam tangan menghasilkan nada kritis')
  assert.match(r.body, /\+14\.0 vs your usual 56\.0/, `selisih terhadap garis dasar pribadi salah: ${r.body}`)
}
// Dua hari berturut-turut tinggi: perubahan bermakna, tetap bukan kritis.
{
  const r = ambil(riwayat([56, 57, 55, 56, 68, 70]))
  assert.match(r.title, /meaningful change/, `dua hari tinggi berturut-turut diberi judul "${r.title}"`)
  assert.notEqual(r.tone, 'critical')
  assert.doesNotMatch(r.title, /doctor/, 'tanpa rentang populasi, angka jam tangan tidak boleh mencapai tingkat dokter')
}
// Riwayat terlalu pendek: garis dasar sedang dibangun.
{
  const r = ambil(riwayat([56, 57, 55]))
  assert.match(r.title, /building baseline/, `tiga hari diberi judul "${r.title}"`)
}
console.log('garis-dasar-wearable: detak istirahat/HRV/tidur/VO2max dibandingkan dengan riwayat sendiri; satu bacaan tidak pernah kritis')
