import assert from 'node:assert/strict'
import {
  tekananUltrafiltrasi, gfrDariStarling, klirens, fraksiFiltrasi, bebanTersaring,
  neracaTubulus, ekskresiFraksional, feNaBedside, RUJUKAN,
} from '../../src/lib/nefron.ts'

const dekat = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol

// ── 1. Nilai rujukan harus MENGHASILKAN angka dewasa, bukan mengklaimnya ────
//
// Kalau seseorang menggeser salah satu tekanan sampai GFR keluar dari kisaran
// fisiologis, uji ini gagal. Tekanan Bowman sempat ditulis 15 mmHg dan
// memberi GFR 162 mL/menit; yang menangkapnya adalah keluarannya, bukan
// pandangan sekilas pada angkanya.
{
  const p = tekananUltrafiltrasi(RUJUKAN.starling)
  assert.ok(dekat(p, 10), `Tekanan ultrafiltrasi neto harus 10 mmHg, dapat ${p}`)
  const gfr = gfrDariStarling(RUJUKAN.starling, RUJUKAN.kf)
  assert.ok(gfr > 90 && gfr < 140, `GFR rujukan di luar kisaran dewasa: ${gfr}`)
  const ff = fraksiFiltrasi(gfr, RUJUKAN.alirPlasmaGinjal)
  assert.ok(ff > 0.15 && ff < 0.25, `Fraksi filtrasi harus sekitar 0,2; dapat ${ff.toFixed(3)}`)
}

// ── 2. Filtrasi berhenti, tidak terbalik ───────────────────────────────────
//
// Ketika onkotik menyamai hidrostatik, filtrasi mencapai kesetimbangan. Angka
// negatif di sini berarti "urin mengalir kembali ke darah" dan akan lolos diam-
// diam ke setiap perhitungan berikutnya.
{
  const setimbang = { hidrostatikKapiler: 50, hidrostatikBowman: 18, onkotikKapiler: 32 }
  assert.equal(gfrDariStarling(setimbang, RUJUKAN.kf), 0)
  const terhambat = { hidrostatikKapiler: 40, hidrostatikBowman: 18, onkotikKapiler: 32 }
  assert.equal(gfrDariStarling(terhambat, RUJUKAN.kf), 0, 'Tekanan neto negatif tetap nol.')
  assert.equal(gfrDariStarling(RUJUKAN.starling, 0), 0, 'Kf nol berarti tidak ada filtrasi.')
}

// Arah setiap gaya harus benar. Ini yang membedakan model dari tiga angka
// yang kebetulan berjumlah sepuluh.
{
  const dasar = gfrDariStarling(RUJUKAN.starling, RUJUKAN.kf)
  const onkotikNaik = gfrDariStarling({ ...RUJUKAN.starling, onkotikKapiler: 36 }, RUJUKAN.kf)
  assert.ok(onkotikNaik < dasar, 'Onkotik plasma naik harus MENURUNKAN GFR.')
  const obstruksi = gfrDariStarling({ ...RUJUKAN.starling, hidrostatikBowman: 25 }, RUJUKAN.kf)
  assert.ok(obstruksi < dasar, 'Tekanan Bowman naik (obstruksi) harus menurunkan GFR.')
  const hipertensiGlomerulus = gfrDariStarling({ ...RUJUKAN.starling, hidrostatikKapiler: 70 }, RUJUKAN.kf)
  assert.ok(hipertensiGlomerulus > dasar, 'Hidrostatik kapiler naik harus menaikkan GFR.')
}

// ── 3. Identitas inulin: klirens zat penanda SAMA PERSIS dengan GFR ────────
//
// Zat yang disaring bebas, tidak direabsorpsi dan tidak disekresi harus punya
// klirens yang persis sama dengan GFR. Ini definisi, bukan perkiraan, dan ia
// menangkap hampir setiap cara rumus klirens bisa ditulis terbalik.
{
  const gfr = 125, plasma = 1, alirUrin = 2
  // Semua yang tersaring keluar: U * V = GFR * P.
  const urin = (gfr * plasma) / alirUrin
  const c = klirens(urin, alirUrin, plasma)
  assert.ok(dekat(c, gfr), `Klirens penanda harus 125; dapat ${c}`)
  assert.ok(dekat(ekskresiFraksional(c, gfr), 1), 'Ekskresi fraksionalnya tepat 1.')
  const n = neracaTubulus(gfr, plasma, urin, alirUrin)
  assert.ok(dekat(n.reabsorpsiNeto, 0), 'Penanda tidak direabsorpsi maupun disekresi.')
}

// ── 4. Neraca massa harus tertutup, tepat ──────────────────────────────────
{
  const gfr = 125, plasma = 140, urin = 70, alirUrin = 1  // natrium
  const n = neracaTubulus(gfr, plasma, urin, alirUrin)
  assert.ok(dekat(n.tersaring, bebanTersaring(gfr, plasma)))
  assert.ok(dekat(n.tersaring - n.reabsorpsiNeto, n.diekskresi),
    'Tersaring dikurangi reabsorpsi neto harus sama dengan yang diekskresi.')
  assert.ok(n.reabsorpsiNeto > 0, 'Natrium direabsorpsi secara neto.')
  // Ginjal mereabsorpsi hampir seluruh natrium yang disaring.
  assert.ok(ekskresiFraksional(klirens(urin, alirUrin, plasma), gfr) < 0.02,
    'Ekskresi fraksional natrium normal di bawah 2%.')
}

// Sekresi neto harus keluar sebagai angka negatif, bukan dianggap galat.
{
  const n = neracaTubulus(125, 1, 200, 2)
  assert.ok(n.reabsorpsiNeto < 0, 'Zat yang disekresi punya reabsorpsi neto negatif.')
}

// ── 5. Dua jalan menuju FENa harus sepakat ─────────────────────────────────
//
// Rumus di samping pasien menghapus laju alir urin; jalur klirens tidak. Kalau
// keduanya tidak memberi angka yang sama, salah satunya salah -- dan yang
// dipakai di bangsal adalah yang pertama.
{
  const pNa = 140, uNa = 60, pCr = 1.0, uCr = 100, alirUrin = 1.5
  const gfrDariKreatinin = klirens(uCr, alirUrin, pCr)
  const lewatKlirens = ekskresiFraksional(klirens(uNa, alirUrin, pNa), gfrDariKreatinin)
  const lewatBedside = feNaBedside(uNa, pCr, pNa, uCr)
  assert.ok(dekat(lewatKlirens, lewatBedside),
    `Dua jalur FENa harus sepakat: ${lewatKlirens} vs ${lewatBedside}`)
  // Laju alir urin tidak boleh mengubah jawabannya sama sekali.
  const lain = ekskresiFraksional(klirens(uNa, 3, pNa), klirens(uCr, 3, pCr))
  assert.ok(dekat(lain, lewatBedside), 'FENa tidak bergantung pada laju alir urin.')
}

// ── 6. Masukan tidak sah menghasilkan NaN, bukan angka yang meyakinkan ─────
assert.ok(Number.isNaN(klirens(1, 1, 0)), 'Plasma nol tidak punya klirens.')
assert.ok(Number.isNaN(fraksiFiltrasi(125, 0)), 'Aliran plasma nol tidak punya fraksi filtrasi.')
assert.ok(Number.isNaN(ekskresiFraksional(1, 0)))
assert.ok(Number.isNaN(feNaBedside(60, 1, 140, 0)))

// GFR tidak boleh melebihi plasma yang benar-benar tiba: menyaring lebih
// banyak plasma daripada yang datang tidak punya arti fisik.
{
  const ff = fraksiFiltrasi(gfrDariStarling(RUJUKAN.starling, RUJUKAN.kf), RUJUKAN.alirPlasmaGinjal)
  assert.ok(ff <= 1, `Fraksi filtrasi melebihi 1: ${ff}`)
}

console.log('Nefron: gaya Starling rujukan menghasilkan GFR 125 mL/menit dan FF 0,21, filtrasi berhenti alih-alih terbalik, klirens penanda sama persis dengan GFR, neraca massa tertutup, dan kedua jalur FENa sepakat.')
