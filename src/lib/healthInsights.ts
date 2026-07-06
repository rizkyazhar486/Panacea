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
      id: 'not-enough-data', tone: 'neutral', icon: '📊', title: 'Data belum cukup',
      body: 'Simpan Data Kesehatan setidaknya beberapa kali (idealnya tiap pagi) agar Panaceamed bisa mendeteksi tren dan memberi rekomendasi otomatis.',
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
        title: `HRV turun ${Math.abs(delta).toFixed(0)}%`,
        body: 'Tanda tubuh belum pulih penuh. Pertimbangkan sesi ringan (Zone 2 santai) atau istirahat penuh hari ini, dan prioritaskan tidur malam ini.',
      })
    } else if (delta >= 10) {
      out.push({
        id: 'hrv-up', tone: 'brand', icon: '💪',
        title: `HRV membaik ${delta.toFixed(0)}%`,
        body: 'Tubuh Anda dalam kondisi siap. Ini waktu yang baik untuk sesi lebih berat — interval VO₂max atau latihan kekuatan intensitas tinggi.',
      })
    }
  }

  // Resting HR creeping up is an early flag (fatigue, incoming illness, overreaching).
  if (recentRhr != null && priorRhr != null && priorRhr > 0) {
    const deltaBpm = recentRhr - priorRhr
    if (deltaBpm >= 4) {
      out.push({
        id: 'rhr-up', tone: 'low', icon: '❤️',
        title: `HR istirahat naik ${deltaBpm.toFixed(0)} bpm`,
        body: 'Bisa jadi indikasi kelelahan, stres, atau awal sakit. Pantau 2-3 hari ke depan; jika berlanjut disertai gejala lain, pertimbangkan istirahat ekstra.',
      })
    }
  }

  // Sleep debt.
  if (recentSleep != null && recentSleep < 6.5) {
    out.push({
      id: 'sleep-low', tone: 'critical', icon: '😴',
      title: `Rata-rata tidur ${recentSleep.toFixed(1)} jam`,
      body: 'Di bawah rekomendasi 7-9 jam/malam. Utang tidur menumpuk memengaruhi pemulihan, HRV, dan performa kognitif — coba majukan waktu tidur 30-60 menit.',
    })
  }

  // VO2max progress — reinforce the behavior that's working.
  if (recentVo2 != null && priorVo2 != null && priorVo2 > 0) {
    const delta = recentVo2 - priorVo2
    if (delta >= 1) {
      out.push({
        id: 'vo2-up', tone: 'brand', icon: '📈',
        title: `VO₂max naik ${delta.toFixed(1)} poin`,
        body: 'Latihan aerobik Anda berbuah hasil. Pertahankan basis Zone 2 dan sesekali interval untuk terus mendorong batas ini.',
      })
    }
  }

  if (!out.length) {
    out.push({
      id: 'stable', tone: 'neutral', icon: '✅', title: 'Semua terlihat stabil',
      body: 'Tidak ada perubahan signifikan pada tren terbaru Anda. Terus konsisten dengan rutinitas & pencatatan.',
    })
  }
  return out
}
