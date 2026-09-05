// Uji perhitungan aliran kardiovaskular.
//
// Kenapa diuji sama sekali: animasi aliran yang SALAH tetap terlihat indah.
// Partikel yang mengalir mundur, melonjak di ruas panjang, atau berdenyut di
// vena tidak akan pernah tertangkap lewat tangkapan layar — hanya lewat angka.

import {
  bangunLintasan, panjangKumulatif, titikPada, kecepatanAliran, alirStenosis,
  FLOW_PATHS, strukturJalur, ALIRAN_DIASTOL,
} from '../../src/lib/cardioFlow'
import { CARDIO_BY_NAME } from '../../src/lib/cardioAtlas.gen'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const dekat = (a: number, b: number, e = 1e-6) => Math.abs(a - b) <= e

// ── Nama struktur di tiap jalur harus benar-benar ada di atlas ───────────────
for (const j of FLOW_PATHS) {
  const hilang = j.urutan.filter((n) => !CARDIO_BY_NAME[n.toLowerCase()])
  ok(`jalur ${j.id}: semua struktur ada di atlas`, hilang.length === 0, hilang.join(', '))
  ok(`jalur ${j.id}: sedikitnya 3 struktur`, strukturJalur(j).length >= 3)
}

// ── Lintasan ────────────────────────────────────────────────────────────────
const sistemik = bangunLintasan(FLOW_PATHS.find((j) => j.id === 'systemic')!.urutan)
ok('lintasan sistemik punya banyak titik', sistemik.length > 30, String(sistemik.length))

// Aliran sistemik berjalan dari jantung ke kaki: sumbu Y (atas-bawah) harus
// menurun secara keseluruhan. Kalau ruas terbalik, ini yang gagal.
ok('lintasan sistemik menurun dari jantung ke tungkai',
  sistemik[0][1] > sistemik[sistemik.length - 1][1],
  `${sistemik[0][1]} -> ${sistemik[sistemik.length - 1][1]}`)

// Tidak boleh ada lompatan besar: lompatan berarti ada ruas yang terbalik atau
// urutannya keliru.
const kum = panjangKumulatif(sistemik)
let lompatTerbesar = 0
for (let i = 1; i < kum.length; i++) lompatTerbesar = Math.max(lompatTerbesar, kum[i] - kum[i - 1])
ok('tidak ada lompatan lebih dari seperempat panjang total',
  lompatTerbesar < kum[kum.length - 1] / 4, String(lompatTerbesar))

// ── titikPada: berjalan menurut panjang, bukan menurut nomor titik ───────────
ok('titikPada(0) = titik pertama', titikPada(sistemik, 0)[1] === sistemik[0][1])
ok('titikPada(1) = titik terakhir', titikPada(sistemik, 1)[1] === sistemik[sistemik.length - 1][1])
{
  // Langkah t yang sama besar harus menempuh PANJANG LINTASAN yang sama besar.
  // Diukur sebagai panjang lintasan, bukan jarak lurus antar titik: di tempat
  // lintasan berbelok tajam (misalnya menyeberangi ruang jantung) jarak lurus
  // memang memendek walaupun jarak tempuhnya tetap.
  const panjangSampai = (t: number) => {
    let s = 0
    const N = 4000
    let a = titikPada(sistemik, 0)
    for (let i = 1; i <= N; i++) {
      const b = titikPada(sistemik, (t * i) / N)
      s += Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
      a = b
    }
    return s
  }
  const langkah: number[] = []
  for (let i = 0; i < 10; i++) langkah.push(panjangSampai((i + 1) / 10) - panjangSampai(i / 10))
  const maks = Math.max(...langkah), min = Math.min(...langkah)
  ok('langkah t seragam menempuh panjang lintasan yang seragam',
    maks / Math.max(min, 1e-9) < 1.05, `${min.toFixed(4)}..${maks.toFixed(4)}`)
}

// ── Kecepatan aliran ────────────────────────────────────────────────────────
ok('vena mengalir tetap', kecepatanAliran(0.3, 70, false) === 1 && kecepatanAliran(9.1, 70, false) === 1)
for (const hr of [50, 70, 110, 160]) {
  const periode = 60 / hr
  let jumlah = 0
  const N = 20000
  for (let i = 0; i < N; i++) jumlah += kecepatanAliran((i / N) * periode, hr, true)
  const rata = jumlah / N
  ok(`rata-rata satu siklus tetap 1 pada ${hr} bpm`, dekat(rata, 1, 0.01), rata.toFixed(4))
}
{
  const periode = 60 / 70
  ok('diastol jauh lebih lambat daripada puncak sistol',
    kecepatanAliran(periode * 0.9, 70, true) === ALIRAN_DIASTOL &&
    kecepatanAliran(0.17, 70, true) > 2)
  // Pada takikardia, porsi waktu yang dihabiskan dalam diastol MENGECIL.
  const porsi = (hr: number) => {
    const p = 60 / hr
    let d = 0
    for (let i = 0; i < 2000; i++) if (kecepatanAliran((i / 2000) * p, hr, true) === ALIRAN_DIASTOL) d++
    return d / 2000
  }
  ok('waktu diastol menyusut saat denyut cepat', porsi(160) < porsi(60),
    `${porsi(60).toFixed(2)} -> ${porsi(160).toFixed(2)}`)
}

// ── Stenosis ────────────────────────────────────────────────────────────────
{
  const normal = alirStenosis(0)
  ok('tanpa penyempitan, aliran istirahat normal', dekat(normal.istirahat, 1, 1e-3))
  ok('cadangan aliran koroner normal sekitar 4x', normal.cadangan > 3.5 && normal.cadangan < 4.5,
    String(normal.cadangan))

  // Batas-batas di bawah ini adalah pernyataan fisiologi, bukan selera:
  // aliran istirahat bertahan sampai stenosis berat karena autoregulasi,
  // sementara cadangan aliran sudah tergerus jauh sebelum itu.
  const s50 = alirStenosis(0.5)
  ok('stenosis 50% tidak menurunkan aliran istirahat', s50.istirahat > 0.99, String(s50.istirahat))
  ok('stenosis 50% sudah memangkas cadangan aliran', s50.cadangan < normal.cadangan - 0.1,
    String(s50.cadangan))

  const s70 = alirStenosis(0.7)
  ok('stenosis 70% masih mempertahankan aliran istirahat', s70.istirahat > 0.95, String(s70.istirahat))
  ok('stenosis 70% menurunkan cadangan ke wilayah iskemia saat beban',
    s70.cadangan > 2 && s70.cadangan < 3, String(s70.cadangan))

  const s85 = alirStenosis(0.85)
  ok('stenosis 85% mulai menurunkan aliran istirahat', s85.istirahat < 0.6, String(s85.istirahat))
  ok('pada stenosis 85% cadangan aliran hampir habis', s85.cadangan < 1.2, String(s85.cadangan))

  const s90 = alirStenosis(0.9)
  ok('stenosis 90% menekan aliran istirahat', s90.istirahat < 0.2, String(s90.istirahat))
  ok('aliran istirahat menurun secara monoton',
    alirStenosis(0.3).istirahat >= s50.istirahat && s50.istirahat >= s70.istirahat &&
    s70.istirahat > s85.istirahat && s85.istirahat > s90.istirahat)
  ok('cadangan aliran menurun secara monoton',
    normal.cadangan > s50.cadangan && s50.cadangan > s70.cadangan &&
    s70.cadangan > s85.cadangan && s85.cadangan >= s90.cadangan)
  ok('oklusi total menghentikan aliran', alirStenosis(1).istirahat < 0.001)
}

// ── Patologi: tautan ke struktur, ke jalur, dan ke korpus SKDI ───────────────
//
// Semua tautan diperiksa di sini karena tautan yang mati TIDAK terlihat: layar
// tetap tampil rapi, hanya isinya kosong. Salah ketik satu huruf pada nama
// penyakit SKDI cukup untuk membuat catatan 26.000 baris tidak pernah muncul.
{
  const { CARDIO_CONDITIONS, strukturTakDikenal, kondisiUntukStruktur } =
    await import('../../src/lib/cardioPathology')
  const { SKDI_DISEASE_LIST } = await import('../../src/lib/skdiDiseaseList')
  const { ORGAN_FOCUS } = await import('../../src/lib/organFocus')

  ok('setiap struktur yang disebut patologi ada di atlas', strukturTakDikenal().length === 0,
    strukturTakDikenal().join(' | '))

  const namaSkdi = new Set(SKDI_DISEASE_LIST.map((e: { disease: string }) => e.disease))
  const skdiHilang = CARDIO_CONDITIONS.flatMap((k) =>
    k.skdi.filter((n) => !namaSkdi.has(n)).map((n) => `${k.id}: ${n}`))
  ok('setiap tautan penyakit SKDI benar-benar ada di daftarnya', skdiHilang.length === 0,
    skdiHilang.join(' | '))

  const kunciOrgan = new Set(ORGAN_FOCUS.map((o: { key: string }) => o.key))
  const organHilang = CARDIO_CONDITIONS.filter((k) => !kunciOrgan.has(k.organKey)).map((k) => `${k.id}: ${k.organKey}`)
  ok('setiap keadaan menunjuk sasaran organ yang ada', organHilang.length === 0, organHilang.join(' | '))

  const idJalur = new Set(FLOW_PATHS.map((j) => j.id))
  const jalurHilang = CARDIO_CONDITIONS.filter((k) => k.jalur && !idJalur.has(k.jalur)).map((k) => `${k.id}: ${k.jalur}`)
  ok('setiap keadaan menunjuk jalur aliran yang ada', jalurHilang.length === 0, jalurHilang.join(' | '))

  ok('tiap keadaan punya sedikitnya satu lesi', CARDIO_CONDITIONS.every((k) => k.lesi.length >= 1))
  ok('derajat stenosis selalu antara 0 dan 1',
    CARDIO_CONDITIONS.every((k) => k.lesi.every((l) => l.derajat === undefined || (l.derajat > 0 && l.derajat < 1))))
  ok('id keadaan tidak ada yang kembar',
    new Set(CARDIO_CONDITIONS.map((k) => k.id)).size === CARDIO_CONDITIONS.length)

  // Arah pencarian yang sebenarnya dipakai: dari struktur yang disentuh.
  const lad = kondisiUntukStruktur('Trunk of anterior interventricular branch of left coronary artery')
  ok('menyentuh LAD memunculkan infark anterior dan angina stabil',
    lad.some((x) => x.kondisi.id === 'stemi-anterior' && x.peran === 'lesi') &&
    lad.some((x) => x.kondisi.id === 'stable-angina'), String(lad.length))
  const ivc = kondisiUntukStruktur('Inferior vena cava')
  ok('vena cava inferior muncul sebagai HILIR, bukan sebagai lesi',
    ivc.length > 0 && ivc.every((x) => x.peran === 'hilir'))
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
