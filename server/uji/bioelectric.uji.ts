// Uji mesin biolistrik jantung.
//
// Kenapa berkas ini panjang: simulasi jaringan eksitabel yang SALAH tetap
// menghasilkan gambar yang meyakinkan. Gelombang tetap berputar, warnanya tetap
// bergerak, dan tidak satu pun tangkapan layar yang bisa memberi tahu bahwa
// kecepatan konduksinya dua kali terlalu cepat atau bahwa obatnya memendekkan
// potensial aksi ke arah yang keliru. Yang bisa memberi tahu hanya angka, dan
// hanya kalau angkanya dibandingkan dengan sesuatu di luar model.
//
// Karena itu uji di sini dibagi dua jenis:
//   1. Uji KALIBRASI — memastikan penskalaan yang sudah dipilih tidak bergeser.
//   2. Uji yang TIDAK dikalibrasi ke apa pun, dan justru itu yang membuktikan
//      modelnya waras: APD yang keluar sendiri di kisaran fisiologis, CV yang
//      sebanding dengan akar difusi, arah efek tiap kelas obat, dan hukum
//      panjang gelombang terhadap keliling sirkuit.

import {
  PARAMETER_BAKU, MS_PER_SATUAN, MM_PER_SEL, DT_BAKU, APD_MS_RISIKO_TORSADE,
  buatJaringan, buatCincin, bersihkan, ulangDariAwal, langkah, stabil,
  rangsang, rangsangSetengah, pasangParut, pasangFibrosis, garisAblasi, ablasiRadial,
  fraksiEksitabel, puncakAktivitas, kelilingCincin, pseudoEkg, jumlahRotor,
  ukurPlanar, terapkanObat, nilaiSubstrat, profilPotensialAksi, pasangGelombangBerputar,
  blokSementara, TANPA_OBAT,
} from '../../src/lib/bioelectric'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

const maju = (j: ReturnType<typeof buatJaringan>, sampai: number) => {
  while (j.t < sampai) langkah(j, DT_BAKU, 50)
}

// ── 1. Jaringan istirahat harus benar-benar diam ────────────────────────────
// Kalau jaringan yang tidak dirangsang mulai berdenyut sendiri, seluruh sisa
// berkas ini tidak ada artinya: yang terlihat bukan aritmia melainkan bug.
{
  const j = buatJaringan(40, 40)
  langkah(j, DT_BAKU, 3000)
  ok('jaringan tanpa rangsangan tetap diam', puncakAktivitas(j) < 1e-6, String(puncakAktivitas(j)))
  ok('jaringan istirahat tetap stabil', stabil(j))
}

// ── 2. Ambang eksitasi benar-benar sebuah ambang ────────────────────────────
{
  const bawah = buatJaringan(60, 5)
  rangsang(bawah, 0, 0, 3, 5, 0.10) // di bawah a = 0,15
  langkah(bawah, DT_BAKU, 2000)
  ok('rangsangan di bawah ambang padam', puncakAktivitas(bawah) < 0.05, String(puncakAktivitas(bawah)))

  const atas = buatJaringan(60, 5)
  rangsang(atas, 0, 0, 3, 5, 1)
  let puncakJauh = 0
  while (atas.t < 12) { langkah(atas, DT_BAKU, 25); puncakJauh = Math.max(puncakJauh, atas.u[2 * 60 + 50]) }
  ok('rangsangan di atas ambang merambat sampai ujung jauh', puncakJauh > 0.5, puncakJauh.toFixed(4))
}

// ── 3. Integrator tidak meledak ─────────────────────────────────────────────
{
  const j = buatJaringan(64, 64)
  rangsang(j, 0, 0, 4, 64, 1)
  langkah(j, DT_BAKU, 8000)
  ok('tetap berhingga dan terbatas setelah 8000 langkah', stabil(j))
}

// ── 4. Kalibrasi: kecepatan konduksi baku ───────────────────────────────────
const baku = ukurPlanar(PARAMETER_BAKU)
ok('gelombang planar baku merambat', !baku.blok)
ok('kecepatan konduksi baku 0,5 mm/ms',
  Math.abs(baku.cvMmPerMs - 0.5) < 0.03, baku.cvMmPerMs.toFixed(4))

// ── 5. TIDAK dikalibrasi: APD keluar di kisaran fisiologis ──────────────────
// Penskalaan waktu 12,9 ms/satuan diambil apa adanya dari makalah Aliev-Panfilov
// dan tidak pernah disetel terhadap APD. Bahwa APD90 tetap mendarat di sekitar
// 300 ms — angka untuk miosit ventrikel manusia — adalah pemeriksaan kewarasan
// yang berdiri sendiri, bukan lingkaran.
ok('APD90 baku berada di kisaran ventrikel manusia (250-400 ms)',
  baku.apdMs > 250 && baku.apdMs < 400, baku.apdMs.toFixed(0))
ok('panjang gelombang = CV x APD',
  Math.abs(baku.panjangGelombangMm - baku.cvMmPerMs * baku.apdMs) < 1e-6)
ok('panjang gelombang baku melebihi lintasan mana pun di jantung normal (> 120 mm)',
  baku.panjangGelombangMm > 120, baku.panjangGelombangMm.toFixed(0))

// ── 6. TIDAK dikalibrasi: CV sebanding dengan akar difusi ───────────────────
// Sifat baku persamaan reaksi-difusi. Kalau Laplacian atau langkah waktunya
// keliru, justru di sini kelihatan.
{
  const empatKali = ukurPlanar({ ...PARAMETER_BAKU, D: PARAMETER_BAKU.D * 4 })
  const rasio = empatKali.cvModel / baku.cvModel
  ok('difusi 4x melipatduakan kecepatan konduksi', rasio > 1.9 && rasio < 2.15, rasio.toFixed(3))
  const seperempat = ukurPlanar({ ...PARAMETER_BAKU, D: PARAMETER_BAKU.D / 4 })
  const rasio2 = seperempat.cvModel / baku.cvModel
  ok('difusi seperempat memotong kecepatan menjadi setengah', rasio2 > 0.45 && rasio2 < 0.56, rasio2.toFixed(3))
}

// ── 7. Arah efek tiap kelas obat ────────────────────────────────────────────
// Ini bagian yang paling mudah salah tanpa terlihat salah, dan yang paling
// mahal kalau salah: seluruh pelajaran klinis panel ini bergantung padanya.
{
  const kelasI = [0.1, 0.2, 0.3, 0.4, 0.5].map((n) => ukurPlanar(terapkanObat(PARAMETER_BAKU, { ...TANPA_OBAT, natrium: n })))
  let menurun = true
  for (let i = 1; i < kelasI.length; i++) if (kelasI[i].cvMmPerMs >= kelasI[i - 1].cvMmPerMs) menurun = false
  ok('kelas I: kecepatan konduksi turun monoton terhadap blok natrium', menurun,
    kelasI.map((m) => m.cvMmPerMs.toFixed(3)).join(' '))
  ok('kelas I: panjang gelombang MEMENDEK — inilah mekanisme proaritmia CAST',
    kelasI[kelasI.length - 1].panjangGelombangMm < baku.panjangGelombangMm * 0.6,
    `${baku.panjangGelombangMm.toFixed(0)} -> ${kelasI[kelasI.length - 1].panjangGelombangMm.toFixed(0)}`)

  const kelasIII = ukurPlanar(terapkanObat(PARAMETER_BAKU, { ...TANPA_OBAT, kalium: 0.8 }))
  ok('kelas III: APD memanjang', kelasIII.apdMs > baku.apdMs * 1.1,
    `${baku.apdMs.toFixed(0)} -> ${kelasIII.apdMs.toFixed(0)}`)
  ok('kelas III: kecepatan konduksi hampir tidak berubah',
    Math.abs(kelasIII.cvMmPerMs - baku.cvMmPerMs) / baku.cvMmPerMs < 0.05,
    `${baku.cvMmPerMs.toFixed(3)} -> ${kelasIII.cvMmPerMs.toFixed(3)}`)
  ok('kelas III: panjang gelombang MEMANJANG', kelasIII.panjangGelombangMm > baku.panjangGelombangMm * 1.1)

  const kelasIV = ukurPlanar(terapkanObat(PARAMETER_BAKU, { ...TANPA_OBAT, kalsium: 0.6 }))
  ok('kelas IV: APD memendek', kelasIV.apdMs < baku.apdMs * 0.95,
    `${baku.apdMs.toFixed(0)} -> ${kelasIV.apdMs.toFixed(0)}`)

  // Blok natrium yang sangat dalam menghentikan konduksi sama sekali. Ini bukan
  // kegagalan simulasi — ini toksisitas kelas I, dan memang begitu bentuknya.
  const racun = ukurPlanar(terapkanObat(PARAMETER_BAKU, { ...TANPA_OBAT, natrium: 0.85 }))
  ok('blok natrium ekstrem menghentikan konduksi', racun.blok)
}

// ── 8. Parut dan lesi benar-benar menyekat ──────────────────────────────────
// Dicatat karena sempat salah: memeriksa u di AKHIR simulasi tidak menjawab
// apa pun. Gelombang yang lewat sudah repolarisasi lagi pada saat itu, jadi
// nilainya nol baik ketika lesinya menyekat maupun ketika tidak. Yang harus
// dilacak adalah puncak sepanjang waktu.
{
  function puncakDiKolom(j: ReturnType<typeof buatJaringan>, x: number, sampai: number): number {
    let puncak = 0
    while (j.t < sampai) {
      langkah(j, DT_BAKU, 25)
      for (let y = 0; y < j.tinggi; y++) puncak = Math.max(puncak, j.u[y * j.lebar + x])
    }
    return puncak
  }

  const j = buatJaringan(80, 30)
  garisAblasi(j, 40, 0, 40, 29, 5)
  rangsang(j, 0, 0, 3, 30, 1)
  ok('gelombang tidak bisa menembus lesi selebar penuh', puncakDiKolom(j, 70, 40) < 0.05)

  const tembus = buatJaringan(80, 30)
  garisAblasi(tembus, 40, 0, 40, 14, 5) // menyisakan celah 13 sel
  rangsang(tembus, 0, 0, 3, 30, 1)
  const lewat = puncakDiKolom(tembus, 70, 40)
  ok('gelombang lewat kalau lesinya menyisakan celah', lewat > 0.5, lewat.toFixed(4))
}

// ── 9. Substrat: parut, fibrosis, dan sifat menentukannya ───────────────────
{
  const j = buatJaringan(60, 60)
  pasangParut(j, 30, 30, 10)
  const f = fraksiEksitabel(j)
  const diharapkan = 1 - (Math.PI * 100) / 3600
  ok('luas parut sesuai jari-jarinya', Math.abs(f - diharapkan) < 0.02, `${f.toFixed(3)} vs ${diharapkan.toFixed(3)}`)

  const a = buatJaringan(50, 50); pasangFibrosis(a, 0.3, 7)
  const b = buatJaringan(50, 50); pasangFibrosis(b, 0.3, 7)
  let sama = true
  for (let i = 0; i < a.eksitabel.length; i++) if (a.eksitabel[i] !== b.eksitabel[i]) sama = false
  ok('fibrosis dengan benih sama menghasilkan substrat yang sama', sama)
  ok('fraksi fibrosis kira-kira sesuai permintaan',
    Math.abs(fraksiEksitabel(a) - 0.7) < 0.03, fraksiEksitabel(a).toFixed(3))
}

// ── 10. Blok sementara memang sementara ─────────────────────────────────────
{
  const j = buatJaringan(40, 40)
  blokSementara(j, 0, Math.PI, 3)
  const tertutup = fraksiEksitabel(j)
  ok('blok sementara menutup sebagian jaringan', tertutup < 0.9, tertutup.toFixed(3))
  maju(j, 5)
  ok('blok sementara pulih sendiri', fraksiEksitabel(j) === 1, fraksiEksitabel(j).toFixed(3))
}

// ── 11. Titik singular fase: nol untuk gelombang utuh ───────────────────────
// Detektor rotor yang gampang berteriak lebih berbahaya daripada tidak ada
// detektor sama sekali: ia akan melaporkan fibrilasi pada denyut yang normal.
{
  const planar = buatJaringan(96, 96)
  rangsang(planar, 0, 0, 4, 96, 1)
  maju(planar, 8)
  ok('gelombang planar tidak menghasilkan titik singular', jumlahRotor(planar) === 0, String(jumlahRotor(planar)))
  maju(planar, 16)
  ok('gelombang planar tetap nol rotor saat sudah lewat', jumlahRotor(planar) === 0, String(jumlahRotor(planar)))

  // Gelombang yang DIPATAHKAN oleh rangsangan silang di jaringan yang panjang
  // gelombangnya sudah pendek memang harus terdeteksi.
  const par = terapkanObat(PARAMETER_BAKU, { ...TANPA_OBAT, natrium: 0.5 })
  const patah = buatJaringan(128, 128, par)
  rangsang(patah, 0, 0, 4, 128, 1)
  maju(patah, 20)
  rangsangSetengah(patah, 'y', 64, 1)
  maju(patah, 40)
  ok('gelombang yang dipatahkan menghasilkan sedikitnya satu titik singular',
    jumlahRotor(patah) >= 1, String(jumlahRotor(patah)))
}

// ── 12. EKG semu ────────────────────────────────────────────────────────────
{
  const diam = buatJaringan(60, 60)
  ok('EKG semu jaringan diam adalah nol', Math.abs(pseudoEkg(diam, 30, -20)) < 1e-9)

  const aktif = buatJaringan(60, 60)
  rangsang(aktif, 0, 0, 4, 60, 1)
  maju(aktif, 4)
  ok('EKG semu menyimpang saat ada muka gelombang', Math.abs(pseudoEkg(aktif, 30, -20)) > 1e-6,
    pseudoEkg(aktif, 30, -20).toExponential(2))
}

// ── 13. Hukum panjang gelombang: inti seluruh berkas ────────────────────────
//
// Reentri tidak butuh apa pun yang eksotis. Ia hanya butuh lintasan tertutup
// yang lebih panjang daripada gelombangnya sendiri. Kalau lintasannya lebih
// pendek, kepala gelombang bertemu ekornya sendiri dan berhenti — dan itulah
// sebabnya jantung yang normal tidak berfibrilasi meskipun setiap hari
// menerima denyut prematur.
{
  const prof = profilPotensialAksi(PARAMETER_BAKU)

  // Sirkuit 190 mm (rasio 1,17 terhadap panjang gelombang) — terlalu sempit.
  const sempit = buatCincin(96, 96, 22, 43, PARAMETER_BAKU)
  pasangGelombangBerputar(sempit, prof, 22, 43)
  maju(sempit, 60)
  const kelSempit = kelilingCincin(22, 43) * MM_PER_SEL
  ok('sirkuit lebih pendek dari ~1,4x panjang gelombang: reentri padam',
    puncakAktivitas(sempit) < 0.05,
    `keliling ${kelSempit.toFixed(0)} mm, rasio ${(kelSempit / baku.panjangGelombangMm).toFixed(2)}, maxU ${puncakAktivitas(sempit).toFixed(3)}`)

  // Sirkuit 268 mm (rasio 1,66) — cukup panjang, reentri bertahan.
  const luas = buatCincin(128, 128, 34, 58, PARAMETER_BAKU)
  pasangGelombangBerputar(luas, prof, 34, 58)
  maju(luas, 100)
  const kelLuas = kelilingCincin(34, 58) * MM_PER_SEL
  ok('sirkuit yang cukup panjang mempertahankan reentri',
    puncakAktivitas(luas) > 0.5,
    `keliling ${kelLuas.toFixed(0)} mm, rasio ${(kelLuas / baku.panjangGelombangMm).toFixed(2)}, maxU ${puncakAktivitas(luas).toFixed(3)}`)
  ok('reentri yang bertahan tetap stabil secara numerik', stabil(luas))

  // Panjang siklus reentri harus masuk akal sebagai takikardia, bukan sebagai
  // angka acak. Diukur dari satu titik pantau di cincin.
  const idx = Math.round(128 / 2) * 128 + Math.round(128 / 2 - 46)
  const aktivasi: number[] = []
  let sblm = luas.u[idx]
  const sampai = luas.t + 60
  while (luas.t < sampai) {
    langkah(luas, DT_BAKU, 10)
    const u = luas.u[idx]
    if (sblm < 0.5 && u >= 0.5) aktivasi.push(luas.t)
    sblm = u
  }
  const cl = aktivasi.length > 1
    ? ((aktivasi[aktivasi.length - 1] - aktivasi[0]) / (aktivasi.length - 1)) * MS_PER_SATUAN
    : 0
  ok('panjang siklus reentri masuk akal sebagai takikardia (250-800 ms)',
    cl > 250 && cl < 800, `${cl.toFixed(0)} ms = ${(60000 / cl).toFixed(0)}/menit`)
}

// ── 14. Kelas III menghentikan reentri dengan memanjangkan gelombang ────────
//
// Bukan dengan "menenangkan" apa pun. Panjang gelombang tumbuh melewati
// keliling sirkuit, kepala gelombang menabrak ekornya sendiri, dan takikardia
// berhenti. Inilah cara ibutilide mengakhiri flutter atrium.
{
  const kel = kelilingCincin(28, 50) * MM_PER_SEL
  const parBaku = PARAMETER_BAKU
  const tanpa = buatCincin(112, 112, 28, 50, parBaku)
  pasangGelombangBerputar(tanpa, profilPotensialAksi(parBaku), 28, 50)
  maju(tanpa, 80)
  ok('sirkuit ambang mempertahankan reentri tanpa obat',
    puncakAktivitas(tanpa) > 0.5, `keliling ${kel.toFixed(0)} mm, maxU ${puncakAktivitas(tanpa).toFixed(3)}`)

  const parIII = terapkanObat(parBaku, { ...TANPA_OBAT, kalium: 0.8 })
  const ukurIII = ukurPlanar(parIII)
  const dengan = buatCincin(112, 112, 28, 50, parIII)
  pasangGelombangBerputar(dengan, profilPotensialAksi(parIII), 28, 50)
  maju(dengan, 80)
  ok('kelas III menghentikan reentri pada sirkuit yang sama',
    puncakAktivitas(dengan) < 0.05,
    `panjang gelombang ${ukurIII.panjangGelombangMm.toFixed(0)} mm > keliling ${kel.toFixed(0)} mm? rasio ${(kel / ukurIII.panjangGelombangMm).toFixed(2)}, maxU ${puncakAktivitas(dengan).toFixed(3)}`)
  ok('penghentian itu memang karena panjang gelombang melewati keliling',
    ukurIII.panjangGelombangMm > baku.panjangGelombangMm && kel / ukurIII.panjangGelombangMm < 1.25)
}

// ── 15. Ablasi: topologi, bukan keberuntungan ───────────────────────────────
//
// Satu garis dari tepi dalam ke tepi luar menghapus satu-satunya lintasan
// tertutup. Setelah itu tidak ada tempat bagi gelombang untuk kembali. Ini
// bentuk yang sama dengan garis ablasi isthmus kavotrikuspid pada flutter.
{
  const prof = profilPotensialAksi(PARAMETER_BAKU)
  const j = buatCincin(128, 128, 34, 58, PARAMETER_BAKU)
  pasangGelombangBerputar(j, prof, 34, 58)
  maju(j, 60)
  ok('reentri berjalan sebelum ablasi', puncakAktivitas(j) > 0.5, puncakAktivitas(j).toFixed(3))
  ablasiRadial(j, Math.PI / 2, 7)
  maju(j, 160)
  ok('satu garis ablasi radial menghentikan reentri', puncakAktivitas(j) < 0.05, puncakAktivitas(j).toFixed(4))
}

// ── 16. Vonis substrat ──────────────────────────────────────────────────────
{
  ok('panjang gelombang panjang pada lintasan pendek dinilai aman',
    nilaiSubstrat(baku, 120) === 'aman', nilaiSubstrat(baku, 120))
  ok('panjang gelombang pendek pada lintasan panjang dinilai rentan reentri',
    nilaiSubstrat(ukurPlanar(terapkanObat(PARAMETER_BAKU, { ...TANPA_OBAT, natrium: 0.5 })), 200) === 'rentan-reentri')
  ok('konduksi yang gagal dinilai blok',
    nilaiSubstrat(ukurPlanar(terapkanObat(PARAMETER_BAKU, { ...TANPA_OBAT, natrium: 0.85 })), 200) === 'blok')
  const panjangSekali = { ...baku, apdMs: APD_MS_RISIKO_TORSADE + 50 }
  ok('APD yang berlebihan ditandai sebagai risiko repolarisasi',
    nilaiSubstrat(panjangSekali, 500) === 'risiko-repolarisasi')
}

// ── 17. Kebersihan API ──────────────────────────────────────────────────────
{
  const j = buatJaringan(20, 20)
  pasangParut(j, 10, 10, 4)
  rangsang(j, 0, 0, 20, 20, 1)
  bersihkan(j)
  ok('bersihkan menyetel ulang keadaan tetapi menyimpan parut',
    puncakAktivitas(j) === 0 && j.t === 0 && fraksiEksitabel(j) < 1)
  ulangDariAwal(j)
  ok('ulangDariAwal menghapus parut juga', fraksiEksitabel(j) === 1)
  ok('satu sel grid berukuran sekitar satu milimeter', MM_PER_SEL > 0.5 && MM_PER_SEL < 2, String(MM_PER_SEL))
}

console.log(`\nBioelectric: ${lulus} lulus, ${gagal} gagal`)
if (gagal > 0) process.exit(1)
