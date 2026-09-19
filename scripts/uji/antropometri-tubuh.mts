import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  selesaikanBentukTubuh,
  volumeTangkaPenampang,
  kelilingElips,
  lingkarPenampangCm,
  PROPORSI_DRILLIS_CONTINI,
  DENSITAS_TUBUH_LAZIM,
  bangunMeshTubuh,
  BAGIAN_MASSA,
} from '../../src/lib/anatomy/antropometriTubuh.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Klaim yang diuji di sini hanya satu, dan ia dapat difalsifikasi:
// bentuk tubuh yang dihasilkan HARUS punya volume sama dengan massa/densitas.
//
// Itulah yang memisahkan berkas antropometri dari angka ajaib yang digantikannya.
// Jari-jari 0.68/0.43/0.52 pada avatar lama tidak dapat salah, karena tidak
// mengaku apa-apa. Bentuk di sini mengaku sesuatu yang dapat diperiksa, dan
// uji ini memeriksanya pada rentang tubuh manusia yang nyata.
// ─────────────────────────────────────────────────────────────────────────────

// ── Keliling elips: diperiksa terhadap kasus yang jawabannya sudah diketahui.
// Saat a = b, elips adalah lingkaran dan kelilingnya wajib tepat 2*pi*r.
for (const r of [0.05, 0.12, 0.4]) {
  const lingkaran = 2 * Math.PI * r
  assert.ok(
    Math.abs(kelilingElips(r, r) - lingkaran) < 1e-12,
    `keliling elips pada a=b=${r} menyimpang dari 2*pi*r, jadi rumusnya salah bahkan pada kasus paling sederhana`,
  )
}
assert.throws(() => kelilingElips(-1, 0.1), /negatif/)

// ── Volume: silinder elips lurus punya volume pi*a*b*h yang diketahui pasti.
{
  const a = 0.1, b = 0.07, h = 2
  const v = volumeTangkaPenampang([
    { nama: 'bawah', y: 0, a, b },
    { nama: 'atas', y: h, a, b },
  ])
  const tepat = Math.PI * a * b * h
  assert.ok(
    Math.abs(v - tepat) / tepat < 1e-12,
    `volume tangkai penampang pada silinder lurus (${v}) tidak sama dengan pi*a*b*h (${tepat})`,
  )
}

// ── KLAIM UTAMA: kekekalan massa pada rentang tubuh manusia nyata.
const KASUS: { tinggiCm: number; massaKg: number; jenisKelamin: 'L' | 'P' }[] = [
  { tinggiCm: 150, massaKg: 45, jenisKelamin: 'P' },
  { tinggiCm: 160, massaKg: 55, jenisKelamin: 'P' },
  { tinggiCm: 165, massaKg: 90, jenisKelamin: 'P' },
  { tinggiCm: 170, massaKg: 70, jenisKelamin: 'L' },
  { tinggiCm: 178, massaKg: 62, jenisKelamin: 'L' },
  { tinggiCm: 185, massaKg: 110, jenisKelamin: 'L' },
  { tinggiCm: 200, massaKg: 95, jenisKelamin: 'L' },
]

for (const kasus of KASUS) {
  const bentuk = selesaikanBentukTubuh(kasus)
  assert.ok(
    bentuk.residuRelatif < 1e-9,
    `pada ${kasus.tinggiCm}cm/${kasus.massaKg}kg volume mesh meleset ${(bentuk.residuRelatif * 100).toFixed(4)}% dari massa/densitas — kekekalan massa tidak terpenuhi`,
  )
  // Volume yang dilaporkan harus benar-benar volume penampangnya, bukan angka
  // yang disimpan terpisah dan kebetulan cocok.
  assert.ok(
    bentuk.volumeM3 > volumeTangkaPenampang(bentuk.penampang),
    `volume yang dilaporkan pada ${kasus.tinggiCm}cm tidak melebihi volume tangkai, berarti volume lengan tidak ikut dihitung`,
  )
  assert.ok(bentuk.skalaLingkar > 0, 'skala lingkar wajib positif')
}

// ── DUA TUNGKAI, dan volumenya benar-benar dihitung dua kali.
//
// Versi pertama model ini memasukkan tungkai ke tangkai penampang yang sama
// dengan batang tubuh, sehingga seluruh tubuh menjadi satu benda putar: secara
// aritmetika volumenya konsisten, tetapi sosok yang muncul di layar berkaki
// satu. Uji ini menahan pemisahan itu tetap ada DAN tetap terhitung benar.
{
  const bentuk = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 72 })
  assert.ok(bentuk.tungkai.length >= 4, 'tungkai tidak dimodelkan terpisah dari batang tubuh')

  // Batang tubuh tidak boleh turun sampai pergelangan kaki.
  const torsoTerendah = Math.min(...bentuk.penampang.map((p) => p.y))
  assert.ok(
    torsoTerendah > 0.40 * 1.75,
    `penampang batang tubuh terendah di ${torsoTerendah.toFixed(3)}m masih turun ke wilayah tungkai — tubuh bawah kembali menjadi satu kolom`,
  )

  // Tungkai menyambung ke selangkangan, tanpa celah maupun tumpang tindih.
  const tungkaiTertinggi = Math.max(...bentuk.tungkai.map((p) => p.y))
  const selangkangan = bentuk.penampang.find((p) => p.nama === 'selangkangan')!
  assert.ok(
    Math.abs(tungkaiTertinggi - selangkangan.y) < 1e-9,
    `puncak tungkai (${tungkaiTertinggi.toFixed(3)}m) tidak bertemu selangkangan (${selangkangan.y.toFixed(3)}m)`,
  )

  // Volume yang dilaporkan HARUS memuat dua tungkai, bukan satu.
  const torsoV = volumeTangkaPenampang(bentuk.penampang)
  const tungkaiV = volumeTangkaPenampang(bentuk.tungkai)
  assert.ok(
    bentuk.volumeM3 >= torsoV + 2 * tungkaiV - 1e-12,
    'volume yang dilaporkan lebih kecil daripada batang tubuh + dua tungkai — salah satu kaki tidak ikut dihitung',
  )

  // Dan mesh tungkai benar-benar dapat dibangun dengan pembangun yang sama.
  const kaki = bangunMeshTubuh(bentuk.tungkai, { segmen: 24, sisipan: 3 })
  assert.ok(kaki.jumlahCincin > bentuk.tungkai.length, 'mesh tungkai tidak dihaluskan')
  const titikKaki = kaki.posisi.length / 3
  for (const idx of kaki.indeks) assert.ok(idx < titikKaki, 'indeks mesh tungkai di luar batas')
}

// ── PEMBAGIAN VOLUME harus mendekati fraksi massa terbitan (Winter).
//
// Kekekalan massa saja tidak cukup: sosok dengan tungkai terlalu gemuk dan
// batang tubuh terlalu kurus tetap dapat memenuhi volume total yang benar.
// Itu persis yang terjadi pada versi pertama model ini — tungkai 36.9%
// terhadap batang tubuh 51.7%, padahal tabel Winter menyebut 32.2% dan 57.8%.
// Pita di bawah sengaja ketat; melonggarkannya berarti membiarkan proporsi
// tubuh kembali hanyut tanpa ada yang menyadari.
{
  const bentuk = selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 68, jenisKelamin: 'L' })
  const vTorso = volumeTangkaPenampang(bentuk.penampang)
  const vTungkai = 2 * volumeTangkaPenampang(bentuk.tungkai)
  const vLengan = bentuk.volumeM3 - vTorso - vTungkai

  const bagian = {
    torso: vTorso / bentuk.volumeM3,
    tungkai: vTungkai / bentuk.volumeM3,
    lengan: vLengan / bentuk.volumeM3,
  }
  // Jumlah fraksi Winter sedikit di bawah 1 (tangan/kaki dibulatkan), jadi
  // dinormalkan dulu supaya perbandingannya adil.
  const totalWinter = BAGIAN_MASSA.torso + BAGIAN_MASSA.tungkai + BAGIAN_MASSA.lengan
  for (const kunci of ['torso', 'tungkai', 'lengan'] as const) {
    const sasaran = BAGIAN_MASSA[kunci] / totalWinter
    const nyata = bagian[kunci]
    assert.ok(
      Math.abs(nyata - sasaran) < 0.035,
      `pembagian volume '${kunci}' ${(nyata * 100).toFixed(1)}% menyimpang lebih dari 3.5 poin dari fraksi massa Winter ${(sasaran * 100).toFixed(1)}% — proporsi antar segmen tidak lagi mengikuti tabel terbitan`,
    )
  }
}

// ── NAMA PENAMPANG YANG DIPAKAI PERENDER harus benar-benar ada.
//
// Uji ini ada karena kekurangan nyata pada versi sebelumnya: seluruh berkas
// lulus, tetapi PersonalBodyAvatar3D mencari 'pergelangan-kaki' hanya di dalam
// `penampang`. Setelah tungkai dipisahkan ke daftarnya sendiri, pencarian itu
// menghasilkan undefined, pembacaan `.y` melempar, dan halaman Profile jatuh
// ke layar "Something went wrong" — tanpa satu pun uji lib yang berubah warna.
// Karena itu di sini yang diperiksa adalah kontrak antara lib dan perendernya.
{
  const bentuk = selesaikanBentukTubuh({ tinggiCm: 172, massaKg: 70 })
  const tersedia = new Set([...bentuk.penampang, ...bentuk.tungkai].map((p) => p.nama))
  const DIPAKAI_PERENDER = ['bahu', 'panggul', 'pergelangan-kaki', 'kepala-tengah', 'selangkangan']
  for (const nama of DIPAKAI_PERENDER) {
    assert.ok(
      tersedia.has(nama),
      `penampang '${nama}' dicari oleh PersonalBodyAvatar3D tetapi tidak ada pada bentuk tubuh — perendernya akan melempar dan halaman jatuh ke layar galat`,
    )
  }

  const sumberPerender = readFileSync(
    new URL('../../src/components/PersonalBodyAvatar3D.tsx', import.meta.url),
    'utf8',
  )
  for (const nama of DIPAKAI_PERENDER) {
    if (!sumberPerender.includes(`'${nama}'`)) continue
    assert.ok(
      tersedia.has(nama),
      `PersonalBodyAvatar3D menyebut penampang '${nama}' yang tidak lagi dihasilkan model`,
    )
  }
  // Pencariannya wajib menelusuri KEDUA daftar; menelusuri satu saja adalah
  // persis bentuk kegagalan yang pernah terjadi.
  assert.match(
    sumberPerender,
    /bentuk\.penampang\.find[\s\S]{0,120}bentuk\.tungkai\.find/,
    'pencarian penampang di PersonalBodyAvatar3D tidak menelusuri tungkai, sehingga nama yang pindah ke sana akan kembali menjadi undefined',
  )
}

// ── Monotonisitas: pada tinggi tetap, orang yang lebih berat harus lebih besar.
// Kalau ini gagal, bentuknya tidak benar-benar mengikuti masukan.
{
  const ringan = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 60 })
  const berat = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 95 })
  assert.ok(
    berat.skalaLingkar > ringan.skalaLingkar,
    'pada tinggi sama, massa lebih besar tidak menghasilkan lingkar lebih besar — bentuk tidak mengikuti masukan',
  )
  assert.ok(
    lingkarPenampangCm(berat, 'pinggang') > lingkarPenampangCm(ringan, 'pinggang'),
    'lingkar pinggang tidak bertambah saat massa bertambah',
  )
}

// ── Tinggi benar-benar dipakai: penampang teratas harus berada di tinggi itu.
for (const tinggiCm of [150, 175, 200]) {
  const bentuk = selesaikanBentukTubuh({ tinggiCm, massaKg: 70 })
  const puncak = Math.max(...bentuk.penampang.map((p) => p.y))
  assert.ok(
    Math.abs(puncak - tinggiCm / 100) < 1e-9,
    `penampang tertinggi pada ${tinggiCm}cm berada di ${puncak}m, bukan ${tinggiCm / 100}m — tinggi masukan tidak menentukan tinggi model`,
  )
}

// ── Kerangka vertikal memang memakai proporsi TERBITAN.
//
// Nilai di bawah SENGAJA ditulis ulang sebagai angka, bukan dibaca dari modul
// yang diuji. Versi pertama uji ini membandingkan modul dengan konstantanya
// sendiri, sehingga mengubah 0.285 menjadi 0.300 di sumber tetap lolos: uji
// yang membaca angka dari benda yang diperiksanya tidak menguji apa pun.
// Angka-angka ini adalah tabel Drillis & Contini (1966) via Winter, dan
// menyimpang darinya berarti berkas sumber berhenti memakai proporsi terbitan.
const PROPORSI_TERBIT: Record<string, number> = {
  tinggiPergelanganKaki: 0.039,
  tinggiLutut: 0.285,
  tinggiTrokanter: 0.530,
  tinggiDada: 0.720,
  tinggiBahu: 0.818,
  lebarBahu: 0.259,
  lebarPanggul: 0.191,
  tinggiKepala: 0.130,
  tinggiSiku: 0.630,
  tinggiPergelanganTangan: 0.485,
  panjangLenganAtas: 0.186,
  panjangLenganBawah: 0.146,
  panjangPaha: 0.245,
  panjangBetis: 0.246,
  panjangTelapakKaki: 0.152,
}
for (const [nama, nilai] of Object.entries(PROPORSI_TERBIT)) {
  assert.equal(
    (PROPORSI_DRILLIS_CONTINI as Record<string, number>)[nama],
    nilai,
    `proporsi '${nama}' bukan lagi ${nilai} seperti tabel Drillis & Contini — sumber berhenti memakai proporsi terbitan`,
  )
}
{
  const H = 1.75
  const bentuk = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 70 })
  const semua = [...bentuk.penampang, ...bentuk.tungkai]
  for (const [penampangNama, kunci] of [['lutut', 'tinggiLutut'], ['bahu', 'tinggiBahu'], ['dada', 'tinggiDada']] as const) {
    const p = semua.find((x) => x.nama === penampangNama)!
    assert.ok(
      Math.abs(p.y - PROPORSI_TERBIT[kunci] * H) < 1e-9,
      `ketinggian penampang '${penampangNama}' tidak sama dengan ${PROPORSI_TERBIT[kunci]}xH seperti tabel terbitan`,
    )
  }
}

// ── Perbedaan jenis kelamin hanya pada bentuk, TIDAK pada tinggi segmen.
{
  const l = selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 65, jenisKelamin: 'L' })
  const p = selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 65, jenisKelamin: 'P' })
  for (const a of l.penampang) {
    const b = p.penampang.find((x) => x.nama === a.nama)!
    assert.ok(
      Math.abs(a.y - b.y) < 1e-12,
      `penampang '${a.nama}' berada di ketinggian berbeda antar jenis kelamin — proporsi segmen tidak boleh dibedakan begitu`,
    )
  }
  const rasioL = lingkarPenampangCm(l, 'panggul') / lingkarPenampangCm(l, 'bahu')
  const rasioP = lingkarPenampangCm(p, 'panggul') / lingkarPenampangCm(p, 'bahu')
  assert.ok(rasioP > rasioL, 'rasio panggul-terhadap-bahu tidak berbeda antar jenis kelamin')
}

// ── GAGAL-TERTUTUP: masukan di luar kisaran manusia ditolak, bukan dibentuk.
assert.throws(() => selesaikanBentukTubuh({ tinggiCm: 0, massaKg: 70 }), /di luar kisaran/)
assert.throws(() => selesaikanBentukTubuh({ tinggiCm: 400, massaKg: 70 }), /di luar kisaran/)
assert.throws(() => selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 0 }), /di luar kisaran/)
assert.throws(() => selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 900 }), /di luar kisaran/)
assert.throws(() => selesaikanBentukTubuh({ tinggiCm: NaN, massaKg: 70 }), /di luar kisaran/)
assert.throws(() => selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 70 }, 2.5), /densitas/)

// ── Densitas yang sah menggeser hasil, membuktikan ia benar-benar dipakai.
{
  const renggang = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 75 }, 1.02)
  const padat = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 75 }, 1.05)
  assert.ok(
    renggang.volumeSasaranM3 > padat.volumeSasaranM3,
    'densitas lebih tinggi tidak menghasilkan volume sasaran lebih kecil — densitas tidak benar-benar dipakai',
  )
  assert.notEqual(renggang.skalaLingkar, padat.skalaLingkar)
}

// ── Lingkar hasil harus berada di kisaran manusia yang masuk akal.
// Bukan uji kosmetik: kalau model memenuhi kekekalan massa dengan bentuk yang
// mustahil (misalnya pinggang 20 cm), ia lulus aritmetika tapi salah sebagai tubuh.
{
  const bentuk = selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 68, jenisKelamin: 'L' })
  const dada = lingkarPenampangCm(bentuk, 'dada')
  const pinggang = lingkarPenampangCm(bentuk, 'pinggang')
  const panggul = lingkarPenampangCm(bentuk, 'panggul')
  assert.ok(dada > 70 && dada < 130, `lingkar dada ${dada.toFixed(1)} cm di luar kisaran manusia yang masuk akal pada 170cm/68kg`)
  assert.ok(pinggang > 55 && pinggang < 120, `lingkar pinggang ${pinggang.toFixed(1)} cm di luar kisaran manusia yang masuk akal pada 170cm/68kg`)
  assert.ok(panggul > 70 && panggul < 130, `lingkar panggul ${panggul.toFixed(1)} cm di luar kisaran manusia yang masuk akal pada 170cm/68kg`)
  assert.throws(() => lingkarPenampangCm(bentuk, 'tidak-ada'), /tidak ada/)
}

// ── Mesh ter-loft: satu permukaan menyambung, bukan primitif bertumpuk.
{
  const bentuk = selesaikanBentukTubuh({ tinggiCm: 172, massaKg: 70 })
  const mesh = bangunMeshTubuh(bentuk, { segmen: 32, sisipan: 4 })

  assert.equal(mesh.titikPerCincin, 32)
  assert.equal(mesh.posisi.length, mesh.jumlahCincin * 32 * 3)
  assert.equal(mesh.indeks.length, (mesh.jumlahCincin - 1) * 32 * 6)

  // Penghalusan harus benar-benar menambah cincin; kalau tidak, permukaannya
  // kembali bersudut di tiap penampang dan "mulus" hanya jadi klaim.
  assert.ok(
    mesh.jumlahCincin > bentuk.penampang.length,
    `mesh hanya punya ${mesh.jumlahCincin} cincin untuk ${bentuk.penampang.length} penampang — tidak ada penghalusan sama sekali`,
  )

  // Tiap indeks wajib menunjuk titik yang ada. Indeks di luar batas adalah
  // cara paling umum geometri prosedural gagal, dan gagalnya diam-diam.
  const jumlahTitik = mesh.posisi.length / 3
  for (const idx of mesh.indeks) {
    assert.ok(idx < jumlahTitik, `indeks ${idx} melampaui ${jumlahTitik} titik yang ada`)
  }

  // Tidak boleh ada NaN: satu saja membuat seluruh mesh hilang saat dirender.
  for (const v of mesh.posisi) assert.ok(Number.isFinite(v), 'posisi mesh memuat nilai bukan bilangan')

  // Tinggi mesh harus sama dengan tinggi orangnya.
  let yMin = Infinity, yMaks = -Infinity
  for (let i = 1; i < mesh.posisi.length; i += 3) {
    yMin = Math.min(yMin, mesh.posisi[i]); yMaks = Math.max(yMaks, mesh.posisi[i])
  }
  assert.ok(Math.abs(yMaks - 1.72) < 0.02, `puncak mesh batang tubuh di ${yMaks.toFixed(3)}m, bukan 1.72m`)
  // Batang tubuh bermula di selangkangan (~0.5H), BUKAN di lantai: yang
  // menjangkau lantai adalah mesh tungkai.
  assert.ok(
    Math.abs(yMin - 0.5 * 1.72) < 0.02,
    `dasar mesh batang tubuh di ${yMin.toFixed(3)}m, seharusnya di selangkangan ~${(0.5 * 1.72).toFixed(3)}m`,
  )

  const kaki = bangunMeshTubuh(bentuk.tungkai, { segmen: 24, sisipan: 4 })
  let kakiMin = Infinity, kakiMaks = -Infinity
  for (let i = 1; i < kaki.posisi.length; i += 3) {
    kakiMin = Math.min(kakiMin, kaki.posisi[i]); kakiMaks = Math.max(kakiMaks, kaki.posisi[i])
  }
  assert.ok(kakiMin >= 0 && kakiMin < 0.12, `dasar tungkai di ${kakiMin.toFixed(3)}m, seharusnya dekat lantai`)
  assert.ok(
    Math.abs(kakiMaks - yMin) < 1e-6,
    `puncak tungkai (${kakiMaks.toFixed(3)}m) tidak bertemu dasar batang tubuh (${yMin.toFixed(3)}m) — akan ada celah di selangkangan`,
  )

  assert.throws(
    () => bangunMeshTubuh({ ...bentuk, penampang: bentuk.penampang.slice(0, 2) }),
    /sedikitnya tiga penampang/,
  )
}

const contoh = selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 68, jenisKelamin: 'L' })
console.log(
  `antropometri-tubuh: ${KASUS.length} tubuh diselesaikan, kekekalan massa terpenuhi < 1e-9; 170cm/68kg -> dada ${lingkarPenampangCm(contoh, 'dada').toFixed(1)}cm, pinggang ${lingkarPenampangCm(contoh, 'pinggang').toFixed(1)}cm, panggul ${lingkarPenampangCm(contoh, 'panggul').toFixed(1)}cm, volume ${(contoh.volumeM3 * 1000).toFixed(1)}L`,
)
