import assert from 'node:assert/strict'
import {
  resistensi, tetapanWaktu, jariJariTersumbat, isiAnalitik, langkahIsi,
  mulaiVentilasi, langkahVentilasi, SEGMEN_VENTILASI, segmenTidakSelaras,
} from '../../src/lib/ventilasiSegmental.ts'

const dekat = (a: number, b: number, tol = 1e-12) => Math.abs(a - b) <= tol

// ── 1. Hukum pangkat empat harus JATUH SENDIRI ──────────────────────────────
//
// Bahwa menyempitkan saluran menjadi setengah melipatgandakan resistensi 16
// kali adalah pelajaran inti obstruksi saluran napas. Ia tidak ditulis sebagai
// angka di mana pun di dalam mesin; ia muncul dari 1/r^4. Kalau seseorang
// mengganti pangkatnya menjadi 2, uji ini gagal dan pelajarannya ikut hilang.
assert.ok(dekat(resistensi(0.5) / resistensi(1), 16), 'Jari-jari separuh harus memberi resistensi 16x.')
assert.ok(dekat(resistensi(1 / 3) / resistensi(1), 81), 'Sepertiga memberi 81x.')
assert.ok(dekat(resistensi(2) / resistensi(1), 1 / 16))
assert.equal(resistensi(0), Number.POSITIVE_INFINITY, 'Saluran tertutup tidak punya aliran.')

// Penyempitan dinyatakan sebagai pecahan JARI-JARI, bukan pecahan resistensi.
assert.ok(dekat(jariJariTersumbat(1, 0.5), 0.5))
assert.ok(dekat(resistensi(jariJariTersumbat(1, 0.5)) / resistensi(1), 16),
  'Penyempitan 50% jari-jari = resistensi 16x, bukan 2x.')
// Penyempitan 20% saja sudah lebih dari melipatduakan resistensi -- justru
// inilah alasan obstruksi ringan bisa memberi gejala yang tidak sebanding.
assert.ok(resistensi(jariJariTersumbat(1, 0.2)) / resistensi(1) > 2.4)

// ── 2. Tetapan waktu adalah R kali C, tepat ────────────────────────────────
assert.ok(dekat(tetapanWaktu(1, 1), 1))
assert.ok(dekat(tetapanWaktu(0.5, 1), 16), 'tau ikut naik 16x saat jari-jari separuh.')
assert.ok(dekat(tetapanWaktu(1, 2), 2), 'Komplians dua kali, tau dua kali.')

// ── 3. Pengisian analitik: nilai yang sudah diketahui sebelum kodenya ada ───
assert.ok(dekat(isiAnalitik(1, 0), 0))
assert.ok(Math.abs(isiAnalitik(1, 1) - 0.6321205588) < 1e-9, 'Satu tetapan waktu = 63,2%.')
assert.ok(Math.abs(isiAnalitik(1, 3) - 0.9502129316) < 1e-9, 'Tiga tetapan waktu = 95%.')
assert.ok(isiAnalitik(1, 50) > 0.999999)

// ── 4. Integrator diuji terhadap penyelesaian analitiknya, bukan dirinya ────
{
  const tau = 2, T = 6
  const galat = (dt: number) => {
    let v = 0
    for (let t = 0; t < T - 1e-12; t += dt) v = langkahIsi(v, tau, dt)
    return Math.abs(v - isiAnalitik(tau, T))
  }
  const e1 = galat(0.2), e2 = galat(0.1), e3 = galat(0.05)
  assert.ok(e2 < e1 && e3 < e2, `Galat harus menyusut: ${e1}, ${e2}, ${e3}`)
  const orde = Math.log2(e1 / e2)
  assert.ok(orde > 0.8 && orde < 1.3, `Euler maju berorde satu; teramati ${orde.toFixed(3)}`)
}

// Pengisian tidak pernah melewati 1, dan tidak pernah mundur.
{
  let v = 0
  for (let i = 0; i < 5000; i++) {
    const baru = langkahIsi(v, 1, 0.01)
    assert.ok(baru >= v - 1e-15, 'Pengisian tidak boleh mundur.')
    assert.ok(baru <= 1 + 1e-9, `Pengisian melewati penuh: ${baru}`)
    v = baru
  }
}

// ── 5. Segmen yang tersumbat harus tertinggal, dan yang lain tidak ──────────
{
  let k = mulaiVentilasi(SEGMEN_VENTILASI)
  const sumbat = { 'resp:segment:r-s6': 0.5 }
  for (let i = 0; i < 200; i++) k = langkahVentilasi(k, SEGMEN_VENTILASI, 0.05, sumbat)
  const tersumbat = k.isi['resp:segment:r-s6']
  const tetangga = k.isi['resp:segment:r-s7']
  assert.ok(tersumbat < tetangga, 'Segmen tersumbat harus terisi lebih lambat.')
  assert.ok(tetangga > 0.99, 'Segmen lain tidak boleh ikut terpengaruh.')
  // Perbandingannya harus besar, bukan sekadar berbeda: itu arti pangkat empat.
  assert.ok(tersumbat < tetangga * 0.85, `Beda terlalu kecil untuk 16x tau: ${tersumbat} vs ${tetangga}`)
}

// Tanpa penyumbatan, seluruh segmen identik -- tidak ada kemiringan tersembunyi.
{
  let k = mulaiVentilasi(SEGMEN_VENTILASI)
  for (let i = 0; i < 100; i++) k = langkahVentilasi(k, SEGMEN_VENTILASI, 0.05)
  const nilai = Object.values(k.isi)
  assert.ok(Math.max(...nilai) - Math.min(...nilai) < 1e-12,
    'Tanpa penyumbatan, tidak boleh ada segmen yang istimewa.')
}

// Keadaan tidak berubah bila dt tidak sah.
{
  const k = mulaiVentilasi(SEGMEN_VENTILASI)
  assert.equal(langkahVentilasi(k, SEGMEN_VENTILASI, 0), k)
  assert.equal(langkahVentilasi(k, SEGMEN_VENTILASI, -1), k)
}

// ── 6. Fisiologi dan anatomi tidak boleh berpisah ──────────────────────────
//
// Segmen di modul ini memakai id simpul atlas yang sama persis. Kalau atlasnya
// menambah atau mengganti nama segmen, uji ini gagal -- sehingga panel
// ventilasi tidak bisa diam-diam menjalankan paru yang berbeda dari paru yang
// ditampilkan.
assert.deepEqual(segmenTidakSelaras(), [],
  'Segmen ventilasi harus sama persis dengan segmen atlas pernapasan.')
assert.equal(SEGMEN_VENTILASI.length, 18, 'Delapan belas segmen bronkopulmoner.')
assert.equal(SEGMEN_VENTILASI.filter((s) => s.sisi === 'kanan').length, 10)
assert.equal(SEGMEN_VENTILASI.filter((s) => s.sisi === 'kiri').length, 8)

console.log('Ventilasi segmental: hukum 1/r^4 jatuh sendiri (setengah jari-jari = 16x resistensi), tau = RC, integrator konvergen orde satu terhadap penyelesaian analitik, dan segmennya terkunci pada atlas.')
