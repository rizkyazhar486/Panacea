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
  /**
   * Berat yang dirasakan (Borg CR10, 1-10), hanya pada sesi yang dicatat tangan.
   *
   * Ada karena sesi tangan tidak punya deret denyut jantung: tanpa satu pun
   * keterangan beban, sesi itu hanya berupa lama waktu, dan lari santai 60 menit
   * akan dihitung setara dengan interval 60 menit. RPE tidak menggantikan
   * pengukuran — ia dinyatakan sebagai yang DIRASAKAN, dan tetap ditandai
   * demikian di mana pun dipakai.
   */
  rpe?: number
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
  if (!Array.isArray(raw) || !Number.isFinite(t0)) return []
  const out: HrPoint[] = []
  for (const s of raw as Record<string, unknown>[]) {
    const bpm = sampleBpm(s)
    const t = parseHaeDate(s?.date)
    if (bpm == null || bpm <= 0 || Number.isNaN(t)) continue
    const relatif = Math.round((t - t0) / 1000)
    if (!Number.isFinite(relatif) || relatif < 0) continue
    out.push({ t: relatif, bpm: Math.round(bpm) })
  }
  return out.sort((a, b) => a.t - b.t)
}

/** Energi datang dalam kJ pada sebagian besar ekspor; jadikan kkal. */
function toKcal(v: unknown, units?: unknown): number | undefined {
  const n = qty(v)
  if (n == null || n < 0) return undefined
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

    const akhirValid = !Number.isNaN(t1) && t1 >= t0
    const hr = series(w?.heartRateData, t0)
    // Recovery hanya punya makna relatif terhadap akhir sesi yang benar-benar
    // terekam. Tanpa end timestamp valid, jangan mengarang anchor recovery.
    const pemulihan = akhirValid ? series(w?.heartRateRecovery, t1) : []

    const durasiTerekam = qty(w?.duration)
    const durasiTurunan = akhirValid ? (t1 - t0) / 1000 : 0
    const durasi = durasiTerekam != null && durasiTerekam > 0
      ? durasiTerekam
      : durasiTurunan > 0 ? durasiTurunan : 0

    const jarakMentah = qty(w?.distance) ?? qty(w?.walkingAndRunningDistance)
    const jarakKm = jarakMentah != null && jarakMentah > 0 ? jarakMentah : undefined
    const speedMentah = qty(w?.speed)
    const kecepatanKmh = speedMentah != null && speedMentah > 0
      ? speedMentah
      : jarakKm && durasi > 0 ? (jarakKm / (durasi / 3600)) : undefined

    // HRR1 hanya bermakna bila ekspor benar-benar merekam sampel dekat menit
    // pertama. Pilih titik 45-75 detik yang paling dekat ke 60 detik; jangan
    // mengganti titik yang hilang dengan sampel 10 detik atau beberapa menit
    // kemudian karena itu akan memberi label "1-minute" pada waktu yang salah.
    let hrr1: number | undefined
    const last = <T,>(a: T[]): T | undefined => (a.length ? a[a.length - 1] : undefined)
    const akhir = last(hr)?.bpm
    if (akhir != null && pemulihan.length) {
      const sekitarMenit = pemulihan
        .filter((p) => p.t >= 45 && p.t <= 75)
        .sort((a, b) => Math.abs(a.t - 60) - Math.abs(b.t - 60))
      const titik = sekitarMenit[0]
      if (titik) {
        const puncakAwal = pemulihan.find((p) => p.t >= 0 && p.t <= 15)?.bpm
        const dasar = Math.max(akhir, puncakAwal ?? akhir)
        const d = dasar - titik.bpm
        if (d > 0) hrr1 = Math.round(d)
      }
    }

    const avgHrMentah = qty(w?.avgHeartRate)
    const maxHrMentah = qty(w?.maxHeartRate)
    const cadenceMentah = qty(w?.stepCadence)
    const stepCountMentah = qty(w?.stepCount)
    const langkah = Array.isArray(w?.stepCount)
      ? Math.round((w.stepCount as Record<string, unknown>[]).reduce((a, s) => {
          const n = qty(s?.qty)
          return a + (n != null && n >= 0 ? n : 0)
        }, 0))
      : stepCountMentah != null && stepCountMentah >= 0 ? Math.round(stepCountMentah) : undefined

    out.push({
      id: typeof w?.id === 'string' && w.id.trim() ? w.id : `${w?.name ?? 'workout'}-${t0}`,
      nama: typeof w?.name === 'string' && w.name.trim() ? w.name : 'Latihan',
      mulai: new Date(t0).toISOString(),
      selesai: akhirValid ? new Date(t1).toISOString() : new Date(t0 + durasi * 1000).toISOString(),
      durasi: Math.round(durasi),
      jarakKm: jarakKm != null ? +jarakKm.toFixed(2) : undefined,
      kcal: toKcal(w?.activeEnergyBurned) ?? toKcal(w?.totalEnergy),
      avgHr: avgHrMentah != null && avgHrMentah > 0 ? Math.round(avgHrMentah) : undefined,
      maxHr: maxHrMentah != null && maxHrMentah > 0 ? Math.round(maxHrMentah) : undefined,
      minHr: hr.length ? Math.min(...hr.map((p) => p.bpm)) : undefined,
      kecepatanKmh: kecepatanKmh != null ? +kecepatanKmh.toFixed(2) : undefined,
      paceSec: kecepatanKmh && kecepatanKmh > 0 ? Math.round(3600 / kecepatanKmh) : undefined,
      kadens: cadenceMentah != null && cadenceMentah > 0 ? Math.round(cadenceMentah) : undefined,
      langkah,
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

// Setiap zona dulu memakai satu warna Tailwind generik (slate/emerald/blue/
// amber/red-400) — cukup untuk membedakan, tapi datar dibanding palet
// bernama yang diminta langsung ("shades of blue/green psychology sheet").
// Warna di bawah dipilih dari keluarga yang sama tapi lebih spesifik dan
// bermakna: hijau segar untuk aerobik dasar, biru tegas (bukan biru muda
// polos) untuk tempo, emas untuk ambang, merah balap untuk usaha maksimal.
const ZONA: { zona: 1 | 2 | 3 | 4 | 5; nama: string; dariPct: number; hinggaPct: number; warna: string }[] = [
  { zona: 1, nama: 'Pemulihan', dariPct: 0, hinggaPct: 60, warna: '#94a3b8' },
  { zona: 2, nama: 'Aerobik dasar', dariPct: 60, hinggaPct: 70, warna: '#3CB043' },
  { zona: 3, nama: 'Tempo', dariPct: 70, hinggaPct: 80, warna: '#0F52BA' },
  { zona: 4, nama: 'Ambang', dariPct: 80, hinggaPct: 90, warna: '#E8A33D' },
  { zona: 5, nama: 'Maksimal', dariPct: 90, hinggaPct: 200, warna: '#E0115F' },
]

/**
 * Sebaran waktu per zona, dihitung dari deret per menit.
 *
 * Inilah yang tidak bisa dijawab oleh rata-rata: lari mudah 40 menit dan lari
 * mudah 30 menit yang diselingi lima menit sprint bisa memberi rata-rata yang
 * mirip, padahal tuntutan pemulihannya berbeda jauh.
 */
export function zoneBreakdown(hr: HrPoint[], hrMax: number): ZoneSlice[] {
  if (!Array.isArray(hr) || !Number.isFinite(hrMax) || hrMax <= 0) return []

  // Runtime JSON/local cache tidak mendapat perlindungan TypeScript. Bersihkan
  // titik satu per satu dan urutkan salinan supaya pemanggil tidak termutasi.
  const aman = hr
    .filter((p): p is HrPoint => Boolean(p) && Number.isFinite(p.t) && p.t >= 0 && Number.isFinite(p.bpm) && p.bpm > 0)
    .slice()
    .sort((a, b) => a.t - b.t)
  if (!aman.length) return []

  // Tiap sampel mewakili jarak waktu ke sampel berikutnya. Untuk sampel
  // terakhir pertahankan semantik lama: gunakan interval sebelumnya, atau
  // 60 detik bila hanya ada satu titik.
  const durasiSampel: number[] = aman.map((p, i) =>
    i < aman.length - 1
      ? Math.max(0, aman[i + 1].t - p.t)
      : aman.length > 1
        ? Math.max(0, aman[aman.length - 1].t - aman[aman.length - 2].t)
        : 60,
  )
  const totalDetik = durasiSampel.reduce((a, b) => a + b, 0)
  if (!(totalDetik > 0) || !Number.isFinite(totalDetik)) return []

  return ZONA.map((z) => {
    let detik = 0
    aman.forEach((p, i) => {
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
    const mulaiTs = parseHaeDate(n?.start)
    if (Number.isNaN(mulaiTs)) continue

    const kind = typeof n?.heartNotification === 'string' ? n.heartNotification.toLowerCase() : ''
    const jenis: HrNotification['jenis'] =
      kind.includes('high') ? 'tinggi'
        : kind.includes('low') ? 'rendah'
          : kind.includes('irregular') ? 'iramaTidakTeratur' : 'lain'
    const label =
      jenis === 'tinggi' ? 'High heart rate while inactive'
        : jenis === 'rendah' ? 'Denyut rendah'
          : jenis === 'iramaTidakTeratur' ? 'Irregular rhythm' : 'Heart-rate alert'

    const samples = Array.isArray(n?.heartRateData) ? (n.heartRateData as Record<string, unknown>[]) : []
    const bpms = samples.map((s) => sampleBpm(s)).filter((v): v is number => v != null && v > 0)
    const ambang = typeof n?.threshold === 'number' && Number.isFinite(n.threshold) && n.threshold > 0
      ? n.threshold
      : undefined

    out.push({
      jenis,
      label,
      mulai: new Date(mulaiTs).toISOString(),
      ambang,
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
    arti: 'The watch detected a heart rate above your set threshold for ten minutes while you appeared NOT to be active. The most common triggers are not illness: movement the watch did not read as exercise, anxiety, coffee, fever, poor sleep, dehydration, or the sensor shifting on your wrist.',
    kapanPenting: 'It matters if it comes with chest pain, breathlessness, fainting or near-fainting, spinning dizziness, or if it repeats with no clear trigger. Bring this list of events to an appointment — the timing is more useful to a clinician than the peak number.',
  },
  rendah: {
    arti: 'A heart rate below the threshold while not asleep. In trained people, a low resting heart rate is a sign of fitness rather than a problem.',
    kapanPenting: 'It matters if it comes with light-headedness, unusual fatigue, fainting, or if you take medicines that slow the heart such as beta blockers.',
  },
  iramaTidakTeratur: {
    arti: 'An irregular rhythm resembling atrial fibrillation. This is a notification, not a diagnosis — a watch cannot diagnose a rhythm disorder.',
    kapanPenting: 'This needs following up with an in-person examination and an ECG, especially if it repeats. Keep the dates.',
  },
  lain: {
    arti: 'A heart-rate alert from your watch.',
    kapanPenting: 'Pay attention to the symptoms alongside it, not the number on its own.',
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
  const nonNegatif = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
  const positif = (v: unknown): number =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0

  let totalDetik = 0
  let totalKm = 0
  let totalKcal = 0
  let durasiBerjarak = 0
  let jarakBerpace = 0
  let mudahDetik = 0
  let berzonaDetik = 0
  const hrMaxAman = Number.isFinite(hrMax) && hrMax > 0 ? hrMax : 0

  for (const w of workouts) {
    const durasi = nonNegatif(w?.durasi)
    const jarak = positif(w?.jarakKm)
    const kcal = nonNegatif(w?.kcal)

    totalDetik += durasi
    totalKm += jarak
    totalKcal += kcal

    // Pace agregat hanya memakai sesi yang memiliki pasangan jarak + durasi
    // valid. Sesi strength/non-distance tidak boleh memperlambat pace mingguan.
    if (durasi > 0 && jarak > 0) {
      durasiBerjarak += durasi
      jarakBerpace += jarak
    }

    const hrAman = Array.isArray(w?.hr)
      ? w.hr
          .filter((p): p is HrPoint => Boolean(p) && Number.isFinite(p.t) && p.t >= 0 && Number.isFinite(p.bpm) && p.bpm > 0)
          .slice()
          .sort((a, b) => a.t - b.t)
      : []
    const slices = zoneBreakdown(hrAman, hrMaxAman)
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
    rerataPaceSec: jarakBerpace > 0 && durasiBerjarak > 0
      ? Math.round(durasiBerjarak / jarakBerpace)
      : undefined,
    pctMudah: berzonaDetik > 0 ? Math.round((mudahDetik / berzonaDetik) * 100) : undefined,
  }
}

export function fmtDurasi(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const totalMenit = Math.round(sec / 60)
  const h = Math.floor(totalMenit / 60)
  const m = totalMenit % 60
  return h > 0 ? `${h}j ${m}m` : `${m} menit`
}

export function fmtPace(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '—'
  const totalDetik = Math.round(sec)
  const m = Math.floor(totalDetik / 60)
  const s = totalDetik % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
