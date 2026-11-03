import assert from 'node:assert/strict'
import {
  tekananUltrafiltrasi, gfrDariStarling, klirens, fraksiFiltrasi, bebanTersaring,
  neracaTubulus, ekskresiFraksional, feNaBedside, RUJUKAN,
  hitungAutoregulasiGinjal, hitungLengkungHenle, hitungAkiDifferential,
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

// ── 7. Autoregulasi ginjal & Umpan Balik Tubuloglomerular (TGF) ─────────────
{
  // Baseline euvolemik MAP 93 mmHg
  const euvolemik = hitungAutoregulasiGinjal({ mapMmhg: 93 })
  assert.equal(euvolemik.autoregulationZone, 'AUTOREGULATORY_PLATEAU')
  assert.equal(euvolemik.myogenicTone, 'AUTOREGULATED')
  assert.ok(euvolemik.gfr >= 120 && euvolemik.gfr <= 135, `GFR baseline harus ~125, dapat ${euvolemik.gfr}`)
  assert.ok(euvolemik.rbf >= 1000 && euvolemik.rbf <= 1200, `RBF harus ~1100 mL/menit, dapat ${euvolemik.rbf}`)

  // Plateau autoregulasi: MAP naik dari 93 ke 140 mmHg hanya sedikit menggeser GFR (<8%)
  const hipertensiSedang = hitungAutoregulasiGinjal({ mapMmhg: 140 })
  assert.equal(hipertensiSedang.autoregulationZone, 'AUTOREGULATORY_PLATEAU')
  assert.ok(Math.abs(hipertensiSedang.gfr - euvolemik.gfr) < 15, 'GFR harus stabil pada rentang autoregulasi')
  assert.ok(hipertensiSedang.effectiveRa > euvolemik.effectiveRa, 'Resistensi aferen harus naik untuk meredam lonjakan tekanan perfusi')

  // Syok / hipotensi di bawah batas autoregulasi (MAP 55 mmHg)
  const syok = hitungAutoregulasiGinjal({ mapMmhg: 55 })
  assert.equal(syok.autoregulationZone, 'HYPOTENSIVE_ESCAPE')
  assert.equal(syok.myogenicTone, 'DILATED')
  assert.ok(syok.effectiveRa < euvolemik.effectiveRa, 'Aferen harus vasodilatasi maksimal pada hipotensi berat')
  assert.ok(syok.gfr < euvolemik.gfr, 'Hipotensi berat meloloskan tekanan dan menurunkan GFR')

  // SGLT2 inhibitor: mengurangi reabsorpsi proksimal -> memulihkan delivery makula densa -> memicu TGF aferen
  const sglt2 = hitungAutoregulasiGinjal({ mapMmhg: 110, sglt2InhibitorActive: true })
  assert.ok(sglt2.tgfActive, 'SGLT2 inhibitor harus mengaktifkan TGF via peningkatan pengiriman NaCl ke makula densa')
  assert.ok(sglt2.maculaDensaNaclDelivery > 1.15, 'Pengiriman ke makula densa harus > 1.15x baseline')
  assert.ok(sglt2.pGc < hitungAutoregulasiGinjal({ mapMmhg: 110 }).pGc, 'TGF harus menurunkan Pgc untuk mencegah hiperfiltrasi glomerulus')

  // Triple whammy pada perfusi rendah: NSAID (blok aferen) + ACEi (blok eferen)
  const normalHypo = hitungAutoregulasiGinjal({ mapMmhg: 70 })
  const tripleWhammy = hitungAutoregulasiGinjal({ mapMmhg: 70, nsaidActive: true, aceInhibitorActive: true })
  assert.ok(tripleWhammy.gfr < normalHypo.gfr * 0.7, 'Kombinasi NSAID + ACEi pada perfusi rendah harus meruntuhkan GFR secara bermakna')
}

// ── 8. Lengkung Henle: Multiplikasi Lawan Arus & Gradien Medula ──────────
{
  // Normal euvolemik
  const normal = hitungLengkungHenle({ nkcc2ActivityFraction: 1.0, adhVasopressinLevel: 0.6 })
  assert.equal(normal.cortex, 300, 'Korteks selalu isosmotik ~300 mOsm/kg')
  assert.equal(normal.singleEffectGradient, 200, 'Single effect NKCC2 normal adalah 200 mOsm/kg')
  assert.ok(normal.medullaryInterstitialMax >= 1000, `Interstisium medula puncak harus hipertonik >= 1000, dapat ${normal.medullaryInterstitialMax}`)
  assert.equal(normal.innerMedullaBend, normal.medullaryInterstitialMax, 'Ujung lengkung Henle harus setimbang dengan medula papiler')
  assert.ok(normal.thickAscendingLimbExit <= 120, 'Segmen pengencer (TAL) harus mengeluarkan filtrat hipotonik ~100 mOsm/kg')
  assert.equal(normal.isMedullaryWashout, false)

  // Furosemid (loop diuretic yang memblok NKCC2)
  const furosemid = hitungLengkungHenle({ nkcc2ActivityFraction: 0.05, adhVasopressinLevel: 1.0 })
  assert.ok(furosemid.isMedullaryWashout, 'Blokade NKCC2 harus meruntuhkan gradien medula (washout)')
  assert.ok(furosemid.medullaryInterstitialMax < 450, 'Gradien medula harus jatuh mendekati isosmotik')
  assert.ok(furosemid.finalUrineOsmolality < 450, 'Meski ADH tinggi, urin tidak dapat dikonsentrasikan tanpa gradien medula')

  // Diabetes Insipidus (ADH = 0)
  const diabetesInsipidus = hitungLengkungHenle({ nkcc2ActivityFraction: 1.0, adhVasopressinLevel: 0.0 })
  assert.ok(diabetesInsipidus.finalUrineOsmolality <= 120, 'Tanpa ADH, urin harus keluar sangat encer (<120 mOsm/kg)')
}

// ── 9. Diferensial AKI Samping Pasien (Prerenal vs ATN) ───────────────────
{
  // Kasus 1: Prerenal Azotemia karena dehidrasi berat
  // UNa 12 mEq/L, PNa 140 mEq/L, UCr 90 mg/dL, PCr 1.8 mg/dL, BUN 42 mg/dL
  const prerenal = hitungAkiDifferential({
    natriumUrinMeq: 12,
    natriumPlasmaMeq: 140,
    kreatininUrinMgDl: 90,
    kreatininPlasmaMgDl: 1.8,
    ureaNitrogenPlasmaMgDl: 42,
  })
  assert.equal(prerenal.classification, 'PRERENAL_AZOTEMIA')
  assert.ok(prerenal.feNaPercent < 1.0, `FENa prerenal harus < 1.0%, dapat ${prerenal.feNaPercent}`)
  assert.ok(prerenal.bunCreatinineRatio! > 20, 'Rasio BUN/Cr prerenal harus > 20')

  // Kasus 2: Acute Tubular Necrosis (ATN) karena iskemia/nefrotoksin
  // UNa 62 mEq/L, PNa 136 mEq/L, UCr 35 mg/dL, PCr 2.8 mg/dL, BUN 30 mg/dL
  const atn = hitungAkiDifferential({
    natriumUrinMeq: 62,
    natriumPlasmaMeq: 136,
    kreatininUrinMgDl: 35,
    kreatininPlasmaMgDl: 2.8,
    ureaNitrogenPlasmaMgDl: 30,
  })
  assert.equal(atn.classification, 'INTRINSIC_ATN')
  assert.ok(atn.feNaPercent > 2.0, `FENa ATN harus > 2.0%, dapat ${atn.feNaPercent}`)
  assert.ok(atn.bunCreatinineRatio! < 15, 'Rasio BUN/Cr ATN harus < 15')

  // Kasus 3: Pasien prerenal sedang memakai diuretik (FENa rancu tapi FEUrea < 35%)
  const diuretikPrerenal = hitungAkiDifferential({
    natriumUrinMeq: 45,
    natriumPlasmaMeq: 138,
    kreatininUrinMgDl: 50,
    kreatininPlasmaMgDl: 2.0,
    ureaNitrogenPlasmaMgDl: 52,
    ureaNitrogenUrinMgDl: 320,
  })
  assert.equal(diuretikPrerenal.classification, 'PRERENAL_AZOTEMIA')
  assert.ok(diuretikPrerenal.feUreaPercent! < 35, 'FEUrea < 35% mengonfirmasi prerenal saat FENa terdistorsi diuretik')
}

console.log('Nefron: gaya Starling rujukan, autoregulasi TGF, lengkung Henle countercurrent, dan diferensial AKI terverifikasi lengkap.')
