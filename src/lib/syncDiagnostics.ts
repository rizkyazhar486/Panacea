// Self-diagnosis for the Apple Health sync.
//
// Why this exists: when a sync "doesn't work", the failure is almost never
// visible to the user. The phone reports success, the website shows nothing,
// and there is no way to tell which of four completely different causes it was.
// Asking someone to read server logs is not a real answer for a product.
//
// So this classifies a payload the way the server does and names the actual
// cause. The four failure modes look identical from outside but need opposite
// fixes:
//
//   1. Metric groups arrived but every one is EMPTY  -> the Date Range in the
//      app is too narrow, or that metric simply isn't recorded daily (VO2max
//      and weight are not). Widening the range fixes it. Nothing is broken.
//   2. Groups arrived with samples but NO NAME MATCHED -> a naming mismatch we
//      need to fix in code. This is our bug, not the user's.
//   3. NOTHING arrived at all -> the phone never reached the server: wrong URL,
//      automation disabled, or the backend is asleep/down.
//   4. Data matched fine -> sync works; the problem is elsewhere.

export type SyncVerdict = 'ok' | 'empty-samples' | 'name-mismatch' | 'no-payload' | 'not-json'

export interface MetricReport {
  name: string
  sampleCount: number
  recognised: boolean
  /** Which of our fields it mapped to, when recognised. */
  mappedTo?: string
  value?: number
}

export interface SyncDiagnosis {
  verdict: SyncVerdict
  headline: string
  explanation: string
  /** What the user should actually do, in order. */
  actions: string[]
  metrics: MetricReport[]
  matchedCount: number
  emptyCount: number
  unknownNames: string[]
}

// Kept deliberately in step with the server's matcher list — if these drift,
// the file path and the webhook path disagree again, which is exactly the class
// of bug this whole area already had once.
const KNOWN: { field: string; test: (n: string) => boolean }[] = [
  { field: 'vo2max', test: (n) => n.includes('vo2') },
  { field: 'restingHr', test: (n) => n.includes('restingheartrate') },
  { field: 'hrvMs', test: (n) => n.includes('heartratevariability') || n.includes('hrv') },
  { field: 'sleepH', test: (n) => n.includes('sleep') },
  { field: 'weightKg', test: (n) => n.includes('weightbodymass') || n === 'bodyweight' || n === 'weight' || n.includes('bodymass') },
  { field: 'bodyFatPct', test: (n) => n.includes('bodyfatpercentage') },
  { field: 'steps', test: (n) => n.includes('stepcount') },
  { field: 'activeKcal', test: (n) => n.includes('activeenergy') },
  { field: 'heartRate', test: (n) => n === 'heartrate' || n.includes('walkingheartrate') },
  { field: 'spo2Pct', test: (n) => n.includes('oxygensaturation') || n.includes('bloodoxygen') },
  { field: 'respRate', test: (n) => n.includes('respiratoryrate') },
  { field: 'systolic', test: (n) => n.includes('bloodpressuresystolic') },
  { field: 'diastolic', test: (n) => n.includes('bloodpressurediastolic') },
  { field: 'leanMassKg', test: (n) => n.includes('leanbodymass') },
  { field: 'bodyTempC', test: (n) => n.includes('bodytemperature') || n.includes('wristtemperature') },
  { field: 'exerciseMin', test: (n) => n.includes('exercisetime') },
  { field: 'distanceKm', test: (n) => n.includes('distancewalkingrunning') },
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function sampleValue(s: Record<string, unknown>): number | undefined {
  for (const k of ['qty', 'Avg', 'avg', 'Max', 'max', 'Min', 'min', 'asleep', 'totalSleep']) {
    const v = s[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return undefined
}

export function diagnose(rawText: string): SyncDiagnosis {
  const base = { metrics: [] as MetricReport[], matchedCount: 0, emptyCount: 0, unknownNames: [] as string[] }

  let root: unknown
  try { root = JSON.parse(rawText) } catch {
    return {
      ...base, verdict: 'not-json',
      headline: 'Isi yang ditempel bukan JSON yang sah',
      explanation: 'Teksnya tidak bisa dibaca sebagai JSON. Kemungkinan tersalin sebagian, atau yang tersalin adalah tampilan layar aplikasi dan bukan isi filenya.',
      actions: [
        'Di Health Auto Export, gunakan Export lalu pilih format JSON dan bagikan filenya.',
        'Buka file itu dan salin SELURUH isinya, mulai dari tanda kurung kurawal pertama.',
      ],
    }
  }

  const data = (root as { data?: unknown })?.data ?? root
  const metrics = (data as { metrics?: unknown })?.metrics

  if (!Array.isArray(metrics) || metrics.length === 0) {
    return {
      ...base, verdict: 'no-payload',
      headline: 'Tidak ada satu pun grup metrik di dalam data ini',
      explanation: 'Struktur yang diharapkan adalah data.metrics berisi daftar metrik. Di sini bagian itu kosong atau tidak ada — artinya telepon memang tidak mengirimkan metrik apa pun, bukan sekadar salah nama.',
      actions: [
        'Di Health Auto Export, pastikan ada metrik yang DICENTANG pada bagian pemilihan data.',
        'Pastikan izin akses Health sudah diberikan ke aplikasi tersebut di Pengaturan iPhone.',
        'Bila memakai Automation, pastikan otomatisasinya benar-benar berjalan dan bukan sekadar tersimpan.',
      ],
    }
  }

  const reports: MetricReport[] = []
  for (const m of metrics as Record<string, unknown>[]) {
    const name = typeof m?.name === 'string' ? m.name : '(tanpa nama)'
    const samples = Array.isArray(m?.data) ? (m.data as Record<string, unknown>[]) : []
    const hit = KNOWN.find((k) => k.test(norm(name)))
    const last = samples.length ? samples[samples.length - 1] : undefined
    reports.push({
      name,
      sampleCount: samples.length,
      recognised: Boolean(hit),
      mappedTo: hit?.field,
      value: last ? sampleValue(last) : undefined,
    })
  }

  const withSamples = reports.filter((r) => r.sampleCount > 0)
  const matched = withSamples.filter((r) => r.recognised)
  const emptyCount = reports.length - withSamples.length
  const unknownNames = withSamples.filter((r) => !r.recognised).map((r) => r.name)

  const common = { metrics: reports, matchedCount: matched.length, emptyCount, unknownNames }

  if (matched.length > 0) {
    return {
      ...common, verdict: 'ok',
      headline: `${matched.length} metrik dikenali dan akan tersimpan`,
      explanation: emptyCount > 0
        ? `Sinkronisasi ini berfungsi. ${emptyCount} grup lain datang tanpa sampel — itu wajar, karena metrik seperti VO2max, berat badan, atau tekanan darah tidak tercatat setiap hari.`
        : 'Sinkronisasi ini berfungsi dan semua grup membawa sampel.',
      actions: matched.length < 5
        ? ['Bila Anda ingin lebih banyak data masuk, centang lebih banyak metrik di Health Auto Export dan perluas Date Range menjadi "Last 7 Days".']
        : ['Tidak ada yang perlu diperbaiki pada sisi ini.'],
    }
  }

  if (withSamples.length === 0) {
    return {
      ...common, verdict: 'empty-samples',
      headline: `${reports.length} grup metrik datang, tetapi semuanya KOSONG`,
      explanation: 'Ini penyebab tersering, dan bukan kerusakan. Telepon berhasil menghubungi server, namun rentang tanggal yang dipilih tidak berisi data. Beberapa metrik memang tidak tercatat harian — VO2max hanya muncul setelah latihan luar ruang tertentu, dan berat badan hanya ada bila Anda menimbang.',
      actions: [
        'Ubah Date Range di Health Auto Export menjadi "Last 7 Days" atau lebih panjang.',
        'Pastikan Apple Watch sudah tersinkron ke iPhone sebelum ekspor dijalankan.',
        'Coba mulai dari metrik yang pasti terisi harian: Steps, Heart Rate, dan Active Energy.',
      ],
    }
  }

  return {
    ...common, verdict: 'name-mismatch',
    headline: 'Data ada, tetapi tidak ada nama metrik yang kami kenali',
    explanation: 'Grup metrik datang lengkap dengan sampel, namun penamaannya tidak cocok dengan yang kami petakan. Ini kesalahan di sisi kami, bukan di sisi Anda — versi aplikasi yang berbeda kadang memakai nama yang berbeda.',
    actions: [
      'Salin daftar nama di bawah ini dan kirimkan kepada kami — dari situ pemetaannya bisa langsung diperbaiki.',
      'Sementara itu, unggah file JSON-nya lewat tombol impor di atas; jalur impor file memakai pemetaan yang lebih luas.',
    ],
  }
}
