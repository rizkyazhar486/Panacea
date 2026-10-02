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
  densitasDariLemakTubuh,
  LEMAK_TUBUH_MIN_PCT,
  LEMAK_TUBUH_MAKS_PCT,
  DENSITAS_TUBUH_MIN,
  DENSITAS_TUBUH_MAKS,
  volumeAcuanPerawakanM3,
  IMT_ACUAN_ICRP89,
  skalaLingkarUntukVolume,
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
  const vLengan = 2 * volumeTangkaPenampang(bentuk.lengan)
  // Ketiganya harus MENJUMLAH ke volume yang dilaporkan. Dulu volume lengan
  // dihitung sebagai sisa (total - torso - tungkai), yang membuat uji ini tidak
  // pernah bisa menangkap kesalahan pada lengan: berapa pun nilainya, sisanya
  // selalu pas. Sekarang lengan dihitung sendiri dan totalnya diperiksa.
  assert.ok(
    Math.abs(vTorso + vTungkai + vLengan - bentuk.volumeM3) / bentuk.volumeM3 < 1e-9,
    'jumlah volume batang tubuh + dua tungkai + dua lengan tidak sama dengan volume yang dilaporkan',
  )

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
      Math.abs(nyata - sasaran) < 0.015,
      `pembagian volume '${kunci}' ${(nyata * 100).toFixed(1)}% menyimpang lebih dari 1.5 poin dari fraksi massa Winter ${(sasaran * 100).toFixed(1)}% — proporsi antar segmen tidak lagi mengikuti tabel terbitan`,
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
  const tersedia = new Set([...bentuk.penampang, ...bentuk.tungkai, ...bentuk.lengan].map((p) => p.nama))
  const DIPAKAI_PERENDER = ['bahu', 'panggul', 'pergelangan-kaki', 'kepala-tengah', 'selangkangan', 'deltoid']
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
    /bentuk\.penampang\.find[\s\S]{0,200}bentuk\.tungkai\.find[\s\S]{0,200}bentuk\.lengan\.find/,
    'pencarian penampang di PersonalBodyAvatar3D tidak menelusuri KETIGA daftar (batang tubuh, tungkai, lengan), sehingga nama yang pindah antar daftar akan kembali menjadi undefined',
  )
}

// ── KOMPOSISI TUBUH: densitas dari Siri, dan ke mana volumenya pergi.
//
// Sebelum ini avatar hanya memakai tinggi dan berat, jadi dua orang dengan
// tinggi/berat sama menghasilkan sosok yang identik — padahal komposisinya bisa
// sangat berbeda. Lemak (~0.9 g/cm3) lebih ringan per satuan volume daripada
// massa bebas lemak (~1.1), sehingga pada massa yang sama tubuh dengan lemak
// lebih tinggi benar-benar menempati ruang lebih besar.
{
  // Persamaan Siri diperiksa pada titik yang dapat dihitung tangan:
  // D = 4.95 / (BF/100 + 4.50)
  for (const [bf, harap] of [[5, 4.95 / 4.55], [15, 4.95 / 4.65], [30, 4.95 / 4.80], [45, 4.95 / 4.95]] as const) {
    assert.ok(
      Math.abs(densitasDariLemakTubuh(bf) - harap) < 1e-12,
      `densitas pada lemak ${bf}% menyimpang dari pembalikan persamaan Siri`,
    )
  }
  // Lebih banyak lemak berarti tubuh kurang padat. Arah ini tidak boleh terbalik.
  assert.ok(densitasDariLemakTubuh(10) > densitasDariLemakTubuh(35), 'densitas tidak menurun saat lemak tubuh naik')

  // Batas densitas HARUS memuat seluruh rentang lemak yang dapat diukur.
  // Versi sebelumnya memakai 1.01-1.06 dan akan menolak tubuh nyata: Siri
  // memberi 1.088 pada 5% dan 1.000 pada 45%.
  for (const bf of [LEMAK_TUBUH_MIN_PCT, 5, 25, 45, LEMAK_TUBUH_MAKS_PCT]) {
    const d = densitasDariLemakTubuh(bf)
    assert.ok(
      d >= DENSITAS_TUBUH_MIN && d <= DENSITAS_TUBUH_MAKS,
      `densitas ${d.toFixed(4)} pada lemak ${bf}% berada di luar batas yang diterima model, sehingga tubuh yang sah akan ditolak`,
    )
  }
  assert.throws(() => densitasDariLemakTubuh(1), /di luar rentang/)
  assert.throws(() => densitasDariLemakTubuh(80), /di luar rentang/)
  assert.throws(() => densitasDariLemakTubuh(NaN), /di luar rentang/)

  // Pada MASSA SAMA, lemak lebih tinggi harus memberi volume lebih besar.
  const kurus = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 78, jenisKelamin: 'L', lemakTubuhPct: 8 })
  const gemuk = selesaikanBentukTubuh({ tinggiCm: 175, massaKg: 78, jenisKelamin: 'L', lemakTubuhPct: 32 })
  assert.ok(
    gemuk.volumeM3 > kurus.volumeM3,
    'pada massa sama, lemak tubuh lebih tinggi tidak menghasilkan volume lebih besar — densitas dari komposisi tidak benar-benar dipakai',
  )

  // Kekekalan massa TETAP berlaku setelah distribusi. Distribusi hanya
  // memindahkan volume antar bagian; ia tidak boleh menambah atau menguranginya.
  for (const b of [kurus, gemuk]) {
    assert.ok(
      b.residuRelatif < 1e-9,
      `distribusi lemak merusak kekekalan massa (residu ${b.residuRelatif})`,
    )
  }

  // POLA ANDROID pada laki-laki: pinggang tumbuh lebih cepat daripada dada.
  const rasioKurus = lingkarPenampangCm(kurus, 'pinggang') / lingkarPenampangCm(kurus, 'dada')
  const rasioGemuk = lingkarPenampangCm(gemuk, 'pinggang') / lingkarPenampangCm(gemuk, 'dada')
  assert.ok(
    rasioGemuk > rasioKurus + 0.1,
    `rasio pinggang/dada nyaris tidak berubah (${rasioKurus.toFixed(3)} -> ${rasioGemuk.toFixed(3)}); lemak ditambahkan merata, yang tidak terjadi pada tubuh sungguhan`,
  )

  // POLA GYNOID pada perempuan: panggul tumbuh lebih cepat daripada pinggang.
  const pKurus = selesaikanBentukTubuh({ tinggiCm: 165, massaKg: 62, jenisKelamin: 'P', lemakTubuhPct: 18 })
  const pGemuk = selesaikanBentukTubuh({ tinggiCm: 165, massaKg: 62, jenisKelamin: 'P', lemakTubuhPct: 40 })
  const wKurus = lingkarPenampangCm(pKurus, 'pinggang') / lingkarPenampangCm(pKurus, 'panggul')
  const wGemuk = lingkarPenampangCm(pGemuk, 'pinggang') / lingkarPenampangCm(pGemuk, 'panggul')
  assert.ok(
    wGemuk < wKurus - 0.1,
    `rasio pinggang/panggul perempuan tidak turun (${wKurus.toFixed(3)} -> ${wGemuk.toFixed(3)}); pola gynoid tidak terbentuk`,
  )

  // Dan polanya memang BERBEDA antar jenis kelamin pada masukan yang sama.
  const lSama = selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 70, jenisKelamin: 'L', lemakTubuhPct: 35 })
  const pSama = selesaikanBentukTubuh({ tinggiCm: 170, massaKg: 70, jenisKelamin: 'P', lemakTubuhPct: 35 })
  assert.ok(
    lingkarPenampangCm(lSama, 'pinggang') / lingkarPenampangCm(lSama, 'panggul') >
      lingkarPenampangCm(pSama, 'pinggang') / lingkarPenampangCm(pSama, 'panggul') + 0.05,
    'distribusi lemak tidak dibedakan antar jenis kelamin pada masukan yang sama',
  )

  // KEWAJARAN DI SELURUH RENTANG KOMPOSISI, bukan hanya pada kasus bawaan.
  // Uji lama hanya memeriksa tubuh tanpa lemak terukur, sehingga pengali
  // distribusi yang terlalu kuat lolos: pada 8% lemak ia menghasilkan pinggang
  // 59 cm untuk laki-laki 175 cm — angka yang tidak ada pada manusia dewasa.
  for (const bf of [5, 10, 18, 25, 35, 45]) {
    for (const jk of ['L', 'P'] as const) {
      const b = selesaikanBentukTubuh({ tinggiCm: 172, massaKg: 72, jenisKelamin: jk, lemakTubuhPct: bf })
      const pinggang = lingkarPenampangCm(b, 'pinggang')
      const dada = lingkarPenampangCm(b, 'dada')
      const panggul = lingkarPenampangCm(b, 'panggul')
      assert.ok(pinggang > 60 && pinggang < 135, `lemak ${bf}% ${jk}: pinggang ${pinggang.toFixed(1)} cm di luar kisaran manusia dewasa`)
      assert.ok(dada > 75 && dada < 140, `lemak ${bf}% ${jk}: dada ${dada.toFixed(1)} cm di luar kisaran manusia dewasa`)
      assert.ok(panggul > 75 && panggul < 140, `lemak ${bf}% ${jk}: panggul ${panggul.toFixed(1)} cm di luar kisaran manusia dewasa`)
    }
  }

  // RASIO PINGGANG-TINGGI sebagai pagar bebas-skala.
  //
  // Pita lingkar mutlak ternyata terlalu longgar: pengali distribusi yang jauh
  // terlalu kuat tetap lolos karena lingkarnya masih di atas ambang tetap.
  // Rasio pinggang/tinggi menangkapnya, dan ia memang ukuran yang dipakai
  // literatur WHtR. Yang dijamin di sini: sekalipun MASUKANNYA mustahil
  // (misalnya 195 cm / 70 kg dengan lemak 5%, yang tidak konsisten secara
  // fisiologis), model tetap tidak boleh menggambar siluet non-manusia.
  {
    let terkecil = Infinity
    let terbesar = 0
    let kasusKecil = ''
    for (const bf of [5, 10, 18, 25, 35, 45, 55]) {
      for (const [h, w] of [[150, 45], [160, 50], [165, 62], [172, 72], [175, 78], [180, 85], [185, 110], [195, 70]] as const) {
        for (const jk of ['L', 'P'] as const) {
          const b = selesaikanBentukTubuh({ tinggiCm: h, massaKg: w, jenisKelamin: jk, lemakTubuhPct: bf })
          const r = lingkarPenampangCm(b, 'pinggang') / h
          if (r < terkecil) { terkecil = r; kasusKecil = `${h}cm/${w}kg ${jk} lemak ${bf}%` }
          if (r > terbesar) terbesar = r
        }
      }
    }
    assert.ok(
      terkecil > 0.30,
      `rasio pinggang/tinggi turun sampai ${terkecil.toFixed(3)} pada ${kasusKecil} — di bawah apa pun yang ada pada manusia; distribusi lemak terlalu kuat`,
    )
    assert.ok(
      terbesar < 0.80,
      `rasio pinggang/tinggi naik sampai ${terbesar.toFixed(3)} — di atas apa pun yang ada pada manusia`,
    )
  }

  // Tanpa lemak terukur, model tetap bekerja dengan densitas lazim.
  const tanpa = selesaikanBentukTubuh({ tinggiCm: 172, massaKg: 72 })
  assert.equal(tanpa.densitasDipakai, DENSITAS_TUBUH_LAZIM)
  assert.throws(
    () => selesaikanBentukTubuh({ tinggiCm: 172, massaKg: 72, lemakTubuhPct: 90 }),
    /di luar rentang/,
  )
}

// ── TUTUP UJUNG: anggota badan tidak boleh berakhir sebagai tepi datar.
//
// Tabung ter-loft ujungnya terbuka. Pada lengan itu terlihat langsung sebagai
// potongan rata di puncak, dan pada tungkai sebagai kaki tanpa ujung. Uji ini
// memeriksa ujungnya benar-benar MENGECIL ke satu titik, bukan sekadar
// bertambah cincin.
{
  const bentuk = selesaikanBentukTubuh({ tinggiCm: 174, massaKg: 74 })
  const terbuka = bangunMeshTubuh(bentuk.lengan, { segmen: 24, sisipan: 3 })
  const tertutup = bangunMeshTubuh(bentuk.lengan, { segmen: 24, sisipan: 3, tutupUjung: true })

  assert.ok(
    tertutup.jumlahCincin > terbuka.jumlahCincin,
    'tutupUjung tidak menambah cincin apa pun, jadi ujungnya tetap terbuka',
  )

  // Jari-jari cincin paling ujung harus jauh lebih kecil daripada cincin
  // tubuh terdekatnya. Kalau tidak, "tutup" hanya memperpanjang tabung.
  const jariCincin = (m: typeof tertutup, r: number) => {
    let maks = 0
    for (let s = 0; s < m.titikPerCincin; s++) {
      const i = (r * m.titikPerCincin + s) * 3
      maks = Math.max(maks, Math.hypot(m.posisi[i], m.posisi[i + 2]))
    }
    return maks
  }
  const ujungBawah = jariCincin(tertutup, 0)
  const ujungAtas = jariCincin(tertutup, tertutup.jumlahCincin - 1)
  const tengah = jariCincin(tertutup, Math.floor(tertutup.jumlahCincin / 2))
  assert.ok(
    ujungBawah < tengah * 0.25,
    `cincin ujung bawah masih berjari-jari ${ujungBawah.toFixed(4)} m terhadap ${tengah.toFixed(4)} m di tengah — ujungnya belum menutup`,
  )
  assert.ok(
    ujungAtas < tengah * 0.25,
    `cincin ujung atas masih berjari-jari ${ujungAtas.toFixed(4)} m terhadap ${tengah.toFixed(4)} m di tengah — ujungnya belum menutup`,
  )

  // Tutup memanjangkan bentuk ke luar, bukan memakan ke dalam: rentang
  // vertikalnya harus MELEBIHI versi terbuka di kedua arah.
  const rentang = (m: typeof tertutup) => {
    let lo = Infinity, hi = -Infinity
    for (let i = 1; i < m.posisi.length; i += 3) { lo = Math.min(lo, m.posisi[i]); hi = Math.max(hi, m.posisi[i]) }
    return { lo, hi }
  }
  const rt = rentang(tertutup), rb = rentang(terbuka)
  assert.ok(rt.lo < rb.lo && rt.hi > rb.hi, 'tutup ujung tidak memanjang ke luar bentuk aslinya')

  // Tetap geometri yang sah.
  const titik = tertutup.posisi.length / 3
  for (const idx of tertutup.indeks) assert.ok(idx < titik, 'indeks mesh bertutup di luar batas')
  for (const v of tertutup.posisi) assert.ok(Number.isFinite(v), 'mesh bertutup memuat nilai bukan bilangan')

  // Bawaan tetap TERBUKA.
  assert.equal(
    bangunMeshTubuh(bentuk.lengan, { segmen: 24, sisipan: 3 }).jumlahCincin,
    terbuka.jumlahCincin,
    'tutup ujung menyala tanpa diminta',
  )

  // KENDALI PER-UJUNG. Batang tubuh butuh ubun-ubun membulat tetapi
  // selangkangannya HARUS tetap terbuka: di situlah tungkai menyambung, dan
  // menutupnya akan menyisipkan kubah di dalam panggul.
  const hanyaAtas = bangunMeshTubuh(bentuk.penampang, { segmen: 24, sisipan: 3, tutupAtas: true })
  const polos = bangunMeshTubuh(bentuk.penampang, { segmen: 24, sisipan: 3 })
  const bawahnya = (m: typeof polos) => {
    let lo = Infinity
    for (let i = 1; i < m.posisi.length; i += 3) lo = Math.min(lo, m.posisi[i])
    return lo
  }
  const atasnya = (m: typeof polos) => {
    let hi = -Infinity
    for (let i = 1; i < m.posisi.length; i += 3) hi = Math.max(hi, m.posisi[i])
    return hi
  }
  assert.ok(
    Math.abs(bawahnya(hanyaAtas) - bawahnya(polos)) < 1e-9,
    'tutupAtas ikut mengubah ujung bawah — selangkangan tidak lagi terbuka untuk tungkai',
  )
  assert.ok(
    atasnya(hanyaAtas) > atasnya(polos),
    'tutupAtas tidak membulatkan ubun-ubun',
  )
  // Dan ubun-ubunnya benar-benar mengecil, bukan sekadar lebih tinggi.
  const jariPuncak = (() => {
    let maks = 0
    const r = hanyaAtas.jumlahCincin - 1
    for (let s = 0; s < hanyaAtas.titikPerCincin; s++) {
      const i = (r * hanyaAtas.titikPerCincin + s) * 3
      maks = Math.max(maks, Math.hypot(hanyaAtas.posisi[i], hanyaAtas.posisi[i + 2]))
    }
    return maks
  })()
  assert.ok(jariPuncak < 0.01, `cincin ubun-ubun masih berjari-jari ${jariPuncak.toFixed(4)} m — kepala tetap terpotong rata`)

  // BENTUK TENGKORAK, bukan hanya tutupnya.
  //
  // Asersi di atas memeriksa cincin SETELAH ditutup, dan cincin itu selalu
  // kecil berapa pun bentuk kepalanya — jadi ia tidak dapat menangkap
  // tengkorak berbentuk kerucut. Yang menentukan adalah seberapa curam kepala
  // menyusut SEBELUM ditutup: kubah di atas kerucut tetap terbaca sebagai
  // kerucut. Tengkorak membulat menyisakan mahkota yang masih lebar; versi
  // pertama menyusut dari 0.050H ke 0.012H (24%) dan tampak lancip.
  const kepala = bentuk.penampang.filter((p) => p.nama.startsWith('kepala') || p.nama === 'puncak-kepala')
  assert.ok(kepala.length >= 3, 'kepala hanya punya sedikit penampang, bentuknya tidak dapat diperiksa')
  const terlebar = Math.max(...kepala.map((p) => p.a))
  const mahkota = bentuk.penampang.find((p) => p.nama === 'puncak-kepala')!
  assert.ok(
    mahkota.a / terlebar > 0.40,
    `mahkota hanya ${((mahkota.a / terlebar) * 100).toFixed(0)}% dari lebar kepala terbesar — tengkorak menyusut seperti kerucut dan ubun-ubun akan tampak lancip`,
  )
}

// ── PERAWAKAN ACUAN: penyebut saat menskalakan geometri manusia terbitan.
//
// Angkanya harus tetap berupa nilai ICRP 89 yang diterbitkan, bukan konstanta
// yang nyaman. Ditulis ulang di sini dengan tangan supaya menggeser konstanta
// di modulnya tidak ikut menggeser ujinya.
{
  assert.ok(
    Math.abs(IMT_ACUAN_ICRP89 - 73 / 1.76 ** 2) < 1e-12,
    `IMT acuan ${IMT_ACUAN_ICRP89} bukan 73 kg / (1,76 m)^2 — perawakan acuan menyimpang dari ICRP 89`,
  )
  assert.ok(
    IMT_ACUAN_ICRP89 > 22 && IMT_ACUAN_ICRP89 < 25,
    `IMT acuan ${IMT_ACUAN_ICRP89} di luar perawakan dewasa lazim`,
  )

  // Volume tumbuh dengan kuadrat tinggi pada IMT tetap, dan harus mendarat di
  // kisaran manusia: sekitar 0,07 m3 untuk orang 1,76 m.
  const v176 = volumeAcuanPerawakanM3(1.76)
  assert.ok(
    Math.abs(v176 - 73 / (DENSITAS_TUBUH_LAZIM * 1000)) < 1e-12,
    `volume acuan pada 1,76 m adalah ${v176} m3, bukan 73 kg dibagi densitas lazim`,
  )
  assert.ok(v176 > 0.06 && v176 < 0.08, `volume acuan ${v176} m3 bukan ukuran tubuh manusia`)

  const v352 = volumeAcuanPerawakanM3(3.52)
  assert.ok(
    Math.abs(v352 / v176 - 4) < 1e-9,
    'volume acuan tidak tumbuh dengan kuadrat tinggi pada IMT tetap',
  )

  for (const buruk of [0, -1.7, NaN, Infinity]) {
    assert.throws(
      () => volumeAcuanPerawakanM3(buruk),
      /tidak dapat dipakai/,
      `tinggi acuan ${buruk} tidak ditolak`,
    )
  }

  // Orang berperawakan acuan harus menghasilkan skala lingkar sekitar 1:
  // geometri terbitan tidak boleh dikembang-kempiskan tanpa alasan.
  const acuan = selesaikanBentukTubuh({ tinggiCm: 176, massaKg: 73 })
  const kAcuan = skalaLingkarUntukVolume(volumeAcuanPerawakanM3(1.76), acuan.volumeSasaranM3)
  assert.ok(
    kAcuan !== null && Math.abs(kAcuan - 1) < 1e-6,
    `orang berperawakan acuan justru diskalakan ${kAcuan}, bukan 1`,
  )

  // Dan arah simpangannya harus benar: lebih berat -> lebih besar lingkarnya.
  const kRingan = skalaLingkarUntukVolume(
    volumeAcuanPerawakanM3(1.76),
    selesaikanBentukTubuh({ tinggiCm: 176, massaKg: 60 }).volumeSasaranM3,
  )
  const kBerat = skalaLingkarUntukVolume(
    volumeAcuanPerawakanM3(1.76),
    selesaikanBentukTubuh({ tinggiCm: 176, massaKg: 88 }).volumeSasaranM3,
  )
  assert.ok(kRingan !== null && kRingan < 1, `orang 60 kg pada 176 cm diskalakan ${kRingan}, tidak mengecil`)
  assert.ok(kBerat !== null && kBerat > 1, `orang 88 kg pada 176 cm diskalakan ${kBerat}, tidak membesar`)
}

// ── Skala lingkar untuk geometri terbitan, dan GAGAL-TERTUTUPnya.
{
  // Volume tumbuh dengan kuadrat skala lingkar: sasaran 4x acuan -> k = 2.
  // Tetapi 2 berada di luar pita manusia yang wajar, jadi harus ditolak.
  assert.equal(skalaLingkarUntukVolume(1, 4), null, 'skala 2.0 yang mustahil tidak ditolak')

  const k = skalaLingkarUntukVolume(0.070, 0.070 * 1.21) // k = 1.1
  assert.ok(k !== null && Math.abs(k - 1.1) < 1e-9, `skala lingkar ${k} bukan 1.1`)

  // Volume acuan rusak atau kosong tidak boleh menghasilkan angka apa pun.
  for (const buruk of [0, -1, NaN, Infinity]) {
    assert.equal(skalaLingkarUntukVolume(buruk, 0.07), null, `volume acuan ${buruk} tidak ditolak`)
    assert.equal(skalaLingkarUntukVolume(0.07, buruk), null, `volume sasaran ${buruk} tidak ditolak`)
  }

  // Rentang manusia nyata harus DITERIMA seluruhnya: dari orang sangat kurus
  // sampai sangat berat, pada tinggi ekstrem sekalipun, geometri terbitan tetap
  // harus dapat diproporsikan alih-alih jatuh ke sosok parametrik.
  for (const [tinggiCm, massaKg] of [[145, 38], [163, 57], [176, 73], [180, 110], [196, 120]] as const) {
    const orang = selesaikanBentukTubuh({ tinggiCm, massaKg })
    const kOrang = skalaLingkarUntukVolume(volumeAcuanPerawakanM3(tinggiCm / 100), orang.volumeSasaranM3)
    assert.ok(
      kOrang !== null,
      `${tinggiCm} cm / ${massaKg} kg ditolak — orang nyata tidak mendapat geometri manusia terbitan`,
    )
  }
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
