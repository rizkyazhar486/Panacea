// Maps a "Health Auto Export" (HealthyApps) REST API JSON payload onto the
// same fields the Health Profile form uses. Payload shape (per the app's
// documented API export format): { data: { metrics: [ { name, units, data: [...] } ] } }
// Most metrics carry { qty, date }; sleep carries { asleep, sleepStart, sleepEnd, ... }.
// Ref: https://github.com/Lybron/health-auto-export/wiki/API-Export---JSON-Format

export interface HealthWebhookResult {
  vo2max?: number
  restingHr?: number
  hrvMs?: number
  sleepH?: number
  weightKg?: number
  bodyFatPct?: number
  steps?: number
  activeKcal?: number
}

// When the user turns on Health Auto Export's "Summarize Data" option, samples
// can arrive as { Min, Avg, Max } instead of a single { qty }, for ANY metric
// (not just heart rate) — so every matcher below must tolerate both shapes.
interface MetricSample { date?: string; qty?: number; asleep?: number; Min?: number; Avg?: number; Max?: number }
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
  const m = date.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})\s*(Z|[+-]\d{2}:?\d{2})?$/)
  if (!m) return NaN
  const offset = !m[3] || m[3] === 'Z' ? 'Z' : m[3].length === 5 ? `${m[3].slice(0, 3)}:${m[3].slice(3)}` : m[3]
  return Date.parse(`${m[1]}T${m[2]}${offset}`)
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

const MATCHERS: { key: keyof HealthWebhookResult; test: (n: string) => boolean; pick: (s: MetricSample) => number | undefined }[] = [
  { key: 'vo2max', test: (n) => n.includes('vo2'), pick: anyValue },
  { key: 'restingHr', test: (n) => n.includes('restingheartrate'), pick: anyValue },
  { key: 'hrvMs', test: (n) => n.includes('heartratevariability') || n.includes('hrv'), pick: anyValue },
  { key: 'weightKg', test: (n) => n.includes('weightbodymass') || n === 'bodyweight' || n === 'weight', pick: anyValue },
  { key: 'bodyFatPct', test: (n) => n.includes('bodyfatpercentage'), pick: (s) => { const v = anyValue(s); return v != null ? (v <= 1 ? v * 100 : v) : undefined } },
  { key: 'steps', test: (n) => n.includes('stepcount'), pick: anyValue },
  { key: 'activeKcal', test: (n) => n.includes('activeenergy'), pick: anyValue },
]

export function parseHealthWebhookPayload(body: unknown): HealthWebhookResult {
  const out: HealthWebhookResult = {}
  const metrics = (body as Payload)?.data?.metrics
  if (!Array.isArray(metrics)) return out

  for (const m of metrics) {
    if (!m?.name || !Array.isArray(m.data)) continue
    const n = norm(m.name)

    if (n.includes('sleep')) {
      const s = latestSample(m.data as (MetricSample & { asleep?: number; totalSleep?: number })[])
      const asleepMin = (s as { asleep?: number; totalSleep?: number } | undefined)?.asleep
        ?? (s as { asleep?: number; totalSleep?: number } | undefined)?.totalSleep
      if (typeof asleepMin === 'number' && asleepMin > 0) out.sleepH = +(asleepMin / 60).toFixed(1)
      continue
    }

    const matcher = MATCHERS.find((mm) => mm.test(n))
    if (!matcher) continue
    const s = latestSample(m.data)
    if (!s) continue
    const v = matcher.pick(s)
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[matcher.key] = Math.round(v * 10) / 10
  }
  return out
}
