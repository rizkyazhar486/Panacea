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
import { isComplete } from './careEpisode'
import type { CareEpisode, LifeDomain, LifeEvent } from './types'

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

// One thread in the story. "life" items are entirely the user's own words;
// "health" items are derived from real Care Episode timestamps (when a
// journey actually started, actually got blocked, actually completed) —
// never a diagnosis or vital sign restated as a "life moment," just the
// real shape of when something in their care happened. A single life
// shouldn't live in two separate timelines just because one thread is
// medical — this is what makes it one story instead of two apps.
export interface StoryItem {
  id: string
  at: string
  title: string
  note?: string
  kind: 'life' | 'health'
  domains: LifeDomain[]
  impact?: LifeEvent['impact'] // only 'life' items carry a self-rated impact
  healthStatus?: 'started' | 'blocked' | 'completed' // only 'health' items
  isTurningPoint?: boolean // only 'life' items — the user's own call, never inferred
}

export function lifeEventToStoryItem(e: LifeEvent): StoryItem {
  return {
    id: e.id,
    at: e.at,
    title: e.title,
    note: e.note,
    kind: 'life',
    domains: e.domains,
    impact: e.impact,
    isTurningPoint: e.isTurningPoint,
  }
}

// Real timestamps from the episode's own stage history — nothing inferred.
// Started when the episode was created; blocked at the moment a stage was
// actually marked blocked (with whatever reason was actually given);
// completed at the timestamp every stage actually finished.
export function careEpisodeToStoryItems(ep: CareEpisode): StoryItem[] {
  const items: StoryItem[] = [
    { id: `${ep.id}_started`, at: ep.createdAt, title: `Started: ${ep.title}`, kind: 'health', domains: ['physical'], healthStatus: 'started' },
  ]
  for (const stage of ep.stages) {
    if (stage.status === 'blocked' && stage.updatedAt) {
      items.push({
        id: `${ep.id}_blocked_${stage.stage}`,
        at: stage.updatedAt,
        title: `Blocked: ${ep.title}`,
        note: stage.blockedReason,
        kind: 'health',
        domains: ['physical'],
        healthStatus: 'blocked',
      })
    }
  }
  if (isComplete(ep)) {
    items.push({ id: `${ep.id}_completed`, at: ep.updatedAt, title: `Completed: ${ep.title}`, kind: 'health', domains: ['physical'], healthStatus: 'completed' })
  }
  return items
}

export interface LifeChapter {
  name: string
  ageRange: string
  items: StoryItem[]
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

// A real count of what's actually been logged per domain — not a wellbeing
// score, not an inferred "you're neglecting X." Just arithmetic on the
// user's own entries, sorted highest first, domains never logged omitted
// entirely rather than shown as a zero that implies a judgment.
export interface DomainCount {
  domain: LifeDomain
  count: number
}

export function domainCounts(events: LifeEvent[]): DomainCount[] {
  const counts = new Map<LifeDomain, number>()
  for (const e of events) {
    for (const d of e.domains) counts.set(d, (counts.get(d) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
}

// Groups items (life moments and/or health-episode moments, merged) into
// chapters, oldest chapter first, items within a chapter oldest first —
// read top-to-bottom like a story.
export function groupIntoChapters(items: StoryItem[], dob: string): LifeChapter[] {
  const sorted = [...items].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  const chapters = new Map<string, LifeChapter>()
  for (const it of sorted) {
    const age = ageAt(dob, it.at)
    const { name, ageRange } = chapterForAge(age)
    if (!chapters.has(name)) chapters.set(name, { name, ageRange, items: [] })
    chapters.get(name)!.items.push(it)
  }
  // Emit in chronological chapter order (CHAPTER_BOUNDS order), skipping any
  // chapter with no items rather than showing empty chapters.
  return CHAPTER_BOUNDS.map((b) => chapters.get(b.name)).filter((c): c is LifeChapter => !!c)
}
