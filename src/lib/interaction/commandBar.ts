// Bilah perintah yang menyingkir saat dibaca, dan kembali saat dicari.
//
// SATU JEBAKAN YANG MEMBUAT POLA INI GAGAL, DAN ALASAN BERKAS INI ADA.
// Bilah yang disembunyikan dengan `transform: translateY(-100%)` tidak lagi
// berada di bawah penunjuk, jadi `:hover` PADA BILAH ITU SENDIRI tidak akan
// pernah menyala: tidak ada yang bisa mengarahkan kursor ke sesuatu yang sudah
// pergi dari layar. Karena itu yang memicu kemunculan bukan bilahnya,
// melainkan SEBUAH PITA di tepi atas viewport yang selalu ada — `revealZonePx`
// di bawah. Bilahnya menyingkir; daerah tangkapnya tidak.
//
// Dua pemicu lain wajib ada dan sering dilupakan:
//   1. papan ketik. Kalau fokus berada di dalam bilah, bilah tidak boleh
//      menyingkir — pengguna papan ketik akan kehilangan kendali yang sedang
//      ia pakai, dan fokusnya berpindah ke elemen yang tidak terlihat.
//   2. puncak halaman. Di y kecil bilah selalu tampil, apa pun arah gulirnya;
//      kalau tidak, memuat halaman sambil menggulir ke bawah sedikit langsung
//      menyembunyikan satu-satunya navigasi yang dimiliki halaman itu.

export type CommandBarState = 'shown' | 'hidden'

export interface CommandBarThresholds {
  /** Di bawah offset ini bilah selalu tampil; puncak halaman bukan tempat menyembunyikan navigasi. */
  alwaysVisibleBelowPx: number
  /** Pita tangkap di tepi atas viewport yang memanggil bilah kembali. */
  revealZonePx: number
  /** Gerak gulir sekecil ini diabaikan supaya bilah tidak berkedip saat jari bergetar. */
  ignoreDeltaPx: number
}

export const DEFAULT_COMMAND_BAR_THRESHOLDS: CommandBarThresholds = {
  alwaysVisibleBelowPx: 72,
  revealZonePx: 64,
  ignoreDeltaPx: 6,
}

export interface CommandBarInput {
  /** Posisi gulir sekarang. */
  scrollY: number
  /** Posisi gulir pada pembacaan sebelumnya. */
  previousScrollY: number
  /** Jarak penunjuk dari tepi atas viewport; null bila tidak ada penunjuk (sentuh). */
  pointerY: number | null
  /** Benar bila fokus papan ketik sedang berada di dalam bilah. */
  focusWithin: boolean
  /**
   * Benar bila pengguna baru saja MENGETUK pita tangkap di tepi atas.
   *
   * Sentuhan tidak punya hover: `pointerY` selalu null untuk jari, jadi pada
   * ponsel satu-satunya cara memanggil bilah kembali adalah menggulir ke atas.
   * Padahal ketukan di tepi atas adalah isyarat yang paling langsung dan yang
   * memang diminta. Ini jalurnya — sekali ketuk menampilkan, dan gulir ke
   * bawah berikutnya menyembunyikannya lagi seperti biasa.
   */
  tapAtTop?: boolean
}

/**
 * Menentukan keadaan bilah berikutnya.
 *
 * Urutannya disengaja: aksesibilitas dulu (fokus), lalu kepastian posisi
 * (puncak halaman), lalu niat pengguna (penunjuk), baru arah gulir.
 */
export function nextCommandBarState(
  current: CommandBarState,
  input: CommandBarInput,
  thresholds: CommandBarThresholds = DEFAULT_COMMAND_BAR_THRESHOLDS,
): CommandBarState {
  if (input.focusWithin) return 'shown'
  if (input.tapAtTop) return 'shown'
  if (input.scrollY <= thresholds.alwaysVisibleBelowPx) return 'shown'
  if (input.pointerY !== null && input.pointerY <= thresholds.revealZonePx) return 'shown'

  const delta = input.scrollY - input.previousScrollY
  if (Math.abs(delta) < thresholds.ignoreDeltaPx) return current
  return delta > 0 ? 'hidden' : 'shown'
}
