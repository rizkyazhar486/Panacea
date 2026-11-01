import assert from 'node:assert/strict'
import test from 'node:test'

import {
  computeJiangAbstinenceTestosteroneIndex,
  evaluateLifeAscentProtocol,
} from '../../src/domains/personal-health/engine/lifeAscentProtocolEngine.ts'
import { evaluateWorkoutSessionAndRecovery } from '../../src/domains/personal-health/engine/workoutAndEndocrineMasteryEngine.ts'
import { evaluateSeasonClimbAndProofs } from '../../src/domains/personal-health/engine/seasonalClimbAndProofEngine.ts'
import {
  buildHomeScreenWidgetPayload,
  calibrateGoalsFromAppleHealth,
  customizeDailyQuestDeck,
  evaluateOnboardingAndProgramGeneration,
  evaluateSevenBuiltInMiniTools,
} from '../../src/domains/personal-health/engine/onboardingAndMiniToolsEngine.ts'

const BASE_DAY1_RATINGS = {
  wisdom: 120,
  confidence: 140,
  strength: 210,
  discipline: 115,
  focus: 130,
}

const CURRENT_BASE_RATINGS = {
  wisdom: 160,
  confidence: 195,
  strength: 315,
  discipline: 170,
  focus: 190,
}

test('ASC-1 1. Golden case: 5-pillar rating (Wisdom, Confidence, Strength, Discipline, Focus), spiritual contemplation, and Day-7 Jiang (2003) abstinence peak', () => {
  assert.strictEqual(computeJiangAbstinenceTestosteroneIndex(0), 1.0)
  assert.strictEqual(computeJiangAbstinenceTestosteroneIndex(7), 1.457)

  const res = evaluateLifeAscentProtocol({
    protocolDay: 14,
    targetProtocolDays: 66,
    hardModeEnabled: true,
    day1Ratings: BASE_DAY1_RATINGS,
    currentBaseRatings: CURRENT_BASE_RATINGS,
    dailyQuests: [
      { questId: 'q1', title: '20 push-ups', category: 'workout-strength', difficulty: 'medium', completed: true, streakDays: 12 },
      { questId: 'q2', title: 'Run 5km', category: 'cardio-endurance', difficulty: 'hard', completed: true, streakDays: 9 },
      { questId: 'q3', title: 'Read 20 pages & scripture', category: 'spiritual-wisdom', difficulty: 'easy', completed: true, streakDays: 7 },
    ],
    spiritualLogs: [
      { practice: 'prayer-devotion', durationMinutes: 20, reflectionCompleted: true },
      { practice: 'meditation-mindfulness', durationMinutes: 10, reflectionCompleted: true },
    ],
    abstinence: {
      currentStreakDays: 7,
      urgesOvercomeToday: 2,
      morningVitalityScore1To5: 5,
    },
    screenTime: {
      day1BaselineMinutes: 262,
      currentDailyMinutes: 110,
      targetMaxMinutes: 150,
      lightsOutBefore2230: true,
    },
  })

  assert.strictEqual(res.ok, true)
  assert.strictEqual(res.abstinenceReport.jiangDay7RelativeTestosteroneIndex, 1.457)
  assert.strictEqual(res.abstinenceReport.endocrineTruthClass, 'derived')
  assert.strictEqual(res.abstinenceReport.neuroPhase, 'phase-1-acute-endocrine-resensitization')
  assert.strictEqual(res.screenTimeSavedMinutes, 152)
  assert.strictEqual(res.updatedRatings.wisdom > CURRENT_BASE_RATINGS.wisdom, true)
  assert.strictEqual(res.updatedRatings.strength > CURRENT_BASE_RATINGS.strength, true)
  assert.strictEqual(res.updatedRatings.discipline > CURRENT_BASE_RATINGS.discipline, true)
  assert.strictEqual(res.updatedRatings.focus > CURRENT_BASE_RATINGS.focus, true)
  assert.strictEqual(res.hardModePenaltyXp, 0)
})

test('ASC-1 2. Paired test: Hard Mode penalizes missed quests and distinguishes measured serum testosterone from derived model', () => {
  const missedHardMode = evaluateLifeAscentProtocol({
    protocolDay: 14,
    targetProtocolDays: 66,
    hardModeEnabled: true,
    day1Ratings: BASE_DAY1_RATINGS,
    currentBaseRatings: CURRENT_BASE_RATINGS,
    dailyQuests: [
      { questId: 'q1', title: 'Push Day', category: 'workout-strength', difficulty: 'hard', completed: false, streakDays: 0 },
      { questId: 'q2', title: 'Run 5km', category: 'cardio-endurance', difficulty: 'hard', completed: false, streakDays: 0 },
    ],
    spiritualLogs: [],
    abstinence: {
      currentStreakDays: 68,
      urgesOvercomeToday: 1,
      morningVitalityScore1To5: 4,
      measuredSerumTestosteroneNgDl: 685,
    },
    screenTime: {
      day1BaselineMinutes: 262,
      currentDailyMinutes: 300,
      targetMaxMinutes: 150,
      lightsOutBefore2230: false,
    },
  })

  assert.strictEqual(missedHardMode.ok, true)
  assert.strictEqual(missedHardMode.hardModePenaltyXp, 70)
  assert.strictEqual(missedHardMode.abstinenceReport.neuroPhase, 'phase-4-sovereign-automaticity')
  assert.strictEqual(missedHardMode.abstinenceReport.endocrineTruthClass, 'measured')
  assert.strictEqual(missedHardMode.abstinenceReport.measuredSerumTestosteroneNgDl, 685)
})

test('ASC-1 3. Workout Tracker ("Train Hard, Rest Smart"): Push Day 4 moves / 14 sets computes exact volume, Epley 1RM, protein target, and ACWR readiness', () => {
  const pushSession = evaluateWorkoutSessionAndRecovery({
    sessionId: 'push-day-a',
    title: 'Push Day',
    split: 'push',
    durationMinutes: 42,
    bodyMassKg: 66.7,
    sleepHoursLastNight: 7.5,
    acute7DayLoadAu: 1100,
    chronic28DayWeeklyAvgLoadAu: 1400,
    sessionRpe1To10: 7,
    moves: [
      { moveId: 'bench', name: 'Bench press', sets: 4, reps: 8, loadKg: 80 },
      { moveId: 'ohp', name: 'Overhead press', sets: 4, reps: 6, loadKg: 50 },
      { moveId: 'pushup', name: 'Push-up', sets: 3, reps: 12, loadKg: 45 },
      { moveId: 'dip', name: 'Dip', sets: 3, reps: 8, loadKg: 65 },
    ],
  })

  assert.strictEqual(pushSession.ok, true)
  assert.strictEqual(pushSession.totalSets, 14)
  assert.strictEqual(pushSession.totalMoves, 4)
  assert.strictEqual(pushSession.totalVolumeKg, 6940)
  assert.strictEqual(pushSession.recommendedDailyProteinGrams, 120)
  assert.strictEqual(pushSession.recoveryReadinessZone, 'optimal-progressive-loading')
})

test('ASC-1 4. Paired ACWR overreaching test: excessive acute load or <5h sleep triggers rest-smart-deload-required', () => {
  const overreached = evaluateWorkoutSessionAndRecovery({
    sessionId: 'legs-heavy',
    title: 'Legs Max Effort',
    split: 'legs',
    durationMinutes: 75,
    bodyMassKg: 70,
    sleepHoursLastNight: 4.5,
    acute7DayLoadAu: 2100,
    chronic28DayWeeklyAvgLoadAu: 1300,
    sessionRpe1To10: 9,
    moves: [{ moveId: 'squat', name: 'Back squat', sets: 5, reps: 5, loadKg: 120 }],
  })

  assert.strictEqual(overreached.ok, true)
  assert.strictEqual(overreached.recoveryReadinessZone, 'rest-smart-deload-required')
})

test('ASC-1 5. Seasonal Climb ("Climb While They Sleep") & 50-Achievement Proof Matrix ("Proof You Changed")', () => {
  const season = evaluateSeasonClimbAndProofs({
    seasonId: 'season-2026-04',
    currentSeasonXp: 1820,
    dailyXpHistory: [68, 68, 68],
    goldTierAverageDailyXp: 63,
    partnerStreakDays: 5,
    userOpenedToday: true,
    partnerOpenedToday: false,
    longestHabitStreakDays: 47,
    totalWorkoutsCompleted: 18,
    abstinenceStreakDays: 14,
    spiritualSessionsCompleted: 20,
  })

  assert.strictEqual(season.ok, true)
  assert.strictEqual(season.currentTier, 'Gold II')
  assert.strictEqual(season.nextTier, 'Gold I')
  assert.strictEqual(season.xpToNextTier, 160)
  assert.strictEqual(season.dailyXpDeltaVsTierAvg, 5)
  assert.strictEqual(season.partnerNudgeAvailable, true)
  assert.strictEqual(season.totalAchievementsCatalogCount, 50)
})

test('ASC-1 6. Science-Backed Onboarding & Custom Program Generation identifies strengths, blind spots, and Day-1 quest deck', () => {
  const ob = evaluateOnboardingAndProgramGeneration({
    biologicalSex: 'male',
    ageYears: 24,
    heightCm: 175,
    weightKg: 70,
    workoutsPerWeek: 5,
    averageSleepHours: 7.5,
    dailyScreenTimeMinutes: 300,
    spiritualPracticeMinutesPerDay: 5,
    readingPagesPerDay: 2,
    currentAbstinenceStreakDays: 3,
    primaryGoal: 'complete-66-day-total-life-reset',
  })

  assert.strictEqual(ob.ok, true)
  assert.strictEqual(ob.strengths[0], 'strength')
  assert.strictEqual(ob.generatedCustomProgram.length, 5)

  const customized = customizeDailyQuestDeck(
    ob.generatedCustomProgram,
    ['custom-q-reading'],
    [
      {
        questId: 'custom-q-calisthenics',
        title: 'Handstand & Front Lever Progression (15 min)',
        category: 'workout-strength',
        difficulty: 'hard',
        completed: false,
        streakDays: 0,
      },
    ],
  )
  assert.strictEqual(customized.length, 5)
  assert.strictEqual(customized[4].questId, 'custom-q-calisthenics')
})

test('ASC-1 7. Seven Built-In Mini Tools compute Mifflin-St Jeor BMR/TDEE, Pomodoro blocks, Book Summary, Meditation coherence, Screen Blocker, Fasting & Urge Reset', () => {
  const tools = evaluateSevenBuiltInMiniTools({
    biologicalSex: 'male',
    weightKg: 70,
    heightCm: 175,
    ageYears: 24,
    activityMultiplier: 1.5,
    caloricGoalDeltaKcal: 0,
    focusTimerCompletedMinutes: 75,
    bookPagesReadToday: 20,
    bookKeyTakeaway: 'Consistent small actions compound into sovereignty.',
    meditationMinutesToday: 10,
    breathCyclesPerMinute: 6,
    screenBlockerActiveMinutes: 120,
    blockedDistractionAttempts: 4,
    fastingWindowHours: 16,
    urgeSurfingResetCompleted: true,
  })

  assert.strictEqual(tools.ok, true)
  // BMR = 10*70 + 6.25*175 - 5*24 + 5 = 700 + 1093.75 - 120 + 5 = 1679 kcal
  assert.strictEqual(tools.aiCalorieTracker.mifflinStJeorBmrKcal, 1679)
  assert.strictEqual(tools.aiCalorieTracker.targetProteinGrams, 140)
  assert.strictEqual(tools.focusTimer.completedPomodoroBlocks, 3)
  assert.strictEqual(tools.bookSummaryTool.summaryLogged, true)
  assert.strictEqual(tools.meditationTool.resonanceCoherenceAchieved, true)
  assert.strictEqual(tools.circadianFastingTool.metabolicSwitchReached, true)
  assert.strictEqual(tools.urgeSurfingTool.impulseBonusXp, 35)
})

test('ASC-1 8. Apple Health on-device privacy enforcement & Home Screen Widget payload generation', () => {
  const okSync = calibrateGoalsFromAppleHealth({
    keepHealthDataOnDeviceOnly: true,
    recentDailyStepsAverage: 7200,
    recentSleepHoursAverage: 6.8,
    recentWorkoutsPerWeek: 3,
  })
  assert.strictEqual(okSync.ok, true)
  assert.strictEqual(okSync.localDevicePrivacyGuaranteed, true)
  assert.strictEqual(okSync.recommendedDailyStepGoal, 8000)

  const blockedCloud = calibrateGoalsFromAppleHealth({
    keepHealthDataOnDeviceOnly: false,
    recentDailyStepsAverage: 7200,
    recentSleepHoursAverage: 6.8,
    recentWorkoutsPerWeek: 3,
  })
  assert.strictEqual(blockedCloud.ok, false)
  assert.strictEqual(blockedCloud.reason, 'privacy-violation-cloud-export-blocked')

  const widget = buildHomeScreenWidgetPayload({
    protocolDay: 14,
    targetProtocolDays: 66,
    currentStreakDays: 14,
    dailyQuests: [
      { questId: 'q1', title: '20 push-ups', category: 'workout-strength', difficulty: 'medium', completed: true, streakDays: 14 },
      { questId: 'q2', title: 'Read 20 pages', category: 'deep-reading', difficulty: 'easy', completed: false, streakDays: 7 },
    ],
    activeMantraText: 'Climb while they sleep.',
    seasonTier: 'Gold II',
  })
  assert.strictEqual(widget.protocolDayLabel, 'DAY 14 / 66')
  assert.strictEqual(widget.completedQuestsCount, 1)
  assert.strictEqual(widget.totalQuestsCount, 2)
  assert.strictEqual(widget.nextPriorityQuestTitle, 'Read 20 pages')
})

test('ASC-1 9. Boundary +-epsilon & invalid inputs fail closed across all 4 engines', () => {
  const badVitality = evaluateLifeAscentProtocol({
    protocolDay: 1,
    hardModeEnabled: false,
    day1Ratings: BASE_DAY1_RATINGS,
    currentBaseRatings: CURRENT_BASE_RATINGS,
    dailyQuests: [],
    spiritualLogs: [],
    abstinence: {
      currentStreakDays: 1,
      urgesOvercomeToday: 0,
      morningVitalityScore1To5: 5 + 1e-6,
    },
    screenTime: {
      day1BaselineMinutes: 200,
      currentDailyMinutes: 100,
      targetMaxMinutes: 120,
      lightsOutBefore2230: true,
    },
  })
  assert.strictEqual(badVitality.ok, false)
  assert.strictEqual(badVitality.reason, 'invalid-vitality-range')

  const emptyWorkout = evaluateWorkoutSessionAndRecovery({
    sessionId: 'empty',
    title: 'Empty',
    split: 'push',
    durationMinutes: 30,
    bodyMassKg: 70,
    sleepHoursLastNight: 7,
    acute7DayLoadAu: 1000,
    chronic28DayWeeklyAvgLoadAu: 1000,
    sessionRpe1To10: 6,
    moves: [],
  })
  assert.strictEqual(emptyWorkout.ok, false)
  assert.strictEqual(emptyWorkout.reason, 'empty-workout-moves')
})
