/**
 * Science-Backed Onboarding, Personalized Blind-Spot Assessment, Custom Program
 * Generator, 7 Built-In Mini Tools, Home Screen Widgets & Apple Health Local-First
 * Calibration Engine (ASC-1D).
 *
 * Implements:
 * 1. Science-Backed Onboarding & Blind-Spot Assessment:
 *    - Evaluates baseline lifestyle questionnaire inputs to identify top strengths,
 *      primary blind spots, and Day-1 starting ratings across Wisdom, Confidence,
 *      Strength, Discipline, and Focus.
 *    - Generates a Day-1 Custom Habit & Workout Program tailored to user goals.
 * 2. Fully Customizable Goals:
 *    - Supports removing quests that do not fit and adding custom user-defined quests.
 * 3. 7 Built-In Mini Tools Suite:
 *    - Tool 1: AI Calorie & Macro Tracker (Mifflin-St Jeor BMR/TDEE + protein/carb/fat split)
 *      Citation: Mifflin MD, St Jeor ST, et al. Am J Clin Nutr. 1990;51(2):241-247. PMID: 2305711.
 *    - Tool 2: Focus Timer (Pomodoro / Ultradian 90-min deep work)
 *    - Tool 3: Book & Scripture Summary Extractor
 *    - Tool 4: Meditation & Contemplative Breathwork Timer
 *    - Tool 5: Screen Blocker & Dopamine Shield
 *    - Tool 6: Circadian Fasting & Sleep Window Tracker
 *    - Tool 7: Impulse Urge-Surfing 90-Second Reset Protocol
 * 4. Home Screen Widgets Payload Generator & Apple Health On-Device Privacy Calibrator.
 */

import type {
  CoreAttributeKey,
  CoreAttributeRatings,
  DailyQuestExecution,
} from './lifeAscentProtocolEngine';
import type { CompetitiveSeasonTier } from './seasonalClimbAndProofEngine';

export const ONBOARDING_TOOLS_DISCLAIMER =
  'Behavioral onboarding, Mifflin-St Jeor nutritional reference & local-first wearable calibration — not a medical device' as const;

export interface OnboardingQuestionnaireInput {
  readonly biologicalSex: 'male' | 'female';
  readonly ageYears: number;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly workoutsPerWeek: number;
  readonly averageSleepHours: number;
  readonly dailyScreenTimeMinutes: number;
  readonly spiritualPracticeMinutesPerDay: number;
  readonly readingPagesPerDay: number;
  readonly currentAbstinenceStreakDays: number;
  readonly primaryGoal:
    | 'build-strength-and-physique'
    | 'conquer-impulse-and-screen-addiction'
    | 'deepen-spiritual-wisdom-and-focus'
    | 'complete-66-day-total-life-reset';
}

export interface OnboardingAssessmentSuccess {
  readonly ok: true;
  readonly startingRatings: CoreAttributeRatings;
  readonly strengths: readonly CoreAttributeKey[];
  readonly blindSpots: readonly CoreAttributeKey[];
  readonly focusFirstAttribute: CoreAttributeKey;
  readonly scienceBackedInsights: readonly string[];
  readonly generatedCustomProgram: readonly DailyQuestExecution[];
  readonly truthClass: 'derived';
  readonly label: typeof ONBOARDING_TOOLS_DISCLAIMER;
}

export interface OnboardingFailure {
  readonly ok: false;
  readonly reason: 'invalid-input' | 'privacy-violation-cloud-export-blocked';
  readonly detail: string;
  readonly truthClass: 'derived';
  readonly label: typeof ONBOARDING_TOOLS_DISCLAIMER;
}

export type OnboardingAssessmentResult = OnboardingAssessmentSuccess | OnboardingFailure;

export function evaluateOnboardingAndProgramGeneration(
  input: OnboardingQuestionnaireInput,
): OnboardingAssessmentResult {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'OnboardingQuestionnaireInput object is required.',
      truthClass: 'derived',
      label: ONBOARDING_TOOLS_DISCLAIMER,
    });
  }

  if (
    typeof input.ageYears !== 'number' ||
    !Number.isFinite(input.ageYears) ||
    input.ageYears < 13 ||
    input.ageYears > 120 ||
    typeof input.heightCm !== 'number' ||
    !Number.isFinite(input.heightCm) ||
    input.heightCm < 100 ||
    input.heightCm > 250 ||
    typeof input.weightKg !== 'number' ||
    !Number.isFinite(input.weightKg) ||
    input.weightKg < 25 ||
    input.weightKg > 250 ||
    typeof input.workoutsPerWeek !== 'number' ||
    !Number.isFinite(input.workoutsPerWeek) ||
    input.workoutsPerWeek < 0 ||
    input.workoutsPerWeek > 14 ||
    typeof input.averageSleepHours !== 'number' ||
    !Number.isFinite(input.averageSleepHours) ||
    input.averageSleepHours < 0 ||
    input.averageSleepHours > 24 ||
    typeof input.dailyScreenTimeMinutes !== 'number' ||
    !Number.isFinite(input.dailyScreenTimeMinutes) ||
    input.dailyScreenTimeMinutes < 0 ||
    input.dailyScreenTimeMinutes > 1440
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Onboarding demographics and lifestyle metrics are outside valid physiological ranges.',
      truthClass: 'derived',
      label: ONBOARDING_TOOLS_DISCLAIMER,
    });
  }

  const wisdomScore = Math.min(
    300,
    Math.round(80 + input.spiritualPracticeMinutesPerDay * 2.5 + input.readingPagesPerDay * 2),
  );
  const strengthScore = Math.min(
    350,
    Math.round(90 + input.workoutsPerWeek * 28 + (input.averageSleepHours >= 7 ? 25 : 0)),
  );
  const disciplineScore = Math.min(
    300,
    Math.round(
      75 +
        input.workoutsPerWeek * 15 +
        Math.min(60, input.currentAbstinenceStreakDays * 2) +
        (input.averageSleepHours >= 7 ? 20 : 0),
    ),
  );
  const focusScore = Math.min(
    300,
    Math.round(
      Math.max(40, 220 - Math.max(0, input.dailyScreenTimeMinutes - 90) * 0.45) +
        input.readingPagesPerDay * 1.5,
    ),
  );
  const confidenceScore = Math.min(
    300,
    Math.round((wisdomScore + strengthScore + disciplineScore + focusScore) / 4),
  );

  const startingRatings: CoreAttributeRatings = Object.freeze({
    wisdom: wisdomScore,
    confidence: confidenceScore,
    strength: strengthScore,
    discipline: disciplineScore,
    focus: focusScore,
  });

  const ranked: [CoreAttributeKey, number][] = [
    ['wisdom', wisdomScore],
    ['confidence', confidenceScore],
    ['strength', strengthScore],
    ['discipline', disciplineScore],
    ['focus', focusScore],
  ];
  ranked.sort((a, b) => b[1] - a[1]);

  const strengths: CoreAttributeKey[] = [ranked[0][0], ranked[1][0]];
  const blindSpots: CoreAttributeKey[] = [ranked[ranked.length - 1][0], ranked[ranked.length - 2][0]];
  const focusFirstAttribute = ranked[ranked.length - 1][0];

  const insights: string[] = [];
  if (input.dailyScreenTimeMinutes > 180) {
    insights.push(
      `High daily screen exposure (${input.dailyScreenTimeMinutes} min/day) fragments prefrontal attention; capping leisure screen time under 120 min/day is your highest-leverage Focus multiplier.`,
    );
  }
  if (input.workoutsPerWeek < 3) {
    insights.push(
      'Increasing structured resistance/calisthenics training to >= 3 sessions/week accelerates neuromuscular strength and insulin sensitivity.',
    );
  }
  if (input.spiritualPracticeMinutesPerDay < 15) {
    insights.push(
      'Adding 15-20 minutes of morning prayer, scripture study, or contemplative stillness anchors Wisdom and reduces reactive impulse relapses.',
    );
  }
  if (insights.length === 0) {
    insights.push(
      'Strong baseline habits detected; lock in 66-day neuroplastic automaticity by maintaining streak consistency in Hard Mode.',
    );
  }

  const generatedCustomProgram: DailyQuestExecution[] = [
    Object.freeze({
      questId: 'custom-q-workout',
      title: input.workoutsPerWeek >= 4 ? 'Push / Pull / Legs Hypertrophy Session (45 min)' : 'Foundation Calisthenics & Strength (30 min)',
      category: 'workout-strength',
      difficulty: input.workoutsPerWeek >= 4 ? 'hard' : 'medium',
      completed: false,
      streakDays: 0,
    }),
    Object.freeze({
      questId: 'custom-q-spiritual',
      title: 'Daily Prayer, Scripture Reflection & Contemplation (20 min)',
      category: 'spiritual-wisdom',
      difficulty: 'medium',
      completed: false,
      streakDays: 0,
    }),
    Object.freeze({
      questId: 'custom-q-abstinence',
      title: 'NoFap Impulse Guard & Morning Vitality Check',
      category: 'impulse-abstinence',
      difficulty: 'hard',
      completed: false,
      streakDays: input.currentAbstinenceStreakDays,
    }),
    Object.freeze({
      questId: 'custom-q-screen-blocker',
      title: `Screen Time Under ${Math.max(90, Math.min(150, input.dailyScreenTimeMinutes - 60))} Min + Lights Out 22:30`,
      category: 'screen-time-detox',
      difficulty: 'medium',
      completed: false,
      streakDays: 0,
    }),
    Object.freeze({
      questId: 'custom-q-reading',
      title: 'Read 20 Pages & Log Book/Scripture Summary',
      category: 'deep-reading',
      difficulty: 'easy',
      completed: false,
      streakDays: 0,
    }),
  ];

  return Object.freeze({
    ok: true,
    startingRatings,
    strengths: Object.freeze(strengths),
    blindSpots: Object.freeze(blindSpots),
    focusFirstAttribute,
    scienceBackedInsights: Object.freeze(insights),
    generatedCustomProgram: Object.freeze(generatedCustomProgram),
    truthClass: 'derived',
    label: ONBOARDING_TOOLS_DISCLAIMER,
  });
}

/**
 * Fully Customizable Goals: removes unwanted quest IDs and appends custom user quests.
 */
export function customizeDailyQuestDeck(
  existingQuests: readonly DailyQuestExecution[],
  removeQuestIds: readonly string[],
  addedQuests: readonly DailyQuestExecution[],
): readonly DailyQuestExecution[] {
  const removeSet = new Set(removeQuestIds);
  const kept = existingQuests.filter(q => !removeSet.has(q.questId));
  return Object.freeze([...kept, ...addedQuests]);
}

export interface SevenMiniToolsInput {
  readonly biologicalSex: 'male' | 'female';
  readonly weightKg: number;
  readonly heightCm: number;
  readonly ageYears: number;
  readonly activityMultiplier: number; // [1.2, 2.2]
  readonly caloricGoalDeltaKcal: number; // e.g., -300 cut, 0 maintenance, +250 lean bulk
  readonly focusTimerCompletedMinutes: number;
  readonly bookPagesReadToday: number;
  readonly bookKeyTakeaway: string;
  readonly meditationMinutesToday: number;
  readonly breathCyclesPerMinute: number; // e.g., 6 breaths/min resonance frequency
  readonly screenBlockerActiveMinutes: number;
  readonly blockedDistractionAttempts: number;
  readonly fastingWindowHours: number;
  readonly urgeSurfingResetCompleted: boolean;
}

export interface SevenMiniToolsReport {
  readonly ok: true;
  readonly aiCalorieTracker: {
    readonly mifflinStJeorBmrKcal: number;
    readonly tdeeKcal: number;
    readonly targetDailyKcal: number;
    readonly targetProteinGrams: number;
    readonly targetCarbsGrams: number;
    readonly targetFatGrams: number;
  };
  readonly focusTimer: {
    readonly deepWorkMinutes: number;
    readonly completedPomodoroBlocks: number;
    readonly focusXpAwarded: number;
  };
  readonly bookSummaryTool: {
    readonly pagesRead: number;
    readonly summaryLogged: boolean;
    readonly wisdomXpAwarded: number;
  };
  readonly meditationTool: {
    readonly durationMinutes: number;
    readonly resonanceCoherenceAchieved: boolean;
    readonly wisdomAndDisciplineXp: number;
  };
  readonly screenBlockerTool: {
    readonly activeShieldMinutes: number;
    readonly distractionsBlocked: number;
    readonly focusSavedScore: number;
  };
  readonly circadianFastingTool: {
    readonly fastingHours: number;
    readonly metabolicSwitchReached: boolean;
  };
  readonly urgeSurfingTool: {
    readonly resetCompleted: boolean;
    readonly impulseBonusXp: number;
  };
  readonly totalMiniToolsBonusXp: number;
}

export function evaluateSevenBuiltInMiniTools(
  input: SevenMiniToolsInput,
): SevenMiniToolsReport | OnboardingFailure {
  if (
    !input ||
    typeof input !== 'object' ||
    input.weightKg <= 0 ||
    input.heightCm <= 0 ||
    input.ageYears <= 0 ||
    input.activityMultiplier < 1.1 ||
    input.activityMultiplier > 2.5 ||
    input.focusTimerCompletedMinutes < 0 ||
    input.bookPagesReadToday < 0 ||
    input.meditationMinutesToday < 0 ||
    input.screenBlockerActiveMinutes < 0 ||
    input.blockedDistractionAttempts < 0 ||
    input.fastingWindowHours < 0 ||
    input.fastingWindowHours > 72
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'SevenMiniToolsInput contains out-of-range or negative metrics.',
      truthClass: 'derived',
      label: ONBOARDING_TOOLS_DISCLAIMER,
    });
  }

  // Tool 1: Mifflin-St Jeor BMR (1990, PMID 2305711)
  const sexConstant = input.biologicalSex === 'male' ? 5 : -161;
  const bmr = Math.round(10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears + sexConstant);
  const tdee = Math.round(bmr * input.activityMultiplier);
  const targetKcal = Math.max(1200, tdee + input.caloricGoalDeltaKcal);
  const proteinG = Math.round(input.weightKg * 2.0);
  const fatG = Math.round((targetKcal * 0.25) / 9);
  const carbsG = Math.max(50, Math.round((targetKcal - proteinG * 4 - fatG * 9) / 4));

  // Tool 2: Focus Timer
  const pomodoroBlocks = Math.floor(input.focusTimerCompletedMinutes / 25);
  const focusXp = pomodoroBlocks * 15;

  // Tool 3: Book & Scripture Summary
  const summaryLogged = typeof input.bookKeyTakeaway === 'string' && input.bookKeyTakeaway.trim().length >= 5;
  const wisdomBookXp = Math.min(40, input.bookPagesReadToday * 2) + (summaryLogged ? 15 : 0);

  // Tool 4: Meditation & Breathwork (resonance ~ 4.5 to 7 breaths/min)
  const resonanceAchieved =
    input.meditationMinutesToday >= 5 &&
    input.breathCyclesPerMinute >= 4 &&
    input.breathCyclesPerMinute <= 7;
  const meditationXp = Math.min(45, input.meditationMinutesToday * 3) + (resonanceAchieved ? 15 : 0);

  // Tool 5: Screen Blocker
  const focusSavedScore = Math.min(
    100,
    Math.round(input.screenBlockerActiveMinutes * 0.3 + input.blockedDistractionAttempts * 5),
  );

  // Tool 6: Circadian Fasting
  const metabolicSwitchReached = input.fastingWindowHours >= 14;

  // Tool 7: Urge Surfing Reset
  const impulseBonusXp = input.urgeSurfingResetCompleted ? 35 : 0;

  const totalMiniToolsBonusXp =
    focusXp +
    wisdomBookXp +
    meditationXp +
    Math.min(40, input.blockedDistractionAttempts * 5) +
    (metabolicSwitchReached ? 20 : 0) +
    impulseBonusXp;

  return Object.freeze({
    ok: true,
    aiCalorieTracker: Object.freeze({
      mifflinStJeorBmrKcal: bmr,
      tdeeKcal: tdee,
      targetDailyKcal: targetKcal,
      targetProteinGrams: proteinG,
      targetCarbsGrams: carbsG,
      targetFatGrams: fatG,
    }),
    focusTimer: Object.freeze({
      deepWorkMinutes: input.focusTimerCompletedMinutes,
      completedPomodoroBlocks: pomodoroBlocks,
      focusXpAwarded: focusXp,
    }),
    bookSummaryTool: Object.freeze({
      pagesRead: input.bookPagesReadToday,
      summaryLogged,
      wisdomXpAwarded: wisdomBookXp,
    }),
    meditationTool: Object.freeze({
      durationMinutes: input.meditationMinutesToday,
      resonanceCoherenceAchieved: resonanceAchieved,
      wisdomAndDisciplineXp: meditationXp,
    }),
    screenBlockerTool: Object.freeze({
      activeShieldMinutes: input.screenBlockerActiveMinutes,
      distractionsBlocked: input.blockedDistractionAttempts,
      focusSavedScore,
    }),
    circadianFastingTool: Object.freeze({
      fastingHours: input.fastingWindowHours,
      metabolicSwitchReached,
    }),
    urgeSurfingTool: Object.freeze({
      resetCompleted: input.urgeSurfingResetCompleted,
      impulseBonusXp,
    }),
    totalMiniToolsBonusXp,
  });
}

export interface AppleHealthSyncInput {
  readonly keepHealthDataOnDeviceOnly: boolean;
  readonly recentDailyStepsAverage: number;
  readonly recentSleepHoursAverage: number;
  readonly recentWorkoutsPerWeek: number;
}

export interface AppleHealthCalibratedGoals {
  readonly ok: true;
  readonly localDevicePrivacyGuaranteed: true;
  readonly recommendedDailyStepGoal: number;
  readonly recommendedSleepHoursGoal: number;
  readonly recommendedWeeklyWorkoutGoal: number;
}

export function calibrateGoalsFromAppleHealth(
  input: AppleHealthSyncInput,
): AppleHealthCalibratedGoals | OnboardingFailure {
  if (!input || typeof input !== 'object') {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'AppleHealthSyncInput is required.',
      truthClass: 'derived',
      label: ONBOARDING_TOOLS_DISCLAIMER,
    });
  }

  if (input.keepHealthDataOnDeviceOnly !== true) {
    return Object.freeze({
      ok: false,
      reason: 'privacy-violation-cloud-export-blocked',
      detail: 'Apple Health data must remain strictly on-device (keepHealthDataOnDeviceOnly=true).',
      truthClass: 'derived',
      label: ONBOARDING_TOOLS_DISCLAIMER,
    });
  }

  if (
    input.recentDailyStepsAverage < 0 ||
    input.recentSleepHoursAverage < 0 ||
    input.recentWorkoutsPerWeek < 0
  ) {
    return Object.freeze({
      ok: false,
      reason: 'invalid-input',
      detail: 'Apple Health metrics must be non-negative.',
      truthClass: 'derived',
      label: ONBOARDING_TOOLS_DISCLAIMER,
    });
  }

  // Progressive +10% step goal capped between 6,000 and 12,500 steps
  const stepGoal = Math.min(
    12500,
    Math.max(6000, Math.round((input.recentDailyStepsAverage * 1.1) / 500) * 500),
  );
  const sleepGoal = Number(Math.min(8.5, Math.max(7.5, input.recentSleepHoursAverage + 0.5)).toFixed(1));
  const workoutGoal = Math.min(6, Math.max(3, input.recentWorkoutsPerWeek + 1));

  return Object.freeze({
    ok: true,
    localDevicePrivacyGuaranteed: true,
    recommendedDailyStepGoal: stepGoal,
    recommendedSleepHoursGoal: sleepGoal,
    recommendedWeeklyWorkoutGoal: workoutGoal,
  });
}

export interface HomeScreenWidgetPayload {
  readonly protocolDayLabel: string;
  readonly currentStreakDays: number;
  readonly completedQuestsCount: number;
  readonly totalQuestsCount: number;
  readonly nextPriorityQuestTitle: string;
  readonly activeMantraText: string;
  readonly seasonTier: CompetitiveSeasonTier;
}

export function buildHomeScreenWidgetPayload(params: {
  readonly protocolDay: number;
  readonly targetProtocolDays: 66 | 90;
  readonly currentStreakDays: number;
  readonly dailyQuests: readonly DailyQuestExecution[];
  readonly activeMantraText: string;
  readonly seasonTier: CompetitiveSeasonTier;
}): HomeScreenWidgetPayload {
  const completed = params.dailyQuests.filter(q => q.completed).length;
  const nextPending = params.dailyQuests.find(q => !q.completed);

  return Object.freeze({
    protocolDayLabel: `DAY ${params.protocolDay} / ${params.targetProtocolDays}`,
    currentStreakDays: params.currentStreakDays,
    completedQuestsCount: completed,
    totalQuestsCount: params.dailyQuests.length,
    nextPriorityQuestTitle: nextPending ? nextPending.title : 'All Daily Quests Completed',
    activeMantraText: params.activeMantraText,
    seasonTier: params.seasonTier,
  });
}
