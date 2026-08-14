import { BANISTER, type AngkaKlinis } from './angkaKlinis'

// ─────────────────────────────────────────────────────────────────────────────
// Penjabaran angka kebugaran, kelelahan, dan kesegaran.
//
// Ditulis sebagai jawaban langsung atas pertanyaan yang sah dan selama ini
// tidak terjawab: "kebugaran saya 26 selama seminggu, atas dasar apa angka itu,
// dan mengapa tidur sepuluh jam tidak mengubahnya."
//
// Jawabannya ada tiga lapis, dan ketiganya adalah sifat MODEL, bukan sifat
// tubuh orang yang bertanya:
//
//   1. Angka itu TIDAK BERSATUAN dan TIDAK BERSKALA POPULASI. Ia adalah rerata
//      bergerak eksponensial atas beban latihan harian orang itu sendiri. "26"
//      tidak rendah dibanding siapa pun — tidak ada siapa pun di dalam
//      perhitungannya. Menyandingkannya dengan angka lain yang berskala 0-100
//      membuat orang membacanya sebagai nilai ujian, dan itu kekeliruan yang
//      diciptakan oleh tampilannya, bukan oleh pemakainya.
//
//   2. TIDUR BUKAN MASUKAN. Model Banister hanya menerima satu masukan, yaitu
//      beban latihan harian. Tidur, HRV, denyut istirahat, suasana hati, dan
//      makan tidak muncul sama sekali di dalam persamaannya. Tidur sepuluh jam
//      TIDAK MUNGKIN mengubahnya, dan itu bukan kegagalan tubuh.
//
//   3. "TIDAK PERNAH SEGAR" ADALAH KELUARAN YANG DIHARAPKAN dari latihan yang
//      teratur. Kesegaran adalah kebugaran dikurangi kelelahan. Bila beban
//      latihan kira-kira tetap, rerata 7 hari akan mendekati rerata 42 hari,
//      sehingga selisihnya bergerak di sekitar nol maupun sedikit negatif —
//      SELAMANYA. Kesegaran hanya menjadi positif bila beban SENGAJA
//      DITURUNKAN selama satu sampai dua pekan. Orang yang berlatih tekun dan
//      teratur akan selalu terbaca "tidak segar", dan itu bukan tanda ada yang
//      salah pada dirinya.
//
// Poin ketiga inilah yang tidak pernah dikatakan aplikasi kebugaran mana pun,
// karena mengatakannya berarti mengakui bahwa angka andalannya sebagian besar
// mencerminkan bentuk grafik latihan, bukan keadaan tubuh.
// ─────────────────────────────────────────────────────────────────────────────

/** Bobot hari ini pada rerata bergerak eksponensial dengan tetapan waktu τ. */
function bobotHarian(tau: number): number {
  return 1 - Math.exp(-1 / tau)
}

function persen(x: number): string {
  return `${(x * 100).toFixed(1)}%`
}

export interface BahanAudit {
  kebugaran: number
  kelelahan: number
  kesegaran: number
  /** Jumlah sesi yang benar-benar terpakai dalam perhitungan. */
  jumlahSesi: number
  /** Rentang tanggal data yang dipakai. */
  rentangHari: number
  /** Denyut maksimum yang dipakai dalam perhitungan TRIMP. */
  hrMax: number
  /** Denyut istirahat yang dipakai. */
  hrIstirahat: number
  /** Beban latihan hari ini, bila ada. */
  upayaHariIni: number
}

/**
 * Batasan yang berlaku bagi ketiga angka sekaligus.
 *
 * Ditulis satu kali dan dipakai bersama, supaya tidak ada satu angka pun yang
 * ditampilkan tanpa batasannya sementara yang lain membawanya.
 */
function batasanBersama(b: BahanAudit): string[] {
  const out = [
    'Hanya menghitung latihan yang TERCATAT. Kerja fisik, jalan kaki harian, dan sesi yang lupa direkam tidak masuk sama sekali, sehingga angkanya lebih rendah daripada beban tubuh yang sesungguhnya.',
    'Beban dihitung dari denyut jantung. Latihan beban dan gerakan kekuatan menaikkan denyut jauh lebih sedikit daripada bebannya bagi otot dan sendi, sehingga selalu dinilai terlalu ringan oleh model ini.',
    `Memakai denyut maksimum ${b.hrMax} bpm dan denyut istirahat ${b.hrIstirahat} bpm. Keduanya menggeser seluruh angka bila keliru; denyut maksimum yang ditaksir dari usia dapat meleset 10-12 bpm pada perorangan.`,
  ]
  if (b.rentangHari < 42) {
    out.unshift(
      `Data baru mencakup ${b.rentangHari} hari, sedangkan tetapan waktu kebugaran adalah ${BANISTER.tauKebugaran} hari. Angka kebugaran BELUM MENCAPAI NILAI TETAPNYA dan masih akan naik meskipun latihan Anda tidak berubah sama sekali.`,
    )
  }
  if (b.jumlahSesi < 10) {
    out.push(`Baru ${b.jumlahSesi} sesi yang terbaca. Di bawah sekitar sepuluh sesi, satu sesi tunggal masih menggeser angkanya secara mencolok.`)
  }
  return out
}

export function auditKebugaran(b: BahanAudit): AngkaKlinis {
  const a = bobotHarian(BANISTER.tauKebugaran)
  return {
    label: 'Kebugaran',
    nilai: String(Math.round(b.kebugaran)),
    satuan: '',
    tingkat: 'termodelkan',
    arti: `Rerata beban latihan harian Anda selama kira-kira ${BANISTER.tauKebugaran} hari terakhir, dengan hari yang lebih baru diberi bobot lebih besar.`,
    skala: 'TIDAK BERSATUAN dan tidak berskala populasi. Angka ini hanya sebanding dengan riwayat Anda sendiri — tidak ada data orang lain di dalam perhitungannya, sehingga tidak ada arti "tinggi" maupun "rendah" selain dibandingkan bulan-bulan Anda sebelumnya.',
    rumus: `kebugaran hari ini = kebugaran kemarin + ${persen(a)} × (beban hari ini − kebugaran kemarin)`,
    masukan: [
      { nama: 'Beban latihan hari ini', nilai: String(Math.round(b.upayaHariIni)), sumber: 'dihitung dari deret denyut jantung sesi' },
      { nama: 'Kebugaran kemarin', nilai: String(Math.round(b.kebugaran)), sumber: 'dihitung' },
      { nama: 'Tetapan waktu τ', nilai: `${BANISTER.tauKebugaran} hari`, sumber: 'tetapan model Banister' },
      { nama: 'Sesi terpakai', nilai: `${b.jumlahSesi} sesi dalam ${b.rentangHari} hari`, sumber: 'riwayat impor' },
    ],
    ketidakpastian: {
      sdc: 'Perubahan di bawah kira-kira 3 satuan dalam sepekan tidak layak ditafsirkan.',
      dasar: `Dengan bobot harian hanya ${persen(a)}, satu sesi biasa hanya menggeser angka ini kurang dari satu satuan. Naik-turun harian sebesar itu adalah aritmetika, bukan perubahan pada tubuh.`,
    },
    tidakDipengaruhi: [
      'TIDUR — berapa pun lama dan mutunya. Tidur sama sekali bukan masukan bagi model ini.',
      'Denyut istirahat pagi, HRV, dan suhu tubuh.',
      'Makan, berat badan, dan hidrasi.',
      'Perasaan lelah maupun bugar hari itu.',
      'Istirahat sehari maupun dua hari — kebugaran meluruh sangat lambat.',
    ],
    yangMenggerakkan: [
      `Hanya beban latihan yang tercatat. Untuk menaikkannya diperlukan penambahan beban yang bertahan berminggu-minggu, bukan satu sesi berat.`,
      `Karena τ = ${BANISTER.tauKebugaran} hari, kira-kira dua pertiga akibat sebuah perubahan beban baru terlihat setelah ${BANISTER.tauKebugaran} hari, dan hampir seluruhnya setelah tiga kali τ.`,
      'Berhenti berlatih sama sekali menurunkannya kira-kira separuh dalam 29 hari.',
    ],
    batasan: batasanBersama(b),
  }
}

export function auditKelelahan(b: BahanAudit): AngkaKlinis {
  const a = bobotHarian(BANISTER.tauKelelahan)
  return {
    label: 'Kelelahan',
    nilai: String(Math.round(b.kelelahan)),
    satuan: '',
    tingkat: 'termodelkan',
    arti: `Rerata beban latihan harian Anda selama kira-kira ${BANISTER.tauKelelahan} hari terakhir. Naik cepat setelah latihan berat dan turun cepat saat istirahat.`,
    skala: 'TIDAK BERSATUAN, dan dinyatakan dalam skala yang sama persis dengan kebugaran — itulah sebabnya keduanya boleh dikurangkan.',
    rumus: `kelelahan hari ini = kelelahan kemarin + ${persen(a)} × (beban hari ini − kelelahan kemarin)`,
    masukan: [
      { nama: 'Beban latihan hari ini', nilai: String(Math.round(b.upayaHariIni)), sumber: 'dihitung dari deret denyut jantung sesi' },
      { nama: 'Kelelahan kemarin', nilai: String(Math.round(b.kelelahan)), sumber: 'dihitung' },
      { nama: 'Tetapan waktu τ', nilai: `${BANISTER.tauKelelahan} hari`, sumber: 'tetapan model Banister' },
    ],
    ketidakpastian: {
      sdc: 'Perubahan di bawah kira-kira 5 satuan dalam sehari tidak layak ditafsirkan.',
      dasar: `Bobot hariannya ${persen(a)}, jauh lebih besar daripada kebugaran, sehingga angka ini memang berayun lebar dari hari ke hari bahkan pada latihan yang teratur.`,
    },
    tidakDipengaruhi: [
      'TIDUR, HRV, dan denyut istirahat — tidak satu pun menjadi masukan.',
      'Rasa pegal dan nyeri otot.',
      'Beban pikiran, pekerjaan, dan tekanan hidup.',
      'Sakit, demam, maupun kurang darah.',
    ],
    yangMenggerakkan: [
      'Beban latihan beberapa hari terakhir. Satu sesi berat menaikkannya dengan segera.',
      `Karena τ = ${BANISTER.tauKelelahan} hari, kira-kira separuhnya hilang setelah 5 hari tanpa latihan.`,
    ],
    batasan: [
      ...batasanBersama(b),
      'Yang diukur adalah kelelahan AKIBAT LATIHAN semata. Lelah karena kurang tidur, sakit, maupun beban pikiran tidak akan pernah muncul di sini, meskipun tubuh Anda merasakannya dengan cara yang sama.',
    ],
  }
}

export function auditKesegaran(b: BahanAudit): AngkaKlinis {
  const beda = b.kebugaran - b.kelelahan
  return {
    label: 'Kesegaran',
    nilai: String(Math.round(b.kesegaran)),
    satuan: '',
    tingkat: 'termodelkan',
    arti: 'Selisih antara rerata beban 42 hari dan rerata beban 7 hari. Positif berarti beban belakangan ini lebih ringan daripada kebiasaan Anda; negatif berarti lebih berat.',
    skala: 'TIDAK BERSATUAN. Nilainya berkisar di sekitar nol menurut susunannya sendiri, bukan menurut keadaan tubuh.',
    rumus: `kesegaran = kebugaran − kelelahan = ${Math.round(b.kebugaran)} − ${Math.round(b.kelelahan)} = ${Math.round(beda)}`,
    masukan: [
      { nama: 'Kebugaran (rerata 42 hari)', nilai: String(Math.round(b.kebugaran)), sumber: 'dihitung' },
      { nama: 'Kelelahan (rerata 7 hari)', nilai: String(Math.round(b.kelelahan)), sumber: 'dihitung' },
    ],
    ketidakpastian: {
      sdc: 'Perubahan di bawah kira-kira 5 satuan tidak layak ditafsirkan, sebab galat kedua penyusunnya ikut terbawa.',
      dasar: 'Selisih dua angka yang masing-masing tidak pasti selalu lebih tidak pasti daripada keduanya.',
    },
    tidakDipengaruhi: [
      'TIDUR — termasuk tidur sepuluh jam. Bukan masukan bagi model ini.',
      'HRV, denyut istirahat pagi, dan perasaan Anda hari itu.',
      'Makan, kafein, dan hidrasi.',
    ],
    yangMenggerakkan: [
      'HANYA perbedaan antara beban pekan ini dan kebiasaan dua bulan terakhir.',
      'Menjadi positif memerlukan penurunan beban yang disengaja selama 7-14 hari. Inilah yang dilakukan atlet sebelum bertanding, dan namanya taper.',
      'Menjadi negatif setiap kali beban dinaikkan — dan itu memang yang seharusnya terjadi saat sedang membangun.',
    ],
    batasan: [
      ...batasanBersama(b),
      'NILAI YANG SELALU DI SEKITAR NOL MAUPUN NEGATIF ADALAH KELUARAN YANG DIHARAPKAN, bukan tanda ada yang salah. Bila beban latihan kira-kira tetap, rerata 7 hari akan mendekati rerata 42 hari, sehingga selisihnya memang tidak pernah menjadi positif. Berlatih tekun dan teratur akan selalu terbaca "tidak segar" selama beban tidak diturunkan.',
      'Angka ini TIDAK MENGUKUR kesiapan tubuh. Ia mengukur bentuk grafik latihan Anda. Untuk kesiapan yang sesungguhnya, denyut istirahat pagi, HRV, mutu tidur, dan rasa badan jauh lebih menentukan — dan tidak satu pun dari itu masuk ke sini.',
    ],
  }
}

/**
 * Ringkasan satu paragraf untuk dibaca lebih dahulu, sebelum ketiga angkanya.
 *
 * Ditulis khusus untuk keadaan yang paling sering menimbulkan kebingungan:
 * kesegaran yang tidak pernah positif meskipun tidur cukup.
 */
export function bacaanJujur(b: BahanAudit): string | null {
  if (b.rentangHari < 42) {
    return `Data Anda baru mencakup ${b.rentangHari} hari, sedangkan kebugaran dihitung dengan tetapan waktu ${BANISTER.tauKebugaran} hari. Angkanya masih akan naik dengan sendirinya meskipun latihan Anda tidak berubah — jadi belum layak dibaca sebagai keadaan yang mapan.`
  }
  if (b.kesegaran <= 0 && b.kelelahan >= b.kebugaran * 0.9) {
    return `Kesegaran Anda di sekitar nol maupun negatif karena beban pekan ini kira-kira sama dengan kebiasaan dua bulan terakhir — itu keluaran yang diharapkan dari latihan yang teratur, bukan tanda tubuh bermasalah. Angka ini hanya akan menjadi positif bila beban sengaja diturunkan selama 7-14 hari. Perlu ditegaskan pula bahwa tidur tidak masuk ke dalam perhitungan ini sama sekali; bila Anda merasa lelah meskipun tidur cukup, sebabnya harus dicari pada denyut istirahat, HRV, gizi, maupun pemeriksaan darah — bukan pada angka ini.`
  }
  return null
}
