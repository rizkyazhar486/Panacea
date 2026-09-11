import { ukurPlanar, PARAMETER_BAKU, DT_BAKU } from '../../src/lib/bioelectric'

// VERIFIKASI NUMERIK mesin biolistrik jantung.
//
// Berkas ini menjawab pertanyaan yang berbeda dari bioelectric.uji.ts. Yang itu
// bertanya "apakah modelnya berperilaku seperti jantung". Yang ini bertanya
// sesuatu yang lebih mendasar dan lebih mudah dilewatkan:
//
//   Apakah angka yang keluar merupakan penyelesaian persamaannya, atau sekadar
//   artefak ukuran langkah yang kebetulan dipilih?
//
// Tanpa studi refinement, tidak ada yang bisa membedakan keduanya. Sebuah
// solver bisa lolos setiap uji fisiologis dan tetap melaporkan kecepatan
// konduksi yang salah sepuluh persen hanya karena dt-nya terlalu besar --
// dan setiap kesimpulan yang dibangun di atasnya, termasuk hukum panjang
// gelombang dan arah efek obat, ikut membawa kesalahan itu tanpa jejak.
//
// Skema waktunya adalah Euler maju, yang secara teori berorde satu. Jadi orde
// yang TERAMATI harus mendekati 1. Kalau ia keluar sebagai 2, atau berubah-ubah
// tanpa pola, maka yang dijalankan bukan skema yang dikira.
//
// CATATAN CAKUPAN, supaya tidak diklaim lebih dari yang diuji: yang
// diverifikasi di sini adalah konvergensi TERHADAP LANGKAH WAKTU. Konvergensi
// terhadap ukuran sel (dx) belum diverifikasi, karena jaringan dibangun dalam
// satuan sel dan D dinyatakan dalam satuan model, sehingga refinement ruang
// menuntut penskalaan ulang parameter yang belum ada. Itu pekerjaan
// berikutnya, bukan sesuatu yang sudah selesai.

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

/** Orde konvergensi teramati dari tiga hasil pada dt, dt/2, dt/4. */
function ordeTeramati(kasar: number, tengah: number, halus: number): number {
  const d1 = kasar - tengah
  const d2 = tengah - halus
  if (d2 === 0) return Number.NaN
  return Math.log2(Math.abs(d1 / d2))
}

const faktor = [4, 2, 1, 0.5, 0.25, 0.125]
const dts = faktor.map((f) => DT_BAKU * f)
const cv: number[] = []
const apd: number[] = []
for (const dt of dts) {
  const u = ukurPlanar(PARAMETER_BAKU, dt)
  cv.push(u.cvModel)
  apd.push(u.apdMs)
}

console.log('\ndt        CV(model)   APD(ms)')
dts.forEach((dt, i) => console.log(`${dt.toFixed(5)}   ${cv[i].toFixed(6)}   ${apd[i].toFixed(3)}`))

// ── 1. Solusinya harus benar-benar konvergen ────────────────────────────────
// Selisih antar-refinement harus menyusut. Kalau tidak, tidak ada gunanya
// bicara orde sama sekali.
{
  const beda = cv.slice(0, -1).map((x, i) => Math.abs(x - cv[i + 1]))
  const menyusut = beda.every((b, i) => i === 0 || b <= beda[i - 1] * 1.05)
  ok('selisih CV menyusut pada setiap refinement', menyusut, beda.map((b) => b.toExponential(2)).join(' '))
}

// ── 2. Orde teramati harus orde pertama, sesuai skemanya ────────────────────
//
// Inilah uji yang menangkap bahwa waktu kedatangan dulu dibulatkan ke langkah
// terdekat: orde CV keluar sebagai 35,80 lalu -34,39 -- bukan angka yang bisa
// ditafsirkan sebagai orde apa pun. Setelah perlintasan ambang diinterpolasi,
// ia menjadi 0,98 / 0,99 / 1,00 / 1,00.
{
  const orde = [
    ordeTeramati(cv[2], cv[3], cv[4]),
    ordeTeramati(cv[3], cv[4], cv[5]),
  ]
  ok('orde konvergensi CV teramati mendekati 1 (Euler maju)',
    orde.every((p) => p > 0.8 && p < 1.3), orde.map((p) => p.toFixed(3)).join(', '))
}
{
  const orde = [
    ordeTeramati(apd[2], apd[3], apd[4]),
    ordeTeramati(apd[3], apd[4], apd[5]),
  ]
  ok('orde konvergensi APD teramati mendekati 1 (Euler maju)',
    orde.every((p) => p > 0.8 && p < 1.3), orde.map((p) => p.toFixed(3)).join(', '))
}

// ── 3. Titik kerja produksi harus BERADA di dalam wilayah konvergen ─────────
//
// Ini bagian yang benar-benar dipakai: DT_BAKU adalah langkah yang dijalankan
// aplikasi. Galat diskretisasinya harus kecil dibandingkan dengan besaran
// biologis yang mana pun yang ingin dibedakan model ini.
{
  const halusCv = cv[cv.length - 1]
  const halusApd = apd[apd.length - 1]
  const galatCv = Math.abs(cv[2] - halusCv) / halusCv * 100
  const galatApd = Math.abs(apd[2] - halusApd) / halusApd * 100
  ok('galat diskretisasi CV pada DT_BAKU di bawah 0,5%', galatCv < 0.5, `${galatCv.toFixed(3)}%`)
  ok('galat diskretisasi APD pada DT_BAKU di bawah 0,5%', galatApd < 0.5, `${galatApd.toFixed(3)}%`)
  console.log(`\nGalat diskretisasi pada dt produksi: CV ${galatCv.toFixed(3)}%, APD ${galatApd.toFixed(3)}%`)
}

// ── 4. Galat diskretisasi harus jauh lebih kecil daripada efek yang diklaim ─
//
// Model ini dipakai untuk menyatakan arah efek obat. Kalau galat numeriknya
// sebanding dengan efek obatnya, pernyataan itu tidak bisa dipertahankan.
// Efek kelas paling halus yang masih diklaim panel adalah orde beberapa persen,
// jadi galat di bawah setengah persen memberi margin yang bisa dipertanggungjawabkan.
{
  const halusCv = cv[cv.length - 1]
  const galatCv = Math.abs(cv[2] - halusCv) / halusCv
  ok('galat numerik setidaknya sepuluh kali lebih kecil daripada efek obat terkecil yang diklaim (~5%)',
    galatCv * 10 < 0.05, (galatCv * 100).toFixed(3) + '%')
}

// ── 5. Hasil harus deterministik ────────────────────────────────────────────
// Verifikasi tidak ada artinya kalau menjalankan ulang memberi angka lain.
{
  const a = ukurPlanar(PARAMETER_BAKU)
  const b = ukurPlanar(PARAMETER_BAKU)
  ok('pengukuran deterministik pada dt yang sama',
    a.cvModel === b.cvModel && a.apdMs === b.apdMs)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
