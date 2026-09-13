// Rujukan: KaloLumen (Tomoki Itamiya).
//
// BERKAS INI ADALAH CATATAN RUJUKAN, BUKAN INTEGRASI. Panacea tidak memaketkan,
// memanggil, memuat, atau memegang lisensi KaloLumen. Tidak ada satu pun aset,
// tangkapan layar, mesh, atau berkas DICOM dari perangkat lunak itu yang masuk
// ke repositori ini.
//
// Yang dicatat di sini hanya hal-hal yang BENAR-BENAR DAPAT DIBACA pada unggahan
// publik penulisnya, sebagaimana ditunjukkan kepada pemilik repositori ini.
// Tidak ada tolok ukur yang diukur ulang oleh Panacea, dan tidak ada klaim yang
// diperhalus maupun dilebihkan.

export interface KlaimRujukan {
  /** Apa yang dinyatakan sumbernya, seringkas mungkin tanpa mengubah maknanya. */
  klaim: string
  /**
   * Bagaimana Panacea mengetahuinya. Ini bukan verifikasi independen: tidak ada
   * satu pun angka di bawah yang diukur ulang di sini.
   */
  asal: 'dinyatakan penulis' | 'terbaca pada antarmuka'
}

export const KALOLUMEN = {
  nama: 'KaloLumen',
  penulis: 'Tomoki Itamiya (板宮朋基)',
  kanal: 'Public posts by @t_itamiya on X',
  /**
   * TIDAK DIKETAHUI, dan karena itu tidak boleh diperlakukan aman untuk
   * produksi. Aturan provenans repositori ini melarang mengarang lisensi;
   * yang belum bisa dipastikan harus tercatat sebagai belum pasti.
   */
  lisensi: 'unresolved' as const,
  /**
   * Batas yang dinyatakan perangkat lunak itu SENDIRI, tercetak pada setiap
   * tangkapan layarnya. Batas ini ikut dibawa karena menghilangkannya saat
   * mengutip akan mengubah arti kutipannya.
   */
  batasPenulis: 'Educational and research use only. Not for clinical or diagnostic use.',
  klaim: [
    { klaim: 'Generates 3DCG automatically from DICOM CT and MRI data.', asal: 'dinyatakan penulis' },
    { klaim: 'Surface rendering can show three layers at once or switch between them.', asal: 'dinyatakan penulis' },
    { klaim: 'Volume rendering was added alongside surface rendering, sharing threshold and colour settings, so the two can be compared or overlaid.', asal: 'dinyatakan penulis' },
    { klaim: 'A free demo version is offered; it runs on a Windows PC with 6 GB or more VRAM.', asal: 'dinyatakan penulis' },
    { klaim: 'Threshold controls are exposed directly in Hounsfield units, with separate lower and upper bounds and a smoothing setting.', asal: 'terbaca pada antarmuka' },
    { klaim: 'A section-plane control and model rotation are exposed in the same interface.', asal: 'terbaca pada antarmuka' },
    { klaim: 'The multi-layer build runs on Acer Spatial Labs hardware.', asal: 'dinyatakan penulis' },
  ] satisfies KlaimRujukan[],
  /**
   * Ambang yang benar-benar terbaca pada antarmukanya. Dicatat karena ia
   * memperlihatkan sesuatu yang nyata: ambang dipilih PER JARINGAN, dan
   * rentangnya lebar.
   */
  ambangTerbaca: [
    { label: 'Bone', bawah: 713.2, atas: 1627.1, modalitas: 'CT' },
    { label: 'Bone', bawah: 333.5, atas: 1436.4, modalitas: 'CT' },
    { label: 'Skin', bawah: -757.9, atas: 1100.2, modalitas: 'CT' },
    { label: 'Soft', bawah: 152.6, atas: 173.7, modalitas: 'MRI' },
  ],
} as const

/**
 * Apa yang TIDAK dimiliki Panacea, dinyatakan sebagai data supaya tidak bisa
 * hilang diam-diam dari layar.
 *
 * Tanpa daftar ini, sebuah halaman yang menjelaskan pipeline DICOM->3D dengan
 * baik akan mudah terbaca sebagai halaman yang MENJALANKANNYA. Keduanya sangat
 * berbeda, dan yang kedua tidak benar.
 */
export const YANG_BELUM_DIMILIKI_PANACEA: readonly string[] = [
  'Panacea does not read DICOM files. No CT or MRI study is loaded, decoded or reconstructed anywhere on this page.',
  'Panacea does not bundle, call, embed or license KaloLumen, and none of its images or models are reproduced here.',
  'The Hounsfield window below is Panacea computing the published physics itself, on a reference scale — not a scan, and not anyone’s body.',
  'No number here was measured from a patient, and nothing here is a diagnosis or a clinical finding.',
]
