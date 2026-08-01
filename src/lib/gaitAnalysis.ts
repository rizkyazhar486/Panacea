// ─────────────────────────────────────────────────────────────────────────────
// Analisis cara berjalan dan bentuk lari, dari data yang sudah ada namun tidak
// pernah dibaca.
//
// Apple Watch dan iPhone diam-diam mencatat kualitas GERAK, bukan hanya jumlah
// langkah: seberapa simetris kedua tungkai, berapa lama kedua kaki menapak
// bersamaan, sepanjang apa langkahnya, seberapa cepat menaiki tangga, dan pada
// lari — waktu kontak tanah, pantulan vertikal, serta panjang langkah. Semua
// angka ini sudah ikut terkirim pada setiap ekspor namun tidak dipetakan ke
// mana pun, sehingga tidak pernah muncul di layar.
//
// Kenapa itu sayang: jumlah langkah hanya mengatakan SEBERAPA BANYAK seseorang
// bergerak. Angka-angka di sini mengatakan SEBAIK APA ia bergerak — dan
// ketimpangan langkah maupun fase tumpuan ganda yang memanjang justru
// merupakan petunjuk paling awal adanya kompensasi akibat nyeri, kelemahan
// sesisi, maupun postur yang sudah lama menyimpang.
//
// PERINGATAN YANG MELEKAT PADA SELURUH HALAMAN INI: angka-angka ini berasal
// dari perkiraan sensor pada jam tangan dan telepon di saku, bukan dari
// pemeriksaan gait laboratorium. Ia berguna untuk melihat ARAH PERUBAHAN pada
// diri sendiri dari waktu ke waktu, bukan untuk menegakkan diagnosis.
// ─────────────────────────────────────────────────────────────────────────────

import type { Vitals } from './healthVitals'

export type Band = 'baik' | 'sedang' | 'perhatian' | 'takTersedia'

export interface Reading {
  key: string
  label: string
  /** Nilai apa adanya beserta satuannya, siap tampil. */
  tampil: string
  nilai?: number
  band: Band
  /** Rentang rujukan yang dipakai, disebut terang-terangan. */
  rujukan: string
  /** Apa arti angka ini — fisiologi, bukan sekadar label. */
  arti: string
  /** Apa yang bisa dilakukan bila angkanya kurang baik. */
  langkah?: string
}

export interface Section {
  key: string
  judul: string
  ikon: string
  pengantar: string
  readings: Reading[]
}

const BAND_ORDER: Record<Band, number> = { perhatian: 0, sedang: 1, baik: 2, takTersedia: 3 }

/** Membentuk satu pembacaan; bila nilainya tidak ada, statusnya jujur "belum ada data". */
function baca(
  key: string,
  label: string,
  nilai: number | undefined,
  satuan: string,
  klasifikasi: (n: number) => Band,
  rujukan: string,
  arti: string,
  langkah?: string,
  desimal = 1,
): Reading {
  if (nilai == null || !Number.isFinite(nilai)) {
    return { key, label, tampil: '—', band: 'takTersedia', rujukan, arti, langkah }
  }
  const tampil = `${desimal === 0 ? Math.round(nilai) : +nilai.toFixed(desimal)}${satuan ? ' ' + satuan : ''}`
  return { key, label, tampil, nilai, band: klasifikasi(nilai), rujukan, arti, langkah }
}

/**
 * Irama langkah lari, dihitung dari kecepatan dibagi panjang langkah.
 * Apple tidak melaporkannya langsung padahal kedua bahannya ada — dan justru
 * irama inilah satu-satunya unsur bentuk lari yang dapat diubah secara sadar
 * dalam hitungan menit.
 */
export function cadenceFrom(speedKmh?: number, strideM?: number): number | null {
  if (!(speedKmh! > 0) || !(strideM! > 0)) return null
  const mps = speedKmh! / 3.6
  return Math.round((mps / strideM!) * 60)
}

/** Pace lari dalam detik per kilometer, dari kecepatan km/jam. */
export function paceFromSpeed(speedKmh?: number): number | null {
  if (!(speedKmh! > 0)) return null
  return Math.round(3600 / speedKmh!)
}

export function fmtPaceSec(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function buildGaitSections(v: Vitals): Section[] {
  const kmhToMs = (k?: number) => (k! > 0 ? k! / 3.6 : undefined)

  const jalan: Section = {
    key: 'jalan',
    judul: 'Kualitas Berjalan',
    ikon: '🚶',
    pengantar:
      'Diukur dari telepon di saku sepanjang hari, bukan dari satu tes. Karena itu angkanya bercampur antara berjalan santai di dalam ruangan dan berjalan sungguhan di luar — yang bermakna adalah PERUBAHANNYA dari minggu ke minggu, bukan satu angka pada satu hari.',
    readings: [
      baca(
        'asimetri', 'Ketimpangan langkah', v.walkingAsymmetryPct, '%',
        (n) => (n < 3 ? 'baik' : n < 6 ? 'sedang' : 'perhatian'),
        'Umumnya di bawah 3%; di atas itu dianggap meningkat',
        'Persentase waktu berjalan ketika satu tungkai bergerak berbeda dari tungkai lainnya. Tubuh melakukan ini untuk MENGHINDARI sesuatu — nyeri, kelemahan, sendi yang kaku, maupun panjang tungkai yang tidak sama. Ketimpangan yang menetap membuat satu sisi menanggung beban lebih besar bertahun-tahun.',
        'Bila menetap tinggi: perhatikan apakah ada nyeri sesisi yang diabaikan, periksa kekuatan bokong dan tungkai kiri-kanan secara terpisah, dan pertimbangkan pemeriksaan langsung. Latihan satu sisi seperti split squat dan single-leg bridge menyamakan kekuatan lebih cepat daripada latihan dua sisi.',
      ),
      baca(
        'doubleSupport', 'Fase dua kaki menapak', v.walkingDoubleSupportPct, '%',
        (n) => (n <= 26 ? 'baik' : n <= 32 ? 'sedang' : 'perhatian'),
        'Umumnya sekitar 20-30% pada dewasa sehat',
        'Bagian dari siklus berjalan ketika KEDUA kaki menyentuh tanah bersamaan. Semakin besar angkanya, semakin lama tubuh menahan diri dalam posisi paling stabil — pola yang muncul ketika keseimbangan kurang dipercaya, ketika ada rasa tidak aman, maupun ketika otot penstabil panggul lemah.',
        'Diperbaiki melalui latihan keseimbangan satu kaki, penguatan bokong tengah, dan berjalan cepat di permukaan rata secara teratur.',
      ),
      baca(
        'kecepatanJalan', 'Kecepatan berjalan', kmhToMs(v.walkingSpeedKmh), 'm/detik',
        (n) => (n >= 1.2 ? 'baik' : n >= 1.0 ? 'sedang' : 'perhatian'),
        'Berjalan sungguhan pada dewasa sehat umumnya 1,2-1,4 m/detik',
        'Kecepatan berjalan merupakan salah satu penanda kesehatan menyeluruh yang paling sederhana sekaligus paling kuat. Perlu diingat angka ini merupakan rata-rata SELURUH langkah harian termasuk berjalan pelan di dalam ruangan, sehingga wajar lebih rendah daripada kecepatan berjalan sungguhan.',
        'Bila ingin membandingkan dengan angka rujukan, ukur sendiri: berjalan secepat yang nyaman sejauh 10 meter dan bagi jaraknya dengan waktu tempuh.',
        2,
      ),
      baca(
        'panjangLangkah', 'Panjang langkah', v.walkingStepLengthCm, 'cm',
        (n) => (n >= 68 ? 'baik' : n >= 58 ? 'sedang' : 'perhatian'),
        'Dewasa umumnya sekitar 70-80 cm, dan bergantung pada tinggi badan',
        'Langkah yang memendek merupakan salah satu perubahan paling awal pada gangguan gerak, kelemahan otot, maupun rasa tidak percaya diri saat berjalan. Karena bergantung pada tinggi badan, nilai ini paling berguna dibandingkan dengan diri sendiri sebelumnya.',
        'Peregangan otot pinggul depan dan penguatan bokong biasanya menambah panjang langkah lebih banyak daripada usaha melangkah lebar secara sadar.',
        0,
      ),
      baca(
        'tanggaNaik', 'Kecepatan menaiki tangga', v.stairSpeedUpMs, 'm/detik',
        (n) => (n >= 0.35 ? 'baik' : n >= 0.22 ? 'sedang' : 'perhatian'),
        'Nilai yang lebih tinggi mencerminkan daya otot tungkai yang lebih besar',
        'Menaiki tangga menuntut DAYA — kekuatan yang dikeluarkan dengan cepat — dan daya menurun lebih dini daripada kekuatan biasa. Karena itu kecepatan menaiki tangga sering berubah lebih dahulu daripada kecepatan berjalan.',
        'Latihan yang menaikkannya: step-up ke bangku, squat, dan naik tangga sebagai latihan tersendiri, bukan sekadar sebagai perjalanan.',
        2,
      ),
      baca(
        'tanggaTurun', 'Kecepatan menuruni tangga', v.stairSpeedDownMs, 'm/detik',
        (n) => (n >= 0.4 ? 'baik' : n >= 0.25 ? 'sedang' : 'perhatian'),
        'Umumnya sedikit lebih cepat daripada saat menaiki',
        'Menuruni tangga membutuhkan kendali otot saat memanjang, dan lebih dipengaruhi oleh keseimbangan serta rasa percaya diri daripada oleh kekuatan.',
        undefined,
        2,
      ),
      baca(
        'enamMenit', 'Perkiraan jarak jalan 6 menit', v.sixMinWalkM, 'meter',
        (n) => (n >= 550 ? 'baik' : n >= 400 ? 'sedang' : 'perhatian'),
        'Dewasa sehat umumnya 400-700 meter pada tes yang sebenarnya',
        'Ini PERKIRAAN yang dihitung telepon dari pola berjalan harian, bukan hasil tes enam menit yang sesungguhnya. Berguna sebagai pemantauan tren, dan tidak dapat menggantikan tes yang dilakukan langsung.',
        undefined,
        0,
      ),
    ],
  }

  const cadence = cadenceFrom(v.runningSpeedKmh, v.runningStrideLengthM)
  const pace = paceFromSpeed(v.runningSpeedKmh)

  const lari: Section = {
    key: 'lari',
    judul: 'Bentuk Lari',
    ikon: '🏃',
    pengantar:
      'Tercatat hanya pada hari Anda benar-benar berlari di luar ruangan. Bentuk lari tidak menentukan kecepatan sebanyak yang dikira orang — tetapi ia sangat menentukan seberapa besar beban benturan yang diterima sendi pada setiap langkah, dan itulah yang berhubungan dengan cedera.',
    readings: [
      baca(
        'irama', 'Irama langkah', cadence ?? undefined, 'langkah/menit',
        (n) => (n >= 168 ? 'baik' : n >= 155 ? 'sedang' : 'perhatian'),
        'Umumnya 170-180 pada pelari terlatih; angka 180 adalah pedoman kasar, bukan aturan',
        'Dihitung dari kecepatan dibagi panjang langkah — Apple tidak melaporkannya langsung meskipun kedua bahannya tersedia. Irama yang lambat berarti langkah yang panjang dan mendarat jauh di depan badan, sehingga tubuh direm setiap langkah dan benturan diteruskan ke lutut serta pinggul. Inilah satu-satunya unsur bentuk lari yang bisa diubah secara sadar dalam hitungan menit.',
        'Naikkan 5% lebih dahulu, bukan langsung ke 180. Cara termudah: berlari mengikuti metronom maupun lagu dengan ketukan yang sesuai, sekali seminggu selama 10 menit. Langkah otomatis memendek dan mendarat lebih dekat ke bawah badan.',
        0,
      ),
      baca(
        'kontakTanah', 'Waktu kontak tanah', v.runningGroundContactMs, 'milidetik',
        (n) => (n <= 240 ? 'baik' : n <= 290 ? 'sedang' : 'perhatian'),
        'Pelari rekreasi umumnya 250-300 ms; pelari elite di bawah 200 ms',
        'Lama telapak kaki menempel tanah pada setiap langkah. Kontak yang lama berarti tubuh menghabiskan lebih banyak waktu menahan beban dan lebih sedikit waktu melayang, sehingga tenaga lebih banyak terbuang. Angka ini erat kaitannya dengan irama langkah — memperbaiki irama biasanya memperpendeknya dengan sendirinya.',
        'Bukan sesuatu yang dilatih langsung. Ia membaik seiring naiknya irama langkah, menguatnya betis dan bokong, serta latihan lompat ringan seperti skipping.',
        0,
      ),
      baca(
        'pantulan', 'Pantulan vertikal', v.runningVerticalOscCm, 'cm',
        (n) => (n <= 9 ? 'baik' : n <= 11 ? 'sedang' : 'perhatian'),
        'Umumnya 6-13 cm; lebih rendah umumnya lebih hemat tenaga',
        'Seberapa jauh badan bergerak naik-turun setiap langkah. Tenaga yang dipakai untuk melambung ke atas tidak memindahkan tubuh ke depan sedikit pun — ia terbuang, lalu kembali sebagai benturan saat mendarat.',
        'Membaik dengan menaikkan irama langkah dan mengurangi usaha "melompat" ke depan. Berlari terasa lebih mendatar dan lebih senyap.',
      ),
      baca(
        'daya', 'Daya lari', v.runningPowerW, 'watt',
        (n) => (n > 0 ? 'baik' : 'takTersedia'),
        'Tidak ada nilai baku — bermakna bila dibandingkan dengan berat badan sendiri dari waktu ke waktu',
        'Perkiraan tenaga mekanik per satuan waktu saat berlari. Nilainya tidak bisa dibandingkan antarorang maupun antarmerek jam karena cara menghitungnya berbeda-beda, tetapi berguna untuk melihat perkembangan diri sendiri.',
        undefined,
        0,
      ),
      baca(
        'panjangLangkahLari', 'Panjang langkah lari', v.runningStrideLengthM, 'meter',
        (n) => (n > 0 ? 'baik' : 'takTersedia'),
        'Menyesuaikan diri dengan kecepatan — dinilai bersama irama, bukan sendirian',
        'Panjang langkah yang besar bukan tujuan tersendiri. Langkah panjang dengan irama lambat berarti mendarat jauh di depan badan, dan itu justru merugikan.',
        undefined,
        2,
      ),
    ],
  }

  const pemulihan: Section = {
    key: 'pemulihan',
    judul: 'Pemulihan & Beban',
    ikon: '❤️‍🩹',
    pengantar:
      'Seberapa cepat jantung menenangkan diri setelah upaya berat merupakan cerminan langsung dari kebugaran dan keseimbangan saraf otonom — dan ia berubah lebih dahulu daripada VO2max ketika kelelahan menumpuk.',
    readings: [
      baca(
        'hrr', 'Pemulihan detak jantung 1 menit', v.cardioRecoveryBpm, 'bpm',
        (n) => (n >= 25 ? 'baik' : n >= 13 ? 'sedang' : 'perhatian'),
        'Turun lebih dari 12 bpm dalam satu menit dianggap normal; makin besar makin baik',
        'Selisih denyut jantung antara akhir latihan dan satu menit sesudahnya. Penurunan yang cepat menandakan saraf parasimpatis bekerja baik. Penurunan 12 bpm atau kurang berkaitan dengan risiko kesehatan jangka panjang yang lebih tinggi pada banyak penelitian, dan merupakan salah satu angka paling bernilai yang diberikan jam tangan secara cuma-cuma.',
        'Naik bersama latihan aerobik yang teratur pada intensitas rendah, dan turun ketika kurang tidur, sakit, maupun berlatih berlebihan — sehingga penurunan mendadak layak dibaca sebagai tanda untuk mengurangi beban.',
        0,
      ),
      baca(
        'vo2', 'VO2max', v.vo2max, 'ml/kg/menit',
        (n) => (n >= 45 ? 'baik' : n >= 35 ? 'sedang' : 'perhatian'),
        'Bergantung usia dan jenis kelamin; nilai lebih tinggi berkaitan dengan risiko kematian lebih rendah',
        'Perkiraan kemampuan tubuh memakai oksigen pada upaya maksimal, dihitung jam tangan dari hubungan antara detak jantung dan kecepatan saat berjalan maupun berlari di luar ruangan.',
        'Yang paling menaikkannya adalah gabungan lari mudah bervolume besar dengan sedikit sesi intensitas tinggi — bukan semua sesi dijalankan keras.',
      ),
      baca(
        'istirahat', 'Detak jantung istirahat', v.restingHr, 'bpm',
        (n) => (n <= 60 ? 'baik' : n <= 75 ? 'sedang' : 'perhatian'),
        'Dewasa sehat umumnya 50-70 bpm; pelari terlatih sering lebih rendah',
        'Turun perlahan seiring membaiknya kebugaran. Kenaikan mendadak beberapa bpm di atas kebiasaan sendiri sering mendahului sakit maupun kelelahan berlebih sebelum gejalanya terasa.',
      ),
      baca(
        'hrv', 'Variabilitas detak jantung', v.hrvMs, 'ms',
        (n) => (n >= 50 ? 'baik' : n >= 30 ? 'sedang' : 'perhatian'),
        'Sangat beragam antarorang — hanya bermakna dibandingkan dengan rata-rata diri sendiri',
        'Selisih halus antarketukan jantung. Nilai antarorang tidak dapat dibandingkan sama sekali; yang bermakna adalah kecenderungan diri sendiri. Penurunan yang menetap beberapa hari umumnya menandakan beban yang belum terbayar, entah dari latihan, kurang tidur, maupun tekanan pikiran.',
      ),
    ],
  }

  const lingkungan: Section = {
    key: 'lingkungan',
    judul: 'Paparan Harian',
    ikon: '🌤️',
    pengantar:
      'Dua hal yang dicatat telepon dan hampir tidak pernah dilihat siapa pun, padahal keduanya berkaitan dengan hal yang tidak dapat dipulihkan: pendengaran dan jam biologis.',
    readings: [
      baca(
        'headphone', 'Paparan suara headphone', v.headphoneAudioDb, 'dB',
        (n) => (n <= 70 ? 'baik' : n <= 80 ? 'sedang' : 'perhatian'),
        'Paparan berkelanjutan di atas sekitar 80 dB dianggap berisiko bila berlangsung lama',
        'Kerusakan sel rambut telinga bersifat MENETAP dan tidak menimbulkan gejala sampai kerusakannya sudah besar. Risikonya ditentukan oleh gabungan kerasnya suara dan lamanya, sehingga volume sedang selama berjam-jam bisa sama merusaknya dengan volume tinggi sebentar.',
        'Aturan sederhana: pada volume 60% selama tidak lebih dari 60 menit berturut-turut. Peredam bising justru menurunkan paparan karena membuat orang tidak perlu menaikkan volume untuk menutupi keramaian.',
        0,
      ),
      baca(
        'lingkunganSuara', 'Paparan suara sekitar', v.audioExposureDb, 'dB',
        (n) => (n <= 70 ? 'baik' : n <= 80 ? 'sedang' : 'perhatian'),
        'Percakapan biasa sekitar 60 dB; lalu lintas padat sekitar 80 dB',
        'Paparan bising lingkungan sepanjang hari, di luar headphone.',
        undefined,
        0,
      ),
      baca(
        'cahaya', 'Waktu di bawah cahaya matahari', v.daylightMin, 'menit',
        (n) => (n >= 60 ? 'baik' : n >= 30 ? 'sedang' : 'perhatian'),
        'Sekitar 60 menit sehari, terutama pada pagi hari',
        'Cahaya terang di pagi hari merupakan penanda waktu terkuat bagi jam biologis tubuh. Bagi orang yang jam kerjanya tidak teratur maupun sering berjaga malam, inilah alat paling murah untuk menjaga jam tidur agar tidak makin bergeser — dan cahaya di dalam ruangan jauh lebih lemah daripada yang terasa oleh mata.',
        'Bawa sebagian kegiatan pagi ke luar ruangan: sarapan, berjalan kaki, maupun perjalanan berangkat kerja. Sepuluh menit di luar bernilai lebih besar daripada satu jam di dalam ruangan yang terang.',
        0,
      ),
    ],
  }

  return [jalan, lari, pemulihan, lingkungan]
}

/** Temuan yang layak disorot lebih dahulu: yang berstatus perhatian, terparah di atas. */
export function highlights(sections: Section[]): Reading[] {
  return sections
    .flatMap((s) => s.readings)
    .filter((r) => r.band === 'perhatian')
    .sort((a, b) => BAND_ORDER[a.band] - BAND_ORDER[b.band])
}

/** Berapa banyak metrik yang benar-benar terisi — untuk memberi tahu bila data masih kosong. */
export function coverage(sections: Section[]): { terisi: number; total: number } {
  const all = sections.flatMap((s) => s.readings)
  return { terisi: all.filter((r) => r.band !== 'takTersedia').length, total: all.length }
}

export const DISCLAIMER =
  'Seluruh angka di halaman ini merupakan perkiraan dari sensor jam tangan dan telepon, bukan hasil pemeriksaan gait laboratorium maupun uji latih beban. Nilainya paling berguna untuk melihat perubahan pada diri sendiri dari waktu ke waktu. Satu angka pada satu hari tidak menegakkan maupun menyingkirkan apa pun, dan keluhan yang nyata tetap perlu diperiksa langsung.'
