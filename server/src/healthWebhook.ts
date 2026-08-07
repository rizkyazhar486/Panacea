// Maps a "Health Auto Export" (HealthyApps) REST API JSON payload onto the
// same fields the Health Profile form uses. Payload shape (per the app's
// documented API export format): { data: { metrics: [ { name, units, data: [...] } ] } }
// Most metrics carry { qty, date }; sleep carries { asleep, sleepStart, sleepEnd, ... }.
// Ref: https://github.com/Lybron/health-auto-export/wiki/API-Export---JSON-Format

import { cariMetrik, keKanonik } from './healthMetrics.js'

// Kunci apa pun dari katalog boleh muncul; yang disebut eksplisit di bawah
// hanyalah yang sudah dipakai layar lama, agar tetap ikut diperiksa tipenya.
export interface HealthWebhookResult {
  [kunci: string]: number | undefined
  vo2max?: number
  restingHr?: number
  hrvMs?: number
  sleepH?: number
  weightKg?: number
  bodyFatPct?: number
  steps?: number
  activeKcal?: number
  // Widened to match the browser-side parser. Previously the live webhook
  // delivered only the eight fields above while a manually uploaded file
  // yielded fifteen, so the same phone produced different data depending on
  // which path it travelled.
  heartRate?: number
  spo2Pct?: number
  respRate?: number
  systolic?: number
  diastolic?: number
  leanMassKg?: number
  bodyTempC?: number
  exerciseMin?: number
  distanceKm?: number
}

// When the user turns on Health Auto Export's "Summarize Data" option, samples
// can arrive as { Min, Avg, Max } instead of a single { qty }, for ANY metric
// (not just heart rate) — so every matcher below must tolerate both shapes.
interface MetricSample { date?: string; qty?: number; asleep?: number; totalSleep?: number; Min?: number; Avg?: number; Max?: number }
interface Metric { name?: string; units?: string; data?: MetricSample[] }
interface Payload { data?: { metrics?: Metric[] } }

// Normalize a metric name for matching regardless of spacing/case/underscores
// (Apple's own identifiers are snake_case; the app also emits Title Case names).
function norm(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Health Auto Export dates look like "2026-07-05 07:00:00 +0700" (space-separated,
// numeric offset, not ISO) — Date.parse() chokes on this. Reshape to ISO 8601.
function parseExportDate(date: string): number {
  // Fractional seconds are optional: Health Auto Export writes
  // "2026-08-01 07:00:00 +0700", but plain ISO 8601 from any other producer
  // carries ".123" and was being silently dropped as unparseable.
  const m = date.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/)
  if (!m) return NaN
  const raw = m[4]
  const offset = !raw || raw === 'Z' ? 'Z' : raw.length === 5 ? `${raw.slice(0, 3)}:${raw.slice(3)}` : raw
  return Date.parse(`${m[1]}T${m[2]}${m[3] ?? ''}${offset}`)
}

/**
 * Tanggal kalender menurut zona waktu YANG TERTULIS DI PAYLOAD.
 *
 * `new Date(t).toISOString().slice(0, 10)` memberi tanggal UTC. Server ini
 * berjalan di UTC sementara penggunanya di WIB (+07:00), jadi tidur yang
 * berakhir pukul 06.20 tanggal 7 tercatat sebagai malam tanggal 6 — mundur satu
 * hari, setiap malam. Ponsel sudah memberi tahu offsetnya di dalam string
 * tanggal ("+0700"); yang benar adalah memakai offset itu, bukan zona server
 * dan bukan UTC.
 */
export function tanggalDiOffset(date: string): string | null {
  const m = date.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/)
  if (!m) return null
  const t = parseExportDate(date)
  if (Number.isNaN(t)) return null
  const raw = m[4]
  if (!raw || raw === 'Z') return new Date(t).toISOString().slice(0, 10)
  const tanda = raw[0] === '-' ? -1 : 1
  const jj = Number(raw.slice(1, 3))
  const mm = Number(raw.slice(raw.length - 2))
  const menit = tanda * (jj * 60 + mm)
  return new Date(t + menit * 60_000).toISOString().slice(0, 10)
}

// Pick the sample with the latest parseable date. If none parse, assume the
// export is chronological and fall back to the last entry in the array.
function latestSample(samples: MetricSample[] | undefined): MetricSample | undefined {
  if (!samples || !samples.length) return undefined
  let best: MetricSample | undefined
  let bestTime = -Infinity
  for (const s of samples) {
    const t = s.date ? parseExportDate(s.date) : NaN
    if (Number.isNaN(t)) continue
    if (t >= bestTime) { bestTime = t; best = s }
  }
  return best ?? samples[samples.length - 1]
}

// Prefer the exact reading (qty), then the average of the summarized window,
// then whatever bound is available — always something over nothing.
function anyValue(s: MetricSample): number | undefined {
  return s.qty ?? s.Avg ?? s.Max ?? s.Min
}

/**
 * Sleep arrives in hours on some Health Auto Export versions and minutes on
 * others, so the unit cannot be assumed — this previously disagreed with the
 * browser-side parser and the same night produced 7.1 h on one path and 0.1 h
 * on the other. Trust the declared `units` first, then fall back to magnitude:
 * nobody sleeps more than 24 hours, so a larger number must be minutes.
 */
function sleepToHours(raw: number | undefined, units: string | undefined): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return undefined
  const u = (units ?? '').toLowerCase()
  if (u.startsWith('hr') || u.startsWith('hour')) return +raw.toFixed(1)
  if (u.startsWith('min')) return +(raw / 60).toFixed(1)
  return +(raw > 24 ? raw / 60 : raw).toFixed(1)
}

/**
 * Baca SETIAP metrik yang dikenali katalog, bukan hanya belasan yang kebetulan
 * ada di formulir profil.
 *
 * Dua aturan yang membedakan hasilnya dari versi sebelumnya:
 *
 *   * Metrik kumulatif (langkah, jarak, kalori, gizi) DIJUMLAHKAN untuk hari
 *     terbaru, bukan diambil sampel terakhirnya. Mengambil yang terakhir dari
 *     ekspor per jam berarti melaporkan langkah satu jam terakhir sebagai
 *     langkah sehari — angka yang selalu terlalu kecil dan tidak pernah
 *     terlihat salah.
 *   * Setiap nilai dikonversi menurut satuan yang dinyatakan payload, sehingga
 *     pengguna dengan setelan imperial tidak lagi menyimpan pon sebagai
 *     kilogram.
 */
export function parseHealthWebhookPayload(body: unknown): HealthWebhookResult {
  const out: HealthWebhookResult = {}
  const metrics = (body as Payload)?.data?.metrics
  if (!Array.isArray(metrics)) return out

  for (const m of metrics) {
    if (!m?.name || !Array.isArray(m.data) || !m.data.length) continue
    const nm = norm(m.name)

    // Hanya metrik TAHAPAN TIDUR yang ditangani di sini. Sebelumnya syaratnya
    // "mengandung sleep" dengan satu pengecualian yang ditulis tangan, jadi
    // setiap metrik tidur baru dari Apple — gangguan napas saat tidur, dan apa
    // pun yang menyusul — ikut tertelan cabang ini dan hilang tanpa jejak,
    // persis pola kegagalan senyap yang paling sulit dilacak. Sekarang yang
    // tidak dikenali diteruskan ke katalog.
    const tahapanTidur = /^sleep(analysis|_?stage)?$/.test(nm) || nm === 'sleepanalysis'
    if (tahapanTidur) {
      const s = latestSample(m.data)
      const raw = s?.asleep ?? s?.totalSleep
      const h = sleepToHours(raw, m.units)
      if (h != null) out.sleepH = h
      continue
    }

    const def = cariMetrik(m.name)
    if (!def) continue

    let nilai: number | undefined
    if (def.jumlahkan) {
      // Jumlahkan hanya sampel dari hari terbaru yang ada di payload, agar
      // ekspor "Last 7 Days" tidak menumpuk tujuh hari menjadi satu angka.
      let hariTerbaru = ''
      for (const s of m.data) {
        const d = typeof s?.date === 'string' ? s.date.trim().slice(0, 10) : ''
        if (d && d > hariTerbaru) hariTerbaru = d
      }
      let total = 0
      let ada = false
      for (const s of m.data) {
        const d = typeof s?.date === 'string' ? s.date.trim().slice(0, 10) : ''
        if (hariTerbaru && d !== hariTerbaru) continue
        const v = anyValue(s)
        if (typeof v === 'number' && Number.isFinite(v)) { total += v; ada = true }
      }
      if (ada) nilai = total
    } else {
      const s = latestSample(m.data)
      const v = s ? anyValue(s) : undefined
      if (typeof v === 'number' && Number.isFinite(v)) nilai = v
    }

    if (nilai == null) continue
    const dikonversi = keKanonik(nilai, m.units, def.satuan)
    // Nol dibiarkan lolos untuk metrik kumulatif: "hari ini nol langkah" adalah
    // fakta, sedangkan nol pada pengukuran seperti berat badan tidak masuk akal.
    if (!Number.isFinite(dikonversi)) continue
    if (!def.jumlahkan && dikonversi <= 0) continue
    if (def.jumlahkan && dikonversi < 0) continue
    out[def.kunci] = Math.round(dikonversi * 100) / 100
  }
  return out
}

/**
 * Local date (YYYY-MM-DD) of the newest sample in the payload.
 *
 * The trend history used to stamp every arriving payload with the date it was
 * RECEIVED. That is only correct when Health Auto Export is set to "Today":
 * with "Yesterday" — a common setting, and the default in some versions —
 * yesterday's numbers get filed under today, so the chart shows the wrong value
 * against the wrong day and never actually gains a fresh point.
 *
 * Uses the offset in the exported timestamp, which is the phone's own local
 * time, rather than the server's timezone.
 */
export function newestSampleDate(body: unknown): string | null {
  const metrics = (body as Payload)?.data?.metrics
  if (!Array.isArray(metrics)) return null
  let bestT = -Infinity
  let bestRaw = ''
  for (const m of metrics) {
    if (!Array.isArray(m?.data)) continue
    for (const s of m.data) {
      if (!s?.date) continue
      const t = parseExportDate(s.date)
      if (Number.isNaN(t) || t <= bestT) continue
      bestT = t
      bestRaw = s.date
    }
  }
  if (!bestRaw) return null
  // "2026-08-01 17:20:00 +0700" — the leading date is already phone-local.
  const m = bestRaw.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : null
}

// ─────────────────────────────────────────────────────────────────────────────
// SERIES EXTRACTION
//
// Everything above answers "what is the latest value of each metric" and throws
// every other sample away. That is the right shape for filling a profile form
// and the wrong shape for two things the user actually wants: a heart-rate LOG,
// and sleep broken down by stage.
//
// What is honestly achievable, stated here because the UI must not promise more:
//
//   * Apple Watch does NOT record heart rate every second. During a workout it
//     samples roughly every 5 seconds; at rest it samples every few minutes and
//     irregularly, taking more readings when something looks unusual. Per-second
//     data does not exist in HealthKit outside a workout, so no exporter can
//     deliver it.
//   * Health Auto Export's automation runs on a minutes-scale interval, so the
//     freshest a value can arrive is that interval, not "live".
//
// So the ceiling is: every sample HealthKit actually holds, delivered a few
// minutes behind real time. That is genuinely useful — it is a log, not a
// monitor — and calling it anything else would be a lie the data cannot back.
// ─────────────────────────────────────────────────────────────────────────────

export interface HrSample {
  /** Epoch milliseconds. */
  t: number
  bpm: number
  /** Min/Max when the export summarised the window; absent for exact samples. */
  lo?: number
  hi?: number
  /** Which metric produced it, so a resting reading is not mistaken for a workout one. */
  kind: 'heart_rate' | 'resting' | 'walking_avg' | 'workout'
}

export interface SleepSession {
  /** Night identifier: the date the sleep ENDED, which is how people name a night. */
  date: string
  start?: string
  end?: string
  totalH?: number
  deepH?: number
  remH?: number
  coreH?: number
  awakeH?: number
  inBedH?: number
  source?: string
}

function toHours(raw: number | undefined, units: string | undefined): number | undefined {
  return sleepToHours(raw, units)
}

/** Every heart-rate sample in the payload, not just the newest. */
export function extractHeartRateSeries(body: unknown): HrSample[] {
  const metrics = (body as Payload)?.data?.metrics
  const out: HrSample[] = []
  if (Array.isArray(metrics)) {
    for (const m of metrics) {
      if (!m?.name || !Array.isArray(m.data)) continue
      const n = norm(m.name)
      const kind: HrSample['kind'] | null =
        n === 'heartrate' ? 'heart_rate'
          : n.includes('restingheartrate') ? 'resting'
            : n.includes('walkingheartrate') ? 'walking_avg' : null
      if (!kind) continue
      for (const s of m.data) {
        const t = s?.date ? parseExportDate(s.date) : NaN
        const bpm = anyValue(s)
        if (Number.isNaN(t) || typeof bpm !== 'number' || !Number.isFinite(bpm) || bpm <= 0) continue
        out.push({
          t,
          bpm: Math.round(bpm),
          lo: typeof s.Min === 'number' ? Math.round(s.Min) : undefined,
          hi: typeof s.Max === 'number' ? Math.round(s.Max) : undefined,
          kind,
        })
      }
    }
  }

  // Workout heart-rate series are far denser than the daily metric, so they are
  // the closest thing to continuous data that exists. Pull them in too.
  const workouts = (body as { data?: { workouts?: Record<string, unknown>[] } })?.data?.workouts
  if (Array.isArray(workouts)) {
    for (const w of workouts) {
      const hrd = (w as { heartRateData?: MetricSample[] })?.heartRateData
      if (!Array.isArray(hrd)) continue
      for (const s of hrd) {
        const t = s?.date ? parseExportDate(s.date) : NaN
        const bpm = anyValue(s)
        if (Number.isNaN(t) || typeof bpm !== 'number' || !Number.isFinite(bpm) || bpm <= 0) continue
        out.push({
          t,
          bpm: Math.round(bpm),
          lo: typeof s.Min === 'number' ? Math.round(s.Min) : undefined,
          hi: typeof s.Max === 'number' ? Math.round(s.Max) : undefined,
          kind: 'workout',
        })
      }
    }
  }

  return out.sort((a, b) => a.t - b.t)
}

/** Every night in the payload, with stages, not just the newest total. */
export function extractSleepSessions(body: unknown): SleepSession[] {
  const metrics = (body as Payload)?.data?.metrics
  if (!Array.isArray(metrics)) return []
  const out: SleepSession[] = []

  for (const m of metrics) {
    if (!m?.name || !Array.isArray(m.data)) continue
    if (!norm(m.name).includes('sleep')) continue

    for (const raw of m.data as Record<string, unknown>[]) {
      const num = (k: string) => {
        const v = raw[k]
        return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined
      }
      const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string) : undefined)

      const start = str('sleepStart') ?? str('inBedStart') ?? str('startDate')
      const end = str('sleepEnd') ?? str('inBedEnd') ?? str('endDate')
      // Name the night by when it ENDED — that is how people refer to it, and it
      // keeps a session that began before midnight on the right day.
      const endT = end ? parseExportDate(end) : NaN
      const dateT = !Number.isNaN(endT) ? endT : raw.date ? parseExportDate(String(raw.date)) : NaN
      if (Number.isNaN(dateT)) continue
      // Tanggalnya diambil menurut offset yang tertulis di payload, bukan UTC.
      const tanggal = tanggalDiOffset(!Number.isNaN(endT) && end ? end : String(raw.date ?? ''))
        ?? new Date(dateT).toISOString().slice(0, 10)

      // asleep can legitimately be 0 alongside a real totalSleep on current
      // exports, so it must not shadow it.
      const total = toHours(num('asleep') ?? num('totalSleep'), m.units)
      const deep = toHours(num('deep'), m.units)
      const rem = toHours(num('rem'), m.units)
      const core = toHours(num('core'), m.units)
      const awake = toHours(num('awake'), m.units)
      const inBed = toHours(num('inBed'), m.units)
      if (total == null && deep == null && rem == null && core == null) continue

      out.push({
        date: tanggal,
        start: !Number.isNaN(start ? parseExportDate(start) : NaN) ? new Date(parseExportDate(start!)).toISOString() : undefined,
        end: !Number.isNaN(endT) ? new Date(endT).toISOString() : undefined,
        totalH: total, deepH: deep, remH: rem, coreH: core, awakeH: awake, inBedH: inBed,
        source: str('source'),
      })
    }
  }

  // Newest night last; one entry per night, later payloads refresh it upstream.
  return out.sort((a, b) => a.date.localeCompare(b.date))
}
