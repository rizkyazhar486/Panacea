// Life Story: health as one thread in a whole life, not a sequence of
// clinical events. See LifeEvent in ./types for why every field here is
// self-reported rather than computed — meaning, relationships, and mood
// aren't measurable the way a lab value is, and scoring them algorithmically
// would be exactly the kind of fabrication this app refuses to do elsewhere.
//
// The one thing here that IS computed, not invented, is which "chapter" a
// moment falls into: real age math from the patient's actual date of birth,
// mapped onto ordinary human life stages. Everything else is the user's own
// words.
import type { LifeDomain, LifeEvent } from './types'

export const LIFE_DOMAINS: { key: LifeDomain; label: string; emoji: string }[] = [
  { key: 'physical', label: 'Physical', emoji: '💪' },
  { key: 'mental', label: 'Mental', emoji: '🧠' },
  { key: 'social', label: 'Social', emoji: '🫂' },
  { key: 'relationships', label: 'Relationships', emoji: '❤️' },
  { key: 'sex', label: 'Sex', emoji: '💞' },
  { key: 'money', label: 'Money', emoji: '💰' },
  { key: 'career', label: 'Career', emoji: '💼' },
  { key: 'study', label: 'Study & knowledge', emoji: '📚' },
  { key: 'recreation', label: 'Recreation & play', emoji: '🎮' },
  { key: 'family', label: 'Family', emoji: '🏡' },
  { key: 'purpose', label: 'Purpose', emoji: '🧭' },
  { key: 'creativity', label: 'Creativity', emoji: '🎨' },
]

export const DOMAIN_LABEL: Record<LifeDomain, string> = Object.fromEntries(
  LIFE_DOMAINS.map((d) => [d.key, d.label]),
) as Record<LifeDomain, string>

export const DOMAIN_EMOJI: Record<LifeDomain, string> = Object.fromEntries(
  LIFE_DOMAINS.map((d) => [d.key, d.emoji]),
) as Record<LifeDomain, string>

export interface LifeChapter {
  name: string
  ageRange: string
  events: LifeEvent[]
}

// Ordinary, widely-recognized life stages — not a fabricated "personality
// arc," just years-of-age brackets. A chapter is where in a human life the
// moment happened, computed from the patient's real date of birth.
const CHAPTER_BOUNDS: { name: string; from: number; to: number }[] = [
  { name: 'Origin', from: -1, to: 12 },
  { name: 'Growth', from: 13, to: 22 },
  { name: 'Foundation', from: 23, to: 35 },
  { name: 'Family & Career', from: 36, to: 50 },
  { name: 'Mastery', from: 51, to: 65 },
  { name: 'Legacy', from: 66, to: 999 },
]

function ageAt(dob: string, at: string): number {
  const birth = new Date(dob).getTime()
  const when = new Date(at).getTime()
  return Math.floor((when - birth) / (365.25 * 24 * 3600 * 1000))
}

export function chapterForAge(age: number): { name: string; ageRange: string } {
  const bound = CHAPTER_BOUNDS.find((b) => age >= b.from && age <= b.to) ?? CHAPTER_BOUNDS[CHAPTER_BOUNDS.length - 1]
  const range = bound.to >= 999 ? `${bound.from}+` : `${Math.max(bound.from, 0)}–${bound.to}`
  return { name: bound.name, ageRange: range }
}

// Groups events into chapters, oldest chapter first, events within a
// chapter oldest first — read top-to-bottom like a story.
export function groupIntoChapters(events: LifeEvent[], dob: string): LifeChapter[] {
  const sorted = [...events].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  const chapters = new Map<string, LifeChapter>()
  for (const ev of sorted) {
    const age = ageAt(dob, ev.at)
    const { name, ageRange } = chapterForAge(age)
    if (!chapters.has(name)) chapters.set(name, { name, ageRange, events: [] })
    chapters.get(name)!.events.push(ev)
  }
  // Emit in chronological chapter order (CHAPTER_BOUNDS order), skipping any
  // chapter with no events rather than showing empty chapters.
  return CHAPTER_BOUNDS.map((b) => chapters.get(b.name)).filter((c): c is LifeChapter => !!c)
}
