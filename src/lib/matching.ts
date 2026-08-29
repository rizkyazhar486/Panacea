// Matching engine for the connect/dating page.
//
// Model follows what was asked for: women hold the initiative (Bumble-style),
// men set preferences and are shown to women who fit them. Swipe left rejects,
// swipe right accepts.
//
// Two things are built in rather than bolted on, because dating products cause
// real-world harm when they are omitted:
//
//   1. Location is never exact. Profiles carry a city and an approximate
//      distance band only. Precise coordinates in a dating profile are how
//      stalking happens, and no matching benefit justifies that.
//   2. Compatibility is shown WITH its basis, and never as a single percentage
//      presented as fact. "87% match" implies a measurement nobody has made;
//      showing which specific things overlap lets a person judge for themselves.

export type Sex = 'L' | 'P'

export interface MatchProfile {
  id: string
  displayName: string
  age: number
  sex: Sex
  city: string
  /** Coarse band in km — never an exact coordinate. */
  distanceBand: '<5 km' | '5-15 km' | '15-50 km' | '>50 km'
  bio: string
  /** Shared-interest axes; this being a health app, activity is the spine. */
  activities: string[]
  /** Lifestyle answers used for genuine compatibility rather than looks. */
  lifestyle: {
    smokes: boolean
    drinks: 'tidak' | 'kadang' | 'sering'
    exerciseDaysPerWeek: number
    sleepSchedule: 'pagi' | 'malam' | 'fleksibel'
    wantsChildren: 'ya' | 'tidak' | 'belum yakin'
  }
  lookingFor: 'teman olahraga' | 'hubungan serius' | 'belum yakin'
}

export interface Preferences {
  interestedIn: Sex
  ageMin: number
  ageMax: number
  maxDistanceBand: MatchProfile['distanceBand']
  mustShareActivity: boolean
  nonSmokerOnly: boolean
}

export const ACTIVITY_OPTIONS = [
  'Lari', 'Gym', 'Bersepeda', 'Berenang', 'Yoga', 'Futsal', 'Basket',
  'Badminton', 'Hiking', 'Panjat tebing', 'Tenis', 'Muay thai', 'Pilates', 'Menari',
]

// Nilai di ACTIVITY_OPTIONS dan pada lifestyle/lookingFor adalah IDENTITAS:
// tersimpan di profil pengguna dan dibandingkan dengan === atau .includes().
// Menerjemahkan nilainya akan mengosongkan profil yang sudah ada. Yang
// diterjemahkan hanya labelnya.
export const ACTIVITY_LABEL: Record<string, string> = {
  Lari: 'Running', Gym: 'Gym', Bersepeda: 'Cycling', Berenang: 'Swimming',
  Yoga: 'Yoga', Futsal: 'Futsal', Basket: 'Basketball', Badminton: 'Badminton',
  Hiking: 'Hiking', 'Panjat tebing': 'Climbing', Tenis: 'Tennis',
  'Muay thai': 'Muay thai', Pilates: 'Pilates', Menari: 'Dance',
}
export const LOOKING_FOR_LABEL: Record<MatchProfile['lookingFor'], string> = {
  'teman olahraga': 'a training partner',
  'hubungan serius': 'a serious relationship',
  'belum yakin': 'not sure yet',
}
export const CHILDREN_LABEL: Record<MatchProfile['lifestyle']['wantsChildren'], string> = {
  ya: 'Want children', tidak: 'Do not want children', 'belum yakin': 'Not sure yet',
}
export const MATCH_LABEL: Record<Compatibility['label'], string> = {
  many: 'A lot in common', some: 'Some in common', few: 'Little in common',
}

const BAND_ORDER: MatchProfile['distanceBand'][] = ['<5 km', '5-15 km', '15-50 km', '>50 km']

export interface Compatibility {
  /** Count of concrete overlaps, NOT a percentage — see module note. */
  sharedActivities: string[]
  agreements: string[]
  frictions: string[]
  /** Coarse label, deliberately not a number. */
  label: 'many' | 'some' | 'few'
}

export function compatibility(me: MatchProfile, them: MatchProfile): Compatibility {
  const sharedActivities = me.activities.filter((a) => them.activities.includes(a))

  const agreements: string[] = []
  const frictions: string[] = []

  if (me.lookingFor === them.lookingFor) agreements.push(`Both looking for ${LOOKING_FOR_LABEL[me.lookingFor]}`)
  else frictions.push(`You are looking for ${LOOKING_FOR_LABEL[me.lookingFor]}, they are looking for ${LOOKING_FOR_LABEL[them.lookingFor]}`)

  if (me.lifestyle.smokes === them.lifestyle.smokes) {
    agreements.push(me.lifestyle.smokes ? 'Both smoke' : 'Neither smokes')
  } else {
    frictions.push(me.lifestyle.smokes ? 'You smoke, they do not' : 'They smoke, you do not')
  }

  if (me.lifestyle.drinks === them.lifestyle.drinks) agreements.push('Similar drinking habits')

  const exDiff = Math.abs(me.lifestyle.exerciseDaysPerWeek - them.lifestyle.exerciseDaysPerWeek)
  if (exDiff <= 1) agreements.push('Similar training frequency')
  else if (exDiff >= 4) frictions.push('Very different training frequency')

  if (me.lifestyle.sleepSchedule === them.lifestyle.sleepSchedule) agreements.push('Similar sleep pattern')
  else if (
    (me.lifestyle.sleepSchedule === 'pagi' && them.lifestyle.sleepSchedule === 'malam') ||
    (me.lifestyle.sleepSchedule === 'malam' && them.lifestyle.sleepSchedule === 'pagi')
  ) frictions.push('Opposite sleep patterns (early bird vs night owl)')

  if (me.lifestyle.wantsChildren === them.lifestyle.wantsChildren) {
    agreements.push(me.lifestyle.wantsChildren === 'belum yakin' ? 'Both unsure about children' : me.lifestyle.wantsChildren === 'ya' ? 'Both want children' : 'Neither wants children')
  } else if (
    (me.lifestyle.wantsChildren === 'ya' && them.lifestyle.wantsChildren === 'tidak') ||
    (me.lifestyle.wantsChildren === 'tidak' && them.lifestyle.wantsChildren === 'ya')
  ) {
    // Surfaced early on purpose: this is the disagreement that most often ends
    // relationships years later, and a matching product that hides it to
    // maximise matches is doing its users harm.
    frictions.push('You disagree about wanting children — this is worth discussing early rather than later')
  }

  const positives = sharedActivities.length + agreements.length
  const label: Compatibility['label'] = positives >= 5 && frictions.length <= 1 ? 'many'
    : positives >= 3 ? 'some'
    : 'few'

  return { sharedActivities, agreements, frictions, label }
}

export function passesPreferences(me: MatchProfile, prefs: Preferences, them: MatchProfile): boolean {
  if (them.sex !== prefs.interestedIn) return false
  if (them.age < prefs.ageMin || them.age > prefs.ageMax) return false
  if (BAND_ORDER.indexOf(them.distanceBand) > BAND_ORDER.indexOf(prefs.maxDistanceBand)) return false
  if (prefs.nonSmokerOnly && them.lifestyle.smokes) return false
  if (prefs.mustShareActivity && !me.activities.some((a) => them.activities.includes(a))) return false
  return true
}

/**
 * Builds the deck.
 *
 * Ordered by number of concrete overlaps, NOT by attractiveness or engagement
 * potential. Ranking a dating deck to maximise time-in-app is the mechanic that
 * makes these products harmful; ordering by actual commonality is both more
 * useful and more honest.
 */
export function buildDeck(
  me: MatchProfile,
  prefs: Preferences,
  pool: MatchProfile[],
  seen: string[],
): MatchProfile[] {
  return pool
    .filter((p) => p.id !== me.id && !seen.includes(p.id) && passesPreferences(me, prefs, p))
    .map((p) => ({ p, c: compatibility(me, p) }))
    .sort((a, b) =>
      (b.c.sharedActivities.length + b.c.agreements.length) -
      (a.c.sharedActivities.length + a.c.agreements.length))
    .map((x) => x.p)
}

/** Safety guidance shown before any first meeting is arranged. */
export const SAFETY_RULES = [
  'Meet for the first time in a BUSY PUBLIC PLACE — a cafe, a park, a gym. Never at a home, a room, or anywhere quiet.',
  'Tell someone you trust who you are meeting, where, and when. Share your live location for the duration.',
  'Travel there and back under your own arrangements. Do not get picked up from home on a first meeting.',
  'Never leave your drink unattended, and do not accept a drink you did not see poured.',
  'NEVER send money, credit, or bank details. A request for money from someone you have not met is the single most common scam pattern, however convincing the story.',
  'Do not share your home address, workplace address, national ID number, or photos of identity documents.',
  'Trust your discomfort. You can end a meeting at any time without giving a reason, and you owe nobody an explanation.',
  'If someone pushes to move to another app quickly, refuses a video call, or their story keeps changing — stop communicating and report them.',
]
