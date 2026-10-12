/**
 * Validasi form "Add player" di Sports Lab. Sebelumnya setiap kolom dibaca `Number(x) || 0`: usia kosong menjadi 0,
 * "matches played" kosong menjadi 0 (pemain dinilai dari nol pertandingan), dan statistik kosong atau negatif
 * diam-diam dinilai sebagai level pengganti. Rentang di sini adalah kewajaran input, bukan ambang performa atau klinis.
 */
export const PLAYER_BOUNDS = {
  ageYears: { min: 10, max: 60 },
  matchesPlayed: { min: 1, max: 200 },
  matchesMissed: { min: 0, max: 200 },
  minutesPerMatch: { min: 1, max: 300 },
  metricPercent: { min: 0, max: 100 },
  metricCount: { min: 0, max: 1000 },
} as const

export interface PlayerEntryText {
  name: string
  position: string
  age: string
  played: string
  missed: string
  minutes: string
  metrics: Record<string, string>
}

export interface MetricField { key: string; label: string }

export interface PlayerEntryValue {
  name: string
  position: string
  ageYears: number
  matchesPlayed: number
  matchesMissed: number
  minutesPerMatch: number
  metrics: Record<string, number>
}

/** `problems` dikunci per kolom (`age`, `played`, `missed`, `minutes`, `name`, `metric:<key>`) agar halaman menampilkannya di tempatnya. */
export type PlayerEntryResult =
  | { ok: true; value: PlayerEntryValue }
  | { ok: false; problems: Record<string, string> }

function numeric(text: unknown): number {
  return typeof text === 'string' && text.trim() !== '' ? Number(text) : Number.NaN
}

function whole(text: unknown, label: string, min: number, max: number): { n: number } | { problem: string } {
  const n = numeric(text)
  if (!Number.isFinite(n)) return { problem: `${label}: enter a number` }
  if (!Number.isInteger(n)) return { problem: `${label}: whole number only` }
  if (n < min || n > max) return { problem: `${label}: ${min}–${max}` }
  return { n }
}

export function validatePlayerEntry(raw: PlayerEntryText, metricFields: readonly MetricField[]): PlayerEntryResult {
  const problems: Record<string, string> = {}
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!name) problems.name = 'Name: required'

  const b = PLAYER_BOUNDS
  const age = whole(raw.age, 'Age', b.ageYears.min, b.ageYears.max)
  const played = whole(raw.played, 'Matches played', b.matchesPlayed.min, b.matchesPlayed.max)
  const missed = whole(raw.missed, 'Matches missed', b.matchesMissed.min, b.matchesMissed.max)
  const minutes = whole(raw.minutes, 'Minutes per match', b.minutesPerMatch.min, b.minutesPerMatch.max)
  if ('problem' in age) problems.age = age.problem
  if ('problem' in played) problems.played = played.problem
  if ('problem' in missed) problems.missed = missed.problem
  if ('problem' in minutes) problems.minutes = minutes.problem

  const metrics: Record<string, number> = {}
  for (const f of metricFields) {
    const n = numeric(raw.metrics?.[f.key])
    const range = f.label.includes('(%)') ? b.metricPercent : b.metricCount
    if (!Number.isFinite(n)) problems[`metric:${f.key}`] = `${f.label}: enter a number`
    else if (n < range.min || n > range.max) problems[`metric:${f.key}`] = `${f.label}: ${range.min}–${range.max}`
    else metrics[f.key] = n
  }

  if (Object.keys(problems).length > 0) return { ok: false, problems }
  return {
    ok: true,
    value: {
      name,
      position: typeof raw.position === 'string' && raw.position.trim() ? raw.position.trim() : '—',
      ageYears: (age as { n: number }).n,
      matchesPlayed: (played as { n: number }).n,
      matchesMissed: (missed as { n: number }).n,
      minutesPerMatch: (minutes as { n: number }).n,
      metrics,
    },
  }
}
