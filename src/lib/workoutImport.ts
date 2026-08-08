// ─────────────────────────────────────────────────────────────────────────────
// Latihan dan peringatan detak jantung dari ekspor Health Auto Export.
//
// Kenapa terpisah dari healthImport: healthImport menjawab "berapa nilai
// TERAKHIR tiap metrik" dan memampatkan seluruh berkas menjadi satu baris
// angka. Itu tepat untuk mengisi profil, tetapi membuang bagian berkas yang
// justru paling berharga — larik `workouts`, yang berisi setiap sesi latihan
// LENGKAP DENGAN DERET DETAK JANTUNG PER MENIT, serta larik
// `heartRateNotifications` yang mencatat kapan jam tangan memperingatkan
// denyut tinggi maupun rendah di luar aktivitas.
//
// Dua hal yang hanya bisa dijawab dari larik ini dan tidak dari rata-rata:
//
//   1. SEBERAPA KERAS sesi itu sebenarnya dijalankan. Rata-rata satu sesi tidak
//      membedakan lari mudah 40 menit dari lari mudah 30 menit yang diselingi
//      lima menit sprint — padahal keduanya menuntut pemulihan yang berbeda.
//      Sebaran waktu per zona menjawabnya, dan hanya deret per menit yang bisa
//      menghitungnya.
//
//   2. SEBERAPA CEPAT PULIH sesudahnya. Ekspor menyertakan deret
//      `heartRateRecovery` beberapa menit setelah sesi berakhir, sehingga
//      penurunan satu menit pertama dapat dihitung langsung dari sesi nyata,
//      bukan dari angka ringkas yang entah diambil kapan.
// ─────────────────────────────────────────────────────────────────────────────

export interface HrPoint {
  /** Detik sejak sesi dimulai. */
  t: number
  bpm: number
}

export interface ZoneSlice {
  zona: 1 | 2 | 3 | 4 | 5
  nama: string
  /** Batas bawah zona dalam persen HRmax. */
  dariPct: number
  hinggaPct: number
  menit: number
  pctWaktu: number
  warna: string
}

export interface ImportedWorkout {
  id: string
  nama: string
  mulai: string
  selesai: string
  /** Detik. */
  durasi: number
  jarakKm?: number
  kcal?: number
  avgHr?: number
  maxHr?: number
  minHr?: number
  /** km/jam. */
  kecepatanKmh?: number
  /** Detik per km. */
  paceSec?: number
  /** Langkah per menit. */
  kadens?: number
  langkah?: number
  diDalamRuangan?: boolean
  hr: HrPoint[]
  /** Deret pemulihan sesudah sesi berakhir. */
  pemulihan: HrPoint[]
  /** Penurunan bpm pada menit pertama setelah selesai, bila terekam. */
  hrr1?: number
}

export interface HrNotification {
  jenis: 'tinggi' | 'rendah' | 'iramaTidakTeratur' | 'lain'
  label: string
  mulai: string
  ambang?: number
  puncakBpm?: number
  sampel: number
}

// ── Pembantu ────────────────────────────────────────────────────────────────

/** Health Auto Export menulis "2026-07-31 21:30:15 +0700" — bukan ISO yang sah. */
function parseHaeDate(s: unknown): number {
  if (typeof s !== 'string') return NaN
  const t = Date.parse(s.replace(' +', '+').replace(' -', '-'))
  if (!Number.isNaN(t)) return t
  return Date.parse(s.replace(' ', 'T').replace(' +', '+'))
}

function qty(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (v && typeof v === 'object') {
    const q = (v as { qty?: unknown }).qty
    if (typeof q === 'number' && Number.isFinite(q)) return q
  }
  return undefined
}

/** Nilai satu sampel deret: Avg lebih dahulu, karena deret HR ditulis sebagai Min/Avg/Max. */
function sampleBpm(s: Record<string, unknown>): number | undefined {
  for (const k of ['Avg', 'avg', 'qty', 'Max', 'max', 'Min', 'min']) {
    const v = s[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return undefined
}

function series(raw: unknown, t0: number): HrPoint[] {
  if (!Array.isArray(raw)) return []
  const out: HrPoint[] = []
  for (const s of raw as Record<string, unknown>[]) {
    const bpm = sampleBpm(s)
    const t = parseHaeDate(s?.date)
    if (bpm == null || bpm <= 0) continue
    out.push({ t: Number.isNaN(t) ? out.length * 60 : Math.round((t - t0) / 1000), bpm: Math.round(bpm) })
  }
  return out.sort((a, b) => a.t - b.t)
}

/** Energi datang dalam kJ pada sebagian besar ekspor; jadikan kkal. */
function toKcal(v: unknown, units?: unknown): number | undefined {
  const n = qty(v)
  if (n == null) return undefined
  const u = typeof units === 'string' ? units.toLowerCase() : ''
  const uu = u || (v && typeof v === 'object' ? String((v as { units?: unknown }).units ?? '').toLowerCase() : '')
  return Math.round(uu.startsWith('kj') ? n / 4.184 : n)
}

// ── Latihan ─────────────────────────────────────────────────────────────────

export function parseWorkouts(text: string): ImportedWorkout[] {
  let root: unknown
  try { root = JSON.parse(text) } catch { return [] }
  const data = (root as { data?: unknown })?.data ?? root
  const raw = (data as { workouts?: unknown })?.workouts
  if (!Array.isArray(raw)) return []

  const out: ImportedWorkout[] = []
  for (const w of raw as Record<string, unknown>[]) {
    const t0 = parseHaeDate(w?.start)
    const t1 = parseHaeDate(w?.end)
    if (Number.isNaN(t0)) continue

    const hr = series(w?.heartRateData, t0)
    const pemulihan = series(w?.heartRateRecovery, Number.isNaN(t1) ? t0 : t1)

    const durasi = typeof w?.duration === 'number' && w.duration > 0
      ? w.duration
      : Number.isNaN(t1) ? 0 : (t1 - t0) / 1000

    const jarakKm = qty(w?.distance) ?? qty(w?.walkingAndRunningDistance)
    const kecepatanKmh = qty(w?.speed) ?? (jarakKm && durasi > 0 ? (jarakKm / (durasi / 3600)) : undefined)

    // Penurunan satu menit pertama sesudah sesi berakhir — dihitung dari deret
    // nyata, bukan dari angka ringkas yang tidak jelas diambil kapan.
    let hrr1: number | undefined
    const last = <T,>(a: T[]): T | undefined => (a.length ? a[a.length - 1] : undefined)
    const akhir = last(hr)?.bpm
    if (akhir != null && pemulihan.length) {
      const dalam60 = pemulihan.filter((p) => p.t <= 60)
      const titik = last(dalam60.length ? dalam60 : pemulihan)
      if (titik) {
        const puncakPemulihan = pemulihan[0]?.bpm ?? akhir
        const d = Math.max(akhir, puncakPemulihan) - titik.bpm
        if (d > 0) hrr1 = Math.round(d)
      }
    }

    out.push({
      id: typeof w?.id === 'string' ? w.id : `${w?.name ?? 'workout'}-${t0}`,
      nama: typeof w?.name === 'string' ? w.name : 'Latihan',
      mulai: new Date(t0).toISOString(),
      selesai: Number.isNaN(t1) ? new Date(t0 + durasi * 1000).toISOString() : new Date(t1).toISOString(),
      durasi: Math.round(durasi),
      jarakKm: jarakKm != null ? +jarakKm.toFixed(2) : undefined,
      kcal: toKcal(w?.activeEnergyBurned) ?? toKcal(w?.totalEnergy),
      avgHr: qty(w?.avgHeartRate) != null ? Math.round(qty(w?.avgHeartRate)!) : undefined,
      maxHr: qty(w?.maxHeartRate) != null ? Math.round(qty(w?.maxHeartRate)!) : undefined,
      minHr: hr.length ? Math.min(...hr.map((p) => p.bpm)) : undefined,
      kecepatanKmh: kecepatanKmh != null ? +kecepatanKmh.toFixed(2) : undefined,
      paceSec: kecepatanKmh && kecepatanKmh > 0 ? Math.round(3600 / kecepatanKmh) : undefined,
      kadens: qty(w?.stepCadence) != null ? Math.round(qty(w?.stepCadence)!) : undefined,
      langkah: Array.isArray(w?.stepCount)
        ? Math.round((w.stepCount as Record<string, unknown>[]).reduce((a, s) => a + (qty(s?.qty) ?? 0), 0))
        : qty(w?.stepCount) != null ? Math.round(qty(w?.stepCount)!) : undefined,
      diDalamRuangan: typeof w?.isIndoor === 'boolean' ? w.isIndoor : undefined,
      hr,
      pemulihan,
      hrr1,
    })
  }
  // Terbaru lebih dahulu.
  return out.sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
}

// ── Zona ────────────────────────────────────────────────────────────────────

const ZONA: { zona: 1 | 2 | 3 | 4 | 5; nama: string; dariPct: number; hinggaPct: number; warna: string }[] = [
  { zona: 1, nama: 'Pemulihan', dariPct: 0, hinggaPct: 60, warna: '#94a3b8' },
  { zona: 2, nama: 'Aerobik dasar', dariPct: 60, hinggaPct: 70, warna: '#34d399' },
  { zona: 3, nama: 'Tempo', dariPct: 70, hinggaPct: 80, warna: '#60a5fa' },
  { zona: 4, nama: 'Ambang', dariPct: 80, hinggaPct: 90, warna: '#fbbf24' },
  { zona: 5, nama: 'Maksimal', dariPct: 90, hinggaPct: 200, warna: '#f87171' },
]

/**
 * Sebaran waktu per zona, dihitung dari deret per menit.
 *
 * Inilah yang tidak bisa dijawab oleh rata-rata: lari mudah 40 menit dan lari
 * mudah 30 menit yang diselingi lima menit sprint bisa memberi rata-rata yang
 * mirip, padahal tuntutan pemulihannya berbeda jauh.
 */
export function zoneBreakdown(hr: HrPoint[], hrMax: number): ZoneSlice[] {
  if (!hr.length || !(hrMax > 0)) return []
  // Tiap sampel mewakili jarak waktu ke sampel berikutnya.
  const durasiSampel: number[] = hr.map((p, i) =>
    i < hr.length - 1 ? Math.max(0, hr[i + 1].t - p.t) : (hr.length > 1 ? hr[hr.length - 1].t - hr[hr.length - 2].t : 60),
  )
  const totalDetik = durasiSampel.reduce((a, b) => a + b, 0) || 1

  return ZONA.map((z) => {
    let detik = 0
    hr.forEach((p, i) => {
      const pct = (p.bpm / hrMax) * 100
      if (pct >= z.dariPct && pct < z.hinggaPct) detik += durasiSampel[i]
    })
    return {
      ...z,
      menit: +(detik / 60).toFixed(1),
      pctWaktu: Math.round((detik / totalDetik) * 100),
    }
  })
}

/** Perkiraan HRmax dari usia; dipakai bila pengguna belum mengukurnya sendiri. */
export function hrMaxFromAge(age: number, sex: 'M' | 'F'): number {
  return sex === 'M' ? 220 - age : 226 - age
}

// ── Peringatan detak jantung ────────────────────────────────────────────────

export function parseHrNotifications(text: string): HrNotification[] {
  let root: unknown
  try { root = JSON.parse(text) } catch { return [] }
  const data = (root as { data?: unknown })?.data ?? root
  const raw = (data as { heartRateNotifications?: unknown })?.heartRateNotifications
  if (!Array.isArray(raw)) return []

  const out: HrNotification[] = []
  for (const n of raw as Record<string, unknown>[]) {
    const kind = typeof n?.heartNotification === 'string' ? n.heartNotification.toLowerCase() : ''
    const jenis: HrNotification['jenis'] =
      kind.includes('high') ? 'tinggi'
        : kind.includes('low') ? 'rendah'
          : kind.includes('irregular') ? 'iramaTidakTeratur' : 'lain'
    const label =
      jenis === 'tinggi' ? 'Denyut tinggi saat tidak beraktivitas'
        : jenis === 'rendah' ? 'Denyut rendah'
          : jenis === 'iramaTidakTeratur' ? 'Irama tidak teratur' : 'Peringatan denyut'

    const samples = Array.isArray(n?.heartRateData) ? (n.heartRateData as Record<string, unknown>[]) : []
    const bpms = samples.map((s) => sampleBpm(s)).filter((v): v is number => v != null && v > 0)

    out.push({
      jenis,
      label,
      mulai: (() => { const t = parseHaeDate(n?.start); return Number.isNaN(t) ? '' : new Date(t).toISOString() })(),
      ambang: typeof n?.threshold === 'number' ? n.threshold : undefined,
      puncakBpm: bpms.length ? Math.max(...bpms) : undefined,
      sampel: bpms.length,
    })
  }
  return out.sort((a, b) => Date.parse(b.mulai) - Date.parse(a.mulai))
}

/**
 * Penjelasan yang menyertai peringatan.
 *
 * Sengaja tidak menenangkan maupun menakut-nakuti: peringatan denyut tinggi
 * dari jam tangan SERING berupa temuan yang tidak berarti — dipicu gerakan,
 * kecemasan, kopi, maupun sensor yang bergeser — namun ia juga merupakan cara
 * beberapa orang pertama kali mengetahui adanya gangguan irama. Yang
 * membedakan keduanya adalah GEJALA yang menyertainya, bukan angkanya.
 */
export const NOTIF_INFO: Record<HrNotification['jenis'], { arti: string; kapanPenting: string }> = {
  tinggi: {
    arti: 'Jam tangan mendeteksi denyut di atas ambang yang Anda tetapkan selama sepuluh menit ketika Anda tampak TIDAK sedang beraktivitas. Pemicu tersering justru bukan penyakit: gerakan yang tidak terbaca sebagai olahraga, kecemasan, kopi, demam, kurang tidur, dehidrasi, maupun sensor yang bergeser di pergelangan.',
    kapanPenting: 'Menjadi penting bila disertai nyeri dada, sesak, pingsan maupun hampir pingsan, pusing berputar, atau bila berulang tanpa pemicu yang jelas. Bawa daftar kejadian ini saat memeriksakan diri — waktu kejadiannya lebih berguna bagi dokter daripada angka puncaknya.',
  },
  rendah: {
    arti: 'Denyut di bawah ambang saat tidak sedang tidur. Pada orang yang terlatih, denyut istirahat rendah merupakan tanda kebugaran dan bukan masalah.',
    kapanPenting: 'Menjadi penting bila disertai rasa melayang, mudah lelah yang tidak biasa, pingsan, maupun bila Anda memakai obat yang memperlambat denyut seperti penyekat beta.',
  },
  iramaTidakTeratur: {
    arti: 'Pola denyut yang tidak teratur dan menyerupai fibrilasi atrium. Ini pemberitahuan, bukan diagnosis — jam tangan tidak dapat menegakkan diagnosis gangguan irama.',
    kapanPenting: 'Perlu ditindaklanjuti dengan pemeriksaan langsung dan rekaman jantung, terutama bila berulang. Simpan tanggal kejadiannya.',
  },
  lain: {
    arti: 'Peringatan denyut dari jam tangan.',
    kapanPenting: 'Perhatikan gejala yang menyertai, bukan angkanya sendiri.',
  },
}

// ── Summary mingguan ──────────────────────────────────────────────────────

export interface WeeklySummary {
  sesi: number
  totalMenit: number
  totalKm: number
  totalKcal: number
  rerataPaceSec?: number
  /** Bagian waktu yang dihabiskan pada zona 1-2 — dasar aturan 80/20. */
  pctMudah?: number
}

export function summarise(workouts: ImportedWorkout[], hrMax: number): WeeklySummary {
  const totalDetik = workouts.reduce((a, w) => a + w.durasi, 0)
  const totalKm = workouts.reduce((a, w) => a + (w.jarakKm ?? 0), 0)
  const totalKcal = workouts.reduce((a, w) => a + (w.kcal ?? 0), 0)

  let mudahDetik = 0
  let berzonaDetik = 0
  for (const w of workouts) {
    const slices = zoneBreakdown(w.hr, hrMax)
    for (const s of slices) {
      const d = s.menit * 60
      berzonaDetik += d
      if (s.zona <= 2) mudahDetik += d
    }
  }

  return {
    sesi: workouts.length,
    totalMenit: Math.round(totalDetik / 60),
    totalKm: +totalKm.toFixed(2),
    totalKcal: Math.round(totalKcal),
    rerataPaceSec: totalKm > 0 ? Math.round(totalDetik / totalKm) : undefined,
    pctMudah: berzonaDetik > 0 ? Math.round((mudahDetik / berzonaDetik) * 100) : undefined,
  }
}

export function fmtDurasi(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  return h > 0 ? `${h}j ${m}m` : `${m} menit`
}

export function fmtPace(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
