import type { ImportedWorkout } from './workoutImport'
import { kunciHari } from './tanggal'

// ─────────────────────────────────────────────────────────────────────────────
// Angka olahraga SEHARI-HARI: langkah, jarak, pace, denyut, zona, kadens.
//
// BEDANYA DENGAN analisisPro.ts. Berkas itu menjawab pertanyaan seorang atlet —
// seberapa berat beban saya, kapan saya siap lomba, apakah kenaikannya terlalu
// cepat. Berkas ini menjawab pertanyaan orang biasa: berapa jauh saya berjalan
// pekan ini, apakah langkah saya bertambah, apakah lari saya makin ringan.
// Keduanya perlu, dan mencampurnya membuat halaman yang tidak menjawab siapa
// pun dengan baik.
//
// SATU ATURAN YANG MENENTUKAN SELURUH BERKAS INI: yang tidak terekam TIDAK
// DIKARANG MENJADI NOL.
//
// Sebagian besar sesi impor tidak memuat kadens, banyak yang tidak memuat
// langkah, dan sesi yang dicatat tangan tidak memuat denyut sama sekali.
// Menjumlahkan bidang yang tidak ada sebagai nol akan menghasilkan grafik yang
// menukik ke bawah pada hari-hari yang justru rajin — dan pembacanya akan
// menyimpulkan dirinya mundur padahal yang terjadi hanya jamnya tidak merekam.
// Karena itu tiap deret memisahkan 'tidak ada nilai' (null) dari 'nilainya nol',
// dan tiap ringkasan menyertakan BERAPA SESI yang benar-benar punya bidang itu.
// Grafik yang datanya terlalu sedikit tidak digambar; ia mengatakan kekurangannya.
// ─────────────────────────────────────────────────────────────────────────────

const HARI = 86_400_000

export interface TitikHarian {
  tanggal: string
  /** Meter. null bila tidak ada satu pun sesi hari itu yang merekamnya. */
  km: number | null
  langkah: number | null
  /** Detik per km, rata-rata berbobot jarak. */
  paceSec: number | null
  /** Rata-rata berbobot durasi. */
  avgHr: number | null
  /** Langkah per menit, rata-rata berbobot durasi. */
  kadens: number | null
  menit: number
  sesi: number
}

/** Rata-rata berbobot; mengembalikan null bila tidak ada bobot yang sah. */
function rerata(pasangan: [number, number][]): number | null {
  let atas = 0
  let bawah = 0
  for (const [nilai, bobot] of pasangan) {
    if (!Number.isFinite(nilai) || !Number.isFinite(bobot) || bobot <= 0) continue
    atas += nilai * bobot
    bawah += bobot
  }
  return bawah > 0 ? atas / bawah : null
}

function jumlah(nilai: (number | undefined)[]): number | null {
  const ada = nilai.filter((n): n is number => Number.isFinite(n as number))
  return ada.length ? ada.reduce((a, b) => a + b, 0) : null
}

/**
 * Deret harian selama `hariKeBelakang` hari terakhir, termasuk hari kosong.
 *
 * Hari tanpa sesi tetap dimasukkan dengan nilai null — bukan nol. Bedanya
 * terlihat pada grafik: nol menggambar garis yang jatuh ke dasar, null memutus
 * garisnya. Yang pertama berbohong, yang kedua jujur.
 */
export function deretHarian(
  workouts: ImportedWorkout[],
  hariKeBelakang = 30,
  sekarang = Date.now(),
): TitikHarian[] {
  const perHari = new Map<string, ImportedWorkout[]>()
  for (const w of workouts) {
    const t = Date.parse(w.mulai)
    if (Number.isNaN(t) || t > sekarang) continue
    const k = kunciHari(new Date(t))
    const arr = perHari.get(k)
    if (arr) arr.push(w)
    else perHari.set(k, [w])
  }

  const mulai = new Date(sekarang - hariKeBelakang * HARI)
  mulai.setHours(0, 0, 0, 0)

  const out: TitikHarian[] = []
  for (let i = 0; i <= hariKeBelakang; i++) {
    const tanggal = kunciHari(new Date(mulai.getTime() + i * HARI))
    const s = perHari.get(tanggal) ?? []
    const menit = s.reduce((a, w) => a + (w.durasi ?? 0) / 60, 0)
    out.push({
      tanggal,
      sesi: s.length,
      menit: +menit.toFixed(1),
      km: jumlah(s.map((w) => w.jarakKm)),
      langkah: jumlah(s.map((w) => w.langkah)),
      // Pace dibobot JARAK, bukan durasi: lari 1 km cepat dan 10 km lambat
      // dalam satu hari tidak boleh dirata-ratakan seolah setara.
      paceSec: rerata(s.map((w) => [w.paceSec ?? NaN, w.jarakKm ?? 0] as [number, number])),
      avgHr: rerata(s.map((w) => [w.avgHr ?? NaN, w.durasi ?? 0] as [number, number])),
      kadens: rerata(s.map((w) => [w.kadens ?? NaN, w.durasi ?? 0] as [number, number])),
    })
  }
  return out
}

export interface RingkasPekan {
  /** Tanggal Senin pekan itu. */
  awal: string
  km: number | null
  langkah: number | null
  menit: number
  sesi: number
  paceSec: number | null
  avgHr: number | null
}

/** Ringkasan per pekan — satuan yang paling wajar untuk olahraga sehari-hari. */
export function deretPekanan(
  workouts: ImportedWorkout[],
  jumlahPekan = 12,
  sekarang = Date.now(),
): RingkasPekan[] {
  // Pekan dimulai SENIN, mengikuti kebiasaan setempat dan sebagian besar
  // aplikasi olahraga. Memulai dari Minggu memindahkan sesi akhir pekan ke
  // pekan berikutnya dan membuat grafiknya tidak cocok dengan ingatan orang.
  const senin = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    const geser = (x.getDay() + 6) % 7
    x.setDate(x.getDate() - geser)
    return x
  }

  const seninIni = senin(new Date(sekarang))
  const ember = new Map<string, ImportedWorkout[]>()
  for (const w of workouts) {
    const t = Date.parse(w.mulai)
    if (Number.isNaN(t) || t > sekarang) continue
    const k = kunciHari(senin(new Date(t)))
    const arr = ember.get(k)
    if (arr) arr.push(w)
    else ember.set(k, [w])
  }

  const out: RingkasPekan[] = []
  for (let i = jumlahPekan - 1; i >= 0; i--) {
    const awal = kunciHari(new Date(seninIni.getTime() - i * 7 * HARI))
    const s = ember.get(awal) ?? []
    out.push({
      awal,
      sesi: s.length,
      menit: +s.reduce((a, w) => a + (w.durasi ?? 0) / 60, 0).toFixed(1),
      km: jumlah(s.map((w) => w.jarakKm)),
      langkah: jumlah(s.map((w) => w.langkah)),
      paceSec: rerata(s.map((w) => [w.paceSec ?? NaN, w.jarakKm ?? 0] as [number, number])),
      avgHr: rerata(s.map((w) => [w.avgHr ?? NaN, w.durasi ?? 0] as [number, number])),
    })
  }
  return out
}

export interface Cakupan {
  /** Berapa sesi yang benar-benar memuat bidang ini. */
  ada: number
  total: number
  /** Bagian dalam persen, dibulatkan. */
  pct: number
}

/**
 * Seberapa lengkap tiap bidang terekam.
 *
 * Dipakai untuk memutuskan grafik mana yang layak digambar. Grafik kadens dari
 * tiga sesi di antara delapan puluh bukan gambaran kebiasaan seseorang — ia
 * gambaran tiga hari yang kebetulan jamnya merekam, dan menyajikannya sebagai
 * tren adalah kekeliruan yang tidak akan pernah dilaporkan siapa pun.
 */
export function cakupanBidang(workouts: ImportedWorkout[]): Record<string, Cakupan> {
  const total = workouts.length
  const hitung = (f: (w: ImportedWorkout) => boolean): Cakupan => {
    const ada = workouts.filter(f).length
    return { ada, total, pct: total ? Math.round((ada / total) * 100) : 0 }
  }
  return {
    jarak: hitung((w) => Number.isFinite(w.jarakKm) && (w.jarakKm ?? 0) > 0),
    langkah: hitung((w) => Number.isFinite(w.langkah) && (w.langkah ?? 0) > 0),
    pace: hitung((w) => Number.isFinite(w.paceSec) && (w.paceSec ?? 0) > 0),
    denyut: hitung((w) => Number.isFinite(w.avgHr) && (w.avgHr ?? 0) > 0),
    kadens: hitung((w) => Number.isFinite(w.kadens) && (w.kadens ?? 0) > 0),
    deretDenyut: hitung((w) => (w.hr?.length ?? 0) >= 2),
  }
}

export interface ZonaDenyut {
  z: 1 | 2 | 3 | 4 | 5
  nama: string
  menit: number
  pct: number
  warna: string
  batas: string
}

const NAMA_ZONA: { nama: string; warna: string; lo: number; hi: number }[] = [
  { nama: 'Z1 Pemulihan', warna: '#94a3b8', lo: 0, hi: 0.6 },
  { nama: 'Z2 Aerobik', warna: '#34d399', lo: 0.6, hi: 0.7 },
  { nama: 'Z3 Tempo', warna: '#60a5fa', lo: 0.7, hi: 0.8 },
  { nama: 'Z4 Ambang', warna: '#fbbf24', lo: 0.8, hi: 0.9 },
  { nama: 'Z5 Maksimal', warna: '#f87171', lo: 0.9, hi: 9 },
]

/**
 * Sebaran menit di tiap zona denyut selama `hari` terakhir.
 *
 * Hanya sesi yang punya DERET denyut yang dihitung. Sesi yang hanya punya
 * denyut rata-rata sengaja tidak dipakai: rata-rata 150 dapat berasal dari satu
 * jam mantap di zona 3, atau dari selang-seling zona 1 dan zona 5 — dua latihan
 * yang sama sekali berbeda maknanya. Menempatkan seluruh durasinya pada satu
 * zona akan menggambar kebiasaan yang tidak pernah terjadi.
 */
export function zonaDenyut(
  workouts: ImportedWorkout[],
  hrMax: number,
  hari = 28,
  sekarang = Date.now(),
): { zona: ZonaDenyut[]; sesiDipakai: number; sesiDilewati: number } {
  const batasWaktu = sekarang - hari * HARI
  const menit = [0, 0, 0, 0, 0]
  let dipakai = 0
  let dilewati = 0

  for (const w of workouts) {
    const t = Date.parse(w.mulai)
    if (Number.isNaN(t) || t < batasWaktu || t > sekarang) continue
    if ((w.hr?.length ?? 0) < 2 || !(hrMax > 0)) { dilewati++; continue }
    dipakai++
    for (let i = 0; i < w.hr.length; i++) {
      const p = w.hr[i]
      const dt = i < w.hr.length - 1
        ? Math.max(0, w.hr[i + 1].t - p.t)
        : Math.max(0, p.t - (w.hr[i - 1]?.t ?? p.t))
      const pct = p.bpm / hrMax
      const idx = NAMA_ZONA.findIndex((z) => pct >= z.lo && pct < z.hi)
      if (idx >= 0) menit[idx] += dt / 60
    }
  }

  const total = menit.reduce((a, b) => a + b, 0)
  return {
    sesiDipakai: dipakai,
    sesiDilewati: dilewati,
    zona: NAMA_ZONA.map((z, i) => ({
      z: (i + 1) as 1 | 2 | 3 | 4 | 5,
      nama: z.nama,
      menit: +menit[i].toFixed(1),
      pct: total > 0 ? Math.round((menit[i] / total) * 100) : 0,
      warna: z.warna,
      batas: `${Math.round(z.lo * hrMax)}-${z.hi > 1 ? Math.round(hrMax) : Math.round(z.hi * hrMax)} bpm`,
    })),
  }
}

/** Perbandingan dua rentang waktu yang sama panjang — "pekan ini vs pekan lalu". */
export interface Banding {
  kini: number | null
  lalu: number | null
  /** Selisih dalam persen; null bila salah satunya tidak ada. */
  deltaPct: number | null
}

export function bandingkan(kini: number | null, lalu: number | null): Banding {
  const bisa = kini !== null && lalu !== null && lalu !== 0
  return { kini, lalu, deltaPct: bisa ? Math.round(((kini - lalu) / lalu) * 100) : null }
}

/** Detik per km menjadi "5:30/km". */
export function tulisPace(detik: number | null): string {
  if (detik === null || !Number.isFinite(detik) || detik <= 0) return '—'
  const m = Math.floor(detik / 60)
  const s = Math.round(detik % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

export default deretHarian
