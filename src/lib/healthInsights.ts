// Deterministic, rule-based coaching nudges generated from the user's own
// Health Profile history — NOT an AI/LLM call, so it costs nothing per use
// (no PNC credits, no API latency) and is fully explainable. Compares recent
// snapshots against slightly older ones to catch meaningful trend shifts.

import { buildPersonalBaseline, type HealthBaselineMetric } from './healthProfileBaseline'
import { analisisTrenSeri, type StatusTren } from './labTrend'

export interface HistorySnapshot {
  date: string
  vo2max?: number; restingHr?: number; hrvMs?: number; recoveryPct?: number; sleepH?: number
}
export interface Insight {
  id: string
  tone: 'brand' | 'low' | 'neutral' | 'critical'
  icon: string
  title: string
  body: string
}

function avg(nums: number[]): number | null {
  const v = nums.filter((n) => typeof n === 'number' && n > 0)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

const BASELINE_META: Array<{ metric: HealthBaselineMetric; label: string; unit: string }> = [
  { metric: 'restingHr', label: 'Resting HR', unit: 'bpm' },
  { metric: 'hrvMs', label: 'HRV', unit: 'ms' },
  { metric: 'sleepH', label: 'Sleep', unit: 'h' },
  { metric: 'vo2max', label: 'VO₂max', unit: 'mL/kg/min' },
]

// Garis dasar wearable memakai mesin yang SAMA dengan tren lab
// (src/lib/labTrend.ts): median/MAD riwayat sebelumnya, satu titik tidak
// pernah "bermakna", dua titik berurutan searah baru dikonfirmasi. Tanpa
// rentang populasi, tingkat tertingginya "perubahan bermakna" — tidak pernah
// "kritis" dari angka jam tangan saja.
const JUDUL_STATUS: Record<StatusTren, string> = {
  'belum-cukup-data': 'building baseline',
  stabil: 'stable for you',
  pantau: 'watch',
  'perubahan-bermakna': 'meaningful change',
  'bicarakan-dengan-dokter': 'discuss with a doctor',
}

function baselineInsights(history: HistorySnapshot[]): Insight[] {
  return BASELINE_META.flatMap(({ metric, label, unit }) => {
    const baseline = buildPersonalBaseline(history, metric)
    if (!baseline) return []
    const seri = history
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.date))
      .map((s) => ({ tanggal: s.date, nilai: s[metric] }))
      .filter((x): x is { tanggal: string; nilai: number } => typeof x.nilai === 'number' && Number.isFinite(x.nilai) && x.nilai > 0)
    const tren = analisisTrenSeri(seri)
    const status = tren?.status ?? 'belum-cukup-data'
    const geser = tren?.garisDasar != null && tren.selisih != null
      ? ` Latest ${tren.terakhir.toFixed(1)} ${unit} is ${tren.selisih >= 0 ? '+' : '−'}${Math.abs(tren.selisih).toFixed(1)} vs your usual ${tren.garisDasar.toFixed(1)}.`
      : ''
    return [{
      id: `personal-baseline-${metric}`,
      tone: status === 'pantau' || status === 'perubahan-bermakna' ? ('low' as const) : ('neutral' as const),
      icon: '🎯',
      title: `${label} · ${JUDUL_STATUS[status]}`,
      body: `${tren?.alasan ?? ''}${geser} Median ${baseline.median.toFixed(1)} ${unit} over ${baseline.count} days; compared with your own history, not a population norm or diagnosis.`.trim(),
    }]
  })
}

function splitWindows<T extends HistorySnapshot>(history: T[], n = 3): { recent: T[]; prior: T[] } {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  return { recent: sorted.slice(-n), prior: sorted.slice(-2 * n, -n) }
}

export function generateInsights(history: HistorySnapshot[]): Insight[] {
  const out: Insight[] = []
  if (history.length < 2) {
    return [{
      id: 'not-enough-data', tone: 'neutral', icon: '📊', title: 'Not enough data yet',
      body: 'Save your Health Data at least a few times (ideally every morning) so Panaceamed can detect trends and give automatic recommendations.',
    }]
  }

  out.push(...baselineInsights(history))

  const { recent, prior } = splitWindows(history, 3)
  const recentHrv = avg(recent.map((s) => s.hrvMs ?? 0))
  const priorHrv = avg(prior.map((s) => s.hrvMs ?? 0))
  const recentRhr = avg(recent.map((s) => s.restingHr ?? 0))
  const priorRhr = avg(prior.map((s) => s.restingHr ?? 0))
  const recentSleep = avg(recent.map((s) => s.sleepH ?? 0))
  const recentVo2 = avg(recent.map((s) => s.vo2max ?? 0))
  const priorVo2 = avg(prior.map((s) => s.vo2max ?? 0))

  if (recentHrv != null && priorHrv != null && priorHrv > 0) {
    const delta = ((recentHrv - priorHrv) / priorHrv) * 100
    if (delta <= -10) {
      out.push({
        id: 'hrv-down', tone: 'critical', icon: '⚠️',
        title: `HRV down ${Math.abs(delta).toFixed(0)}%`,
        body: 'A sign your body hasn\'t fully recovered. Consider an easy session (relaxed Zone 2) or full rest today, and prioritize sleep tonight.',
      })
    } else if (delta >= 10) {
      out.push({
        id: 'hrv-up', tone: 'brand', icon: '💪',
        title: `HRV improved ${delta.toFixed(0)}%`,
        body: 'Your body is ready. This is a good time for a harder session — VO₂max intervals or high-intensity strength training.',
      })
    }
  }

  if (recentRhr != null && priorRhr != null && priorRhr > 0) {
    const deltaBpm = recentRhr - priorRhr
    if (deltaBpm >= 4) {
      out.push({
        id: 'rhr-up', tone: 'low', icon: '❤️',
        title: `Resting HR up ${deltaBpm.toFixed(0)} bpm`,
        body: 'Could indicate fatigue, stress, or the onset of illness. Monitor for the next 2-3 days; if it persists along with other symptoms, consider extra rest.',
      })
    }
  }

  if (recentSleep != null && recentSleep < 6.5) {
    out.push({
      id: 'sleep-low', tone: 'critical', icon: '😴',
      title: `Average sleep ${recentSleep.toFixed(1)}h`,
      body: 'Below the recommended 7-9 hours/night. Accumulating sleep debt affects recovery, HRV, and cognitive performance — try moving bedtime 30-60 minutes earlier.',
    })
  }

  if (recentVo2 != null && priorVo2 != null && priorVo2 > 0) {
    const delta = recentVo2 - priorVo2
    if (delta >= 1) {
      out.push({
        id: 'vo2-up', tone: 'brand', icon: '📈',
        title: `VO₂max up ${delta.toFixed(1)} points`,
        body: 'Your aerobic training is paying off. Keep up the Zone 2 base and occasional intervals to keep pushing this limit.',
      })
    }
  }

  if (!out.length) {
    out.push({
      id: 'stable', tone: 'neutral', icon: '✅', title: 'Everything looks stable',
      body: 'No significant changes in your recent trends. Keep being consistent with your routine & tracking.',
    })
  }
  return out
}
