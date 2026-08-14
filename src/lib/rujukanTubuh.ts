import type { AngkaKlinis } from './angkaKlinis'

// ─────────────────────────────────────────────────────────────────────────────
// Rentang rujukan untuk tanda tubuh — dengan populasinya disebut.
//
// APA YANG SALAH DENGAN "BAIK / CUKUP / KURANG". Label seperti itu menyembunyikan
// tiga hal sekaligus, dan ketiganya menentukan apakah angkanya berarti:
//
//   1. TERHADAP SIAPA. Denyut istirahat 48 bpm adalah tanda kebugaran pada
//      pelari, dan tanda gangguan hantaran jantung pada orang berusia 75 tahun
//      yang memakai penyekat beta. Satu label untuk keduanya keliru pada salah
//      satunya, dan tampilan itu tidak pernah memberi tahu yang mana.
//
//   2. SEBERAPA TIDAK PASTI ALATNYA. Oksimeter pada jam tangan memiliki galat
//      beberapa persen, sehingga bacaan 94% dapat berarti 91% maupun 97%.
//      Menampilkannya sebagai satu angka bulat memberi kesan ketepatan yang
//      tidak dimiliki alatnya.
//
//   3. SEBERAPA BESAR RAGAM HARIANNYA. Inilah yang paling sering diabaikan.
//      HRV berayun belasan sampai dua puluhan persen dari hari ke hari pada
//      orang yang sama dan sehat. Menampilkan panah turun untuk selisih
//      sebesar itu bukan sekadar tidak berguna — ia mengajari orang menafsirkan
//      derau sebagai sinyal, lalu mengubah latihan bahkan obatnya berdasarkan
//      derau tersebut.
//
// TENTANG SUMBER. Angka-angka di bawah ini adalah NILAI LAZIM yang dipakai
// dalam ajaran klinis dan fisiologi olahraga baku, bukan kutipan dari satu
// penelitian tertentu, dan ditulis apa adanya sebagai demikian. Mencantumkan
// nama penulis dan tahun untuk angka yang tidak benar-benar ditelusuri akan
// memberi kesan ketelitian yang tidak ada — dan itu justru kebalikan dari
// tujuan seluruh berkas ini.
//
// PERBANDINGAN YANG PALING BERGUNA BUKAN TERHADAP POPULASI. Untuk HRV dan
// denyut istirahat, ragam antarorang jauh lebih besar daripada ragam dalam
// satu orang. Karena itu yang ditampilkan lebih dahulu adalah perbandingan
// terhadap NILAI DASAR ANDA SENDIRI, dan rentang populasi hanya sebagai
// keterangan tambahan.
// ─────────────────────────────────────────────────────────────────────────────

const SUMBER_LAZIM = 'nilai lazim dalam ajaran klinis dan fisiologi olahraga baku, bukan kutipan satu penelitian'

/** Simpangan baku dalam satu orang dari hari ke hari, dipakai menghitung SDC. */
interface Ragam {
  /** Perkiraan simpangan baku harian dalam diri sendiri. */
  sdHarian: number
  keterangan: string
}

/**
 * Perubahan terkecil yang layak disebut nyata.
 *
 * Memakai kaidah baku pengukuran berulang: selisih dua pengukuran memiliki
 * simpangan baku √2 kali simpangan baku satu pengukuran, dan batas keyakinan
 * 95% berada pada 1,96 kali angka itu. Hasilnya sekitar 2,77 × sd.
 *
 * Angka inilah yang memutuskan boleh tidaknya sebuah panah ditampilkan.
 */
export function sdc(sdHarian: number): number {
  return Math.round(2.77 * sdHarian * 10) / 10
}

export interface BahanTubuh {
  restingHr?: number
  hrvMs?: number
  spo2Pct?: number
  systolic?: number
  diastolic?: number
  /** Rerata nilai dasar pemakai sendiri, bila ada cukup riwayat. */
  dasarRestingHr?: number
  dasarHrvMs?: number
  /** Usia dan jenis kelamin untuk memilih rentang yang tepat. */
  usia?: number
  sex?: 'M' | 'F'
}

const RAGAM_RHR: Ragam = {
  sdHarian: 3,
  keterangan: 'Denyut istirahat yang diukur jam tangan sepanjang malam berayun beberapa denyut dari malam ke malam pada orang yang sama dan sehat, tergantung suhu kamar, waktu makan terakhir, alkohol, dan mutu tidur.',
}

const RAGAM_HRV: Ragam = {
  sdHarian: 8,
  keterangan: 'HRV adalah ukuran yang paling berayun di antara seluruh tanda tubuh. Ragam antar-malam pada orang sehat lazimnya belasan sampai dua puluhan persen dari nilainya sendiri, sehingga selisih satu malam hampir selalu derau.',
}

export function auditDenyutIstirahat(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.restingHr !== 'number' || !Number.isFinite(b.restingHr)) return null
  const batas = sdc(RAGAM_RHR.sdHarian)
  const dasar = b.dasarRestingHr

  return {
    label: 'Denyut istirahat',
    nilai: String(Math.round(b.restingHr)),
    satuan: 'bpm',
    tingkat: 'terukur',
    arti: 'Denyut jantung terendah yang tercatat saat tubuh benar-benar diam, umumnya pada tidur paruh kedua malam.',
    masukan: [
      { nama: 'Bacaan terbaru', nilai: `${Math.round(b.restingHr)} bpm`, sumber: 'jam tangan maupun catatan manual' },
      ...(dasar ? [{ nama: 'Nilai dasar Anda sendiri', nilai: `${Math.round(dasar)} bpm`, sumber: 'rerata riwayat Anda' }] : []),
    ],
    ketidakpastian: {
      sdc: `Selisih di bawah ${batas} bpm terhadap nilai dasar Anda sendiri tidak layak ditafsirkan.`,
      dasar: `${RAGAM_RHR.keterangan} Batas ${batas} bpm dihitung sebagai 2,77 × simpangan baku harian ${RAGAM_RHR.sdHarian} bpm, kaidah baku untuk membedakan perubahan nyata dari ragam pengukuran.`,
    },
    rujukan: {
      rentang: '60-100 bpm pada dewasa; 40-60 bpm lazim pada orang yang terlatih daya tahan',
      populasi: 'dewasa umum; rentang bawah berlaku bagi yang berlatih daya tahan teratur',
      sumber: SUMBER_LAZIM,
    },
    tidakDipengaruhi: [
      'Kebugaran satu sesi. Denyut istirahat mencerminkan penyesuaian berminggu-minggu, bukan latihan kemarin.',
      'Jumlah langkah harian.',
    ],
    yangMenggerakkan: [
      'Latihan daya tahan teratur — menurunkannya perlahan selama berminggu-minggu sampai berbulan-bulan.',
      'Alkohol malam sebelumnya, demam, dehidrasi, dan kurang tidur — menaikkannya untuk sementara.',
      'Obat: penyekat beta menurunkan, obat asma golongan agonis beta dan dekongestan menaikkan.',
      'Suhu kamar dan waktu makan terakhir.',
    ],
    batasan: [
      'Rentang 60-100 bpm berasal dari kelaziman, bukan dari data akibat kesehatan. Nilai 95 bpm berada di dalam rentang itu namun tetap lebih tinggi risikonya daripada 60 bpm.',
      'Angka ini TIDAK DAPAT DIPAKAI MENILAI KEBUGARAN ANTARORANG. Sebagiannya diwariskan; ada orang bugar dengan denyut 65 dan orang tidak bugar dengan denyut 55.',
      'Bila Anda memakai penyekat beta maupun obat jantung lain, seluruh penafsiran di atas berubah dan harus dibicarakan dengan dokter yang meresepkannya.',
      'Denyut istirahat yang menetap di atas 100 bpm, maupun di bawah 40 bpm disertai pusing atau pingsan, adalah alasan memeriksakan diri — bukan alasan menyesuaikan latihan.',
    ],
  }
}

export function auditHrv(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.hrvMs !== 'number' || !Number.isFinite(b.hrvMs)) return null
  const batas = sdc(RAGAM_HRV.sdHarian)

  return {
    label: 'HRV',
    nilai: String(Math.round(b.hrvMs)),
    satuan: 'ms',
    tingkat: 'terukur',
    arti: 'Ragam jarak antardenyut jantung. Mencerminkan seberapa besar pengaruh saraf parasimpatis — bagian susunan saraf yang menenangkan — pada saat pengukuran.',
    skala: 'Nilainya sangat berbeda antarorang dan sangat bergantung usia. PERBANDINGAN YANG BERMAKNA HANYA TERHADAP RIWAYAT ANDA SENDIRI; membandingkan HRV dengan orang lain hampir tidak berarti apa-apa.',
    masukan: [
      { nama: 'Bacaan terbaru', nilai: `${Math.round(b.hrvMs)} ms`, sumber: 'jam tangan' },
      ...(b.dasarHrvMs ? [{ nama: 'Nilai dasar Anda sendiri', nilai: `${Math.round(b.dasarHrvMs)} ms`, sumber: 'rerata riwayat Anda' }] : []),
    ],
    ketidakpastian: {
      sdc: `Selisih di bawah kira-kira ${batas} ms terhadap nilai dasar Anda sendiri adalah derau, bukan perubahan.`,
      dasar: `${RAGAM_HRV.keterangan} Karena itu satu malam tidak pernah cukup: yang layak dibaca adalah rerata tujuh hari, bukan angka semalam.`,
    },
    rujukan: {
      rentang: 'Sangat lebar dan menurun seiring usia; puluhan milidetik pada dewasa muda, jauh lebih rendah pada usia lanjut. Tidak ada satu rentang yang berlaku untuk semua orang.',
      populasi: 'bergantung usia, jenis kelamin, cara pengukuran, dan alat — nilai dari jam tangan tidak dapat disamakan dengan pengukuran laboratorium',
      sumber: SUMBER_LAZIM,
    },
    tidakDipengaruhi: [
      'Jumlah langkah dan kalori harian.',
      'Berat badan dalam jangka pendek.',
    ],
    yangMenggerakkan: [
      'Alkohol — menurunkannya dengan sangat jelas, sering merupakan pengaruh tunggal terbesar yang terlihat pada data perorangan.',
      'Latihan berat pada hari sebelumnya, sakit, demam, dan kurang tidur — menurunkan sementara.',
      'Makan berat menjelang tidur dan suhu kamar yang panas.',
      'Beban pikiran dan kecemasan.',
      'Latihan daya tahan teratur — menaikkannya perlahan selama berbulan-bulan.',
    ],
    batasan: [
      'ANGKA SEMALAM HAMPIR TIDAK BERARTI APA-APA. Yang berarti adalah arah rerata tujuh hari terhadap rerata sebulan.',
      'Nilai dari jam tangan bergantung pada cara alat menghitungnya dan pada bagian malam mana yang diambil; membandingkan angka dari dua merek alat berbeda tidak sah.',
      'Nilai rendah TIDAK berarti sakit, dan nilai tinggi TIDAK berarti sehat. Ada orang sehat yang nilainya rendah sepanjang hidupnya.',
      'Tidak dapat dipakai untuk mendiagnosis apa pun. Ia hanya penanda kasar keadaan saraf otonom pada malam itu.',
    ],
  }
}

export function auditSpo2(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.spo2Pct !== 'number' || !Number.isFinite(b.spo2Pct)) return null
  const v = Math.round(b.spo2Pct)

  return {
    label: 'Saturasi oksigen',
    nilai: String(v),
    satuan: '%',
    tingkat: 'terukur',
    arti: 'Perkiraan persentase hemoglobin yang mengikat oksigen, dibaca dari penyerapan cahaya menembus kulit.',
    masukan: [{ nama: 'Bacaan terbaru', nilai: `${v}%`, sumber: 'oksimeter pada jam tangan maupun alat jari' }],
    ketidakpastian: {
      sdc: `Bacaan ${v}% sebaiknya dibaca sebagai kira-kira ${v - 3}% sampai ${v + 3}%, dan tidak lebih tepat dari itu.`,
      dasar: 'Oksimeter denyut mengukur cahaya yang menembus jaringan, bukan kadar oksigen darah secara langsung. Galat khasnya beberapa persen, dan pada alat konsumen lebih besar daripada alat rumah sakit.',
    },
    rujukan: {
      rentang: '95-100% pada orang sehat di dataran rendah',
      populasi: 'dewasa sehat tanpa penyakit paru maupun jantung, di ketinggian mendekati permukaan laut',
      sumber: SUMBER_LAZIM,
    },
    tidakDipengaruhi: ['Kebugaran dan latihan.', 'Tidur, kecuali bila ada henti napas saat tidur.'],
    yangMenggerakkan: [
      'Ketinggian tempat — turun secara wajar di dataran tinggi.',
      'Penyakit paru dan jantung.',
      'Henti napas saat tidur — menurunkannya berulang kali sepanjang malam.',
    ],
    batasan: [
      'KETEPATANNYA MENURUN PADA KULIT BERWARNA LEBIH GELAP, dan kecenderungannya adalah MEMBACA TERLALU TINGGI. Ini kekeliruan alat yang sudah lama didokumentasikan dan bermakna klinis, sebab kekurangan oksigen dapat terlewat justru pada orang yang paling perlu diketahui.',
      'Kuku berwarna, tangan dingin, gerakan, dan alat yang longgar semuanya membuat bacaan tidak dapat dipercaya.',
      'Alat konsumen TIDAK DIRANCANG untuk mengambil keputusan medis. Bacaan rendah yang mengejutkan sebaiknya diulang dengan tangan hangat dan alat yang pas sebelum disimpulkan.',
      'Sesak napas yang nyata dengan saturasi yang terbaca normal tetap harus diperiksakan — keluhan mendahului angka.',
    ],
  }
}

export function auditTekananDarah(b: BahanTubuh): AngkaKlinis | null {
  if (typeof b.systolic !== 'number' || typeof b.diastolic !== 'number') return null
  const s = Math.round(b.systolic), d = Math.round(b.diastolic)

  return {
    label: 'Tekanan darah',
    nilai: `${s}/${d}`,
    satuan: 'mmHg',
    tingkat: 'terukur',
    arti: 'Tekanan dalam pembuluh arteri saat jantung memompa dan saat jantung mengisi.',
    masukan: [{ nama: 'Bacaan terbaru', nilai: `${s}/${d} mmHg`, sumber: 'tensimeter' }],
    ketidakpastian: {
      sdc: 'Selisih di bawah kira-kira 8 mmHg antara dua pengukuran belum layak ditafsirkan.',
      dasar: 'Tekanan darah berayun sepanjang hari dan dari pengukuran ke pengukuran. Karena itu diagnosis tidak pernah ditegakkan dari satu bacaan.',
    },
    rujukan: {
      rentang: 'Optimal di bawah 120/80 mmHg; tinggi bila 140/90 mmHg atau lebih pada pengukuran di fasilitas kesehatan, dan 135/85 mmHg atau lebih pada pengukuran di rumah',
      populasi: 'dewasa; ambang di rumah memang lebih rendah karena bacaan di rumah rata-rata lebih rendah daripada di klinik',
      sumber: 'Pedoman hipertensi PERKI 2021 dan ajaran klinis baku',
    },
    tidakDipengaruhi: ['Kebugaran dalam jangka pendek.', 'Satu sesi latihan.'],
    yangMenggerakkan: [
      'Garam, berat badan, alkohol, dan kurang gerak.',
      'Nyeri, kecemasan, kandung kemih penuh, dan berbicara saat diukur — semuanya menaikkan untuk sementara.',
      'Kopi dan rokok dalam 30 menit terakhir.',
      'Obat: penurun tekanan darah, dan sebaliknya dekongestan serta obat antiinflamasi nonsteroid yang menaikkan.',
    ],
    batasan: [
      'SATU BACAAN TIDAK MENEGAKKAN APA PUN. Diagnosis memerlukan pengukuran berulang pada hari yang berbeda, dan sebaiknya di rumah.',
      'Cara mengukur menentukan hasilnya: duduk bersandar lima menit lebih dahulu, kaki menapak lantai, lengan disangga setinggi jantung, manset seukuran lengan, dan tidak berbicara. Manset yang terlalu kecil membuat bacaan terlalu tinggi.',
      'Tekanan darah 180/110 mmHg atau lebih, terlebih disertai nyeri dada, sesak, nyeri kepala hebat, gangguan penglihatan, maupun kelemahan sesisi, adalah alasan mencari pertolongan segera — bukan alasan mengulang pengukuran.',
    ],
  }
}

/** Seluruh angka tubuh yang datanya tersedia, siap ditampilkan. */
export function auditTubuh(b: BahanTubuh): AngkaKlinis[] {
  return [
    auditDenyutIstirahat(b),
    auditHrv(b),
    auditTekananDarah(b),
    auditSpo2(b),
  ].filter((x): x is AngkaKlinis => x !== null)
}
