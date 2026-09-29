import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveAffectDecision } from '../../src/lib/affectEngine.ts'

const engineSource = readFileSync(new URL('../../src/lib/affectEngine.ts', import.meta.url), 'utf8')
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
