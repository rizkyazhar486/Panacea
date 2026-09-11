import assert from 'node:assert/strict'
import {
  hill, konsentrasiUntukEfek, blissIndependen, indeksKombinasiLoewe,
  bebanSetimbang, bebanAnalitik, langkahBeban,
  SENYAWA_GERO, senyawaUntukCiri, cakupanKuantitatif,
} from '../../src/lib/farmakodinamik.ts'
import { AGING_HALLMARKS } from '../../src/lib/regenerationResearch.ts'

// Mesin ini diuji terhadap IDENTITAS ANALITIK, bukan terhadap angka yang
// pernah keluar dari dirinya sendiri. Itu perbedaan antara memverifikasi dan
// mengabadikan bug: uji regresi yang membandingkan keluaran dengan keluaran
// kemarin akan lulus dengan senang hati pada implementasi yang salah sejak
// hari pertama.

const dekat = (a: number, b: number, toleransi = 1e-12) => Math.abs(a - b) <= toleransi

// ── 1. Hill: nilai eksak yang sudah diketahui sebelum kodenya ditulis ───────
assert.ok(dekat(hill(1, 1, 1, 1), 0.5), 'Pada C = EC50 efeknya tepat setengah Emax.')
assert.ok(dekat(hill(5, 5, 3, 2), 1), 'Identitas setengah-maksimum berlaku untuk n dan Emax apa pun.')
assert.equal(hill(0, 1, 1, 1), 0, 'Tanpa senyawa tidak ada efek.')
assert.ok(hill(1e9, 1, 1, 1) > 0.999999, 'Efek menuju Emax secara asimptotik.')

// Monoton naik — sifat yang membuat "dosis lebih tinggi, efek lebih besar"
// bermakna sama sekali.
{
  let sebelum = -1
  for (const c of [0.01, 0.1, 0.5, 1, 2, 10, 100]) {
    const e = hill(c, 1, 2, 1)
    assert.ok(e > sebelum, `Kurva harus monoton naik, gagal di C=${c}`)
    sebelum = e
  }
}

// ── 2. Identitas kecuraman: C80/C20 = 16^(1/n), TEPAT ───────────────────────
//
// Inilah uji yang benar-benar menangkap koefisien Hill yang dipasang di tempat
// yang salah dalam rumus. Rasionya tidak bergantung pada EC50 maupun Emax, jadi
// ia tidak bisa dipenuhi secara kebetulan.
for (const n of [0.5, 1, 2, 4]) {
  for (const ec50 of [0.003, 1, 750]) {
    const c80 = konsentrasiUntukEfek(0.8, ec50, n)
    const c20 = konsentrasiUntukEfek(0.2, ec50, n)
    assert.ok(dekat(c80 / c20, Math.pow(16, 1 / n), 1e-9),
      `C80/C20 harus 16^(1/${n}); dapat ${(c80 / c20).toFixed(6)}`)
  }
}

// hill dan konsentrasiUntukEfek harus benar-benar saling membalik.
for (const x of [0.05, 0.25, 0.5, 0.75, 0.95]) {
  const c = konsentrasiUntukEfek(x, 2.5, 1.7)
  assert.ok(dekat(hill(c, 2.5, 1.7, 1), x, 1e-12), `Bukan invers pada x=${x}`)
}

// ── 3. Masukan yang tidak sah menghasilkan NaN, bukan angka yang meyakinkan ─
assert.ok(Number.isNaN(hill(1, 0, 1, 1)), 'EC50 nol tidak punya arti; jangan kembalikan angka.')
assert.ok(Number.isNaN(hill(1, 1, 0, 1)), 'Koefisien Hill nol tidak punya arti.')
assert.ok(Number.isNaN(konsentrasiUntukEfek(1, 1, 1)), 'Efek 100% menuntut konsentrasi tak hingga.')
assert.ok(Number.isNaN(konsentrasiUntukEfek(0, 1, 1)), 'Efek 0% tidak punya konsentrasi tunggal.')

// ── 4. Model nol kombinasi ──────────────────────────────────────────────────
assert.ok(dekat(blissIndependen(0.5, 0.5), 0.75), 'Bliss: dua kali 50% bukan 100%.')
assert.ok(dekat(blissIndependen(0, 0.3), 0.3), 'Senyawa tanpa efek tidak mengubah apa pun.')
assert.ok(blissIndependen(0.9, 0.9) < 1, 'Bliss tidak pernah melewati 1.')

// Loewe: senyawa yang dikombinasikan dengan DIRINYA SENDIRI harus aditif tepat.
// Ini pemeriksaan konsistensi internal yang paling tajam untuk indeks kombinasi,
// karena jawabannya harus tepat 1 tanpa perlu data apa pun.
{
  const ec50 = 4, n = 1.3, efek = 0.6
  const c = konsentrasiUntukEfek(efek, ec50, n)
  const ci = indeksKombinasiLoewe(c / 2, ec50, n, c / 2, ec50, n, efek)
  assert.ok(dekat(ci, 1, 1e-9), `Senyawa dengan dirinya sendiri harus CI = 1; dapat ${ci}`)
}
{
  // Setengah dari konsentrasi aditif memberi CI = 0,5 (tampak sinergis).
  const ec50 = 4, n = 1, efek = 0.5
  const c = konsentrasiUntukEfek(efek, ec50, n)
  const ci = indeksKombinasiLoewe(c / 4, ec50, n, c / 4, ec50, n, efek)
  assert.ok(dekat(ci, 0.5, 1e-9), `CI harus 0,5; dapat ${ci}`)
}

// ── 5. Dinamika sel senesen diuji terhadap penyelesaian analitiknya ─────────
const p = { produksi: 0.002, pembersihanAlami: 0.01 }
assert.ok(dekat(bebanSetimbang(p), 0.2), 'Setimbang = produksi / pembersihan.')
assert.ok(bebanSetimbang(p, 0.03) < bebanSetimbang(p),
  'Pembersihan senolitik menurunkan beban setimbang.')

// Keadaan setimbang harus benar-benar diam.
{
  const s = bebanSetimbang(p)
  assert.ok(dekat(langkahBeban(s, p, 1), s, 1e-15), 'Keadaan setimbang tidak boleh bergeser.')
}

// Solver Euler harus konvergen ke penyelesaian analitik pada orde satu.
{
  const s0 = 0.5, T = 50
  const galat = (dt: number) => {
    let s = s0
    for (let t = 0; t < T - 1e-12; t += dt) s = langkahBeban(s, p, dt)
    return Math.abs(s - bebanAnalitik(p, s0, T))
  }
  const e1 = galat(0.5), e2 = galat(0.25), e3 = galat(0.125)
  assert.ok(e2 < e1 && e3 < e2, `Galat harus menyusut: ${e1}, ${e2}, ${e3}`)
  const orde = Math.log2(e1 / e2)
  assert.ok(orde > 0.8 && orde < 1.3,
    `Euler maju berorde satu; orde teramati ${orde.toFixed(3)}`)
}

// Senolitik yang sangat kuat harus mengosongkan jaringan, bukan membuatnya negatif.
{
  const akhir = bebanAnalitik(p, 0.5, 1000, 5)
  assert.ok(akhir >= 0 && akhir < 0.001, `Beban akhir tidak masuk akal: ${akhir}`)
}

// ── 6. Kejujuran katalog ────────────────────────────────────────────────────
//
// Bagian yang paling mudah dipalsukan: mengarang EC50 supaya setiap senyawa
// punya angka. Sebagian besar senyawa geroscience TIDAK punya satu nilai yang
// bisa dipertanggungjawabkan, dan itu harus terlihat.
for (const s of SENYAWA_GERO) {
  assert.ok(s.catatan.length > 60, `Catatan ${s.id} terlalu tipis untuk membawa batas buktinya.`)
  assert.ok(s.ciriPenuaan.length > 0, `${s.id} harus terhubung ke ciri penuaan.`)
  for (const c of s.ciriPenuaan) {
    assert.ok(AGING_HALLMARKS.some((h) => h.id === c),
      `${s.id} menyebut ciri penuaan yang tidak ada: ${c}`)
  }
  // EC50 dan koefisien Hill harus ada bersama-sama atau tidak sama sekali:
  // satu EC50 tanpa kecuraman tidak menentukan kurva.
  assert.equal(s.ec50Mikromolar === null, s.koefisienHill === null,
    `${s.id}: EC50 dan koefisien Hill harus sepasang.`)
  assert.notEqual(s.bukti, 'speculative', `${s.id} tidak boleh dipasarkan sebagai spekulasi.`)
}

// Tidak boleh ada klaim perpanjangan umur manusia di mana pun.
for (const s of SENYAWA_GERO) {
  assert.doesNotMatch(s.catatan, /extends? human lifespan|memperpanjang umur manusia/i,
    `${s.id} mengklaim perpanjangan umur manusia; tidak ada senyawa yang punya bukti itu.`)
}

// Cakupan kuantitatif harus dilaporkan apa adanya, bukan disembunyikan.
{
  const c = cakupanKuantitatif()
  assert.ok(c.berparameter < c.total,
    'Kalau setiap senyawa tiba-tiba punya EC50, kemungkinan besar angkanya dikarang.')
  assert.ok(c.total >= 5, 'Katalog terlalu kecil untuk berguna.')
}

assert.ok(senyawaUntukCiri('cellular-senescence').length > 0, 'Senolitik harus terhubung ke senesens.')
assert.equal(senyawaUntukCiri('tidak-ada-ciri-ini').length, 0)

console.log('Farmakodinamik: identitas Hill eksak, invers, C80/C20 = 16^(1/n), CI Loewe = 1 untuk senyawa dengan dirinya sendiri, Euler konvergen orde satu terhadap penyelesaian analitik, dan katalog yang tidak mengarang EC50.')

// ── 7. Rujukan harus benar-benar bisa ditelusuri ────────────────────────────
//
// Kutipan yang tidak bisa dibuka sama saja dengan tidak ada kutipan, dan lebih
// buruk: ia memberi kesan diperiksa padahal tidak. Jadi identitasnya diuji
// bentuknya, dan isinya diuji apakah menyatakan BATAS temuan, bukan sekadar
// mengangguk.
for (const s of SENYAWA_GERO) {
  for (const r of s.rujukan) {
    assert.ok(r.pmid || r.nct, `${s.id}: rujukan tanpa identitas tidak bisa ditelusuri.`)
    if (r.pmid) assert.match(r.pmid, /^\d{6,9}$/, `${s.id}: PMID tidak berbentuk PMID: ${r.pmid}`)
    if (r.nct) assert.match(r.nct, /^NCT\d{8}$/, `${s.id}: NCT tidak berbentuk NCT: ${r.nct}`)
    assert.ok(r.judul.length > 25, `${s.id}: judul rujukan terlalu pendek untuk dikenali.`)
    assert.ok(r.temuan.length > 40,
      `${s.id}: rujukan harus mencatat apa yang benar-benar ditunjukkan, bukan hanya dikutip.`)
  }
}

// Senyawa dengan bukti klinis atau praklinis yang DIKLAIM harus membawa
// setidaknya satu sumber, atau menyatakan sendiri bahwa belum diperiksa.
{
  const tanpaSumber = SENYAWA_GERO.filter((s) => s.rujukan.length === 0)
  assert.ok(tanpaSumber.length > 0,
    'Kalau setiap senyawa tiba-tiba punya rujukan, kemungkinan besar sebagiannya dikarang.')
  assert.ok(SENYAWA_GERO.some((s) => s.rujukan.length > 0), 'Setidaknya sebagian harus diperiksa.')
}

// Pemeriksaan yang MENGGUGURKAN klaim harus tetap tercatat, bukan dihapus
// diam-diam. Klaim TAME adalah contohnya.
{
  const metformin = SENYAWA_GERO.find((s) => s.id === 'metformin')
  assert.ok(metformin, 'metformin harus ada.')
  assert.match(metformin.catatan, /tidak menemukan uji TAME yang terdaftar/,
    'Koreksi terhadap klaim yang gugur harus terlihat di katalog, bukan hilang.')
  assert.ok(metformin.rujukan.some((r) => /Taming expectations/i.test(r.judul)),
    'Sumber yang membantah harapan berlebih harus ikut dikutip, bukan hanya yang mendukung.')
}

console.log('Rujukan: identitas berbentuk sah, temuan dinyatakan sebatas yang ditunjukkan, dan klaim yang gugur saat diperiksa tetap tercatat.')
