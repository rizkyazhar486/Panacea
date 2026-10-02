import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveAffectDecision, summarizeAffectEvents } from '../../src/domains/affect/engine/affectEngine.ts'

const engineSource = readFileSync(new URL('../../src/domains/affect/engine/affectEngine.ts', import.meta.url), 'utf8')
const affectSurface = readFileSync(new URL('../../src/components/ForYouAffectArc.tsx', import.meta.url), 'utf8')
const feedSource = readFileSync(new URL('../../src/components/ForYouOmniFeed.tsx', import.meta.url), 'utf8')

test('positive surprise can create a bounded peak without claiming hormone measurement', () => {
  const result = deriveAffectDecision({
    trigger: 'achievement',
    rewardObserved: 0.95,
    expectedReward: 0.25,
    nextStateValue: 0.65,
    personalEffort: 0.9,
    personalMeaning: 0.9,
    socialRelevance: 0.7,
    evidenceConfidence: 0.95,
  })

  assert.ok(result.predictionError > 0)
  assert.ok(result.rewardIntensity > 0)
  assert.ok(result.rewardIntensity <= 1)
  assert.equal(result.hormoneClaim, 'none')
  assert.equal(result.policy, 'meaning-over-compulsion')
})

test('compulsion risk dampens reward and novelty instead of escalating stimulation', () => {
  const base = {
    trigger: 'achievement',
    rewardObserved: 0.95,
    expectedReward: 0.25,
    nextStateValue: 0.65,
    personalEffort: 0.9,
    personalMeaning: 0.9,
    socialRelevance: 0.7,
    evidenceConfidence: 0.95,
  }

  const low = deriveAffectDecision(base)
  const high = deriveAffectDecision({
    ...base,
    lossStreak: 3,
    rapidLoops: 12,
    sessionMinutes: 60,
    recoveryPct: 20,
    explicitNegativeAffect: 1,
  })

  assert.ok(high.compulsionRisk > low.compulsionRisk)
  assert.ok(high.rewardIntensity < low.rewardIntensity)
  assert.ok(high.noveltyBudget < low.noveltyBudget)
  assert.equal(high.shouldOfferPause, true)
  assert.equal(high.shouldThrottleDiscovery, true)
  assert.equal(high.phase, 'calm')
})

test('low recovery never increases reward intensity', () => {
  const input = {
    trigger: 'achievement',
    rewardObserved: 0.9,
    expectedReward: 0.3,
    nextStateValue: 0.6,
    personalEffort: 0.8,
    personalMeaning: 0.8,
    socialRelevance: 0.5,
    evidenceConfidence: 0.9,
  }
  const recovered = deriveAffectDecision({ ...input, recoveryPct: 90 })
  const depleted = deriveAffectDecision({ ...input, recoveryPct: 20 })
  assert.ok(depleted.rewardIntensity <= recovered.rewardIntensity)
  assert.ok(depleted.compulsionRisk >= recovered.compulsionRisk)
})

test('gratitude deterministically closes the affective loop', () => {
  const result = deriveAffectDecision({
    trigger: 'gratitude',
    rewardObserved: 0.8,
    gratitudeCompleted: true,
    rapidLoops: 4,
    sessionMinutes: 15,
  })
  assert.equal(result.phase, 'calm')
  assert.equal(result.shouldPromptGratitude, false)
})

test('engine contains no random variable-ratio reward mechanic', () => {
  assert.doesNotMatch(engineSource, /Math\.random\s*\(/)
  assert.match(engineSource, /No variable-ratio gambling mechanic/)
  assert.match(engineSource, /must never be promoted into suicide\/self-harm risk/)
})

test('For You exposes anticipation-release-gratitude while preserving safety language', () => {
  for (const token of [
    'Mind Rhythm',
    'Anticipation',
    'Peak',
    'Release',
    'Recognition',
    'Gratitude',
    'Calm',
    'meaning &gt; compulsion',
    'no XP, no streak bonus, no leaderboard points',
    'not dopamine, hormone, addiction or mental-health measurements',
  ]) {
    assert.ok(affectSurface.includes(token), `missing affect surface contract: ${token}`)
  }
})

test('real social interactions feed the affect engine instead of synthetic rewards', () => {
  assert.match(feedSource, /recordAffectEvent\('social_reaction'/)
  assert.match(feedSource, /recordAffectEvent\('feed_reveal'/)
  assert.match(feedSource, /recordAffectEvent\('mode_switch'/)
  assert.match(feedSource, /recordAffectEvent\('achievement_view'/)
  assert.match(feedSource, /<ForYouAffectArc/)
})

// ── summarizeAffectEvents: murni, jam dan awal sesi disuplai pemanggil ──────────
const T0 = Date.parse('2026-10-02T10:00:00Z')
const at = (menit) => new Date(T0 + menit * 60_000).toISOString()
const ev = (type, menit) => ({ type, at: at(menit) })

test('positif: peristiwa 5 menit terakhir dihitung sebagai putaran cepat', () => {
  const r = summarizeAffectEvents([ev('feed_reveal', 8), ev('social_reaction', 9), ev('mode_switch', 9)], T0, T0 + 10 * 60_000)
  assert.deepEqual({ reveals: r.reveals, reactions: r.reactions, rapidLoops: r.rapidLoops }, { reveals: 2, reactions: 1, rapidLoops: 3 })
  assert.equal(r.sessionMinutes, 10)
  assert.equal(r.gratitudeCompleted, false)
})
test('positif: gratitude di mana pun dalam sesi menandai selesai', () => {
  assert.equal(summarizeAffectEvents([ev('gratitude', 1)], T0, T0 + 30 * 60_000).gratitudeCompleted, true)
})
test('batas: peristiwa tepat di tepi jendela 5 menit ikut dihitung, 1 ms sebelumnya tidak', () => {
  const sekarang = T0 + 10 * 60_000
  const tepi = { type: 'feed_reveal', at: new Date(sekarang - 5 * 60_000).toISOString() }
  const lewat = { type: 'feed_reveal', at: new Date(sekarang - 5 * 60_000 - 1).toISOString() }
  assert.equal(summarizeAffectEvents([tepi], T0, sekarang).reveals, 1)
  assert.equal(summarizeAffectEvents([lewat], T0, sekarang).reveals, 0)
})
test('negatif: peristiwa sebelum sesi dimulai diabaikan sepenuhnya', () => {
  const r = summarizeAffectEvents([ev('gratitude', -5), ev('feed_reveal', -1)], T0, T0 + 2 * 60_000)
  assert.deepEqual({ reveals: r.reveals, gratitude: r.gratitudeCompleted }, { reveals: 0, gratitude: false })
})
test('negatif: awal sesi di masa depan tidak menghasilkan menit negatif', () => {
  assert.equal(summarizeAffectEvents([], T0 + 60_000, T0).sessionMinutes, 0)
})
test('negatif: tanpa peristiwa semua hitungan nol', () => {
  const r = summarizeAffectEvents([], T0, T0 + 60_000)
  assert.deepEqual({ a: r.rapidLoops, b: r.reactions, c: r.reveals }, { a: 0, b: 0, c: 0 })
})
test('pasangan: peristiwa sama, hanya beda tipe -> social_reaction vs feed_reveal', () => {
  assert.deepEqual(
    [summarizeAffectEvents([ev('social_reaction', 9)], T0, T0 + 10 * 60_000).reactions, summarizeAffectEvents([ev('feed_reveal', 9)], T0, T0 + 10 * 60_000).reactions],
    [1, 0],
  )
})
test('determinisme: dua panggilan identik dan hasil dibekukan', () => {
  const a = summarizeAffectEvents([ev('feed_reveal', 9)], T0, T0 + 10 * 60_000)
  assert.deepEqual(a, summarizeAffectEvents([ev('feed_reveal', 9)], T0, T0 + 10 * 60_000))
  assert.ok(Object.isFrozen(a))
})
// engine murni: tidak menyentuh storage, window, jam atau acak
test('kemurnian: engine tidak memuat window, storage, Date.now, new Date() atau Math.random', () => {
  const kode = engineSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  for (const pola of [/\bwindow\b/, /localStorage/, /sessionStorage/, /Date\.now\s*\(/, /new Date\(\s*\)/, /Math\.random\s*\(/]) {
    assert.doesNotMatch(kode, pola, `engine tidak boleh memuat ${pola}`)
  }
})
