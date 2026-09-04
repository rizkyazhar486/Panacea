// Pencapaian nyata, dihitung dari data yang benar-benar sudah dicatat
// pengguna (log latihan, tingkatan VO2max) — bukan progres yang dikarang.
// Warnanya membawa arti: merah = darah & oksigen (usaha fisik nyata),
// hijau = alam & konsistensi, emas = kekayaan yang terkumpul (volume nyata),
// hitam = kegagalan/kegelapan/waktu — bangkit setelah jeda, bukan hukuman
// atas jeda itu sendiri. Lihat CLAUDE.md "never fabricate": setiap syarat di
// bawah ini adalah aritmetika sederhana atas data lokal, tidak lebih.

export type AchievementTone = 'red' | 'green' | 'gold' | 'black' | 'prism'

export interface Achievement {
  id: string
  title: string
  desc: string
  tone: AchievementTone
}

const SEEN_KEY = 'pm_achievements_seen'

function loadSeen(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]') } catch { return [] }
}

function saveSeen(ids: string[]) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
}

export function unlockedCount(): number {
  return loadSeen().length
}

interface LoggedSet { date: string; sets: number; reps: number; weight: number }

function distinctDays(log: LoggedSet[]): number {
  return new Set(log.map((l) => l.date)).size
}

function totalVolume(log: LoggedSet[]): number {
  return log.reduce((a, l) => a + l.sets * l.reps * (l.weight || 1), 0)
}

// A comeback: two training days on record with a real gap of 3+ days
// between them, and at least one logged day after that gap. Not a streak
// counter — the opposite of one.
function hasComeback(log: LoggedSet[]): boolean {
  const days = Array.from(new Set(log.map((l) => l.date))).sort()
  for (let i = 1; i < days.length; i++) {
    const gap = (new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86400000
    if (gap >= 3) return true
  }
  return false
}

export function evaluateWorkoutAchievements(log: LoggedSet[]): Achievement[] {
  const out: Achievement[] = []
  if (log.length >= 1) {
    out.push({ id: 'first-blood', title: 'First Blood', desc: 'You logged your first set. It begins.', tone: 'red' })
  }
  if (distinctDays(log) >= 3) {
    out.push({ id: 'iron-week', title: 'Iron Week', desc: 'Three different days trained.', tone: 'green' })
  }
  if (distinctDays(log) >= 7) {
    out.push({ id: 'relentless', title: 'Relentless', desc: 'Seven different days trained.', tone: 'green' })
  }
  if (totalVolume(log) >= 10000) {
    out.push({ id: 'ten-thousand', title: 'Ten Thousand', desc: '10,000 total volume logged.', tone: 'gold' })
  }
  if (hasComeback(log)) {
    out.push({ id: 'the-rise', title: 'The Rise', desc: 'You came back after a gap. That is the whole point.', tone: 'black' })
  }
  return out
}

export function evaluateAthleteAchievements(tier: string): Achievement[] {
  const out: Achievement[] = []
  if (tier === 'Elite') {
    // The rarest real tier gets the rainbow — not decoration, the reward.
    out.push({ id: 'elite-lungs', title: 'Elite Lungs', desc: 'Your estimated VO2max is in the Elite band.', tone: 'prism' })
  } else if (tier === 'Excellent') {
    out.push({ id: 'excellent-lungs', title: 'Full Chest', desc: 'Your estimated VO2max is in the Excellent band.', tone: 'red' })
  }
  return out
}

// Compares candidates (everything currently true) against what has already
// been shown, marks the new ones as seen, and returns only those — so a
// popup fires exactly once per achievement, the first time it becomes true.
export function newlyUnlocked(candidates: Achievement[]): Achievement[] {
  const seen = new Set(loadSeen())
  const fresh = candidates.filter((a) => !seen.has(a.id))
  if (fresh.length > 0) saveSeen([...seen, ...fresh.map((a) => a.id)])
  return fresh
}
