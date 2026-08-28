// ─────────────────────────────────────────────────────────────────────────────
// Penghitung hari — berapa lama sejak sesuatu terakhir dilakukan.
//
// BENTUK YANG SENGAJA DIPILIH, DAN YANG SENGAJA TIDAK.
//
// Yang dibuat: satu tanggal mulai, hitungan hari berjalan, dan CATATAN
// PERCOBAAN SEBELUMNYA. Menekan "mulai lagi" tidak menghapus apa pun — rentang
// yang sudah dijalani pindah ke riwayat dan tetap dihitung. Seseorang yang
// bertahan 40 hari lalu terputus TIDAK kembali ke nol pengalaman; ia punya 40
// hari yang pernah ia jalani, dan itu yang paling menentukan apakah ia mencoba
// lagi.
//
// Yang TIDAK dibuat, dan alasannya:
//   * Tidak ada lencana, tingkat, atau gelar. Semuanya mengubah tujuannya dari
//     keadaan menjadi angka, dan angka yang dikejar akan dibohongi.
//   * Tidak ada peringatan atau hukuman saat rangkaiannya terputus. Rasa malu
//     adalah mesin yang paling sering menghentikan orang mencoba lagi, dan
//     memasangnya ke dalam perangkat lunak berarti membuat kambuh terasa lebih
//     mahal daripada seharusnya.
//   * Tidak ada papan peringkat dan tidak ada berbagi. Ini urusan pribadi.
//   * Tidak ada klaim manfaat. Lihat catatan pada tiap jenis di bawah.
//
// SELURUHNYA TINGGAL DI ALAT INI. Tidak dikirim ke mana pun, tidak ikut
// tersinkron ke server, dan tidak muncul dalam ringkasan apa pun.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_hitung_hari_v1'

export interface JenisHitungan {
  id: string
  label: string
  emoji: string
  /**
   * Apa yang benar-benar diketahui tentang hal ini. Ditulis apa adanya,
   * termasuk ketika jawabannya "buktinya tipis" — penghitung hari yang
   * disertai janji yang tidak berdasar merugikan pemakainya dua kali.
   */
  catatan: string
}

export const JENIS: JenisHitungan[] = [
  {
    id: 'nofap',
    label: 'No masturbation / porn',
    emoji: '🧭',
    catatan:
      'Worth being straight about the evidence: claims of large hormonal or performance benefits from abstaining are not supported by good studies, and testosterone does not rise in any lasting way. What IS supported is narrower and still worth having — heavy pornography use is associated with difficulty with arousal to a real partner, and stepping away from it often helps that. Treat this as a habit you have chosen to change, not as a medical treatment. If the urge feels compulsive or is tied to distress, that is worth talking to someone about rather than counting alone.',
  },
  {
    id: 'rokok',
    label: 'No smoking',
    emoji: '🚭',
    catatan:
      'This one has the strongest evidence of anything on this list. Heart-attack risk begins falling within a day, lung function improves over months, and the excess risk of coronary disease roughly halves after a year. Nicotine replacement or varenicline roughly doubles the chance of success — willpower alone is the hardest route, not the most virtuous one.',
  },
  {
    id: 'alkohol',
    label: 'No alcohol',
    emoji: '🚫',
    catatan:
      'Sleep quality and overnight heart-rate variability usually improve within days, and liver enzymes over weeks. One warning that matters: if you have been drinking heavily every day, stopping abruptly can cause seizures and delirium tremens. That withdrawal is a medical situation and needs supervision, not a counter.',
  },
  {
    id: 'gula',
    label: 'No added sugar',
    emoji: '🍬',
    catatan:
      'The measurable benefits come from the total change in your diet, not from sugar being uniquely toxic. Cutting sugary drinks is the single change with the clearest evidence behind it.',
  },
  {
    id: 'gorengan',
    label: 'No fried food',
    emoji: '🍟',
    catatan: 'A reasonable habit to change, though what replaces it matters at least as much as what you removed.',
  },
  {
    id: 'begadang',
    label: 'No late nights',
    emoji: '🌙',
    catatan:
      'Of everything on this list, a fixed wake time is the change that moves Recovery, resting heart rate and Body Battery the most — and it shows up in those numbers within about a week.',
  },
]

export interface Rentang {
  mulai: string
  selesai: string
  hari: number
}

export interface Hitungan {
  jenisId: string
  mulai: string
  riwayat: Rentang[]
}

type Simpanan = Record<string, Hitungan>

export function baca(): Simpanan {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return {}
    const p = JSON.parse(raw) as Simpanan
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

function tulis(s: Simpanan) {
  try {
    localStorage.setItem(KUNCI, JSON.stringify(s))
  } catch {
    /* penyimpanan ditolak — nilai di layar tetap benar untuk sesi ini */
  }
}

function hariIni(): string {
  const d = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Selisih hari penuh antara dua tanggal kalender setempat. */
export function selisihHari(dari: string, sampai = hariIni()): number {
  const a = Date.parse(`${dari}T00:00:00`)
  const b = Date.parse(`${sampai}T00:00:00`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.round((b - a) / 86400000))
}

export function mulai(jenisId: string, tanggal = hariIni()): Simpanan {
  const s = baca()
  s[jenisId] = { jenisId, mulai: tanggal, riwayat: s[jenisId]?.riwayat ?? [] }
  tulis(s)
  return s
}

/**
 * Mulai lagi dari hari ini.
 *
 * Rentang yang sudah dijalani DIPINDAHKAN ke riwayat, tidak dibuang. Inilah
 * satu keputusan rancangan yang paling menentukan di berkas ini: yang membuat
 * orang berhenti mencoba bukan terputusnya rangkaian, melainkan perasaan bahwa
 * semua yang sudah dijalani terhapus.
 */
export function mulaiLagi(jenisId: string): Simpanan {
  const s = baca()
  const k = s[jenisId]
  const t = hariIni()
  const riwayat = k ? [...k.riwayat] : []
  if (k) {
    const hari = selisihHari(k.mulai, t)
    if (hari > 0) riwayat.unshift({ mulai: k.mulai, selesai: t, hari })
  }
  s[jenisId] = { jenisId, mulai: t, riwayat: riwayat.slice(0, 50) }
  tulis(s)
  return s
}

export function berhenti(jenisId: string): Simpanan {
  const s = baca()
  delete s[jenisId]
  tulis(s)
  return s
}

/** Rentang terpanjang yang pernah dijalani, termasuk yang sedang berjalan. */
export function terpanjang(h: Hitungan): number {
  const kini = selisihHari(h.mulai)
  return h.riwayat.reduce((a, r) => Math.max(a, r.hari), kini)
}
