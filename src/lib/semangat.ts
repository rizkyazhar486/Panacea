// ─────────────────────────────────────────────────────────────────────────────
// Hal-hal kecil yang membuat hari terasa lebih baik — dan yang memang benar.
//
// ARAH APLIKASI INI BERUBAH DI SINI, dan alasannya perlu ditulis supaya tidak
// hilang lagi.
//
// Beranda sebelumnya dipimpin oleh grafik denyut, tekanan darah, pengingat
// obat, dan kartu darurat. Semuanya berguna, semuanya benar, dan gabungannya
// membuat siapa pun yang membukanya merasa seperti PASIEN — bukan seperti
// orang yang sedang menjalani harinya. Aplikasi yang setiap pagi menyapa
// dengan angka penyakit tidak membuat orang lebih sehat; ia membuat orang
// lebih cemas, dan orang yang cemas menutup aplikasinya.
//
// Materi klinisnya TIDAK dihapus — ia tetap lengkap dan tetap dicari oleh yang
// membutuhkannya. Yang berubah hanya apa yang muncul lebih dahulu.
//
// APA YANG DIPILIH MASUK KE SINI, DAN SYARATNYA:
//
//   1. BISA DILAKUKAN SEKARANG, dalam hitungan menit, tanpa alat dan tanpa
//      persiapan. Saran yang butuh persiapan adalah saran yang ditunda.
//   2. TERASA ENAK SAAT DILAKUKAN, bukan hanya baik menurut teori. Perilaku
//      yang tidak memberi imbalan apa pun tidak diulang, betapa pun benarnya.
//   3. BENAR-BENAR ADA DASARNYA. Ini tetap aplikasi kesehatan; nada boleh
//      ringan, isinya tidak boleh dikarang. Tiap butir membawa satu kalimat
//      tentang apa yang sebenarnya diketahui, ditulis tanpa membesar-besarkan.
//
// YANG SENGAJA TIDAK ADA — dan ini yang membuatnya bukan sekadar aplikasi
// kebiasaan biasa:
//
//   · Tidak ada rangkaian yang bisa PUTUS. Tidak ada "kamu kehilangan 12 hari".
//     Rasa bersalah adalah mesin yang paling sering menghentikan orang, dan
//     memasangnya ke dalam perangkat lunak berarti membuat hari buruk terasa
//     lebih mahal daripada seharusnya.
//   · Tidak ada imbalan acak, tidak ada peti kejutan, tidak ada apa pun yang
//     dirancang supaya dibuka berulang kali tanpa alasan. Membuat orang
//     kecanduan aplikasi kesehatan adalah menukar satu masalah dengan masalah
//     lain, dan itu sudah ditolak di aplikasi ini sebelumnya.
//   · Tidak ada target harian yang ditetapkan aplikasi. Yang muncul adalah
//     tawaran, bukan tugas.
//
// Yang ADA hanyalah: satu hal kecil, dilakukan, lalu dirayakan sebentar. Itu
// saja sudah cukup, dan hari yang tidak ada satu pun tetap hari yang baik.
// ─────────────────────────────────────────────────────────────────────────────

export interface Kesenangan {
  id: string
  judul: string
  /** Ajakannya, ditulis seperti orang berbicara. */
  ajakan: string
  /** Berapa lama sebenarnya. Jujur — dilebihkan sekali saja dan tidak dipercaya lagi. */
  menit: number
  emoji: string
  /** Warna kartunya. Beranda yang satu warna terasa seperti borang. */
  warna: 'kuning' | 'jingga' | 'merah' | 'ungu' | 'biru' | 'hijau' | 'toska' | 'merahmuda'
  /** Apa yang benar-benar diketahui. Satu kalimat, tanpa dibesar-besarkan. */
  kenapa: string
  /** Ke mana kalau ingin lebih jauh. Boleh kosong. */
  ke?: string
}

export const WARNA: Record<Kesenangan['warna'], { bg: string; teks: string; pekat: string }> = {
  kuning: { bg: 'bg-amber-400/25', teks: 'text-amber-900 dark:text-amber-200', pekat: 'bg-amber-400' },
  jingga: { bg: 'bg-orange-400/25', teks: 'text-orange-900 dark:text-orange-200', pekat: 'bg-orange-400' },
  merah: { bg: 'bg-rose-400/25', teks: 'text-rose-900 dark:text-rose-200', pekat: 'bg-rose-400' },
  ungu: { bg: 'bg-violet-400/25', teks: 'text-violet-900 dark:text-violet-200', pekat: 'bg-violet-400' },
  biru: { bg: 'bg-sky-400/25', teks: 'text-sky-900 dark:text-sky-200', pekat: 'bg-sky-400' },
  hijau: { bg: 'bg-emerald-400/25', teks: 'text-emerald-900 dark:text-emerald-200', pekat: 'bg-emerald-400' },
  toska: { bg: 'bg-teal-400/25', teks: 'text-teal-900 dark:text-teal-200', pekat: 'bg-teal-400' },
  merahmuda: { bg: 'bg-pink-400/25', teks: 'text-pink-900 dark:text-pink-200', pekat: 'bg-pink-400' },
}

export const KESENANGAN: Kesenangan[] = [
  {
    id: 'cahaya', judul: 'Get some daylight', ajakan: 'Step outside and let the light hit your eyes.',
    menit: 5, emoji: '🌤️', warna: 'kuning',
    kenapa: 'Morning light is the strongest signal your body clock has. It is the single change that moves sleep — and therefore mood — the most reliably.',
    ke: '/light-exposure',
  },
  {
    id: 'napas', judul: 'Breathe out longer', ajakan: 'Two short breaths in, one long breath out. A few rounds.',
    menit: 2, emoji: '🫧', warna: 'biru',
    kenapa: 'A longer exhale than inhale shifts you toward the calming branch of the nervous system. The effect is real, immediate, and short-lived — which is fine, because you can do it again.',
    ke: '/breathwork',
  },
  {
    id: 'gerak', judul: 'Move, any way you like', ajakan: 'Five minutes. Walk, dance, stairs — it does not have to be exercise.',
    menit: 5, emoji: '💃', warna: 'jingga',
    kenapa: 'Even brief movement lifts mood within minutes, and the effect does not depend on the session being long or hard enough to count as training.',
    ke: '/workout',
  },
  {
    id: 'kabari', judul: 'Message someone you like', ajakan: 'One person. No reason needed.',
    menit: 2, emoji: '💌', warna: 'merahmuda',
    kenapa: 'Of everything studied in long-life research, the strength of close relationships is among the most consistent predictors — ahead of most things people usually worry about.',
  },
  {
    id: 'air', judul: 'Drink a glass of water', ajakan: 'Right now, before you scroll on.',
    menit: 1, emoji: '💧', warna: 'toska',
    kenapa: 'Mild dehydration shows up as tiredness and poor concentration long before it shows up as thirst.',
    ke: '/hydration',
  },
  {
    id: 'regang', judul: 'Unfold yourself', ajakan: 'Stand up. Reach up. Roll the shoulders back.',
    menit: 2, emoji: '🙆', warna: 'ungu',
    kenapa: 'Breaking up long sitting matters more for health than any single stretch does — the benefit is in standing up, not in the technique.',
    ke: '/stretching',
  },
  {
    id: 'syukur', judul: 'Name one good thing', ajakan: 'Something from today. Small counts. Small is usually better.',
    menit: 1, emoji: '✨', warna: 'kuning',
    kenapa: 'Deliberately noticing one good thing has modest but repeatable effects on mood in trials. It is not magic and it does not need to be.',
    ke: '/logs',
  },
  {
    id: 'musik', judul: 'Play a song you love', ajakan: 'The one that always works. You know the one.',
    menit: 4, emoji: '🎧', warna: 'ungu',
    kenapa: 'Music you personally love reliably triggers reward pathways — this is one of the few pleasures that shows up clearly on a brain scan.',
  },
  {
    id: 'matahari', judul: 'Walk after you eat', ajakan: 'Ten minutes, any pace, after your next meal.',
    menit: 10, emoji: '🚶', warna: 'hijau',
    kenapa: 'A short walk after eating blunts the rise in blood sugar noticeably — one of the highest-return ten minutes in the day.',
    ke: '/workout',
  },
  {
    id: 'layar', judul: 'Look away from the screen', ajakan: 'Twenty seconds looking at something far away.',
    menit: 1, emoji: '👀', warna: 'biru',
    kenapa: 'Eye strain from close work eases when the focus distance changes. It costs twenty seconds.',
    ke: '/screen-time',
  },
  {
    id: 'tawa', judul: 'Find something funny', ajakan: 'One clip, one memory, one friend who always does it.',
    menit: 3, emoji: '😄', warna: 'jingga',
    kenapa: 'Laughing lowers subjective stress and briefly raises pain tolerance. That is a small effect, and it is also a genuinely nice three minutes.',
  },
  {
    id: 'rapikan', judul: 'Clear one small surface', ajakan: 'One table. One shelf. Not the whole room.',
    menit: 5, emoji: '🧹', warna: 'toska',
    kenapa: 'Finishing something visible and bounded gives a sense of control that generalises — which is why the trick is choosing something small enough to actually finish.',
  },
]

const KUNCI = 'pmd_semangat_v1'

interface Simpanan {
  /** tanggal ISO → id yang sudah dilakukan hari itu. */
  [tanggal: string]: string[]
}

function hariIni(): string {
  const d = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

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

export function hariIniSelesai(): string[] {
  return baca()[hariIni()] ?? []
}

export function tandai(id: string): string[] {
  const s = baca()
  const t = hariIni()
  const kini = new Set(s[t] ?? [])
  if (kini.has(id)) kini.delete(id)
  else kini.add(id)
  s[t] = [...kini]
  // Simpan 60 hari terakhir saja. Lebih dari itu tidak dilihat siapa pun dan
  // hanya membebani penyimpanan.
  const kunci = Object.keys(s).sort().slice(-60)
  const ramping: Simpanan = {}
  for (const k of kunci) ramping[k] = s[k]
  try { localStorage.setItem(KUNCI, JSON.stringify(ramping)) } catch { /* penuh */ }
  return s[t]
}

/**
 * Tiga tawaran untuk hari ini.
 *
 * DIPILIH MENURUT TANGGAL, BUKAN ACAK TIAP BUKA. Yang berganti tiap gulir
 * menjadi hiasan, dan lebih buruk: ia menjadi mesin yang membuat orang membuka
 * aplikasi berulang kali untuk melihat apa yang muncul. Itu persis yang tidak
 * ingin dibangun di sini. Ditentukan tanggal, ia sama sepanjang hari, dan besok
 * berganti dengan sendirinya.
 *
 * Jam ikut dipertimbangkan sedikit: "jalan sesudah makan" dan "cahaya pagi"
 * tidak masuk akal ditawarkan tengah malam.
 */
export function tawaranHariIni(sekarang = new Date()): Kesenangan[] {
  const jam = sekarang.getHours()
  const layak = KESENANGAN.filter((k) => {
    if (k.id === 'cahaya' && (jam < 5 || jam > 17)) return false
    if (k.id === 'matahari' && (jam < 6 || jam > 21)) return false
    return true
  })
  const hari = Math.floor(
    (Date.UTC(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()) - Date.UTC(2024, 0, 1)) / 86400000,
  )
  const keluar: Kesenangan[] = []
  for (let i = 0; i < 3 && i < layak.length; i++) {
    keluar.push(layak[(((hari * 3 + i) % layak.length) + layak.length) % layak.length])
  }
  // Jaga-jaga bila rumusnya menghasilkan yang sama dua kali pada daftar pendek.
  return keluar.filter((k, i) => keluar.findIndex((x) => x.id === k.id) === i)
}
