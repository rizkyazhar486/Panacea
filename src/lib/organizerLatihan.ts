// ─────────────────────────────────────────────────────────────────────────────
// Organizer latihan pekanan — lari DAN angkat beban dalam satu kalender.
//
// Halaman Training selama ini hanya bisa menjawab "lari saya bagaimana".
// Orang yang sama juga melakukan push, pull, kaki dan perut, dan sesi itu
// tidak punya tempat: tidak terjadwal, tidak terlihat, dan bentrok dengan hari
// lari tanpa ada yang memberi tahu.
//
// Berkas ini menyusun satu pekan dari ATURAN YANG DITULISKAN, bukan dari
// model terlatih. Tidak ada yang diramalkan di sini. Yang dibaca dari data
// nyata hanyalah SATU hal: berapa kali sepekan orang ini benar-benar tercatat
// berlari. Sisanya templat yang sama untuk semua orang, dan halamannya
// mengatakan begitu.
//
// Yang SENGAJA tidak dilakukan:
//   - tidak menentukan beban (kilogram) — beban bergantung pada orangnya dan
//     tidak bisa disimpulkan dari riwayat detak jantung;
//   - tidak menjanjikan hasil, tidak menilai kesiapan, tidak menilai risiko
//     cedera, dan tidak menggantikan penilaian klinis;
//   - tidak membuat program rehabilitasi.
// ─────────────────────────────────────────────────────────────────────────────

/** Satu hari bisa berisi salah satu dari ini. */
export type JenisHari = 'push' | 'pull' | 'kaki' | 'perut' | 'lari' | 'pemulihan'

export interface Gerakan {
  nama: string
  /** Pola gerak, bukan nama otot: inilah yang menentukan jeda 48 jam. */
  pola: 'dorong-horizontal' | 'dorong-vertikal' | 'tarik-horizontal' | 'tarik-vertikal' | 'lutut' | 'panggul' | 'inti' | 'betis' | 'lengan'
  set: number
  /** Rentang pengulangan, ditulis sebagai rentang karena memang rentang. */
  ulangan: string
  /** Detik. */
  jeda: number
}

export interface HariRencana {
  /** 0 = Senin. Kunci, bukan label. */
  indeks: number
  hari: string
  jenis: JenisHari
  judul: string
  /** Menit perkiraan, dari jumlah set dan jeda — bukan target. */
  menit: number
  gerakan: Gerakan[]
  catatan: string
}

export interface PilihanOrganizer {
  /** 3..6 hari latihan dalam sepekan. */
  hariLatihan: number
  fokus: 'seimbang' | 'kekuatan' | 'lari'
  /** Berapa sesi lari yang ingin dipertahankan dalam sepekan. */
  sesiLari: number
}

export const HARI = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

export const BATAS_ORGANIZER = {
  HARI_MIN: 3,
  HARI_MAKS: 6,
  LARI_MAKS: 5,
  /** Jam minimum antara dua sesi dengan pola gerak yang sama. */
  JEDA_POLA_JAM: 48,
} as const

// ── Katalog gerakan ──────────────────────────────────────────────────────────
// Rentang set dan pengulangan di bawah adalah rentang praktik umum untuk
// latihan kekuatan, bukan resep untuk seseorang. Tidak ada beban di sini.

const PUSH: Gerakan[] = [
  { nama: 'Bench press or push-up', pola: 'dorong-horizontal', set: 4, ulangan: '5–8', jeda: 180 },
  { nama: 'Overhead press', pola: 'dorong-vertikal', set: 3, ulangan: '6–10', jeda: 150 },
  { nama: 'Incline dumbbell press', pola: 'dorong-horizontal', set: 3, ulangan: '8–12', jeda: 120 },
  { nama: 'Lateral raise', pola: 'dorong-vertikal', set: 3, ulangan: '12–15', jeda: 75 },
  { nama: 'Triceps extension', pola: 'lengan', set: 3, ulangan: '10–15', jeda: 75 },
]

const PULL: Gerakan[] = [
  { nama: 'Pull-up or lat pulldown', pola: 'tarik-vertikal', set: 4, ulangan: '5–10', jeda: 150 },
  { nama: 'Barbell or dumbbell row', pola: 'tarik-horizontal', set: 4, ulangan: '6–10', jeda: 150 },
  { nama: 'Chest-supported row', pola: 'tarik-horizontal', set: 3, ulangan: '10–12', jeda: 100 },
  { nama: 'Face pull', pola: 'tarik-horizontal', set: 3, ulangan: '12–15', jeda: 75 },
  { nama: 'Biceps curl', pola: 'lengan', set: 3, ulangan: '10–15', jeda: 75 },
]

const KAKI: Gerakan[] = [
  { nama: 'Back or goblet squat', pola: 'lutut', set: 4, ulangan: '5–8', jeda: 210 },
  { nama: 'Romanian deadlift', pola: 'panggul', set: 3, ulangan: '6–10', jeda: 180 },
  { nama: 'Split squat or lunge', pola: 'lutut', set: 3, ulangan: '8–12 per side', jeda: 120 },
  { nama: 'Hip thrust', pola: 'panggul', set: 3, ulangan: '8–12', jeda: 120 },
  { nama: 'Standing calf raise', pola: 'betis', set: 4, ulangan: '10–15', jeda: 75 },
]

const PERUT: Gerakan[] = [
  { nama: 'Plank or ab wheel (anti-extension)', pola: 'inti', set: 3, ulangan: '30–45 s', jeda: 60 },
  { nama: 'Pallof press (anti-rotation)', pola: 'inti', set: 3, ulangan: '10–12 per side', jeda: 60 },
  { nama: 'Hanging or lying leg raise', pola: 'inti', set: 3, ulangan: '8–15', jeda: 75 },
  { nama: 'Side plank', pola: 'inti', set: 2, ulangan: '25–40 s per side', jeda: 45 },
]

/** Penutup perut untuk ditempelkan ke hari kekuatan saat hari terlalu sedikit. */
const PERUT_PENUTUP: Gerakan[] = PERUT.slice(0, 2)

const LARI_MUDAH: Gerakan[] = [
  { nama: 'Easy conversational run', pola: 'inti', set: 1, ulangan: '30–45 min', jeda: 0 },
]
const LARI_KERAS: Gerakan[] = [
  { nama: 'Intervals or tempo run', pola: 'inti', set: 1, ulangan: '25–40 min including warm-up', jeda: 0 },
]

/**
 * Perkiraan durasi sesi dari jumlah set dan jeda.
 *
 * Perkiraan, bukan target: satu set diasumsikan 40 detik kerja. Angka ini ada
 * supaya orang bisa melihat sesi mana yang tidak muat di harinya, bukan supaya
 * dikejar.
 */
export function perkiraanMenit(gerakan: readonly Gerakan[]): number {
  const detik = gerakan.reduce((jumlah, g) => jumlah + g.set * (40 + g.jeda), 0)
  return Math.round(detik / 60)
}

/**
 * Berapa sesi lari per pekan yang BENAR-BENAR tercatat.
 *
 * Dihitung dari rentang tanggal sesi yang ada, bukan diasumsikan 7 hari:
 * riwayat dua pekan dan riwayat enam bulan tidak boleh menghasilkan angka yang
 * sama. Mengembalikan null bila tidak ada sesi lari sama sekali — tidak ada
 * yang boleh ditebak dari data yang tidak ada.
 */
export function kadensLariPekanan(
  sesi: readonly { nama: string; mulai: string }[],
): number | null {
  const lari = sesi.filter((s) => /run|lari|jog/i.test(s.nama))
  if (!lari.length) return null
  const waktu = lari.map((s) => Date.parse(s.mulai)).filter((t) => Number.isFinite(t))
  if (!waktu.length) return null
  const rentangHari = (Math.max(...waktu) - Math.min(...waktu)) / 86_400_000
  // Riwayat lebih pendek dari sepekan tidak bisa dibagi per pekan tanpa
  // melebih-lebihkan; pekan dianggap minimal satu.
  const pekan = Math.max(1, rentangHari / 7)
  return Math.round((waktu.length / pekan) * 10) / 10
}

function jepit(nilai: number, bawah: number, atas: number): number {
  if (!Number.isFinite(nilai)) return bawah
  return Math.min(atas, Math.max(bawah, Math.round(nilai)))
}

/**
 * Urutan hari kekuatan menurut berapa banyak hari yang tersedia.
 *
 * Push/pull/kaki selalu berjarak, dan perut hanya menjadi hari tersendiri
 * ketika masih ada tempat. Kalau tidak, perut menempel sebagai penutup —
 * dihilangkan sepenuhnya bukan pilihan, karena itulah bagian yang ditanyakan.
 */
function deretKekuatan(hariLatihan: number): JenisHari[] {
  switch (hariLatihan) {
    case 3: return ['push', 'pull', 'kaki']
    case 4: return ['push', 'pull', 'kaki', 'perut']
    case 5: return ['push', 'pull', 'kaki', 'perut', 'push']
    default: return ['push', 'pull', 'kaki', 'push', 'pull', 'perut']
  }
}

function gerakanUntuk(jenis: JenisHari, keras: boolean, tempelPerut: boolean): Gerakan[] {
  switch (jenis) {
    case 'push': return tempelPerut ? [...PUSH, ...PERUT_PENUTUP] : [...PUSH]
    case 'pull': return tempelPerut ? [...PULL, ...PERUT_PENUTUP] : [...PULL]
    case 'kaki': return [...KAKI]
    case 'perut': return [...PERUT]
    case 'lari': return keras ? [...LARI_KERAS] : [...LARI_MUDAH]
    default: return []
  }
}

const JUDUL: Record<JenisHari, string> = {
  push: 'Push day',
  pull: 'Pull day',
  kaki: 'Leg day',
  perut: 'Abs & trunk',
  lari: 'Run',
  pemulihan: 'Rest',
}

/**
 * Susun satu pekan.
 *
 * Aturan yang dijalankan, semuanya bisa dibaca dan diuji:
 *   1. Hari kaki tidak pernah tepat sebelum sesi lari keras.
 *   2. Dua hari dengan pola gerak yang sama tidak pernah berurutan.
 *   3. Selalu ada minimal satu hari pemulihan penuh.
 */
export function susunPekan(pilihan: PilihanOrganizer, sesiLariTercatat?: number | null): HariRencana[] {
  const hariLatihan = jepit(pilihan.hariLatihan, BATAS_ORGANIZER.HARI_MIN, BATAS_ORGANIZER.HARI_MAKS)
  const diminta = Number.isFinite(pilihan.sesiLari) ? pilihan.sesiLari : (sesiLariTercatat ?? 2)
  const sesiLari = jepit(diminta, 0, BATAS_ORGANIZER.LARI_MAKS)

  const kekuatan = deretKekuatan(hariLatihan)
  const tempelPerut = !kekuatan.includes('perut')

  // Hari kekuatan disebar merata di antara tujuh hari supaya jarak antar pola
  // muncul dari penempatan, bukan dari tambalan sesudahnya.
  const slot: (JenisHari | null)[] = Array(7).fill(null)
  const langkah = 7 / kekuatan.length
  kekuatan.forEach((jenis, i) => {
    let posisi = Math.round(i * langkah) % 7
    while (slot[posisi] !== null) posisi = (posisi + 1) % 7
    slot[posisi] = jenis
  })

  // Penyebaran merata saja tidak cukup: pada lima hari, dua hari push jatuh di
  // ujung pekan dan bersentuhan MELINGKAR (Minggu bertemu Senin lagi). Itu
  // melanggar aturan yang halaman ini iklankan sendiri, dan tidak terlihat
  // kalau hanya satu susunan bawaan yang diperiksa. Perbaikannya dilakukan di
  // sini, bukan dengan melunakkan aturannya.
  const bersih = (jenis: JenisHari, posisi: number, papan: (JenisHari | null)[]) =>
    papan[(posisi + 6) % 7] !== jenis && papan[(posisi + 1) % 7] !== jenis
  for (let putaran = 0; putaran < 7; putaran++) {
    let bentrok = -1
    for (let i = 0; i < 7; i++) {
      if (slot[i] !== null && slot[i] === slot[(i + 1) % 7]) { bentrok = (i + 1) % 7; break }
    }
    if (bentrok < 0) break
    const jenis = slot[bentrok]!
    slot[bentrok] = null
    const tujuan = [0, 1, 2, 3, 4, 5, 6].find((p) => slot[p] === null && bersih(jenis, p, slot))
    slot[tujuan ?? bentrok] = jenis
    if (tujuan === undefined) break
  }

  // Lari mengisi hari yang masih kosong, menjauh dari hari kaki.
  const kosong = slot.map((s, i) => (s === null ? i : -1)).filter((i) => i >= 0)
  const jarakDariKaki = (i: number) => {
    const kaki = slot.map((s, j) => (s === 'kaki' ? j : -1)).filter((j) => j >= 0)
    if (!kaki.length) return 7
    return Math.min(...kaki.map((j) => Math.min(Math.abs(i - j), 7 - Math.abs(i - j))))
  }
  const urutLari = [...kosong].sort((a, b) => jarakDariKaki(b) - jarakDariKaki(a) || a - b)
  // Satu hari kosong selalu disisakan sebagai pemulihan penuh.
  const bolehLari = Math.min(sesiLari, Math.max(0, kosong.length - 1))
  const hariLari = new Set(urutLari.slice(0, bolehLari))

  // Sesi lari keras: hanya yang paling jauh dari hari kaki, dan hanya satu,
  // dan hanya kalau fokusnya bukan kekuatan.
  const kandidatKeras = pilihan.fokus === 'kekuatan' ? -1 : (urutLari.find((i) => hariLari.has(i)) ?? -1)

  return HARI.map((hari, i) => {
    const jenis: JenisHari = slot[i] ?? (hariLari.has(i) ? 'lari' : 'pemulihan')
    const keras = jenis === 'lari' && i === kandidatKeras
    const gerakan = gerakanUntuk(jenis, keras, tempelPerut && (jenis === 'push' || jenis === 'pull'))
    return {
      indeks: i,
      hari,
      jenis,
      judul: jenis === 'lari' ? (keras ? 'Run · harder session' : 'Run · easy') : JUDUL[jenis],
      menit: jenis === 'lari' ? (keras ? 35 : 40) : perkiraanMenit(gerakan),
      gerakan,
      catatan: catatanHari(jenis, keras),
    }
  })
}

function catatanHari(jenis: JenisHari, keras: boolean): string {
  switch (jenis) {
    case 'kaki': return 'Placed away from the harder run so the two do not land on the same tired legs.'
    case 'perut': return 'Trunk work is braced and anti-movement first; flexion volume is kept modest.'
    case 'lari': return keras
      ? 'The only harder run of the week. Everything else stays conversational.'
      : 'Easy means you could hold a conversation. If you cannot, it is not this session.'
    case 'pemulihan': return 'A full day off is part of the plan, not a gap in it.'
    default: return 'Leave one to two repetitions in reserve on the heavier sets.'
  }
}

/** Pemeriksaan aturan, dijalankan pada hasil sendiri supaya tidak hanya diklaim. */
export function periksaAturan(pekan: readonly HariRencana[]): string[] {
  const langgar: string[] = []
  if (pekan.length !== 7) langgar.push('a week must have seven days')
  if (!pekan.some((h) => h.jenis === 'pemulihan')) langgar.push('no full rest day')
  for (let i = 0; i < pekan.length; i++) {
    const kini = pekan[i]
    const besok = pekan[(i + 1) % pekan.length]
    if (kini.jenis === 'kaki' && besok.jenis === 'lari' && besok.judul.includes('harder')) {
      langgar.push(`${kini.hari}: leg day immediately before the harder run`)
    }
    if (kini.jenis !== 'pemulihan' && kini.jenis !== 'lari' && kini.jenis === besok.jenis) {
      langgar.push(`${kini.hari}: ${kini.jenis} repeated on consecutive days`)
    }
  }
  return langgar
}
