import { RESPIRATORY_SEGMENT_IDS } from './anatomy/respiratoryAtlas'

// Ventilasi regional per segmen bronkopulmoner, berjalan dalam waktu.
//
// Atlas sudah memuat 18 segmen dengan bronkusnya masing-masing, tetapi tidak
// ada satu pun besaran fisiologis yang berjalan di atasnya: tidak ada
// resistensi, tidak ada komplians, tidak ada tetapan waktu. Segmennya bisa
// disorot, dan itu saja. Modul ini memberi mereka perilaku.
//
// APA YANG DIMODELKAN, dan kenapa bentuknya begini:
//
// Setiap segmen diperlakukan sebagai satu kompartemen berkomplians C yang
// diisi lewat satu saluran berresistensi R. Itu model RC, dan dipilih justru
// karena ia punya penyelesaian analitik:
//
//     V(t) = V_akhir * (1 - exp(-t / RC))
//
// Integrator numeriknya kemudian diuji terhadap rumus itu, bukan terhadap
// keluarannya sendiri kemarin. Model tanpa kebenaran acuan hanya bisa diperiksa
// "kelihatan wajar", dan itu bukan pemeriksaan.
//
// Resistensinya mengikuti Poiseuille, R sebanding dengan 1/r^4. Konsekuensinya
// tidak ditulis sebagai angka hafalan di mana pun: ia JATUH SENDIRI dari
// pangkat empat itu, dan uji pendampingnya memeriksa bahwa menyempitkan jari-
// jari menjadi setengah melipatgandakan resistensi tepat 16 kali.
//
// BATAS, supaya tidak diklaim lebih:
//
//   * Ini bukan pasien. Tidak ada masukan dari siapa pun, dan keluarannya
//     tidak boleh dibaca sebagai fungsi paru seseorang.
//   * Satu kompartemen per segmen adalah penyederhanaan yang besar. Paru
//     sungguhan punya interdependensi jaringan, ventilasi kolateral lewat pori
//     Kohn, dan gradien gravitasi yang tidak ada di sini.
//   * Geometri atlas TIDAK diubah oleh modul ini. Tidak ada yang mengembang,
//     mengempis, atau bergerak; yang berubah hanya keadaan yang ditampilkan di
//     atas anatomi yang tetap. Itu batas yang sudah dipegang Body Exposure dan
//     modul ini tidak melanggarnya.

/** Jari-jari dan komplians relatif, bukan satuan mutlak. */
export interface SegmenVentilasi {
  /** id yang SAMA persis dengan simpul atlas, supaya keduanya tidak bisa berpisah. */
  id: string
  label: string
  sisi: 'kiri' | 'kanan'
  /** Jari-jari saluran relatif terhadap segmen rujukan, 0..1. */
  jariJari: number
  /** Komplians relatif segmen, 0..1. */
  komplians: number
}

/**
 * Resistensi menurut Poiseuille.
 *
 * R = 8 * eta * L / (pi * r^4). Panjang dan viskositas dilipat menjadi satu
 * tetapan karena yang dipakai di sini hanya PERBANDINGAN antar segmen; nilai
 * mutlaknya tidak diklaim.
 */
export const TETAPAN_POISEUILLE = 1

export function resistensi(jariJari: number): number {
  if (!(jariJari > 0)) return Number.POSITIVE_INFINITY
  return TETAPAN_POISEUILLE / Math.pow(jariJari, 4)
}

/** Tetapan waktu pengisian, tau = R * C. */
export function tetapanWaktu(jariJari: number, komplians: number): number {
  const r = resistensi(jariJari)
  if (!Number.isFinite(r) || !(komplians > 0)) return Number.POSITIVE_INFINITY
  return r * komplians
}

/**
 * Penyempitan saluran.
 *
 * `pecahan` adalah bagian jari-jari yang HILANG: 0 berarti normal, 0,5 berarti
 * jari-jarinya tinggal separuh. Dipilih sebagai pecahan jari-jari, bukan
 * pecahan resistensi, karena itulah besaran yang punya arti anatomis -- dan
 * karena hubungan pangkat empatnya justru yang ingin diperlihatkan.
 */
export function jariJariTersumbat(jariJari: number, pecahan: number): number {
  const p = Math.min(Math.max(pecahan, 0), 0.99)
  return jariJari * (1 - p)
}

/** Pengisian analitik sebuah segmen pada waktu t. */
export function isiAnalitik(tau: number, waktu: number): number {
  if (!Number.isFinite(tau) || tau <= 0) return 0
  if (!(waktu > 0)) return 0
  return 1 - Math.exp(-waktu / tau)
}

/** Satu langkah Euler maju untuk pengisian satu segmen. */
export function langkahIsi(isi: number, tau: number, dt: number): number {
  if (!Number.isFinite(tau) || tau <= 0) return isi
  return isi + dt * ((1 - isi) / tau)
}

export interface KeadaanVentilasi {
  waktu: number
  /** Pecahan pengisian tiap segmen, 0..1, dengan kunci id segmen. */
  isi: Record<string, number>
}

export function mulaiVentilasi(segmen: readonly SegmenVentilasi[]): KeadaanVentilasi {
  const isi: Record<string, number> = {}
  for (const s of segmen) isi[s.id] = 0
  return { waktu: 0, isi }
}

/**
 * Majukan seluruh segmen sebesar dt.
 *
 * `penyempitan` memetakan id segmen ke pecahan jari-jari yang hilang. Segmen
 * yang tidak disebut berjalan normal.
 */
export function langkahVentilasi(
  keadaan: KeadaanVentilasi,
  segmen: readonly SegmenVentilasi[],
  dt: number,
  penyempitan: Record<string, number> = {},
): KeadaanVentilasi {
  if (!(dt > 0)) return keadaan
  const isi: Record<string, number> = {}
  for (const s of segmen) {
    const r = jariJariTersumbat(s.jariJari, penyempitan[s.id] ?? 0)
    isi[s.id] = langkahIsi(keadaan.isi[s.id] ?? 0, tetapanWaktu(r, s.komplians), dt)
  }
  return { waktu: keadaan.waktu + dt, isi }
}

/**
 * Segmen bronkopulmoner sebagai kompartemen ventilasi.
 *
 * Jari-jari dan komplians di sini adalah nilai RELATIF yang seragam, bukan
 * pengukuran per segmen. Tidak ada sumber yang memberi jari-jari bronkus
 * segmental per segmen secara konsisten, dan mengarang delapan belas angka
 * berbeda akan membuat modul ini terdengar lebih tahu daripada bidangnya.
 * Yang dimodelkan adalah PERILAKUNYA terhadap penyempitan, dan itu tidak
 * menuntut nilai dasar yang berbeda-beda.
 */
export const SEGMEN_VENTILASI: readonly SegmenVentilasi[] = [
  { id: 'resp:segment:r-s1', label: 'Right S1 apical', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s2', label: 'Right S2 posterior', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s3', label: 'Right S3 anterior', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s4', label: 'Right S4 lateral', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s5', label: 'Right S5 medial', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s6', label: 'Right S6 superior', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s7', label: 'Right S7 medial basal', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s8', label: 'Right S8 anterior basal', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s9', label: 'Right S9 lateral basal', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:r-s10', label: 'Right S10 posterior basal', sisi: 'kanan', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s1-2', label: 'Left S1+2 apicoposterior', sisi: 'kiri', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s3', label: 'Left S3 anterior', sisi: 'kiri', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s4', label: 'Left S4 superior lingular', sisi: 'kiri', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s5', label: 'Left S5 inferior lingular', sisi: 'kiri', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s6', label: 'Left S6 superior', sisi: 'kiri', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s7-8', label: 'Left S7+8 anteromedial basal', sisi: 'kiri', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s9', label: 'Left S9 lateral basal', sisi: 'kiri', jariJari: 1, komplians: 1 },
  { id: 'resp:segment:l-s10', label: 'Left S10 posterior basal', sisi: 'kiri', jariJari: 1, komplians: 1 },
]

/** Segmen yang dipakai modul ini harus sama persis dengan segmen atlas. */
export function segmenTidakSelaras(): string[] {
  const atlas = new Set(RESPIRATORY_SEGMENT_IDS)
  const punyaKita = new Set(SEGMEN_VENTILASI.map((s) => s.id))
  return [
    ...[...atlas].filter((id) => !punyaKita.has(id)).map((id) => `hanya di atlas: ${id}`),
    ...[...punyaKita].filter((id) => !atlas.has(id)).map((id) => `hanya di ventilasi: ${id}`),
  ]
}
