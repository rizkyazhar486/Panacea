// Dari tumpukan DICOM menjadi 3D: skala Hounsfield, jendela, dan dua cara
// merender.
//
// KENAPA INI DIHITUNG, BUKAN DIGAMBARKAN DENGAN KATA. Yang menentukan apa yang
// muncul pada rekonstruksi 3D dari CT bukan "kecanggihan" perangkat lunaknya,
// melainkan satu keputusan yang sangat sederhana dan sangat menentukan: AMBANG
// HOUNSFIELD mana yang dipilih. Menggeser ambang bawah beberapa ratus HU
// mengubah tulang menjadi tulang+pembuluh, atau menghapus separuh isi rongga.
// Itu pernyataan tentang angka, jadi ia harus dihitung.
//
// Skala Hounsfield DIDEFINISIKAN, bukan diukur:
//
//   HU = 1000 x (mu - mu_air) / (mu_air - mu_udara)
//
// sehingga air tepat 0 HU dan udara tepat -1000 HU menurut definisi. Itulah
// dua satu-satunya angka pasti di berkas ini; sisanya rentang khas yang
// bergantung pada mesin, kV, filter rekonstruksi dan kontras.

/** Dua titik kalibrasi yang berlaku menurut DEFINISI, bukan hasil ukur. */
export const TITIK_KALIBRASI_HU = {
  udara: -1000,
  air: 0,
} as const

export interface KelasJaringan {
  nama: string
  /** Rentang HU khas. Perkiraan, bergantung mesin dan protokol. */
  min: number
  maks: number
  catatan: string
}

/**
 * Rentang HU khas per kelas jaringan.
 *
 * Ini nilai rujukan yang lazim dikutip di fisika CT, BUKAN pengukuran pada
 * seseorang. Tumpang-tindih antar kelas memang nyata dan sengaja tidak
 * dirapikan: darah beku dan otot benar-benar bertabrakan, dan itulah sebabnya
 * satu ambang tidak pernah memisahkan jaringan dengan bersih.
 */
export const KELAS_JARINGAN: readonly KelasJaringan[] = [
  { nama: 'Air (lung, bowel gas)', min: -1000, maks: -600, catatan: 'Air is fixed at -1000 HU by definition; aerated lung sits just above it.' },
  { nama: 'Fat', min: -120, maks: -90, catatan: 'Reliably negative, which is what separates fat from almost everything else.' },
  { nama: 'Water / CSF', min: -5, maks: 20, catatan: 'Water is fixed at 0 HU by definition. CSF sits a few HU above it.' },
  { nama: 'Soft tissue / muscle', min: 20, maks: 60, catatan: 'Muscle, kidney, unclotted blood and grey matter all live here and overlap.' },
  { nama: 'Liver', min: 50, maks: 70, catatan: 'Usually a little denser than surrounding soft tissue on unenhanced CT.' },
  { nama: 'Contrast-filled vessel', min: 100, maks: 500, catatan: 'Only present when iodinated contrast was actually given — never assume it.' },
  { nama: 'Cancellous bone', min: 300, maks: 500, catatan: 'Trabecular bone overlaps strongly with dense contrast.' },
  { nama: 'Cortical bone', min: 500, maks: 1900, catatan: 'The widest class; dense cortex approaches the top of the usual scale.' },
  { nama: 'Metal / implant', min: 2000, maks: 3000, catatan: 'Beyond the usual range, and the usual source of streak artefact.' },
]

export interface Jendela {
  /** Ambang bawah, HU. */
  bawah: number
  /** Ambang atas, HU. */
  atas: number
}

/** Lebar jendela: berapa rentang HU yang dipetakan ke seluruh rentang abu-abu. */
export function lebarJendela(j: Jendela): number {
  if (!Number.isFinite(j.bawah) || !Number.isFinite(j.atas)) return Number.NaN
  return j.atas - j.bawah
}

/** Titik tengah jendela. Bersama lebarnya, inilah "window width / level" radiologi. */
export function levelJendela(j: Jendela): number {
  if (!Number.isFinite(j.bawah) || !Number.isFinite(j.atas)) return Number.NaN
  return (j.bawah + j.atas) / 2
}

/**
 * Keabuan 0..1 untuk satu nilai HU pada jendela tertentu.
 *
 * Di bawah ambang bawah semuanya menjadi hitam yang sama; di atas ambang atas
 * semuanya menjadi putih yang sama. Itulah yang membuat jendela sempit
 * memperlihatkan beda halus sekaligus MEMBUANG segalanya di luar rentangnya --
 * informasi yang hilang tidak bisa dikembalikan dengan mengatur layar.
 */
export function keabuan(hu: number, j: Jendela): number {
  const l = lebarJendela(j)
  if (!Number.isFinite(hu) || !Number.isFinite(l) || l <= 0) return Number.NaN
  if (hu <= j.bawah) return 0
  if (hu >= j.atas) return 1
  return (hu - j.bawah) / l
}

/** Kelas jaringan yang SEBAGIAN atau seluruhnya masuk ke dalam jendela. */
export function kelasDalamJendela(j: Jendela): KelasJaringan[] {
  if (!Number.isFinite(j.bawah) || !Number.isFinite(j.atas) || j.atas <= j.bawah) return []
  return KELAS_JARINGAN.filter((k) => k.maks >= j.bawah && k.min <= j.atas)
}

/**
 * Berapa bagian rentang sebuah kelas yang tertangkap jendela ini, 0..1.
 *
 * Dipakai untuk mengatakan "sebagian" alih-alih "ya/tidak": ambang yang
 * memotong tulang kortikal di tengah akan memunculkan sebagian permukaannya
 * saja, dan itu terlihat seperti anatomi yang berlubang.
 */
export function cakupanKelas(kelas: KelasJaringan, j: Jendela): number {
  const l = kelas.maks - kelas.min
  if (l <= 0) return 0
  const irisan = Math.min(kelas.maks, j.atas) - Math.max(kelas.min, j.bawah)
  return Math.max(0, Math.min(1, irisan / l))
}

export type CaraRender = 'permukaan' | 'volume'

export interface SifatRender {
  cara: CaraRender
  judul: string
  bagaimana: string
  kuat: string
  lemah: string
}

/**
 * Dua cara merender yang berbeda secara mendasar, bukan dua gaya visual.
 *
 * Permukaan membuang volumenya: ia memilih SATU nilai ambang, menarik selubung
 * di situ, dan sesudah itu yang tersisa hanya kulit poligon -- semua nilai di
 * dalamnya hilang. Volume tidak membuang apa pun; ia menembakkan sinar dan
 * menjumlahkan seluruh nilai sepanjang jalur lewat fungsi transfer.
 */
export const CARA_RENDER: readonly SifatRender[] = [
  {
    cara: 'permukaan',
    judul: 'Surface rendering (isosurface)',
    bagaimana: 'Pick one threshold, extract the surface that sits exactly at that value, and keep only that shell of polygons.',
    kuat: 'Fast, easy to light and rotate, and the result can be exported as a mesh and measured.',
    lemah: 'Everything inside the shell is discarded. A structure that straddles the threshold appears perforated, and a hole in the surface can mean a hole in the choice of threshold rather than a hole in the body.',
  },
  {
    cara: 'volume',
    judul: 'Volume rendering (ray casting)',
    bagaimana: 'Cast a ray through every voxel and accumulate colour and opacity along it using a transfer function, keeping the whole volume.',
    kuat: 'Nothing is thrown away, so overlapping densities stay visible and soft gradients survive.',
    lemah: 'There is no mesh and no surface to measure, it costs far more computation, and the transfer function changes the picture as strongly as the anatomy does.',
  },
]
