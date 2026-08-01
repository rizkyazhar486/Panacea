// ─────────────────────────────────────────────────────────────────────────────
// Lari, sepeda, dan renang — zona intensitas, kerja kecepatan, dan postur.
//
// Kenapa ketiganya diletakkan dalam satu modul: intensitas latihan pada ketiga
// cabang ini diatur oleh satu prinsip yang sama — ambang laktat — namun
// SATUANNYA BERBEDA, dan itulah sumber kebingungan yang paling sering.
// Lari diukur dengan pace, sepeda dengan daya (watt), renang dengan waktu per
// 100 meter. Menyamakan "zona 3" antar cabang tanpa mengukur ulang ambangnya
// masing-masing menghasilkan latihan yang salah intensitas.
//
// Sisi postur ketiganya juga berlawanan, dan ini jarang dijelaskan:
//   • RENANG adalah satu-satunya yang secara langsung MEMPERBAIKI postur —
//     gerakannya menarik lengan ke belakang, membuka dada, dan menguatkan
//     punggung atas.
//   • SEPEDA adalah yang paling MERUSAK postur bila tanpa penyesuaian —
//     berjam-jam dalam posisi punggung membungkuk dengan leher mendongak
//     memperkuat persis pola yang ingin diperbaiki.
//   • LARI bersifat netral; pengaruhnya bergantung pada posisi badan dan
//     kecepatan langkah.
//
// Seluruh perhitungan berjalan offline.
// ─────────────────────────────────────────────────────────────────────────────

export type Sport = 'lari' | 'sepeda' | 'renang'

export interface SportProfile {
  key: Sport
  nama: string
  emoji: string
  /** Satuan yang dipakai untuk mengatur intensitas pada cabang ini. */
  satuan: string
  /** Cara mengukur ambang pada cabang ini. */
  tesAmbang: string
  bebanSendi: string
  /** Pengaruhnya terhadap postur — inilah yang paling berbeda antar cabang. */
  postur: string
  posturArah: 'memperbaiki' | 'merusak' | 'netral'
  cederaKhas: string
}

export const SPORTS: SportProfile[] = [
  {
    key: 'lari',
    nama: 'Lari',
    emoji: '🏃',
    satuan: 'Pace (menit per km)',
    tesAmbang: 'Lari 5 km maupun 10 km semaksimal mungkin; pace rata-ratanya dipakai sebagai acuan',
    bebanSendi:
      'Paling tinggi di antara ketiganya — setiap langkah memberi beban benturan sekitar 2-3 kali berat badan pada lutut dan pergelangan kaki. Inilah sebabnya penambahan jarak harus bertahap meskipun jantung terasa masih sanggup.',
    postur:
      'Netral. Pengaruhnya bergantung pada cara berlari: badan sedikit condong ke depan dari pergelangan kaki (bukan menekuk di pinggang), pandangan ke depan alih-alih menunduk, bahu rileks dan tidak naik ke arah telinga, serta langkah sekitar 170-180 per menit. Lari dengan kepala menunduk melihat layar jam justru memperkuat postur kepala maju.',
    posturArah: 'netral',
    cederaKhas: 'Nyeri lutut depan (patellofemoral), sindrom iliotibial, plantar fasiitis, dan cedera tulang akibat beban berlebih',
  },
  {
    key: 'sepeda',
    nama: 'Sepeda',
    emoji: '🚴',
    satuan: 'Daya (watt) atau denyut jantung',
    tesAmbang:
      'Tes 20 menit semaksimal mungkin; FTP diperkirakan sebesar 95% dari daya rata-rata selama 20 menit tersebut',
    bebanSendi:
      'Paling rendah karena tidak ada benturan — pilihan yang baik bila lutut maupun pergelangan kaki sedang bermasalah, dan memungkinkan volume latihan jauh lebih besar tanpa merusak sendi.',
    postur:
      'PALING BERISIKO MERUSAK POSTUR bila tidak disesuaikan. Bersepeda menahan punggung atas dalam posisi membungkuk sambil leher mendongak untuk melihat ke depan selama berjam-jam — persis pola yang sudah dialami orang yang bekerja membungkuk, sehingga memperkuatnya alih-alih memperbaiki. Karena itu bersepeda WAJIB disertai latihan tarik dan peregangan dada, serta penyetelan sepeda yang benar.',
    posturArah: 'merusak',
    cederaKhas: 'Nyeri leher dan punggung atas, nyeri lutut depan akibat sadel terlalu rendah, kebas pada tangan dan selangkangan akibat tekanan',
  },
  {
    key: 'renang',
    nama: 'Renang',
    emoji: '🏊',
    satuan: 'Waktu per 100 meter',
    tesAmbang:
      'Tes 400 m dan 200 m semaksimal mungkin; dari selisih waktunya dihitung Critical Swim Speed sebagai perkiraan ambang',
    bebanSendi:
      'Hampir nol karena tubuh ditopang air — satu-satunya dari ketiganya yang dapat dilakukan hampir setiap hari tanpa membebani sendi, dan pilihan utama bila ada cedera tungkai maupun kelebihan berat badan.',
    postur:
      'SATU-SATUNYA YANG SECARA LANGSUNG MEMPERBAIKI POSTUR. Gaya bebas dan gaya punggung menarik lengan ke belakang melawan tahanan air, sehingga menguatkan latissimus dorsi, rhomboid, dan trapezius bawah — otot yang justru melemah akibat duduk dan berdiri membungkuk. Gerakannya juga meregangkan dada dan melatih rotasi tulang belakang dada yang biasanya kaku.',
    posturArah: 'memperbaiki',
    cederaKhas: 'Nyeri bahu (swimmer shoulder) akibat volume berlebih dan teknik yang salah, terutama bila tangan menyeberang garis tengah tubuh saat masuk air',
  },
]

// ─── Sepeda: zona daya berbasis FTP ─────────────────────────────────────────

export interface PowerZone {
  n: number
  nama: string
  pctLo: number
  pctHi: number | null
  tujuan: string
  durasi: string
  rasa: string
}

/** Zona daya klasik (kerangka Coggan), dinyatakan sebagai persen dari FTP. */
export const POWER_ZONES: PowerZone[] = [
  { n: 1, nama: 'Pemulihan aktif', pctLo: 0, pctHi: 55, tujuan: 'Mempercepat pemulihan tanpa menambah kelelahan', durasi: '30-60 menit', rasa: 'Sangat ringan, bisa mengobrol sepanjang waktu' },
  { n: 2, nama: 'Endurance', pctLo: 56, pctHi: 75, tujuan: 'Membangun basis aerobik dan kemampuan membakar lemak', durasi: '1-5 jam', rasa: 'Ringan, masih bisa berbicara kalimat penuh' },
  { n: 3, nama: 'Tempo', pctLo: 76, pctHi: 90, tujuan: 'Menaikkan efisiensi aerobik', durasi: '20-60 menit', rasa: 'Sedang, berbicara mulai terpotong' },
  { n: 4, nama: 'Ambang laktat', pctLo: 91, pctHi: 105, tujuan: 'Menaikkan ambang laktat — penentu terbesar performa', durasi: 'Blok 8-30 menit', rasa: 'Berat namun terkendali, 3-5 kata sekaligus' },
  { n: 5, nama: 'VO₂max', pctLo: 106, pctHi: 120, tujuan: 'Menaikkan kapasitas aerobik maksimal', durasi: 'Blok 3-8 menit', rasa: 'Sangat berat, hanya satu-dua kata' },
  { n: 6, nama: 'Anaerobik', pctLo: 121, pctHi: 150, tujuan: 'Kapasitas anaerobik dan toleransi laktat', durasi: 'Blok 30 detik - 3 menit', rasa: 'Sangat berat, tidak bisa berbicara' },
  { n: 7, nama: 'Neuromuskular', pctLo: 151, pctHi: null, tujuan: 'Kecepatan puncak dan perekrutan serabut otot cepat', durasi: 'Sprint 5-15 detik', rasa: 'Maksimal' },
]

/** FTP diperkirakan sebesar 95% dari daya rata-rata pada tes 20 menit. */
export function ftpFrom20Min(avgWatt: number): number | null {
  if (!(avgWatt > 0)) return null
  return Math.round(avgWatt * 0.95)
}

export function powerRange(ftp: number, z: PowerZone): [number, number | null] {
  return [Math.round((ftp * z.pctLo) / 100), z.pctHi == null ? null : Math.round((ftp * z.pctHi) / 100)]
}

/** Rasio daya terhadap berat badan — penentu utama performa saat menanjak. */
export function wattPerKg(ftp: number, beratKg: number): number | null {
  if (!(ftp > 0) || !(beratKg > 0)) return null
  return +(ftp / beratKg).toFixed(2)
}

export const WKG_BANDS: { min: number; label: string }[] = [
  { min: 5.0, label: 'Setara pesepeda kompetitif tingkat tinggi' },
  { min: 4.0, label: 'Sangat baik — setara pesepeda balap amatir kuat' },
  { min: 3.0, label: 'Baik — di atas rata-rata pesepeda rekreasi rutin' },
  { min: 2.0, label: 'Sedang — basis aerobik sudah terbentuk' },
  { min: 0, label: 'Awal — fokus pada volume zona 2 lebih dahulu' },
]

export function wkgBand(v: number): string {
  return (WKG_BANDS.find((b) => v >= b.min) ?? WKG_BANDS[WKG_BANDS.length - 1]).label
}

// ─── Renang: Critical Swim Speed ────────────────────────────────────────────

export interface SwimZone {
  nama: string
  offset: [number, number]
  tujuan: string
  contoh: string
}

/**
 * Zona renang dinyatakan sebagai selisih detik per 100 m terhadap CSS.
 * Nilai positif berarti LEBIH LAMBAT daripada CSS.
 */
export const SWIM_ZONES: SwimZone[] = [
  { nama: 'Aerobik ringan', offset: [6, 10], tujuan: 'Basis aerobik dan perbaikan teknik', contoh: '8-10 × 100 m, jeda 20 detik' },
  { nama: 'Aerobik', offset: [3, 6], tujuan: 'Daya tahan aerobik', contoh: '5-6 × 200 m, jeda 20 detik' },
  { nama: 'Ambang', offset: [-1, 2], tujuan: 'Menaikkan ambang laktat', contoh: '10-16 × 100 m, jeda 15 detik' },
  { nama: 'VO₂max', offset: [-5, -2], tujuan: 'Kapasitas aerobik maksimal', contoh: '8-12 × 50 m, jeda 20 detik' },
  { nama: 'Kecepatan', offset: [-12, -6], tujuan: 'Kecepatan puncak dan teknik pada kecepatan tinggi', contoh: '10-16 × 25 m, jeda penuh' },
]

export interface CssResult {
  /** Meter per detik. */
  css: number
  /** Detik per 100 m. */
  cssPer100: number
}

/** CSS = (400 - 200) / (waktu400 - waktu200), dalam meter per detik. */
export function criticalSwimSpeed(t400sec: number, t200sec: number): CssResult | null {
  const d = t400sec - t200sec
  if (!(d > 0) || !(t400sec > 0) || !(t200sec > 0)) return null
  const css = 200 / d
  if (!Number.isFinite(css) || css <= 0) return null
  return { css: +css.toFixed(3), cssPer100: 100 / css }
}

// ─── Kerja kecepatan lintas cabang ──────────────────────────────────────────

export interface SpeedWork {
  sport: Sport
  nama: string
  isi: string
  kapan: string
  kenapa: string
}

export const SPEED_WORK: SpeedWork[] = [
  {
    sport: 'lari',
    nama: 'Strides',
    isi: '6-8 × 20 detik pada kecepatan hampir maksimal, jeda jalan sampai pulih penuh',
    kapan: '2 kali seminggu, di akhir easy run',
    kenapa:
      'Melatih perekrutan serabut otot cepat dan memperbaiki koordinasi langkah tanpa menambah kelelahan berarti. Karena jeda diberikan sampai pulih penuh, sesi ini melatih KECEPATAN alih-alih daya tahan, dan itulah sebabnya jeda tidak boleh dipersingkat.',
  },
  {
    sport: 'lari',
    nama: 'Hill sprints',
    isi: '6-10 × 8-12 detik menanjak curam, jalan turun sebagai pemulihan',
    kapan: '1 kali seminggu',
    kenapa:
      'Tanjakan membatasi kecepatan sehingga beban benturan berkurang, namun rekrutmen otot tetap maksimal. Merupakan cara paling aman menambah kekuatan lari tanpa risiko cedera seperti pada sprint di jalan datar.',
  },
  {
    sport: 'sepeda',
    nama: 'Sprint neuromuskular',
    isi: '6-10 × 10-15 detik maksimal dari kecepatan rendah, jeda 3-5 menit',
    kapan: '1 kali seminggu',
    kenapa:
      'Melatih daya puncak dan perekrutan serabut cepat. Jeda panjang bersifat wajib — memperpendeknya mengubah sesi menjadi latihan anaerobik dan menghilangkan tujuan kecepatannya.',
  },
  {
    sport: 'sepeda',
    nama: 'Cadence drill',
    isi: '5 × 1 menit pada 110-120 putaran per menit dengan gigi ringan, jeda 2 menit',
    kapan: '1-2 kali seminggu di sela sesi ringan',
    kenapa:
      'Kecepatan mengayuh yang efisien mengurangi beban pada lutut dan memperbaiki koordinasi. Banyak pesepeda pemula mengayuh terlalu berat dan terlalu lambat, yang membebani sendi tanpa menambah kebugaran.',
  },
  {
    sport: 'renang',
    nama: 'Sprint 25 m',
    isi: '10-16 × 25 m maksimal, jeda penuh sampai napas pulih',
    kapan: '1-2 kali seminggu',
    kenapa:
      'Pada renang, kecepatan lebih ditentukan oleh teknik daripada kekuatan. Sprint pendek dengan jeda penuh memungkinkan teknik tetap terjaga pada kecepatan tinggi — begitu teknik rusak karena lelah, sesi tersebut berhenti melatih kecepatan.',
  },
  {
    sport: 'renang',
    nama: 'Latihan teknik (drill)',
    isi: 'Catch-up, single-arm, fingertip drag, dan sculling — 4 × 50 m tiap jenis',
    kapan: 'Setiap sesi, pada bagian pemanasan',
    kenapa:
      'Perbaikan teknik memberi tambahan kecepatan yang jauh lebih besar daripada penambahan kebugaran pada perenang pemula, karena sebagian besar tenaga hilang akibat hambatan air alih-alih kurangnya tenaga.',
  },
]

// ─── Penyetelan sepeda dan postur ───────────────────────────────────────────

export interface FitPoint {
  bagian: string
  patokan: string
  bilaSalah: string
}

export const BIKE_FIT: FitPoint[] = [
  {
    bagian: 'Tinggi sadel',
    patokan: 'Lutut sedikit menekuk sekitar 25-35 derajat saat pedal berada di titik terbawah; panggul tidak bergoyang saat mengayuh',
    bilaSalah: 'Terlalu rendah menimbulkan nyeri lutut DEPAN; terlalu tinggi menimbulkan nyeri lutut BELAKANG dan panggul bergoyang',
  },
  {
    bagian: 'Maju-mundur sadel',
    patokan: 'Saat pedal mendatar, tempurung lutut berada tepat di atas poros pedal',
    bilaSalah: 'Terlalu maju membebani lutut; terlalu mundur membebani punggung dan tendon belakang paha',
  },
  {
    bagian: 'Jangkauan setang',
    patokan: 'Siku sedikit menekuk, bahu rileks, punggung tidak sampai memanjang berlebihan',
    bilaSalah: 'Terlalu jauh memaksa leher mendongak berlebihan dan merupakan penyebab tersering nyeri leher pada pesepeda',
  },
  {
    bagian: 'Beda tinggi sadel dan setang',
    patokan: 'Pemula sebaiknya memulai dengan setang yang lebih tinggi, lalu diturunkan bertahap seiring kelenturan membaik',
    bilaSalah: 'Setang terlalu rendah sejak awal memaksa punggung membungkuk berlebihan dan memperberat pola postur yang sudah buruk',
  },
  {
    bagian: 'Kecepatan mengayuh',
    patokan: '80-95 putaran per menit pada perjalanan biasa',
    bilaSalah: 'Mengayuh terlalu berat dan lambat membebani lutut dan menghambat perkembangan aerobik',
  },
]

/** Latihan penyeimbang wajib bagi orang yang banyak bersepeda. */
export const CYCLING_COUNTER: { nama: string; dosis: string; kenapa: string }[] = [
  { nama: 'Peregangan dada di kusen pintu', dosis: '3×30 detik setelah bersepeda', kenapa: 'Melawan pemendekan otot dada akibat posisi membungkuk berjam-jam' },
  { nama: 'Face pull atau row dengan karet', dosis: '3×15, 3 kali seminggu', kenapa: 'Menguatkan trapezius bawah dan rhomboid yang teregang pasif namun tidak terlatih saat bersepeda' },
  { nama: 'Peregangan otot pinggul depan', dosis: '3×30 detik tiap sisi', kenapa: 'Posisi menekuk pinggul terus-menerus memendekkan otot ini dan membuat panggul menungging saat berdiri' },
  { nama: 'Rotasi tulang belakang dada', dosis: '2×10 tiap sisi', kenapa: 'Mengembalikan gerak punggung atas yang kaku akibat posisi tetap membungkuk' },
  { nama: 'Chin tuck', dosis: '3×10 tahan 5 detik', kenapa: 'Melawan posisi leher mendongak dan kepala maju yang dipaksakan oleh posisi bersepeda' },
]

// ─── Susunan mingguan gabungan ──────────────────────────────────────────────

export interface Session {
  hari: string
  sport: Sport | 'kekuatan' | 'pulih'
  isi: string
  fokus: string
}

export type Goal = 'kecepatan' | 'kebugaran' | 'postur'

/**
 * Susunan mingguan berbeda menurut tujuan. Perbedaannya bukan pada jenis
 * olahraganya melainkan pada PORSI dan INTENSITASNYA — dan pada tujuan postur,
 * porsi renang serta latihan tarik sengaja diperbesar sementara sepeda dibatasi.
 */
export function weeklyMultiSport(goal: Goal): Session[] {
  if (goal === 'kecepatan') {
    return [
      { hari: 'Senin', sport: 'renang', isi: 'Teknik + ambang: 10×100 m pada pace CSS', fokus: 'Ambang laktat' },
      { hari: 'Selasa', sport: 'lari', isi: 'Interval 5×1000 m pada pace interval', fokus: 'VO₂max' },
      { hari: 'Rabu', sport: 'sepeda', isi: 'Zona 2 selama 60-90 menit + 5 sprint neuromuskular', fokus: 'Basis + kecepatan' },
      { hari: 'Kamis', sport: 'kekuatan', isi: 'Angkat beban dan latihan tarik + program postur', fokus: 'Kekuatan' },
      { hari: 'Jumat', sport: 'lari', isi: 'Tempo 25 menit + 6 strides', fokus: 'Ambang laktat' },
      { hari: 'Sabtu', sport: 'sepeda', isi: 'Blok ambang 3×12 menit pada zona 4', fokus: 'FTP' },
      { hari: 'Minggu', sport: 'pulih', isi: 'Renang ringan maupun jalan santai', fokus: 'Pemulihan' },
    ]
  }
  if (goal === 'postur') {
    return [
      { hari: 'Senin', sport: 'renang', isi: 'Gaya bebas dan gaya punggung 1500-2000 m, banyak latihan teknik', fokus: 'Membuka dada, menguatkan punggung atas' },
      { hari: 'Selasa', sport: 'kekuatan', isi: 'Pull-up progresi, row, face pull, prone Y-T-W', fokus: 'Otot penarik belikat' },
      { hari: 'Rabu', sport: 'lari', isi: 'Easy run 30-40 menit dengan pandangan ke depan, langkah 170-180', fokus: 'Aerobik' },
      { hari: 'Kamis', sport: 'renang', isi: 'Gaya punggung diperbanyak 1500 m', fokus: 'Rotasi dada, rotator eksternal bahu' },
      { hari: 'Jumat', sport: 'kekuatan', isi: 'Latihan tarik + peregangan dada dan pinggul depan', fokus: 'Pasangan regang-kuat' },
      { hari: 'Sabtu', sport: 'sepeda', isi: 'Zona 2 maksimal 60 menit, WAJIB disusul peregangan dada dan face pull', fokus: 'Aerobik dengan penyeimbang' },
      { hari: 'Minggu', sport: 'pulih', isi: 'Jalan santai dan mobilitas', fokus: 'Pemulihan' },
    ]
  }
  return [
    { hari: 'Senin', sport: 'renang', isi: 'Aerobik 1500 m campuran gaya', fokus: 'Aerobik tanpa beban sendi' },
    { hari: 'Selasa', sport: 'lari', isi: 'Easy run 30-40 menit', fokus: 'Basis aerobik' },
    { hari: 'Rabu', sport: 'kekuatan', isi: 'Latihan seluruh tubuh + program postur', fokus: 'Kekuatan dan massa otot' },
    { hari: 'Kamis', sport: 'sepeda', isi: 'Zona 2 selama 60 menit', fokus: 'Basis aerobik' },
    { hari: 'Jumat', sport: 'pulih', isi: 'Jalan santai maupun renang ringan', fokus: 'Pemulihan' },
    { hari: 'Sabtu', sport: 'lari', isi: 'Long run 60-75 menit', fokus: 'Daya tahan' },
    { hari: 'Minggu', sport: 'pulih', isi: 'Istirahat', fokus: 'Pemulihan' },
  ]
}

export const CROSS_RULES: { judul: string; isi: string }[] = [
  {
    judul: 'Ambang harus diukur terpisah untuk tiap cabang',
    isi: 'Denyut jantung ambang saat berenang umumnya 10-15 denyut lebih rendah daripada saat berlari, karena posisi mendatar dan air yang dingin mengubah kerja jantung. Memakai zona lari untuk berenang menghasilkan intensitas yang salah pada hampir setiap sesi.',
  },
  {
    judul: 'Kebugaran aerobik berpindah antar cabang, kekuatan tidak',
    isi: 'Jantung dan paru yang terlatih dari bersepeda tetap bermanfaat saat berlari, namun otot dan tendon tungkai tidak ikut siap menerima beban benturan. Inilah sebabnya pesepeda yang bugar tetap mudah cedera ketika langsung berlari jauh.',
  },
  {
    judul: 'Renang dan sepeda memungkinkan volume yang tidak bisa dicapai lari',
    isi: 'Karena keduanya hampir tanpa benturan, keduanya dapat dipakai menambah volume aerobik ketika lari sudah mencapai batas yang aman bagi sendi — cara paling berguna untuk menaikkan kebugaran tanpa menambah risiko cedera.',
  },
  {
    judul: 'Bersepeda memerlukan penyeimbang, berenang tidak',
    isi: 'Berenang menguatkan otot punggung yang justru melemah pada postur bungkuk, sedangkan bersepeda memperkuat posisi bungkuk itu sendiri. Karena itu setiap sesi sepeda yang panjang sebaiknya diikuti peregangan dada dan latihan tarik, sementara renang tidak memerlukannya.',
  },
  {
    judul: 'Latihan kekuatan bukan pilihan tambahan',
    isi: 'Latihan beban 2 kali seminggu menurunkan risiko cedera pada ketiga cabang dan memperbaiki efisiensi gerak. Pada orang yang memperbaiki postur, latihan tarik justru merupakan bagian yang paling menentukan dan tidak tergantikan oleh olahraga aerobik apa pun.',
  },
]
