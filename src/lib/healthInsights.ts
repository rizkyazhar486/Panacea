// Deterministic, rule-based coaching nudges generated from the user's own
// Health Profile history — NOT an AI/LLM call, so it costs nothing per use
// (no PNC credits, no API latency) and is fully explainable. Compares recent
// snapshots against slightly older ones to catch meaningful trend shifts.

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

// Split history into "recent" (last `n`) vs "prior" (the `n` before that) for
// a simple before/after trend comparison — enough signal without overfitting
// to single noisy days.
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

  const { recent, prior } = splitWindows(history, 3)
  const recentHrv = avg(recent.map((s) => s.hrvMs ?? 0))
  const priorHrv = avg(prior.map((s) => s.hrvMs ?? 0))
  const recentRhr = avg(recent.map((s) => s.restingHr ?? 0))
  const priorRhr = avg(prior.map((s) => s.restingHr ?? 0))
  const recentSleep = avg(recent.map((s) => s.sleepH ?? 0))
  const recentVo2 = avg(recent.map((s) => s.vo2max ?? 0))
  const priorVo2 = avg(prior.map((s) => s.vo2max ?? 0))

  // HRV trend — the primary autoregulation signal.
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

  // Resting HR creeping up is an early flag (fatigue, incoming illness, overreaching).
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

  // Sleep debt.
  if (recentSleep != null && recentSleep < 6.5) {
    out.push({
      id: 'sleep-low', tone: 'critical', icon: '😴',
      title: `Average sleep ${recentSleep.toFixed(1)}h`,
      body: 'Below the recommended 7-9 hours/night. Accumulating sleep debt affects recovery, HRV, and cognitive performance — try moving bedtime 30-60 minutes earlier.',
    })
  }

  // VO2max progress — reinforce the behavior that's working.
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
