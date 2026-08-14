// ─────────────────────────────────────────────────────────────────────────────
// Angka yang dapat diperiksa.
//
// APA YANG SALAH DENGAN APLIKASI KESEHATAN KEBANYAKAN — dan dengan aplikasi ini
// sebelum berkas ini ada.
//
// WHOOP menampilkan "Recovery 62%". Oura menampilkan "Readiness 78". Garmin
// menampilkan "Body Battery 43". Ketiganya punya cacat yang sama, dan cacat itu
// bukan soal ketepatan melainkan soal EPISTEMIK: angka itu tidak dapat
// diperiksa oleh siapa pun. Anda tidak dapat melihat masukannya, tidak dapat
// melihat rumusnya, tidak dapat mengetahui satuannya, tidak dapat mengetahui
// seberapa besar ketidakpastiannya, dan — yang paling merugikan — tidak dapat
// mengetahui APA YANG TIDAK MEMPENGARUHINYA.
//
// Akibatnya terlihat dari keluhan yang sangat lazim: "saya sudah tidur sepuluh
// jam tetapi kebugaran saya tetap 26". Keluhan itu masuk akal sepenuhnya, dan
// jawabannya bukan "coba tidur lebih baik lagi" melainkan: TIDUR SAMA SEKALI
// BUKAN MASUKAN BAGI ANGKA ITU. Aplikasi yang menampilkan angka tidur dan angka
// kebugaran berdampingan, tanpa pernah menyatakan bahwa keduanya tidak
// berhubungan di dalam model, membuat orang menyalahkan tubuhnya sendiri atas
// sesuatu yang secara struktural memang tidak mungkin berubah.
//
// TIGA TINGKAT KEYAKINAN, dan pembedaannya bermakna klinis. Seorang dokter
// memperlakukan kalium yang DIUKUR berbeda dari laju filtrasi ginjal yang
// DIPERKIRAKAN dari rumus; aplikasi kebugaran menampilkan keduanya dengan huruf
// yang sama besar seolah setara.
//
//   terukur      Datang dari sensor maupun alat. Ketidakpastiannya adalah
//                ketidakpastian alatnya.
//   terhitung    Aritmetika pasti dari yang terukur. Tidak menambah asumsi,
//                hanya menambah rambatan galat.
//   termodelkan  Keluaran sebuah model dengan asumsi dan tetapan yang dipilih.
//                Dapat keliru meskipun seluruh masukannya benar.
//
// PERUBAHAN TERKECIL YANG BERMAKNA (smallest detectable change). Ini yang
// paling sering diabaikan. Ukuran seperti HRV memiliki ragam antar-malam yang
// besar; perubahan dari 42 ms menjadi 46 ms berada DI DALAM DERAU dan tidak
// berarti apa pun. Menampilkan panah naik untuk perubahan seperti itu bukan
// sekadar tidak berguna — ia mengajari orang menafsirkan derau sebagai sinyal,
// lalu mengubah latihannya berdasarkan derau tersebut.
// ─────────────────────────────────────────────────────────────────────────────

export type Tingkat = 'terukur' | 'terhitung' | 'termodelkan'

export interface Masukan {
  nama: string
  nilai: string
  /** Dari mana nilai ini berasal: nama alat, atau "dihitung". */
  sumber: string
  /** Kapan diambil, bila relevan. */
  waktu?: string
}

export interface Rujukan {
  /** Rentang yang dianggap lazim, ditulis apa adanya beserta satuannya. */
  rentang: string
  /**
   * POPULASI RUJUKANNYA WAJIB DISEBUT. Rentang tanpa keterangan populasi tidak
   * dapat dipakai: nilai lazim HRV pada laki-laki 25 tahun berbeda jauh dari
   * perempuan 55 tahun, dan menampilkan satu rentang untuk semua orang adalah
   * cara paling halus untuk membuat orang sehat merasa sakit.
   */
  populasi: string
  sumber: string
}

export interface Ketidakpastian {
  /** Perubahan terkecil yang layak dianggap nyata, beserta satuannya. */
  sdc: string
  /** Dari mana angka itu berasal. */
  dasar: string
}

export interface AngkaKlinis {
  label: string
  nilai: string
  /**
   * Satuan. Kosong berarti TIDAK BERSATUAN, dan bila demikian `skala` wajib
   * menjelaskan angkanya diukur terhadap apa. Angka tanpa satuan dan tanpa
   * penjelasan skala adalah bentuk paling murni dari angka yang tidak dapat
   * diperiksa.
   */
  satuan: string
  tingkat: Tingkat
  /** Satu kalimat: angka ini sebenarnya apa. */
  arti: string
  /**
   * Terhadap apa angka ini diukur. Wajib diisi bila `satuan` kosong.
   * Contoh: "tidak bersatuan; sebanding hanya dengan riwayat Anda sendiri".
   */
  skala?: string
  /** Rumusnya, dengan nilai yang sesungguhnya sudah disubstitusikan. */
  rumus?: string
  masukan?: Masukan[]
  rujukan?: Rujukan
  ketidakpastian?: Ketidakpastian
  /**
   * APA YANG TIDAK MEMPENGARUHI ANGKA INI.
   *
   * Bagian yang paling membedakan dari aplikasi kebugaran mana pun, dan yang
   * paling sering dibutuhkan. Orang menduga tidur, makan, dan suasana hati
   * mempengaruhi setiap angka kesehatan yang ditampilkan berdampingan. Bila
   * sebuah model memang tidak memakainya sebagai masukan, mendiamkan hal itu
   * berarti membiarkan orang menyimpulkan sendiri bahwa tubuhnya bermasalah.
   */
  tidakDipengaruhi?: string[]
  /** Apa yang benar-benar akan menggerakkannya, dan kira-kira sebesar apa. */
  yangMenggerakkan?: string[]
  /** Batasan yang jujur: kapan angka ini tidak boleh dipercaya. */
  batasan?: string[]
}

/** Warna dan label tingkat keyakinan — tetap sama di seluruh aplikasi. */
export const TINGKAT_INFO: Record<Tingkat, { label: string; nada: string; arti: string }> = {
  terukur: {
    label: 'Terukur',
    nada: 'bg-emerald-500',
    arti: 'Datang langsung dari sensor maupun alat ukur. Ketidakpastiannya adalah ketidakpastian alatnya.',
  },
  terhitung: {
    label: 'Terhitung',
    nada: 'bg-sky-500',
    arti: 'Aritmetika pasti dari angka yang terukur. Tidak menambah asumsi baru, hanya merambatkan galat masukannya.',
  },
  termodelkan: {
    label: 'Termodelkan',
    nada: 'bg-amber-500',
    arti: 'Keluaran sebuah model beserta asumsi dan tetapannya. Dapat keliru meskipun seluruh masukannya benar.',
  },
}

/**
 * Apakah sebuah perubahan layak disebut perubahan.
 *
 * Dipakai untuk memutuskan MENAMPILKAN PANAH ATAU TIDAK. Aplikasi yang
 * menampilkan panah untuk setiap selisih sekecil apa pun mengajari pemakainya
 * bahwa derau adalah sinyal — dan orang lalu mengubah latihan, jam tidur, dan
 * kadang obatnya berdasarkan derau itu.
 */
export function perubahanBermakna(selisih: number, sdc: number): boolean {
  return Math.abs(selisih) >= sdc
}

/**
 * Tetapan waktu model impuls-respons Banister, dinyatakan sekali di sini
 * supaya penjelasan dan perhitungan tidak pernah menyimpang satu sama lain.
 */
export const BANISTER = {
  tauKebugaran: 42,
  tauKelelahan: 7,
} as const
