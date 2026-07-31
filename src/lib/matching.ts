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

const BAND_ORDER: MatchProfile['distanceBand'][] = ['<5 km', '5-15 km', '15-50 km', '>50 km']

export interface Compatibility {
  /** Count of concrete overlaps, NOT a percentage — see module note. */
  sharedActivities: string[]
  agreements: string[]
  frictions: string[]
  /** Coarse label, deliberately not a number. */
  label: 'Banyak kesamaan' | 'Beberapa kesamaan' | 'Sedikit kesamaan'
}

export function compatibility(me: MatchProfile, them: MatchProfile): Compatibility {
  const sharedActivities = me.activities.filter((a) => them.activities.includes(a))

  const agreements: string[] = []
  const frictions: string[] = []

  if (me.lookingFor === them.lookingFor) agreements.push(`Sama-sama mencari ${me.lookingFor}`)
  else frictions.push(`Anda mencari ${me.lookingFor}, dia mencari ${them.lookingFor}`)

  if (me.lifestyle.smokes === them.lifestyle.smokes) {
    agreements.push(me.lifestyle.smokes ? 'Sama-sama merokok' : 'Sama-sama tidak merokok')
  } else {
    frictions.push(me.lifestyle.smokes ? 'Anda merokok, dia tidak' : 'Dia merokok, Anda tidak')
  }

  if (me.lifestyle.drinks === them.lifestyle.drinks) agreements.push('Kebiasaan minum serupa')

  const exDiff = Math.abs(me.lifestyle.exerciseDaysPerWeek - them.lifestyle.exerciseDaysPerWeek)
  if (exDiff <= 1) agreements.push('Frekuensi olahraga mirip')
  else if (exDiff >= 4) frictions.push('Frekuensi olahraga jauh berbeda')

  if (me.lifestyle.sleepSchedule === them.lifestyle.sleepSchedule) agreements.push('Pola tidur serupa')
  else if (
    (me.lifestyle.sleepSchedule === 'pagi' && them.lifestyle.sleepSchedule === 'malam') ||
    (me.lifestyle.sleepSchedule === 'malam' && them.lifestyle.sleepSchedule === 'pagi')
  ) frictions.push('Pola tidur berlawanan (pagi vs malam)')

  if (me.lifestyle.wantsChildren === them.lifestyle.wantsChildren) {
    agreements.push(`Sama-sama ${me.lifestyle.wantsChildren === 'belum yakin' ? 'belum yakin soal anak' : me.lifestyle.wantsChildren === 'ya' ? 'ingin punya anak' : 'tidak ingin punya anak'}`)
  } else if (
    (me.lifestyle.wantsChildren === 'ya' && them.lifestyle.wantsChildren === 'tidak') ||
    (me.lifestyle.wantsChildren === 'tidak' && them.lifestyle.wantsChildren === 'ya')
  ) {
    // Surfaced early on purpose: this is the disagreement that most often ends
    // relationships years later, and a matching product that hides it to
    // maximise matches is doing its users harm.
    frictions.push('Berbeda soal keinginan punya anak — perbedaan ini sebaiknya dibicarakan lebih awal, bukan nanti')
  }

  const positives = sharedActivities.length + agreements.length
  const label = positives >= 5 && frictions.length <= 1 ? 'Banyak kesamaan'
    : positives >= 3 ? 'Beberapa kesamaan'
    : 'Sedikit kesamaan'

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
  'Bertemu pertama kali di TEMPAT UMUM yang ramai — kafe, pusat kebun raya, atau gym. Jangan di rumah, kos, maupun tempat sepi.',
  'Beri tahu satu orang yang Anda percaya: dengan siapa Anda bertemu, di mana, dan jam berapa. Bagikan lokasi langsung selama pertemuan.',
  'Berangkat dan pulang dengan kendaraan Anda sendiri atau transportasi yang Anda pesan sendiri. Jangan dijemput di rumah pada pertemuan pertama.',
  'Jangan meninggalkan minuman tanpa pengawasan, dan jangan menerima minuman yang tidak Anda lihat disiapkan.',
  'JANGAN pernah mengirim uang, pulsa, atau data rekening — permintaan uang dari orang yang belum pernah Anda temui adalah pola penipuan yang paling sering, seberapa pun meyakinkan ceritanya.',
  'Jangan membagikan alamat rumah, alamat kantor, NIK, atau foto dokumen identitas.',
  'Percayai rasa tidak nyaman Anda. Anda boleh mengakhiri pertemuan kapan saja tanpa memberi alasan, dan tidak berutang penjelasan kepada siapa pun.',
  'Bila seseorang menekan Anda untuk pindah ke aplikasi lain dengan cepat, menolak panggilan video, atau ceritanya berubah-ubah — hentikan komunikasi dan laporkan.',
]
