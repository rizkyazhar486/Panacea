// ─────────────────────────────────────────────────────────────────────────────
// Rupa tiap kelompok fitur — warna, nama tampilan, dan urutannya.
//
// KENAPA INI BERKAS TERSENDIRI, DAN BUKAN DIUBAH DI TEMPATNYA.
//
// Medan `kategori` pada tiap widget adalah KUNCI: ia dipakai untuk
// mengelompokkan, untuk id jangkar bagian, dan dibandingkan dengan ===.
// Menggantinya berarti memutus semua itu tanpa satu galat pun muncul — persis
// jenis kerusakan yang sudah tercatat di CLAUDE.md. Jadi kuncinya dibiarkan
// apa adanya, dan yang dipetakan di sini hanya NAMA YANG TAMPIL, warnanya, dan
// urutannya.
//
// DUA HAL YANG DIUBAH OLEH BERKAS INI:
//
//   1. WARNA. Sebelumnya seluruh lambang fitur memakai satu latar abu-abu yang
//      sama, dan halaman berisi dua ratus lambang identik terbaca seperti
//      daftar inventaris, bukan seperti tempat yang ingin dijelajahi. Warna
//      per kelompok membuat mata menemukan bagiannya tanpa membaca judulnya —
//      dan itu bukan hiasan, itu navigasi.
//
//   2. NAMA DAN URUTANNYA. "Clinical & Learning" menempatkan pembacanya
//      sebagai klinisi. Aplikasi ini dipakai orang yang ingin hidup lebih
//      sehat, dan sebagian besar dari mereka bukan klinisi. Isinya sama
//      persis; yang berubah cara ia memperkenalkan dirinya — dari klinis
//      menjadi PENGETAHUAN. Dan olahraga naik ke urutan pertama, sebab itu
//      yang paling sering benar-benar dibuka.
// ─────────────────────────────────────────────────────────────────────────────

export interface Rupa {
  /** Nama yang tampil. Kuncinya tidak ikut berubah. */
  label: string
  emoji: string
  /** Latar lambang. */
  bg: string
  /** Warna judul bagiannya. */
  teks: string
  /** Garis tipis penanda bagian. */
  garis: string
}

/** Urutan tampil. Yang tidak disebut di sini muncul sesudahnya, apa adanya. */
export const URUTAN = [
  'Training',
  'Nutrition',
  'Sleep & Recovery',
  'Mind & Habits',
  'Body & Data',
  'Prevention & Screening',
  'Clinical & Learning',
  'Calculators & Scores',
  'Services & Emergency',
  'Faith & Life',
]

export const RUPA: Record<string, Rupa> = {
  'Training': {
    label: 'Move & Train', emoji: '🏃',
    bg: 'bg-orange-400/25', teks: 'text-orange-700 dark:text-orange-300', garis: 'bg-orange-400',
  },
  'Nutrition': {
    label: 'Eat Well', emoji: '🥗',
    bg: 'bg-lime-400/25', teks: 'text-lime-700 dark:text-lime-300', garis: 'bg-lime-400',
  },
  'Sleep & Recovery': {
    label: 'Sleep & Recover', emoji: '🌙',
    bg: 'bg-indigo-400/25', teks: 'text-indigo-700 dark:text-indigo-300', garis: 'bg-indigo-400',
  },
  'Mind & Habits': {
    label: 'Mind & Habits', emoji: '🧘',
    bg: 'bg-violet-400/25', teks: 'text-violet-700 dark:text-violet-300', garis: 'bg-violet-400',
  },
  'Body & Data': {
    label: 'Your Body', emoji: '📈',
    bg: 'bg-teal-400/25', teks: 'text-teal-700 dark:text-teal-300', garis: 'bg-teal-400',
  },
  'Prevention & Screening': {
    label: 'Stay Ahead', emoji: '🛡️',
    bg: 'bg-sky-400/25', teks: 'text-sky-700 dark:text-sky-300', garis: 'bg-sky-400',
  },
  // Nama lamanya menempatkan pembacanya sebagai klinisi. Isinya tidak berubah
  // sama sekali — hanya perkenalannya.
  'Clinical & Learning': {
    label: 'Learn & Look Up', emoji: '📚',
    bg: 'bg-amber-400/25', teks: 'text-amber-700 dark:text-amber-300', garis: 'bg-amber-400',
  },
  'Calculators & Scores': {
    label: 'Work It Out', emoji: '🧮',
    bg: 'bg-cyan-400/25', teks: 'text-cyan-700 dark:text-cyan-300', garis: 'bg-cyan-400',
  },
  'Services & Emergency': {
    label: 'Help & Services', emoji: '🤝',
    bg: 'bg-rose-400/25', teks: 'text-rose-700 dark:text-rose-300', garis: 'bg-rose-400',
  },
  'Faith & Life': {
    label: 'Faith & Life', emoji: '🕊️',
    bg: 'bg-emerald-400/25', teks: 'text-emerald-700 dark:text-emerald-300', garis: 'bg-emerald-400',
  },
}

const CADANGAN: Rupa = {
  label: '', emoji: '✨',
  bg: 'bg-neutral-200/60 dark:bg-white/10', teks: 'text-neutral-700 dark:text-neutral-200', garis: 'bg-neutral-400',
}

export function rupa(kategori: string): Rupa {
  const r = RUPA[kategori]
  // Kelompok yang belum diberi rupa tetap tampil, memakai namanya sendiri —
  // jangan sampai fitur baru menghilang hanya karena berkas ini belum
  // menyusul. Kesalahan itu sudah pernah terjadi pada daftar widget beranda.
  return r ?? { ...CADANGAN, label: kategori }
}

export function urutkanKategori(kategori: string[]): string[] {
  return [...kategori].sort((a, b) => {
    const ia = URUTAN.indexOf(a)
    const ib = URUTAN.indexOf(b)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
}
