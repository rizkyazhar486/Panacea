// ─────────────────────────────────────────────────────────────────────────────
// Waktu salat dan pengingat adzan.
//
// TENTANG PERHITUNGANNYA. Waktu salat TIDAK dihitung sendiri oleh aplikasi ini.
// Ia bergantung pada sudut matahari, garis lintang, ketinggian, dan — yang
// paling menentukan perbedaan antar-daerah — METODE PERHITUNGAN yang dipakai
// otoritas setempat. Kemenag RI, Muslim World League, dan Umm al-Qura
// menghasilkan waktu Subuh yang berbeda beberapa menit untuk kota yang sama,
// dan perbedaan itu bukan galat melainkan pilihan mazhab hisab.
//
// Sebuah aplikasi kebugaran tidak berwenang memilihkan mazhab hisab untuk
// penggunanya. Maka waktunya diambil dari layanan yang menyatakan metodenya,
// METODENYA DAPAT DIPILIH PENGGUNA, dan metode yang sedang dipakai selalu
// tampil di layar bersama waktunya.
//
// TENTANG SUARANYA. Rekaman adzan TIDAK disertakan bersama aplikasi. Hampir
// semua rekaman adzan yang beredar adalah rekaman muazin tertentu dengan hak
// cipta yang tidak jelas, dan menyalurkan ulang rekaman semacam itu bukan hal
// yang pantas dilakukan diam-diam — apalagi pada sesuatu yang bernilai ibadah.
// Yang disediakan:
//
//   1. Nada pengingat lembut yang DIBANGKITKAN peramban lewat Web Audio, tanpa
//      berkas dan tanpa hak cipta siapa pun.
//   2. Kolom untuk menempelkan alamat rekaman adzan milik pengguna sendiri,
//      bila ia memang punya salinan yang sah.
//
// Pengingatnya sendiri tetap berbunyi tepat waktu apa pun pilihannya.
//
// TENTANG BATASNYA. Pengingat ini berjalan SELAMA HALAMAN TERBUKA. Ia bukan
// pengganti jadwal salat masjid setempat, dan tidak diklaim demikian di layar.
// ─────────────────────────────────────────────────────────────────────────────

export type Salat = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'

/** Salat wajib yang lima. Sunrise sengaja tidak termasuk — ia bukan waktu salat. */
// Nama yang dipakai orang Indonesia sehari-hari, bukan transliterasi Inggris
// milik penyedia. `id` tetap mengikuti penyedia karena itulah kunci datanya.
export const SALAT: { id: Salat; nama: string; ikon: string }[] = [
  { id: 'Fajr', nama: 'Subuh', ikon: '🌄' },
  { id: 'Dhuhr', nama: 'Zuhur', ikon: '🌞' },
  { id: 'Asr', nama: 'Asar', ikon: '🌤️' },
  { id: 'Maghrib', nama: 'Magrib', ikon: '🌇' },
  { id: 'Isha', nama: 'Isya', ikon: '🌙' },
]

/**
 * Metode perhitungan. Angkanya adalah kode metode pada penyedia.
 *
 * Kemenag diletakkan pertama karena penggunanya berada di Indonesia, tetapi ia
 * TIDAK dipaksakan — daftar ini ada justru supaya pilihannya ada di tangan
 * pengguna.
 */
export const METODE: { kode: number; nama: string; catatan: string }[] = [
  { kode: 20, nama: 'Kemenag RI', catatan: 'The method used by Indonesia’s Ministry of Religious Affairs.' },
  { kode: 3, nama: 'Muslim World League', catatan: 'Widely used internationally.' },
  { kode: 4, nama: 'Umm al-Qura, Makkah', catatan: 'Used in Saudi Arabia.' },
  { kode: 2, nama: 'ISNA (North America)', catatan: 'Common in North America.' },
  { kode: 1, nama: 'University of Islamic Sciences, Karachi', catatan: 'Common in South Asia.' },
  { kode: 5, nama: 'Egyptian General Authority of Survey', catatan: 'Common in Egypt and parts of Africa.' },
]

export const PENYEDIA_WAKTU = {
  nama: 'Al Adhan',
  situs: 'https://aladhan.com',
  basis: 'https://api.aladhan.com/v1',
  catatan:
    'Free, no API key. Times are computed from the coordinates of the city you name, using the calculation method you choose — the method in use is always shown beside the times.',
}

export interface WaktuSalat {
  /** Menit sejak tengah malam waktu setempat. */
  menit: number
  jam: string
  salat: Salat
}

export interface JadwalHari {
  tanggal: string
  kota: string
  metode: string
  waktu: WaktuSalat[]
}

const KUNCI_CACHE = 'pmd-adzan-v1'

/** "05:12" atau "05:12 (WIB)" menjadi menit sejak tengah malam. */
export function keMenit(jam: string): number | null {
  const m = String(jam ?? '').trim().match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const j = Number(m[1]), n = Number(m[2])
  if (!Number.isFinite(j) || !Number.isFinite(n) || j > 23 || n > 59) return null
  return j * 60 + n
}

export function fmtMenit(menit: number): string {
  const j = Math.floor(((menit % 1440) + 1440) % 1440 / 60)
  const n = Math.round(((menit % 1440) + 1440) % 1440 % 60)
  return `${String(j).padStart(2, '0')}:${String(n).padStart(2, '0')}`
}

export interface HasilPeriksa { utuh: boolean; alasan?: string }

/**
 * Jadwal yang tidak lolos periksa TIDAK ditampilkan.
 *
 * Waktu salat yang salah bukan ketidaknyamanan kecil — ia membuat orang salat
 * di luar waktunya. Karena itu jadwal yang tidak masuk akal ditolak seluruhnya
 * alih-alih ditampilkan sebagian.
 */
export function periksaJadwal(w: WaktuSalat[]): HasilPeriksa {
  if (w.length !== SALAT.length) {
    return { utuh: false, alasan: `Expected ${SALAT.length} prayer times but received ${w.length}. Nothing is shown.` }
  }
  // Urutannya harus menaik sepanjang hari. Jadwal yang melompat mundur berarti
  // ada waktu yang salah baca, dan menampilkannya menuntun orang keliru.
  for (let i = 1; i < w.length; i++) {
    if (w[i].menit <= w[i - 1].menit) {
      return { utuh: false, alasan: `${w[i].salat} is not later than ${w[i - 1].salat} in the times received, so the schedule cannot be right. Nothing is shown.` }
    }
  }
  return { utuh: true }
}

interface JawabanAdhan {
  data?: { timings?: Record<string, string>; date?: { readable?: string }; meta?: { method?: { name?: string } } }
}

/** Jadwal hari ini untuk sebuah kota. */
export async function jadwalHariIni(kota: string, negara = 'Indonesia', metode = 20): Promise<JadwalHari> {
  const kunci = `${kota}|${negara}|${metode}|${new Date().toISOString().slice(0, 10)}`
  try {
    const c = JSON.parse(localStorage.getItem(KUNCI_CACHE) || '{}') as Record<string, JadwalHari>
    if (c[kunci]) return c[kunci]
  } catch { /* cache rusak — ambil ulang saja */ }

  const url = `${PENYEDIA_WAKTU.basis}/timingsByCity?city=${encodeURIComponent(kota)}&country=${encodeURIComponent(negara)}&method=${metode}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`gagal_memuat_${r.status}`)
  const j = (await r.json()) as JawabanAdhan
  const t = j.data?.timings ?? {}

  const waktu: WaktuSalat[] = []
  for (const s of SALAT) {
    const menit = keMenit(t[s.id])
    if (menit === null) {
      throw new Error(`The provider did not return a usable time for ${s.nama}, so no schedule is shown.`)
    }
    waktu.push({ salat: s.id, menit, jam: fmtMenit(menit) })
  }

  const cek = periksaJadwal(waktu)
  if (!cek.utuh) throw new Error(cek.alasan)

  const hasil: JadwalHari = {
    tanggal: String(j.data?.date?.readable ?? new Date().toDateString()),
    kota,
    metode: String(j.data?.meta?.method?.name ?? METODE.find((m) => m.kode === metode)?.nama ?? String(metode)),
    waktu,
  }
  // Disimpan hanya SETELAH lolos periksa, dan hanya untuk hari ini.
  try { localStorage.setItem(KUNCI_CACHE, JSON.stringify({ [kunci]: hasil })) } catch { /* kuota */ }
  return hasil
}

/** Salat berikutnya hari ini, atau Subuh besok bila Isya sudah lewat. */
export function berikutnya(j: JadwalHari, menitSekarang: number): { salat: WaktuSalat; menitLagi: number } {
  for (const w of j.waktu) if (w.menit > menitSekarang) return { salat: w, menitLagi: w.menit - menitSekarang }
  const subuh = j.waktu[0]
  return { salat: subuh, menitLagi: 1440 - menitSekarang + subuh.menit }
}

/**
 * Nada pengingat yang DIBANGKITKAN, bukan berkas rekaman.
 *
 * Tiga nada naik yang lembut dan pendek. Sengaja tidak meniru lantunan adzan:
 * tiruan adzan yang dibuat mesin terdengar seperti olok-olok terhadap sesuatu
 * yang tidak pantas diolok, dan lebih baik jujur sebagai nada pengingat.
 */
export function bunyikanNada(volume = 0.25): void {
  try {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
    const Ctx = AC.AudioContext ?? AC.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const nada = [523.25, 659.25, 783.99]   // C5, E5, G5
    nada.forEach((hz, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = hz
      const mulai = ctx.currentTime + i * 0.42
      gain.gain.setValueAtTime(0, mulai)
      gain.gain.linearRampToValueAtTime(volume, mulai + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.0001, mulai + 0.75)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(mulai); osc.stop(mulai + 0.8)
    })
    setTimeout(() => { void ctx.close() }, 2600)
  } catch { /* peramban menolak audio tanpa interaksi — pengingat visual tetap muncul */ }
}

export interface SetelanAdzan {
  aktif: boolean
  kota: string
  negara: string
  metode: number
  /** Berapa menit sebelum waktunya pengingat berbunyi. 0 berarti tepat waktu. */
  awalanMenit: number
  /** Salat mana saja yang diingatkan. */
  pilih: Record<Salat, boolean>
  /** Alamat rekaman adzan milik pengguna sendiri, bila ada. */
  suaraUrl: string
  /**
   * Getar saat waktunya tiba.
   *
   * BUKAN pengganti bunyi, melainkan pendamping. Telepon yang disenyapkan
   * tidak mengeluarkan bunyi sama sekali — dan telepon disenyapkan justru di
   * tempat orang paling ingin diingatkan: rapat, kuliah, bangsal. Sebaliknya
   * iOS Safari tidak mengenal getar sama sekali. Keduanya dicoba, dan yang
   * bekerja di perangkat itulah yang menyampaikan.
   */
  getar: boolean
}

export const SETELAN_AWAL: SetelanAdzan = {
  aktif: false,
  kota: 'Jakarta',
  negara: 'Indonesia',
  metode: 20,
  awalanMenit: 0,
  pilih: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  suaraUrl: '',
  getar: true,
}

const KUNCI_SETELAN = 'pmd-adzan-setelan-v1'

export function muatSetelan(): SetelanAdzan {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI_SETELAN) || 'null') as Partial<SetelanAdzan> | null
    if (!d) return { ...SETELAN_AWAL }
    return {
      ...SETELAN_AWAL,
      ...d,
      pilih: { ...SETELAN_AWAL.pilih, ...(d.pilih ?? {}) },
    }
  } catch { return { ...SETELAN_AWAL } }
}

export function simpanSetelan(s: SetelanAdzan): void {
  try { localStorage.setItem(KUNCI_SETELAN, JSON.stringify(s)) } catch { /* kuota */ }
}

/**
 * Apakah sebuah waktu salat pantas diingatkan sekarang.
 *
 * Dipisahkan supaya bisa diuji tanpa menunggu waktu berjalan, dan supaya
 * aturan "jangan mengingatkan yang sudah lewat jauh" tertulis di satu tempat.
 * Pengingat salat yang datang empat jam terlambat memberi kabar yang salah
 * tentang apa yang harus dilakukan sekarang — persis kesalahan yang pernah
 * terjadi pada pengingat obat.
 */
export const TOLERANSI_MENIT = 3

export function saatnyaMengingatkan(
  waktuSalat: number,
  menitSekarang: number,
  awalanMenit = 0,
): boolean {
  const target = ((waktuSalat - awalanMenit) % 1440 + 1440) % 1440
  const selisih = menitSekarang - target
  return selisih >= 0 && selisih <= TOLERANSI_MENIT
}

/** Menit sejak tengah malam menurut jam setempat peramban. */
export function menitSekarang(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}
