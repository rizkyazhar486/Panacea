// ─────────────────────────────────────────────────────────────────────────────
// Optional daily wellbeing prompts.
//
// Home should not force every visit into a clinical frame. Panacea can still
// feel energetic, humane and visually expressive without inventing outcomes or
// judging the user's day. These prompts are intentionally small and optional.
//
// RULES FOR THIS LIST:
//   1. The action must be low-friction and possible in a few minutes.
//   2. The wording must describe the action honestly, not promise a result.
//   3. Health-related explanations must be cautious and proportional to the
//      evidence. Association is not causation; an average study effect is not a
//      guarantee for one person.
//   4. Completion is never a health score, diagnosis, treatment result or moral
//      judgement. The user can ignore every prompt without “failing” anything.
//   5. No variable rewards or mechanics designed to keep the user reopening the
//      app without a useful reason.
// ─────────────────────────────────────────────────────────────────────────────

export interface Kesenangan {
  id: string
  judul: string
  /** Short, concrete instruction. */
  ajakan: string
  /** Approximate time needed for the action. */
  menit: number
  emoji: string
  /** Visual identity only; color does not imply healthy/unhealthy. */
  warna: 'kuning' | 'jingga' | 'merah' | 'ungu' | 'biru' | 'hijau' | 'toska' | 'merahmuda'
  /** Evidence-aware explanation without a guaranteed outcome. */
  kenapa: string
  /** Optional route for a fuller tool or explanation. */
  ke?: string
}

export const WARNA: Record<Kesenangan['warna'], { bg: string; teks: string; pekat: string }> = {
  kuning: { bg: 'bg-amber-400/25', teks: 'text-amber-900 dark:text-amber-200', pekat: 'bg-amber-400' },
  jingga: { bg: 'bg-orange-400/25', teks: 'text-orange-900 dark:text-orange-200', pekat: 'bg-orange-400' },
  merah: { bg: 'bg-rose-400/25', teks: 'text-rose-900 dark:text-rose-200', pekat: 'bg-rose-400' },
  ungu: { bg: 'bg-violet-400/25', teks: 'text-violet-900 dark:text-violet-200', pekat: 'bg-violet-400' },
  biru: { bg: 'bg-sky-400/25', teks: 'text-sky-900 dark:text-sky-200', pekat: 'bg-sky-400' },
  hijau: { bg: 'bg-emerald-400/25', teks: 'text-emerald-900 dark:text-emerald-200', pekat: 'bg-emerald-400' },
  toska: { bg: 'bg-teal-400/25', teks: 'text-teal-900 dark:text-teal-200', pekat: 'bg-teal-400' },
  merahmuda: { bg: 'bg-pink-400/25', teks: 'text-pink-900 dark:text-pink-200', pekat: 'bg-pink-400' },
}

export const KESENANGAN: Kesenangan[] = [
  {
    id: 'cahaya', judul: 'Get some daylight', ajakan: 'Step outside for a few minutes if conditions are safe.',
    menit: 5, emoji: '🌤️', warna: 'kuning',
    kenapa: 'Light exposure is an important cue for circadian timing. The effect depends on timing, intensity, duration and the individual.',
    ke: '/light-exposure',
  },
  {
    id: 'napas', judul: 'Try slow breathing', ajakan: 'Breathe comfortably and make the exhale a little longer for a few rounds.',
    menit: 2, emoji: '🫧', warna: 'biru',
    kenapa: 'Slow breathing can reduce perceived arousal or stress for some people. Stop if it causes dizziness or discomfort.',
    ke: '/breathwork',
  },
  {
    id: 'gerak', judul: 'Move for a few minutes', ajakan: 'Walk, dance, take the stairs, or choose another comfortable movement.',
    menit: 5, emoji: '💃', warna: 'jingga',
    kenapa: 'A short movement break adds physical activity and interrupts prolonged sitting. It does not need to count as a training session.',
    ke: '/workout',
  },
  {
    id: 'kabari', judul: 'Message someone', ajakan: 'Send a short message to someone you want to stay connected with.',
    menit: 2, emoji: '💌', warna: 'merahmuda',
    kenapa: 'Social connection is associated with health and wellbeing in population research. This prompt is simply one low-effort way to maintain contact.',
  },
  {
    id: 'air', judul: 'Have some water', ajakan: 'Drink according to thirst and your usual fluid needs.',
    menit: 1, emoji: '💧', warna: 'toska',
    kenapa: 'Fluid needs vary with body size, activity, climate, diet and medical conditions. People with prescribed fluid restriction should follow their care plan.',
    ke: '/hydration',
  },
  {
    id: 'regang', judul: 'Stand and move', ajakan: 'Stand up, change position, and move your shoulders or legs comfortably.',
    menit: 2, emoji: '🙆', warna: 'ungu',
    kenapa: 'Changing position breaks up prolonged sitting. No single stretch is presented here as a treatment or injury-prevention guarantee.',
    ke: '/stretching',
  },
  {
    id: 'syukur', judul: 'Write one positive note', ajakan: 'Record one thing from today that you appreciated or want to remember.',
    menit: 1, emoji: '✨', warna: 'kuning',
    kenapa: 'Brief positive-reflection exercises have shown small average wellbeing effects in some studies. They are optional prompts, not a treatment for low mood.',
    ke: '/logs',
  },
  {
    id: 'musik', judul: 'Play music you enjoy', ajakan: 'Choose one song because you want to hear it, not because the app says you should.',
    menit: 4, emoji: '🎧', warna: 'ungu',
    kenapa: 'Music can be used for enjoyment or relaxation, but responses differ between people and situations.',
  },
  {
    id: 'matahari', judul: 'Walk after a meal', ajakan: 'If appropriate for you, take an easy walk after your next meal.',
    menit: 10, emoji: '🚶', warna: 'hijau',
    kenapa: 'Light post-meal activity can reduce the average postprandial glucose rise in studies. Individual response and suitability vary.',
    ke: '/workout',
  },
  {
    id: 'layar', judul: 'Change your focus distance', ajakan: 'Look away from the screen at something farther away for a short break.',
    menit: 1, emoji: '👀', warna: 'biru',
    kenapa: 'Changing focus distance and taking breaks can reduce visual discomfort during prolonged near work for some people.',
    ke: '/screen-time',
  },
  {
    id: 'tawa', judul: 'Take a short recreation break', ajakan: 'Choose something you find funny or enjoyable for a few minutes.',
    menit: 3, emoji: '😄', warna: 'jingga',
    kenapa: 'This is a recreation prompt, not a medical intervention. The purpose is simply to make room for a brief enjoyable activity.',
  },
  {
    id: 'rapikan', judul: 'Finish one small task', ajakan: 'Pick one clearly bounded task that can be completed in a few minutes.',
    menit: 5, emoji: '🧹', warna: 'toska',
    kenapa: 'A small bounded task can provide structure for the next few minutes. No health or productivity outcome is implied.',
  },
]

const KUNCI = 'pmd_semangat_v1'

interface Simpanan {
  /** Local date → ids completed on that date. */
  [tanggal: string]: string[]
}

function hariIni(): string {
  const d = new Date()
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function baca(): Simpanan {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return {}
    const p = JSON.parse(raw) as Simpanan
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

export function hariIniSelesai(): string[] {
  return baca()[hariIni()] ?? []
}

export function tandai(id: string): string[] {
  const s = baca()
  const t = hariIni()
  const kini = new Set(s[t] ?? [])
  if (kini.has(id)) kini.delete(id)
  else kini.add(id)
  s[t] = [...kini]
  // Keep only recent history because this widget does not use older entries.
  const kunci = Object.keys(s).sort().slice(-60)
  const ramping: Simpanan = {}
  for (const k of kunci) ramping[k] = s[k]
  try { localStorage.setItem(KUNCI, JSON.stringify(ramping)) } catch { /* storage unavailable/full */ }
  return s[t]
}

/**
 * Three deterministic optional prompts for the current day.
 *
 * The selection changes by date rather than on every app open so it does not
 * become a variable-reward loop. Time of day only removes prompts that would be
 * poorly timed, such as daylight late at night.
 */
export function tawaranHariIni(sekarang = new Date()): Kesenangan[] {
  const jam = sekarang.getHours()
  const layak = KESENANGAN.filter((k) => {
    if (k.id === 'cahaya' && (jam < 5 || jam > 17)) return false
    if (k.id === 'matahari' && (jam < 6 || jam > 21)) return false
    return true
  })
  const hari = Math.floor(
    (Date.UTC(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()) - Date.UTC(2024, 0, 1)) / 86400000,
  )
  const keluar: Kesenangan[] = []
  for (let i = 0; i < 3 && i < layak.length; i++) {
    keluar.push(layak[(((hari * 3 + i) % layak.length) + layak.length) % layak.length])
  }
  return keluar.filter((k, i) => keluar.findIndex((x) => x.id === k.id) === i)
}
