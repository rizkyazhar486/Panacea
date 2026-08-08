// ─────────────────────────────────────────────────────────────────────────────
// Pelacak klinis yang berdiri sendiri: saturasi oksigen, hasil EKG, jet lag,
// kehamilan, dan fisiologi kursi roda.
//
// Semua di sini memakai masukan yang dicatat sendiri, bukan ekspor jam tangan,
// sehingga tetap bekerja pada perangkat apa pun.
//
// SATU GARIS YANG TIDAK DILANGGAR: modul ini MENCATAT dan MENJELASKAN, tetapi
// tidak MENAFSIRKAN rekaman mentah. Untuk EKG, yang disimpan adalah klasifikasi
// yang sudah dikeluarkan alat berizin (Irama Sinus / Fibrilasi Atrium / Tidak
// Meyakinkan) beserta gejala yang menyertainya — bukan pembacaan gelombang oleh
// perhitungan di sini. Membaca EKG adalah wilayah alat kesehatan berizin dan
// tenaga medis, dan menirunya akan berbahaya justru ketika hasilnya salah.
//
// Nilai yang mengarah ke keputusan klinis selalu disertai tanda bahaya dan
// anjuran memeriksakan diri, bukan sekadar angka.
// ─────────────────────────────────────────────────────────────────────────────

// ═══ 1. SATURASI OKSIGEN ════════════════════════════════════════════════════

export interface BacaanSpo2 {
  waktu: string
  spo2: number
  /** Denyut saat pengukuran, bila alat menampilkannya. */
  nadi?: number
  konteks: 'istirahat' | 'tidur' | 'aktivitas' | 'ketinggian'
  ketinggianM?: number
  catatan?: string
}

export interface AnalisisSpo2 {
  terakhir: BacaanSpo2 | null
  rerata: number | null
  terendah: number | null
  jumlah: number
  band: 'normal' | 'perhatian' | 'rendah' | 'takAda'
  arti: string
  tandaBahaya: string[]
  batasKetinggian: string | null
}

/**
 * Rentang rujukan saturasi pada orang sehat di dataran rendah adalah 95-100%.
 *
 * Dua hal yang membuat angka ini sering disalahartikan, dan keduanya
 * dinyatakan terang-terangan:
 *
 *   1. Saturasi TURUN secara wajar di ketinggian. 90% di 2500 m bukan hal yang
 *      sama dengan 90% di permukaan laut.
 *   2. Alat di jam tangan dan oksimeter jari BUKAN alat diagnostik. Ia meleset
 *      beberapa persen, dan meleset lebih besar pada kulit gelap, jari dingin,
 *      cat kuku, serta gerakan. Angka rendah yang sendirian tanpa gejala paling
 *      sering merupakan kesalahan pengukuran.
 */
export function analisisSpo2(bacaan: BacaanSpo2[]): AnalisisSpo2 {
  const urut = [...bacaan].sort((a, b) => Date.parse(b.waktu) - Date.parse(a.waktu))
  const terakhir = urut[0] ?? null
  const nilai = urut.map((b) => b.spo2).filter((v) => v > 0 && v <= 100)

  if (!nilai.length) {
    return { terakhir: null, rerata: null, terendah: null, jumlah: 0, band: 'takAda',
      arti: 'Belum ada bacaan tercatat.', tandaBahaya: [], batasKetinggian: null }
  }

  const rerata = +(nilai.reduce((a, b) => a + b, 0) / nilai.length).toFixed(1)
  const terendah = Math.min(...nilai)
  const v = terakhir!.spo2
  const diKetinggian = (terakhir!.ketinggianM ?? 0) >= 1500

  const band: AnalisisSpo2['band'] = v >= 95 ? 'normal' : v >= 91 ? 'perhatian' : 'rendah'

  const arti = band === 'normal'
    ? 'Dalam rentang rujukan orang sehat di dataran rendah (95-100%).'
    : band === 'perhatian'
      ? diKetinggian
        ? 'Di bawah 95%, namun Anda berada di ketinggian — penurunan ini wajar terjadi di sana.'
        : 'Sedikit di bawah rentang rujukan. Bila Anda merasa sehat, ulangi pengukuran dengan tangan hangat dan diam; angka rendah sendirian tanpa gejala paling sering merupakan kesalahan pengukuran.'
      : 'Jelas di bawah rentang rujukan. Ulangi pengukuran; bila tetap rendah DAN disertai gejala, ini perlu diperiksakan hari itu juga.'

  const tandaBahaya = band === 'normal' ? [] : [
    'Sesak napas yang baru maupun memberat',
    'Nyeri dada',
    'Bibir maupun ujung jari kebiruan',
    'Bingung, sangat mengantuk, maupun sulit dibangunkan',
    'Napas cepat saat istirahat',
  ]

  return {
    terakhir, rerata, terendah, jumlah: nilai.length, band, arti, tandaBahaya,
    batasKetinggian: diKetinggian
      ? `Bacaan diambil pada ${terakhir!.ketinggianM} m. Di ketinggian, saturasi memang lebih rendah — sekitar 90-94% di 2500 m sudah lazim pada orang sehat, dan rentang 95-100% tidak berlaku di sana.`
      : null,
  }
}

/** Alasan tersering pembacaan rendah yang keliru — diperiksa sebelum panik. */
export const SEBAB_SPO2_KELIRU: string[] = [
  'Jari dingin maupun peredaran darah tangan yang menurun',
  'Gerakan saat pengukuran, termasuk menggigil',
  'Cat kuku, kuku palsu, maupun kuku yang sangat tebal',
  'Jam tangan yang longgar maupun terlalu jauh dari pergelangan',
  'Cahaya terang yang masuk di antara sensor dan kulit',
  'Pengukuran pada kulit gelap cenderung sedikit lebih tinggi daripada keadaan sebenarnya, sehingga penurunan nyata bisa terlewat',
]

// ═══ 2. CATATAN HASIL EKG ═══════════════════════════════════════════════════

export type KlasifikasiEkg = 'sinus' | 'afib' | 'tidakMeyakinkan' | 'nadiTinggi' | 'nadiRendah' | 'lainnya'

export interface CatatanEkg {
  waktu: string
  klasifikasi: KlasifikasiEkg
  nadi?: number
  gejala: string[]
  catatan?: string
}

export interface InfoEkg {
  label: string
  arti: string
  langkah: string
  warna: string
}

/**
 * Penjelasan tiap klasifikasi yang dikeluarkan alat.
 *
 * Perhatikan bahwa tidak ada satu pun yang menafsirkan gelombang: yang
 * dijelaskan adalah arti label yang SUDAH diberikan alat berizin, dan apa yang
 * sebaiknya dilakukan dengan label itu.
 */
export const INFO_EKG: Record<KlasifikasiEkg, InfoEkg> = {
  sinus: {
    label: 'Irama sinus',
    arti: 'Alat menilai irama jantung teratur dan berasal dari pemacu alami jantung, pada laju 50-100 kali per menit selama perekaman itu.',
    langkah: 'Tidak perlu tindakan bila Anda tidak bergejala. Perlu disadari, rekaman ini hanya menggambarkan 30 detik itu saja — gangguan irama yang hilang-timbul bisa saja terlewat sepenuhnya.',
    warna: '#34d399',
  },
  afib: {
    label: 'Fibrilasi atrium',
    arti: 'Alat menemukan pola tidak teratur yang menyerupai fibrilasi atrium, yaitu irama tidak teratur yang berasal dari serambi jantung.',
    langkah: 'PERLU DITINDAKLANJUTI dengan pemeriksaan langsung, meskipun Anda merasa sehat. Fibrilasi atrium meningkatkan risiko stroke dan sering tidak terasa. Simpan berkas PDF rekamannya dari aplikasi Health dan bawa saat berobat — dokter akan menilai rekamannya sendiri, bukan labelnya.',
    warna: '#f87171',
  },
  tidakMeyakinkan: {
    label: 'Tidak meyakinkan',
    arti: 'Alat tidak dapat menggolongkan rekaman ini. Penyebab tersering adalah gerakan, sentuhan yang tidak rapat, kulit kering, maupun denyut di luar rentang yang bisa dinilai alat.',
    langkah: 'Ulangi rekaman dengan lengan disangga meja, tubuh diam, dan kulit sedikit dilembapkan. Bila berulang kali tidak meyakinkan DAN Anda bergejala, periksakan diri — jangan menunggu alat memberi label.',
    warna: '#fbbf24',
  },
  nadiTinggi: {
    label: 'Denyut tinggi',
    arti: 'Denyut di atas 100 saat perekaman, sehingga alat tidak menilai iramanya.',
    langkah: 'Bila Anda baru bergerak, cemas, demam, maupun minum kopi, ini lazim. Ulangi setelah tenang beberapa menit. Bila denyut tetap tinggi saat benar-benar istirahat dan disertai gejala, periksakan diri.',
    warna: '#fbbf24',
  },
  nadiRendah: {
    label: 'Denyut rendah',
    arti: 'Denyut di bawah 50 saat perekaman, sehingga alat tidak menilai iramanya.',
    langkah: 'Pada orang terlatih, denyut istirahat rendah lazim dan bukan masalah. Menjadi penting bila disertai rasa melayang, pingsan, maupun mudah lelah yang tidak biasa — dan pada pemakai obat pelambat denyut seperti penyekat beta.',
    warna: '#fbbf24',
  },
  lainnya: {
    label: 'Hasil lain',
    arti: 'Klasifikasi lain yang dikeluarkan alat.',
    langkah: 'Simpan berkas PDF-nya dan tunjukkan saat berobat.',
    warna: '#94a3b8',
  },
}

export const GEJALA_EKG: string[] = [
  'Berdebar', 'Nyeri dada', 'Sesak napas', 'Pusing berputar', 'Hampir pingsan', 'Pingsan',
  'Mudah lelah tidak biasa', 'Tidak ada gejala',
]

export interface RingkasEkg {
  total: number
  perKlasifikasi: { k: KlasifikasiEkg; jumlah: number }[]
  adaAfib: boolean
  bergejalaSaatAfib: boolean
  saran: string
  darurat: boolean
}

export function ringkasEkg(catatan: CatatanEkg[]): RingkasEkg {
  const hitung = new Map<KlasifikasiEkg, number>()
  for (const c of catatan) hitung.set(c.klasifikasi, (hitung.get(c.klasifikasi) ?? 0) + 1)

  const afibList = catatan.filter((c) => c.klasifikasi === 'afib')
  const bergejala = afibList.some((c) => c.gejala.some((g) => g !== 'Tidak ada gejala'))
  // Gejala yang menuntut pertolongan segera, apa pun label alatnya.
  const gejalaBerat = ['Nyeri dada', 'Pingsan', 'Hampir pingsan', 'Sesak napas']
  const darurat = catatan.some((c) => c.gejala.some((g) => gejalaBerat.includes(g)))

  const saran = darurat
    ? 'Ada rekaman yang disertai nyeri dada, sesak, maupun pingsan. Gejala seperti itu perlu dinilai segera, TERLEPAS dari apa pun label yang diberikan alat — alat ini tidak dirancang untuk mengenali serangan jantung.'
    : afibList.length > 0
      ? `Tercatat ${afibList.length} rekaman berlabel fibrilasi atrium. Bawa berkas PDF-nya saat berobat; yang paling berguna bagi dokter adalah pola waktunya, bukan angkanya.`
      : catatan.length > 0
        ? 'Belum ada rekaman berlabel fibrilasi atrium. Tetap simpan riwayat ini — pola dari waktu ke waktu jauh lebih berguna daripada satu rekaman.'
        : 'Belum ada rekaman tersimpan.'

  return {
    total: catatan.length,
    perKlasifikasi: [...hitung.entries()].map(([k, jumlah]) => ({ k, jumlah })).sort((a, b) => b.jumlah - a.jumlah),
    adaAfib: afibList.length > 0,
    bergejalaSaatAfib: bergejala,
    saran, darurat,
  }
}

// ═══ 3. PENASIHAT JET LAG ═══════════════════════════════════════════════════

export interface RencanaJetLag {
  bedaJam: number
  arah: 'maju' | 'mundur' | 'tidakAda'
  perkiraanHariPulih: number
  ringkas: string
  /** Rencana harian sebelum dan sesudah terbang. */
  langkah: { hari: string; isi: string[] }[]
  catatan: string[]
}

/**
 * Adjustment plan jam biologis dari zona waktu asal dan tujuan.
 *
 * Dua hal yang menentukan dan sering terbalik dilakukan orang:
 *
 *   1. Terbang KE TIMUR menuntut jam tubuh MAJU, dan itu lebih sulit karena
 *      jam bawaan manusia sedikit lebih panjang daripada 24 jam. Terbang ke
 *      barat menuntut jam MUNDUR, dan itu lebih mudah.
 *   2. Cahaya adalah pengatur terkuat, tetapi WAKTUNYA menentukan arah: cahaya
 *      setelah titik suhu tubuh terendah memajukan jam, sedangkan cahaya
 *      sebelum titik itu justru memundurkannya. Salah waktu berarti memperparah,
 *      bukan memperbaiki.
 *
 * Titik suhu terendah diperkirakan sekitar dua jam sebelum bangun alami.
 */
export function rencanaJetLag(opsi: {
  tzAsal: number
  tzTujuan: number
  jamBangunBiasa: string
  hariPersiapan?: number
}): RencanaJetLag {
  const beda = opsi.tzTujuan - opsi.tzAsal
  // Normalkan ke rentang −12..+12; terbang 20 jam ke timur = 4 jam ke barat.
  let bedaJam = beda
  while (bedaJam > 12) bedaJam -= 24
  while (bedaJam < -12) bedaJam += 24

  const arah = bedaJam === 0 ? 'tidakAda' : bedaJam > 0 ? 'maju' : 'mundur'
  const abs = Math.abs(bedaJam)
  // Ke timur sekitar satu hari per jam; ke barat lebih cepat.
  const perkiraanHariPulih = arah === 'tidakAda' ? 0 : Math.ceil(abs / (arah === 'maju' ? 1 : 1.5))

  const [jamB, menitB] = (opsi.jamBangunBiasa.match(/^(\d{1,2}):(\d{2})$/) ?? [, '7', '00']).slice(1).map(Number)
  const bangunMin = (jamB ?? 7) * 60 + (menitB ?? 0)
  const fmt = (m: number) => {
    const x = ((m % 1440) + 1440) % 1440
    return `${String(Math.floor(x / 60)).padStart(2, '0')}.${String(x % 60).padStart(2, '0')}`
  }
  const titikTerendah = bangunMin - 120

  const catatan: string[] = []
  const langkah: { hari: string; isi: string[] }[] = []

  if (arah === 'tidakAda') {
    return { bedaJam: 0, arah, perkiraanHariPulih: 0,
      ringkas: 'Tidak ada perbedaan zona waktu — tidak perlu penyesuaian.', langkah: [], catatan: [] }
  }

  const hariSiap = Math.min(opsi.hariPersiapan ?? 3, 4)
  const geserPerHari = arah === 'maju' ? 60 : 90 // menit; ke barat boleh lebih besar

  for (let d = hariSiap; d >= 1; d--) {
    const geser = (hariSiap - d + 1) * geserPerHari * (arah === 'maju' ? -1 : 1)
    langkah.push({
      hari: `H−${d} (sebelum terbang)`,
      isi: [
        `Tidur dan bangun ${Math.abs(geser) / 60} jam lebih ${arah === 'maju' ? 'awal' : 'lambat'} daripada biasa (bangun sekitar pukul ${fmt(bangunMin + geser)}).`,
        arah === 'maju'
          ? `Cari cahaya terang segera setelah bangun, dan REDUPKAN cahaya pada malam hari — cahaya malam akan menarik jam Anda ke arah yang salah.`
          : `Cari cahaya terang pada sore dan malam hari, dan hindari cahaya terang pagi-pagi sekali.`,
      ],
    })
  }

  langkah.push({
    hari: 'Hari penerbangan',
    isi: [
      'Segera setelah naik pesawat, ubah jam tangan ke waktu tujuan dan mulai berpikir dalam waktu itu.',
      'Tidur di pesawat hanya bila saat itu malam di tempat tujuan. Bila di tujuan sedang siang, tetap terjaga meskipun mengantuk.',
      'Minum air cukup. Hindari alkohol — ia memperburuk kualitas tidur dan memperlambat penyesuaian.',
      'Kafein boleh dipakai untuk bertahan terjaga, tetapi hentikan setidaknya 8 jam sebelum waktu tidur di tujuan.',
    ],
  })

  for (let d = 1; d <= Math.min(perkiraanHariPulih, 5); d++) {
    langkah.push({
      hari: `H+${d} (di tujuan)`,
      isi: [
        arah === 'maju'
          ? 'Keluar ruangan untuk mendapat cahaya terang pada pagi hari waktu setempat, dan pakai kacamata hitam bila terpaksa keluar sebelum subuh.'
          : 'Cari cahaya terang pada sore hari waktu setempat, dan hindari tidur sore yang panjang.',
        'Makan mengikuti jam makan setempat — jadwal makan ikut mengatur jam biologis, meskipun lebih lemah daripada cahaya.',
        'Bila sangat mengantuk, tidur singkat maksimal 20-30 menit dan tidak lewat pukul 15.00 waktu setempat.',
        d === 1 ? 'Turunkan intensitas latihan pada hari pertama; koordinasi dan penilaian usaha ikut terganggu.' : 'Latihan boleh dinaikkan bertahap sesuai rasa.',
      ],
    })
  }

  catatan.push(
    arah === 'maju'
      ? 'Ke timur berarti jam tubuh harus MAJU, dan ini arah yang lebih sulit karena jam bawaan manusia sedikit lebih panjang daripada 24 jam.'
      : 'Ke barat berarti jam tubuh MUNDUR, dan ini arah yang lebih mudah — biasanya pulih sekitar satu setengah kali lebih cepat.',
    `Perkiraan titik suhu tubuh terendah Anda sekitar pukul ${fmt(titikTerendah)} waktu asal. Cahaya SESUDAH titik itu memajukan jam; cahaya SEBELUMNYA memundurkannya. Inilah sebabnya waktu berjemur lebih menentukan daripada lamanya.`,
    'Melatonin dipakai sebagian orang untuk membantu penyesuaian, namun dosis dan waktunya berbeda menurut arah perjalanan dan tidak seragam antarorang — bicarakan dengan dokter maupun apoteker sebelum memakainya, terlebih bila Anda memakai obat lain.',
  )

  return {
    bedaJam, arah, perkiraanHariPulih,
    ringkas: `Beda ${abs} jam ke ${arah === 'maju' ? 'timur' : 'barat'}. Perkiraan pulih sekitar ${perkiraanHariPulih} hari bila cahaya diatur; tanpa pengaturan cahaya bisa lebih lama.`,
    langkah, catatan,
  }
}

// ═══ 4. KEHAMILAN & AKTIVITAS ═══════════════════════════════════════════════

export interface StatusKehamilan {
  usiaMinggu: number
  usiaHari: number
  trimester: 1 | 2 | 3
  perkiraanLahir: string
  sisaHari: number
}

/** Usia kehamilan dari hari pertama haid terakhir; perkiraan lahir 280 hari. */
export function statusKehamilan(hpht: string, sekarang = Date.now()): StatusKehamilan | null {
  const t = Date.parse(hpht)
  if (Number.isNaN(t) || t > sekarang) return null
  const hari = Math.floor((sekarang - t) / 86_400_000)
  if (hari > 320) return null
  const minggu = Math.floor(hari / 7)
  const trimester: 1 | 2 | 3 = minggu < 14 ? 1 : minggu < 28 ? 2 : 3
  const lahir = new Date(t + 280 * 86_400_000)
  return {
    usiaMinggu: minggu,
    usiaHari: hari % 7,
    trimester,
    perkiraanLahir: lahir.toISOString().slice(0, 10),
    sisaHari: Math.max(0, Math.round((+lahir - sekarang) / 86_400_000)),
  }
}

export interface PanduanOlahragaHamil {
  anjuran: string[]
  hindari: string[]
  tandaBerhenti: string[]
  catatanTrimester: string
  kontraindikasiMutlak: string[]
}

/**
 * Panduan aktivitas dalam kehamilan.
 *
 * Denyut jantung SENGAJA tidak dipakai sebagai patokan intensitas: denyut
 * istirahat meningkat dalam kehamilan dan tanggapannya terhadap beban berubah,
 * sehingga zona berbasis denyut menjadi menyesatkan. Yang dipakai adalah uji
 * bicara — jauh lebih andal pada keadaan ini.
 */
export function panduanOlahragaHamil(trimester: 1 | 2 | 3): PanduanOlahragaHamil {
  const catatanTrimester = trimester === 1
    ? 'Trimester pertama: mual dan lelah sering menjadi penghalang terbesar, bukan olahraganya. Aktivitas ringan justru sering mengurangi keluhan. Suhu tubuh yang terlalu tinggi dihindari pada masa ini.'
    : trimester === 2
      ? 'Trimester kedua: umumnya masa paling nyaman untuk beraktivitas. Mulai hindari berbaring telentang lama karena rahim dapat menekan pembuluh darah besar dan menimbulkan rasa melayang.'
      : 'Trimester ketiga: pusat berat badan berpindah sehingga keseimbangan menurun. Utamakan aktivitas dengan tumpuan stabil seperti berjalan, berenang, dan sepeda statis.'

  return {
    catatanTrimester,
    anjuran: [
      'Sasaran umum sekitar 150 menit aktivitas intensitas sedang per pekan, dibagi ke beberapa hari.',
      'Ukur intensitas dengan UJI BICARA, bukan dengan denyut jantung: intensitas sedang berarti masih bisa berbicara dalam kalimat penuh. Denyut jantung berubah dalam kehamilan sehingga zona denyut menjadi menyesatkan.',
      'Strength training ringan sampai sedang bermanfaat dan aman pada kehamilan tanpa penyulit.',
      'Latihan otot dasar panggul membantu pemulihan setelah melahirkan dan mengurangi keluhan kebocoran kencing.',
      'Minum cukup dan hindari berolahraga pada suhu maupun kelembapan yang tinggi.',
      'Berjalan, berenang, sepeda statis, dan senam hamil merupakan pilihan dengan risiko paling rendah.',
    ],
    hindari: [
      'Olahraga dengan risiko benturan maupun jatuh: bela diri kontak, sepak bola, bola basket, berkuda, ski, sepeda di jalan ramai maupun medan sulit',
      'Menyelam (scuba)',
      'Aktivitas di ketinggian lebih dari 2500 m bila belum terbiasa',
      'Berbaring telentang lama setelah trimester pertama',
      'Sauna, bak air panas, dan hot yoga — suhu inti yang tinggi tidak dianjurkan',
      'Menahan napas saat mengangkat beban',
    ],
    tandaBerhenti: [
      'Perdarahan dari jalan lahir',
      'Nyeri perut maupun kontraksi teratur yang menetap',
      'Keluar cairan dari jalan lahir',
      'Sesak napas sebelum beraktivitas',
      'Nyeri dada',
      'Pusing berputar maupun hampir pingsan yang menetap',
      'Nyeri kepala hebat',
      'Kelemahan otot yang mengganggu keseimbangan',
      'Nyeri maupun bengkak pada betis',
      'Gerakan janin berkurang',
    ],
    kontraindikasiMutlak: [
      'Penyakit jantung maupun paru yang bermakna',
      'Serviks yang lemah maupun sudah dijahit',
      'Kehamilan kembar dengan risiko kelahiran prematur',
      'Perdarahan menetap pada trimester kedua maupun ketiga',
      'Plasenta previa setelah 26 minggu',
      'History maupun ancaman persalinan prematur pada kehamilan ini',
      'Ketuban pecah dini',
      'Preeklamsia maupun hipertensi dalam kehamilan yang tidak terkendali',
      'Anemia berat',
    ],
  }
}

export const DISCLAIMER_HAMIL =
  'Panduan ini bersifat umum untuk kehamilan TANPA penyulit. Kehamilan Anda perlu dinilai sendiri oleh bidan maupun dokter yang merawat sebelum memulai maupun melanjutkan program latihan, terutama bila ada keadaan pada daftar kontraindikasi. Bila muncul salah satu tanda berhenti, hentikan aktivitas dan hubungi tenaga kesehatan.'

// ═══ 5. FISIOLOGI KURSI RODA ════════════════════════════════════════════════

export interface ZonaDorong {
  z: number
  nama: string
  pctHrPuncak: [number, number]
  tujuan: string
}

/**
 * Zona untuk olahraga lengan atas.
 *
 * Denyut jantung puncak pada olahraga lengan lebih RENDAH daripada pada
 * olahraga kaki — massa otot yang bekerja lebih kecil — sehingga memakai
 * HRmaks hasil tes berlari maupun rumus 220−usia akan membuat setiap zona
 * terbaca terlalu ringan. Zona di sini dinyatakan terhadap denyut puncak yang
 * diamati SAAT MENDORONG, bukan terhadap HRmaks umum.
 */
export const ZONA_DORONG: ZonaDorong[] = [
  { z: 1, nama: 'Pemulihan', pctHrPuncak: [50, 60], tujuan: 'Mendorong santai, melancarkan peredaran darah.' },
  { z: 2, nama: 'Ketahanan', pctHrPuncak: [60, 70], tujuan: 'Basis aerobik. Bagian terbesar volume mingguan ada di sini.' },
  { z: 3, nama: 'Tempo', pctHrPuncak: [70, 80], tujuan: 'Menengah, terasa berat namun terkendali.' },
  { z: 4, nama: 'Ambang', pctHrPuncak: [80, 90], tujuan: 'Interval 5-10 menit untuk menaikkan ambang.' },
  { z: 5, nama: 'Maksimal', pctHrPuncak: [90, 100], tujuan: 'Sprint dan interval pendek.' },
]

export interface PanduanKursiRoda {
  zona: { z: number; nama: string; dari: number; sampai: number; tujuan: string }[]
  bahu: { judul: string; isi: string }[]
  catatan: string[]
}

export function panduanKursiRoda(hrPuncakDorong: number): PanduanKursiRoda {
  const zona = ZONA_DORONG.map((z) => ({
    z: z.z, nama: z.nama, tujuan: z.tujuan,
    dari: Math.round((hrPuncakDorong * z.pctHrPuncak[0]) / 100),
    sampai: Math.round((hrPuncakDorong * z.pctHrPuncak[1]) / 100),
  }))

  return {
    zona,
    bahu: [
      {
        judul: 'Bahu adalah sendi yang menanggung segalanya',
        isi: 'Pada pengguna kursi roda, bahu dipakai untuk berpindah, mendorong, dan menahan berat badan — pekerjaan yang pada orang lain dibagi ke tungkai. Karena itu nyeri bahu sangat sering terjadi, dan menjaganya bukan tambahan melainkan bagian inti program.',
      },
      {
        judul: 'Kuatkan otot penarik, bukan hanya pendorong',
        isi: 'Mendorong melatih dada dan bagian depan bahu. Bila hanya itu yang dilatih, ketidakseimbangan bertambah dan bahu makin tertarik ke depan. Latihan menarik — row, face pull, retraksi belikat — adalah penyeimbang yang paling menentukan.',
      },
      {
        judul: 'Teknik mendorong menentukan beban sendi',
        isi: 'Dorongan yang panjang dan berirama dengan tangan mengayun rendah kembali ke belakang membebani bahu lebih sedikit daripada dorongan pendek yang cepat dan berulang. Jumlah dorongan yang lebih sedikit dengan setiap dorongan lebih panjang adalah sasaran yang tepat.',
      },
      {
        judul: 'Rotator cuff dan dada',
        isi: 'Kuatkan rotator eksternal dan regangkan dada secara teratur. Pola pemendekan dada dengan pelemahan otot belakang berkembang lebih cepat pada pengguna kursi roda dibanding orang lain.',
      },
    ],
    catatan: [
      'Denyut jantung puncak pada olahraga lengan lebih rendah daripada pada olahraga kaki. Memakai rumus 220−usia akan membuat zona terbaca terlalu ringan — pakailah denyut puncak yang benar-benar Anda amati saat mendorong keras.',
      'Pada cedera saraf tulang belakang setinggi dada ke atas, denyut jantung dapat tidak naik sebagaimana mestinya karena persarafan jantung ikut terganggu. Bila demikian, denyut jantung TIDAK bisa dipakai untuk mengukur intensitas — pakai skala rasa usaha (6-20 maupun 1-10) dan uji bicara.',
      'Pengaturan suhu tubuh juga dapat terganggu pada cedera saraf tulang belakang tinggi, sehingga risiko kepanasan meningkat. Berlatih di tempat sejuk, minum cukup, dan gunakan pendinginan.',
      'Waspadai disrefleksia otonom pada cedera setinggi T6 ke atas: nyeri kepala hebat mendadak, wajah memerah, berkeringat di atas ketinggian cedera, dan tekanan darah melonjak. Ini keadaan gawat darurat — hentikan aktivitas, duduk tegak, dan cari pertolongan.',
      'Periksa kulit di daerah tumpuan secara teratur, terutama setelah menambah volume latihan.',
    ],
  }
}
